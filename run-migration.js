import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
  try {
    const sql = fs.readFileSync('./server/migrations/003_modify_users_table.sql', 'utf8');
    
    console.log('Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration error:', error);
      
      // Try alternative approach - run commands individually
      const commands = sql.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        if (command.trim()) {
          console.log('Executing:', command.trim().substring(0, 50) + '...');
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: command.trim() });
          if (cmdError) {
            console.error('Command error:', cmdError.message);
          }
        }
      }
    } else {
      console.log('✅ Migration completed successfully');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();