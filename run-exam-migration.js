import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const migration = fs.readFileSync('./server/migrations/006_add_exam_fields.sql', 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql: migration });
    
    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();