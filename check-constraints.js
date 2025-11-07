import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkConstraints() {
  try {
    // Check current constraints on users table
    const { data, error } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'users')
      .eq('constraint_type', 'UNIQUE');
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Current unique constraints:', data);
    }
    
    // Try to add unique constraint
    console.log('Adding unique constraint...');
    const { error: alterError } = await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE users ADD CONSTRAINT unique_employee_id UNIQUE (employee_id);' 
    });
    
    if (alterError) {
      console.error('Constraint error:', alterError);
    } else {
      console.log('✅ Unique constraint added successfully');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkConstraints();