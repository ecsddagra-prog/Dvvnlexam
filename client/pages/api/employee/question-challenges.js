import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method === 'POST') {
    // Submit a question challenge
    console.log('Challenge submission request:', req.body);
    const { questionId, examResultId, challengeReason, suggestedCorrectAnswer } = req.body;

    if (!questionId || !examResultId || !challengeReason?.trim()) {
      return res.status(400).json({ error: 'Question ID, exam result ID, and challenge reason are required' });
    }

    // Validate suggested correct answer if provided
    if (suggestedCorrectAnswer && !['A', 'B', 'C', 'D'].includes(suggestedCorrectAnswer.toUpperCase())) {
      return res.status(400).json({ error: 'Suggested correct answer must be A, B, C, or D' });
    }

    // Verify the exam result belongs to the current user
    const { data: examResult, error: resultError } = await supabase
      .from('exam_results')
      .select('id')
      .eq('id', examResultId)
      .eq('user_id', req.user.id)
      .single();

    if (resultError || !examResult) {
      return res.status(404).json({ error: 'Exam result not found or access denied' });
    }

    // Check if table exists first
    const { error: tableCheckError } = await supabase
      .from('question_challenges')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === 'PGRST116') {
      return res.status(400).json({
        error: 'Database table not found',
        details: 'The question_challenges table has not been created yet. Please run the QUESTION_CHALLENGES_TABLE.sql file in your Supabase SQL editor.'
      });
    }

    // Check if challenge already exists
    const { data: existingChallenge } = await supabase
      .from('question_challenges')
      .select('id')
      .eq('question_id', questionId)
      .eq('employee_id', req.user.id)
      .eq('exam_result_id', examResultId)
      .single();

    if (existingChallenge) {
      return res.status(400).json({ error: 'Challenge already submitted for this question' });
    }

    // Create the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('question_challenges')
      .insert({
        question_id: questionId,
        employee_id: req.user.id,
        exam_result_id: examResultId,
        challenge_reason: challengeReason.trim(),
        suggested_correct_answer: suggestedCorrectAnswer ? suggestedCorrectAnswer.toUpperCase() : null
      })
      .select()
      .single();

    if (challengeError) {
      console.error('Database error creating challenge:', challengeError);
      return res.status(400).json({
        error: 'Failed to create challenge',
        details: challengeError.message,
        code: challengeError.code
      });
    }

    res.json({ challenge, message: 'Challenge submitted successfully' });

  } else if (req.method === 'GET') {
    // Get challenges for the current user
    const { data: challenges, error } = await supabase
      .from('question_challenges')
      .select(`
        *,
        questions(question),
        exam_results(exams(title))
      `)
      .eq('employee_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ challenges });

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
