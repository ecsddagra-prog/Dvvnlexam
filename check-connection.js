import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'server', '.env') });

console.log('🔍 Checking Supabase Connection...\n');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkConnection() {
  try {
    console.log('📡 Supabase URL:', process.env.SUPABASE_URL);
    console.log('🔑 Service Key:', process.env.SUPABASE_SERVICE_KEY ? '✓ Present' : '✗ Missing');
    console.log('');

    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      console.log('❌ Database Error:', error.message);
      console.log('\n⚠️  Action Required:');
      console.log('   1. Go to: https://cgpwrlclywbahahrcaov.supabase.co');
      console.log('   2. SQL Editor → New Query');
      console.log('   3. Run: server/migrations/001_initial_schema.sql');
      console.log('   4. Run: server/migrations/002_seed_admin.sql');
    } else {
      console.log('✅ Supabase Connected Successfully!');
      console.log('✅ Database Tables Accessible');
      console.log('\n🚀 Ready to start servers!');
    }
  } catch (err) {
    console.log('❌ Connection Failed:', err.message);
  }
  
  process.exit(0);
}

checkConnection();
