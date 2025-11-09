import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    // Get all question challenges with pagination
    const { status, page = 0, limit = 10 } = req.query;

    let query = supabase
      .from('question_challenges')
      .select(`
        *,
        questions(id, question, options, correct_answer),
        users(name, employee_id),
        exam_results(exams(title)),
        reviewed_by_user:users!question_challenges_reviewed_by_fkey(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: challenges, error, count } = await query
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      challenges,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } else if (req.method === 'PUT') {
    // Update challenge status and response
    const { challengeId, status, adminResponse, updateQuestionAnswer } = req.body;

    if (!challengeId || !status) {
      return res.status(400).json({ error: 'Challenge ID and status are required' });
    }

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // First, get the challenge details to check if we need to update the question
    const { data: currentChallenge, error: fetchError } = await supabase
      .from('question_challenges')
      .select('*, questions(id, correct_answer)')
      .eq('id', challengeId)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: 'Failed to fetch challenge details' });
    }

    const updateData = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: req.user.id
    };

    if (adminResponse) {
      updateData.admin_response = adminResponse;
    }

    // If admin wants to update the question's correct answer
    if (updateQuestionAnswer && currentChallenge.suggested_correct_answer) {
      const { error: questionUpdateError } = await supabase
        .from('questions')
        .update({ correct_answer: currentChallenge.suggested_correct_answer })
        .eq('id', currentChallenge.question_id);

      if (questionUpdateError) {
        return res.status(400).json({ error: 'Failed to update question answer: ' + questionUpdateError.message });
      }
    }

    const { data: challenge, error } = await supabase
      .from('question_challenges')
      .update(updateData)
      .eq('id', challengeId)
      .select(`
        *,
        questions(id, question, correct_answer),
        users(name, employee_id),
        exam_results(exams(title))
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      challenge,
      message: updateQuestionAnswer ?
        'Challenge updated and question answer changed successfully' :
        'Challenge updated successfully'
    });

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
