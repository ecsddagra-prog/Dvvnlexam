import multer from 'multer';
import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

const upload = multer({ dest: '/tmp/' });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

      const validRows = data.filter(row => {
        const empId = row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '';
        const name = row['Employee Name'] || row['Name'] || '';
        return empId && name;
      });

      if (validRows.length === 0) {
        return res.status(400).json({ error: 'No valid employee data found' });
      }

      const employees = [];
      for (const row of validRows) {
        const empId = String(row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '').trim();
        const name = String(row['Employee Name'] || row['Name'] || '').trim();
        const defaultPassword = String(row['DefaultPassword'] || 'Dvvnl@123').trim();
        
        employees.push({
          employee_id: empId,
          name: name,
          email: String(row['Email'] || `${empId}@company.com`).trim(),
          mobile: String(row['Mobile'] || '0000000000').trim(),
          department: String(row['Department'] || 'General').trim(),
          password_hash: await bcrypt.hash(defaultPassword, 10),
          role: 'employee',
          password_reset_required: true,
        });
      }

      let successCount = 0;
      const errors = [];
      
      for (const employee of employees) {
        const { error } = await supabase.from('users').insert([employee]);
        if (error) {
          if (error.code === '23505') {
            errors.push(`Employee ID ${employee.employee_id} already exists`);
          } else {
            errors.push(`Error inserting ${employee.employee_id}: ${error.message}`);
          }
        } else {
          successCount++;
        }
      }
      
      const response = { message: `${successCount} employees created successfully`, count: successCount };
      if (errors.length > 0) response.warnings = errors;
      
      res.json(response);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});
