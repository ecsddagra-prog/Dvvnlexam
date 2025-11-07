import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import { supabase } from '../utils/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate, authorize('admin'));

router.post('/upload-employees', upload.single('file'), async (req, res) => {
  try {
    let data;
    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
      const fs = await import('fs');
      const csvContent = fs.default.readFileSync(filePath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    }

    // Filter out empty rows and debug
    console.log('Raw Excel data sample:', data.slice(0, 2));

    const validRows = data.filter((row, index) => {
      const empId = row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '';
      const name = row['Employee Name'] || row['Name'] || '';

      if (!empId || !name) {
          console.log(`Skipping row ${index} due to missing empId or name`);
          return false;
      }

      const empIdStr = String(empId).trim();
      const nameStr = String(name).trim();

      if (empIdStr === '' || nameStr === '' || empIdStr.toLowerCase() === 'null') {
          console.log(`Skipping row ${index} due to empty empId or name or null`);
          return false;
      }

      console.log(`Row ${index}: empId=${empIdStr}, name=${nameStr}`);
      return true;
    });

    console.log(`Valid rows found: ${validRows.length}`);

    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid employee data found. Check column names: Employee Id, Employee Name, or Personnel Number' });
    }

    // Extract all employee IDs and emails first
    const allEmpIds = validRows.map(row => 
      String(row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '').trim()
    );
    const allEmails = validRows.map(row => 
      String(row['Email'] || row['Off. Email'] || row['Personal Email'] || `${String(row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '').trim()}@company.com`).trim()
    );
    
    // Check for existing employees by ID and email in batch
    const { data: existingEmployees } = await supabase
      .from('users')
      .select('employee_id, email')
      .or(`employee_id.in.(${allEmpIds.join(',')}),email.in.(${allEmails.join(',')})`);
    
    const existingIds = new Set(existingEmployees?.map(emp => emp.employee_id) || []);
    const existingEmails = new Set(existingEmployees?.map(emp => emp.email) || []);
    
    const employees = [];
    const processedIds = new Set();
    const skippedExisting = [];
    
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const empId = String(row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '').trim();
      const name = String(row['Employee Name'] || row['Name'] || '').trim();

      console.log(`Processing row ${i}: empId='${empId}', name='${name}'`);

      // Skip duplicates within the file
      if (processedIds.has(empId)) {
        console.log(`Skipping duplicate employee ID: ${empId}`);
        continue;
      }
      processedIds.add(empId);

      const email = String(row['Email'] || row['Off. Email'] || row['Personal Email'] || `${empId}@company.com`).trim();

      // Check if employee already exists in database by ID or email
      if (existingIds.has(empId) || existingEmails.has(email)) {
        console.log(`Employee ${empId} or email ${email} already exists, skipping`);
        skippedExisting.push(`${empId} (${email})`);
        continue;
      }

      // Convert Excel date numbers to proper dates
      const convertExcelDate = (excelDate) => {
        if (!excelDate || isNaN(excelDate)) return null;
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      };

      const defaultPassword = String(row['DefaultPassword'] || row['Default Password'] || 'Dvvnl@123').trim();
      
      employees.push({
        employee_id: empId,
        name: name,
        email: String(row['Email'] || row['Off. Email'] || row['Personal Email'] || `${empId}@company.com`).trim(),
        mobile: String(row['Mobile'] || row['Personal Mob.'] || row['Official Mob.'] || '0000000000').trim(),
        department: String(row['Department'] || row['Department Text'] || 'General').trim(),
        password_hash: await bcrypt.hash(defaultPassword, 10),
        role: 'employee',
        password_reset_required: true
      });
    }

    if (employees.length === 0) {
      return res.status(400).json({ error: 'No new employees to insert (all may already exist)' });
    }

    console.log(`Inserting ${employees.length} employees:`, employees.map(e => e.employee_id));
    
    // Insert employees one by one to handle any remaining duplicates gracefully
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
    
    const message = `${successCount} employees created successfully`;
    const response = { message, count: successCount };
    
    if (errors.length > 0) {
      response.warnings = errors;
    }
    
    if (skippedExisting.length > 0) {
      response.skipped = `${skippedExisting.length} existing employees ignored: ${skippedExisting.join(', ')}`;
    }
    
    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/exams', async (req, res) => {
  const { title, description, duration, passingScore, startTime, endTime } = req.body;

  const examData = {
    title,
    description,
    duration,
    passing_score: passingScore
  };

  if (startTime) examData.start_time = startTime;
  if (endTime) examData.end_time = endTime;

  const { data, error } = await supabase
    .from('exams')
    .insert(examData)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/exams', async (req, res) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/exams/:examId/assign', async (req, res) => {
  const { examId } = req.params;
  const { employeeIds } = req.body;

  const assignments = employeeIds.map(empId => ({
    exam_id: examId,
    user_id: empId
  }));

  const { error } = await supabase.from('exam_assignments').insert(assignments);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Exam assigned successfully' });
});

