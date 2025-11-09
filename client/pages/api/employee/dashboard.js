import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = req.user.id;

  const [assignedExams, completedResults] = await Promise.all([
    supabase.from('exam_assignments').select('*, exams(end_time)').eq('user_id', userId),
    supabase.from('exam_results').select('percentage').eq('user_id', userId)
  ]);

  const now = new Date();
  const pendingExams = assignedExams.data?.filter(a => {
    if (a.completed_at) return false;
    const isExpired = a.exams?.end_time && new Date(a.exams.end_time) < now;
    return !isExpired;
  }).length || 0;
  const completedExams = completedResults.data?.length || 0;
  const averageScore = completedExams > 0 
    ? (completedResults.data.reduce((sum, r) => sum + r.percentage, 0) / completedExams).toFixed(1)
    : 0;
  const bestScore = completedExams > 0 
    ? Math.max(...completedResults.data.map(r => r.percentage))
    : 0;

  res.json({
    pendingExams,
    completedExams,
    averageScore,
    bestScore
  });
});