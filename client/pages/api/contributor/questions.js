import { supabase } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default requireRole('contributor')(async (req, res) => {
  const userId = req.user.id;

  if (req.method === 'POST') {
    const { question, options, correctAnswer, category, difficulty, majorSubject, lot } = req.body;

    const questionData = {
      question,
      type: 'mcq',
      options,
      correct_answer: correctAnswer,
      category,
      difficulty,
      lot,
      major_subject: majorSubject,
      status: 'pending',
      created_by: userId
    };

    const { data, error } = await supabase
      .from('questions')
      .insert(questionData)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } else if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
