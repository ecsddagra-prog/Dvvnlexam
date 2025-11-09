import { supabase } from '../../../../lib/supabase';
import { requireRole } from '../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, difficulty } = req.query;
  let query = supabase.from('questions').select('*').eq('status', 'approved');
  if (subject) query = query.eq('category', subject);
  if (difficulty) query = query.eq('difficulty', difficulty);
  
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  
  const formatted = data.map(q => ({
    ...q,
    question_text: q.question,
    subject: q.category || q.subject,
    lot: q.lot || null,
    major_subject: q.major_subject || null
  }));
  
  res.json(formatted);
});