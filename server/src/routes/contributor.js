import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { supabase } from '../utils/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate, authorize('contributor', 'admin'));

router.post('/questions', async (req, res) => {
  const { question, type, options, correctAnswer, difficulty, category } = req.body;

  const { data, error } = await supabase
    .from('questions')
    .insert({
      question,
      type,
      options,
      correct_answer: correctAnswer,
      difficulty,
      category,
      created_by: req.user.id,
      status: 'pending'
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/questions', async (req, res) => {
  const { status } = req.query;
  
  let query = supabase
    .from('questions')
    .select('*')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });
    
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/questions/bulk', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const questions = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      const question = String(row['Question'] || '').trim();
      const optionA = String(row['Option A'] || '').trim();
      const optionB = String(row['Option B'] || '').trim();
      const optionC = String(row['Option C'] || '').trim();
      const optionD = String(row['Option D'] || '').trim();
      const correctAnswer = String(row['Correct Answer'] || '').trim().toUpperCase();
      const difficulty = String(row['Difficulty'] || 'medium').trim().toLowerCase();
      const subject = String(row['Subject'] || '').trim();

      if (!question || !optionA || !optionB || !correctAnswer) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        errors.push(`Row ${i + 1}: Correct answer must be A, B, C, or D`);
        continue;
      }

      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        errors.push(`Row ${i + 1}: Difficulty must be easy, medium, or hard`);
        continue;
      }

      questions.push({
        question,
        type: 'mcq',
        options: {
          A: optionA,
          B: optionB,
          C: optionC || '',
          D: optionD || ''
        },
        correct_answer: correctAnswer,
        difficulty,
        subject,
        created_by: req.user.id,
        status: 'pending'
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({ 
        error: 'No valid questions found', 
        errors 
      });
    }

    const { data: insertedQuestions, error } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ 
      message: `${insertedQuestions.length} questions uploaded successfully`,
      count: insertedQuestions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { question, type, options, correctAnswer, difficulty, subject } = req.body;

  const { data, error } = await supabase
    .from('questions')
    .update({
      question,
      type,
      options,
      correct_answer: correctAnswer,
      difficulty,
      subject
    })
    .eq('id', id)
    .eq('created_by', req.user.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Question not found or cannot be edited' });
  
  res.json(data);
});

router.delete('/questions/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)
    .eq('created_by', req.user.id)
    .eq('status', 'pending');

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Question deleted successfully' });
});

router.get('/stats', async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .select('status')
    .eq('created_by', req.user.id);

  if (error) return res.status(400).json({ error: error.message });

  const stats = {
    total: data.length,
    pending: data.filter(q => q.status === 'pending').length,
    approved: data.filter(q => q.status === 'approved').length,
    rejected: data.filter(q => q.status === 'rejected').length
  };

  res.json(stats);
});

export default router;
