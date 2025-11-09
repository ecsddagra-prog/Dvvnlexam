import { supabase } from '../../../../../lib/supabase';
import { requireAuth } from '../../../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { resultId } = req.query;

  // Get the result with answers
  const { data: result, error: resultError } = await supabase
    .from('exam_results')
    .select('*, exams(title)')
    .eq('id', resultId)
    .eq('user_id', req.user.id)
    .single();

  if (resultError || !result) {
    return res.status(404).json({ error: 'Result not found' });
  }

  // Get all questions for this exam
  const { data: examQuestions, error: questionsError } = await supabase
    .from('exam_questions')
    .select('questions(*)')
    .eq('exam_id', result.exam_id);

  if (questionsError) {
    return res.status(400).json({ error: questionsError.message });
  }

  // Get existing challenges for this exam result
  const { data: challenges } = await supabase
    .from('question_challenges')
    .select('question_id, status, challenge_reason, admin_response')
    .eq('exam_result_id', resultId)
    .eq('employee_id', req.user.id);

  const challengesMap = new Map(
    challenges?.map(c => [c.question_id, c]) || []
  );

  // Build the response data
  const responses = examQuestions.map(eq => {
    const question = eq.questions;
    const userAnswer = result.answers[question.id];
    const isCorrect = userAnswer === question.correct_answer;
    const challenge = challengesMap.get(question.id);

    return {
      id: question.id,
      question: question.question,
      options: question.options,
      correct_answer: question.correct_answer,
      user_answer: userAnswer,
      is_correct: isCorrect,
      challenge: challenge || null
    };
  });

  res.json({
    exam_title: result.exams.title,
    exam_result_id: resultId,
    responses,
    summary: {
      total_questions: responses.length,
      correct_answers: responses.filter(r => r.is_correct).length,
      wrong_answers: responses.filter(r => !r.is_correct).length,
      score_percentage: result.percentage
    }
  });
});
