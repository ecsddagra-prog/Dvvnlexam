import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { employeeId, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('employee_id', employeeId)
    .single();

  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, employeeId: user.employee_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      employeeId: user.employee_id,
      name: user.name,
      role: user.role,
      passwordResetRequired: user.password_reset_required
    }
  });
});

router.post('/reset-password', async (req, res) => {
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
});

export default router;
