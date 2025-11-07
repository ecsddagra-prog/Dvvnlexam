import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  console.log('URL:', process.env.SUPABASE_URL);
  
  try {
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('\n⚠️  Run migrations first:');
      console.log('   1. Go to Supabase SQL Editor');
      console.log('   2. Run server/migrations/001_initial_schema.sql');
      console.log('   3. Run server/migrations/002_seed_admin.sql');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Database tables accessible');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testConnection();
