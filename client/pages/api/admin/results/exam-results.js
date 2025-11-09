import { supabase } from '../../../../lib/supabase';
import { requireRole } from '../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { examId } = req.query;
  const { data, error } = await supabase.from('exam_results').select('*, users(name, employee_id, department)').eq('exam_id', examId).order('rank', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});