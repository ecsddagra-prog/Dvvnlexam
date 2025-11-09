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
  
  const now = new Date();
  const filteredData = data.map(assignment => {
    const exam = assignment.exams;
    const isExpired = exam.end_time && new Date(exam.end_time) < now;
    
    return {
      ...assignment,
      exams: {
        ...exam,
        is_expired: isExpired
      }
    };
  });
  
  res.json(filteredData);
});