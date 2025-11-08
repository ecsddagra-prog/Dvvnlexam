import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      passwordResetRequired: user.password_reset_required,
      personnel_number: user.personnel_number,
      personnel_area: user.personnel_area,
      employee_group: user.employee_group,
      discom: user.discom,
      gender: user.gender,
      personal_mobile: user.personal_mobile,
      mobile: user.mobile
    }
  });
}
