import express from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('employee'));

router.get('/exams', async (req, res) => {
  const { status = 'all' } = req.query;
  
  let query = supabase
    .from('exam_assignments')
    .select('*, exams(*)')
    .eq('user_id', req.user.id);
    
  if (status === 'pending') {
    query = query.is('completed_at', null);
  } else if (status === 'completed') {
    query = query.not('completed_at', 'is', null);
  }

  const { data, error } = await query.order('assigned_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  
  // Add exam status based on current time
  const now = new Date();
  const examsWithStatus = data.map(assignment => {
    const exam = assignment.exams;
    let examStatus = 'available';
    
    if (exam.start_time && new Date(exam.start_time) > now) {
      examStatus = 'upcoming';
    } else if (exam.end_time && new Date(exam.end_time) < now) {
      examStatus = 'expired';
    } else if (assignment.completed_at) {
      examStatus = 'completed';
    }
    
    return {
      ...assignment,
      examStatus
    };
  });
  
  res.json(examsWithStatus);
});

router.get('/results', async (req, res) => {
  const { data, error } = await supabase
    .from('exam_results')
    .select('*, exams(title, duration)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/results/:examId', async (req, res) => {
  const { examId } = req.params;
  
  const { data, error } = await supabase
    .from('exam_results')
    .select('*, exams(title, duration)')
    .eq('user_id', req.user.id)
    .eq('exam_id', examId)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  
  // Get total number of students who attempted this exam for rank context
  const { data: totalAttempts } = await supabase
    .from('exam_results')
    .select('id')
    .eq('exam_id', examId);
    
  res.json({
    ...data,
    totalAttempts: totalAttempts?.length || 0
  });
});

router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [assignmentsResult, resultsResult] = await Promise.all([
      supabase
        .from('exam_assignments')
        .select('*, exams(*)')
        .eq('user_id', userId),
      supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', userId)
    ]);

    const assignments = assignmentsResult.data || [];
    const results = resultsResult.data || [];
    
    const now = new Date();
    const pendingExams = assignments.filter(a => 
      !a.completed_at && 
      (!a.exams.end_time || new Date(a.exams.end_time) > now)
    );
    
    const completedExams = results.length;
    const averageScore = results.length > 0 
      ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)
      : 0;
    
    const bestScore = results.length > 0 
      ? Math.max(...results.map(r => r.percentage))
      : 0;

    res.json({
      pendingExams: pendingExams.length,
      completedExams,
      averageScore: parseFloat(averageScore),
      bestScore,
      recentResults: results.slice(0, 5)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
