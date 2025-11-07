import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkDB() {
  // Check existing users
  const { data: users, error } = await supabase
    .from('users')
    .select('employee_id, name')
    .limit(10);
    
  console.log('Existing users:', users);
  
  // Check if Personnel Number 11007004 already exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('employee_id', '11007004');
    
  console.log('Employee 11007004 exists:', existing);
  
  // Test insert with simple data
  const testEmployee = {
    employee_id: 'TEST001',
    name: 'Test User',
    department: 'IT',
    email: 'test@company.com',
    mobile: '1234567890',
    password_hash: '$2b$10$test',
    role: 'employee',
    password_reset_required: true
  };
  
  const { data: insertResult, error: insertError } = await supabase
    .from('users')
    .insert(testEmployee)
    .select();
    
  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('Test insert successful:', insertResult);
    
    // Clean up
    await supabase.from('users').delete().eq('employee_id', 'TEST001');
  }
}

checkDB();