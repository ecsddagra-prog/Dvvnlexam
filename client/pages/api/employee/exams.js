import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;

  const { data, error } = await supabase
    .from('exam_assignments')
    .select('*, exams(*)')
    .eq('user_id', userId);

  if (error) return res.status(400).json({ error: error.message });

  // Get all exam results for this user to mark submitted exams
  const { data: results, error: resultsError } = await supabase
    .from('exam_results')
    .select('exam_id')
    .eq('user_id', userId);

  if (resultsError) return res.status(400).json({ error: resultsError.message });

  const submittedExamIds = new Set(results.map(result => result.exam_id));

  const now = new Date();
  const filteredData = data.map(assignment => {
    const exam = assignment.exams;
    const isExpired = exam.end_time && new Date(exam.end_time) < now;
    const isSubmitted = submittedExamIds.has(assignment.exam_id);

    return {
      ...assignment,
      exams: {
        ...exam,
        is_expired: isExpired,
        is_submitted: isSubmitted
      }
    };
  });

  res.json(filteredData);
});
