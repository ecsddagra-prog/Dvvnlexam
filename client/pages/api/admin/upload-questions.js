import multer from 'multer';
import xlsx from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

const upload = multer({ dest: '/tmp/' });

export const config = {
  api: { bodyParser: false },
};

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

      const questions = data.filter(row => row.Question && row['Option A'] && row['Correct Answer']).map(row => ({
        question: String(row.Question).trim(),
        type: 'mcq',
        options: { A: row['Option A'], B: row['Option B'], C: row['Option C'], D: row['Option D'] },
        correct_answer: String(row['Correct Answer']).trim().toUpperCase(),
        category: String(row.Subject || 'General').trim(),
        difficulty: String(row.Difficulty || 'medium').toLowerCase(),
        lot: row['Lot'] ? String(row['Lot']).trim() : null,
        major_subject: row['Major Subject'] ? String(row['Major Subject']).trim() : null,
        status: 'approved',
        created_by: req.user.id
      }));

      const { data: inserted, error } = await supabase.from('questions').insert(questions).select();
      if (error) return res.status(400).json({ error: error.message });
      res.json({ message: `${inserted.length} questions uploaded`, count: inserted.length });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});
