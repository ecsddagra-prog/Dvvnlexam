import { requireRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default requireRole('admin')(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    const { data, error } = await supabase
      .from('reexam_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    const employeeIds = [...new Set(data.map(r => r.employee_id))];
    const examIds = [...new Set(data.map(r => r.exam_id))];

    const [employeesData, examsData] = await Promise.all([
      supabase.from('users').select('id, name, employee_id').in('id', employeeIds),
      supabase.from('exams').select('id, title').in('id', examIds)
    ]);

    const employeesMap = {};
    employeesData.data?.forEach(e => { employeesMap[e.id] = e; });

    const examsMap = {};
    examsData.data?.forEach(e => { examsMap[e.id] = e; });

    const formatted = data.map(r => ({
      ...r,
      employee_name: employeesMap[r.employee_id]?.name || 'Unknown',
      exam_title: examsMap[r.exam_id]?.title || 'Unknown'
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Reexam requests error:', error);
    res.status(500).json({ error: error.message });
  }
});