router.post('/exams/:examId/questions', async (req, res) => {
  const { examId } = req.params;
  const { questionIds } = req.body;

  const examQuestions = questionIds.map(qId => ({
    exam_id: examId,
    question_id: qId
  }));

  const { error } = await supabase.from('exam_questions').insert(examQuestions);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Questions assigned to exam successfully' });
});

router.get('/questions/approved', async (req, res) => {
  const { subject, difficulty } = req.query;
  
  let query = supabase
    .from('questions')
    .select('*')
    .eq('status', 'approved');
    
  if (subject) query = query.eq('subject', subject);
  if (difficulty) query = query.eq('difficulty', difficulty);
  
  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/analytics/dashboard', async (req, res) => {
  try {
    const [examsResult, usersResult, questionsResult, resultsResult] = await Promise.all([
      supabase.from('exams').select('id').eq('created_at', 'gte', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('users').select('id, role'),
      supabase.from('questions').select('id, status'),
      supabase.from('exam_results').select('id, percentage')
    ]);

    const analytics = {
      totalExams: examsResult.data?.length || 0,
      totalUsers: {
        admin: usersResult.data?.filter(u => u.role === 'admin').length || 0,
        contributor: usersResult.data?.filter(u => u.role === 'contributor').length || 0,
        employee: usersResult.data?.filter(u => u.role === 'employee').length || 0
      },
      questions: {
        pending: questionsResult.data?.filter(q => q.status === 'pending').length || 0,
        approved: questionsResult.data?.filter(q => q.status === 'approved').length || 0,
        rejected: questionsResult.data?.filter(q => q.status === 'rejected').length || 0
      },
      averageScore: resultsResult.data?.length > 0 
        ? (resultsResult.data.reduce((sum, r) => sum + r.percentage, 0) / resultsResult.data.length).toFixed(2)
        : 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/questions/pending', async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*, users(name)')
    .eq('status', 'pending');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.patch('/questions/:id/approve', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('questions')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Question approved' });
});

router.patch('/questions/:id/reject', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('questions')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Question rejected' });
});

router.get('/results/:examId', async (req, res) => {
  const { examId } = req.params;

  const { data, error } = await supabase
    .from('exam_results')
    .select('*, users(name, employee_id, department)')
    .eq('exam_id', examId)
    .order('rank', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/employees', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, employee_id, name, email, department')
    .eq('role', 'employee');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/reset-password/:employeeId', async (req, res) => {
  const { employeeId } = req.params;

  const hash = await bcrypt.hash('Dvvnl@123', 10);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: hash, password_reset_required: true })
    .eq('employee_id', employeeId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Password reset successfully' });
});

router.post('/upload-questions', upload.single('file'), async (req, res) => {
  try {
    let data;
    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
      const fs = await import('fs');
      const csvContent = fs.default.readFileSync(filePath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    }

    console.log('Raw Questions data sample:', data.slice(0, 2));

    const validRows = data.filter((row, index) => {
      const question = String(row['Question'] || row['question'] || '').trim();
      const optionA = String(row['Option A'] || row['A'] || '').trim();
      const optionB = String(row['Option B'] || row['B'] || '').trim();
      const correctAnswer = String(row['Correct Answer'] || row['Answer'] || '').trim();

      if (!question || !optionA || !optionB || !correctAnswer) {
        console.log(`Skipping question row ${index} due to missing required fields`);
        return false;
      }
      return true;
    });

    console.log(`Valid question rows found: ${validRows.length}`);

    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid questions found. Required columns: Question, Option A, Option B, Correct Answer' });
    }

    const questions = validRows.map(row => {
      const optionA = String(row['Option A'] || row['A'] || '').trim();
      const optionB = String(row['Option B'] || row['B'] || '').trim();
      const optionC = String(row['Option C'] || row['C'] || '').trim();
      const optionD = String(row['Option D'] || row['D'] || '').trim();
      
      const options = { A: optionA, B: optionB };
      if (optionC) options.C = optionC;
      if (optionD) options.D = optionD;
      
      return {
        question: String(row['Question'] || row['question'] || '').trim(),
        type: 'mcq',
        options: options,
        correct_answer: String(row['Correct Answer'] || row['Answer'] || '').trim().toUpperCase(),
        category: String(row['Subject'] || 'General').trim(),
        difficulty: ['easy', 'medium', 'hard'].includes(String(row['Difficulty'] || 'medium').toLowerCase()) ? String(row['Difficulty'] || 'medium').toLowerCase() : 'medium',
        status: 'approved',
        created_by: req.user.id
      };
    });

    console.log(`Preparing to insert ${questions.length} questions`);

    const { data: insertedQuestions, error } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (error) {
      console.error('Question insert error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`Successfully inserted ${insertedQuestions.length} questions`);

    res.json({ 
      message: `${insertedQuestions.length} questions uploaded successfully`,
      count: insertedQuestions.length 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
