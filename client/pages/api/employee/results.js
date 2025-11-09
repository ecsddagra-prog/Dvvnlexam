import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { limit = 10, offset = 0 } = req.query;

  const { data, error, count } = await supabase
    .from('exam_results')
    .select(`
      *,
      exams(title, passing_score),
      users(name, employee_id)
    `, { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('submitted_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (error) return res.status(400).json({ error: error.message });

  const examIds = data.map(r => r.exam_id);
  const { data: requests } = await supabase
    .from('reexam_requests')
    .select('exam_id, status')
    .eq('employee_id', req.user.id)
    .in('exam_id', examIds);

  const requestedExams = new Map(requests?.map(r => [r.exam_id, r.status]) || []);
  const results = data.map(r => ({
    ...r,
    reexam_requested: requestedExams.has(r.exam_id),
    reexam_status: requestedExams.get(r.exam_id) || null
  }));

  res.json({
    results,
    total: count,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});
