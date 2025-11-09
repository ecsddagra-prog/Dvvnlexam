import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const { userId } = req.query;
  const { role } = req.body;
  if (!['admin', 'contributor', 'employee'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Role updated to ${role}` });
});
