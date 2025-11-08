import bcrypt from 'bcryptjs';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId, oldPassword, newPassword } = req.body;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('employee_id', employeeId)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid old password' });

  const hash = await bcrypt.hash(newPassword, 10);

  await supabase
    .from('users')
    .update({ password_hash: hash, password_reset_required: false })
    .eq('employee_id', employeeId);

  res.json({ message: 'Password reset successful' });
}
