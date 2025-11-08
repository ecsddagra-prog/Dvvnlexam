import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabase';
import { requireRole } from '../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { employeeId } = req.query;
  const hash = await bcrypt.hash('Dvvnl@123', 10);
  const { error } = await supabase.from('users').update({ password_hash: hash, password_reset_required: true }).eq('employee_id', employeeId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Password reset successfully' });
});
