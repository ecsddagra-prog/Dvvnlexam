import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixAdmin() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Generated hash:', hash);
  
  // Delete existing admin
  await supabase.from('users').delete().eq('employee_id', 'ADMIN001');
  
  // Insert new admin with correct hash
  const { data, error } = await supabase.from('users').insert({
    employee_id: 'ADMIN001',
    name: 'System Admin',
    email: 'admin@example.com',
    password_hash: hash,
    role: 'admin',
    password_reset_required: false
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Admin user created successfully');
    console.log('Login: ADMIN001 / Admin@123');
  }
}

fixAdmin();