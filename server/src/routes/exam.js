import express from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { generateCertificate } from '../utils/certificate.js';

const router = express.Router();

router.use(authenticate);

router.post('/:examId/start', async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.id;

  // Check if exam is already started
  const { data: existingSession } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (existingSession) {
    return res.status(400).json({ error: 'Exam already in progress' });
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  // Check if exam is within time window
  const now = new Date();
  if (exam.start_time && new Date(exam.start_time) > now) {
    return res.status(400).json({ error: 'Exam has not started yet' });
  }
  if (exam.end_time && new Date(exam.end_time) < now) {
    return res.status(400).json({ error: 'Exam has ended' });
  }

  const { data: questions } = await supabase
    .from('exam_questions')
    .select('questions(id, question, type, options, difficulty, subject)')
    .eq('exam_id', examId);

  let questionsData = questions.map(q => ({
    id: q.questions.id,
    question: q.questions.question,
    type: q.questions.type,
    options: q.questions.options,
    difficulty: q.questions.difficulty,
    subject: q.questions.subject
  }));

  // Randomize questions if enabled
  if (exam.randomize_questions) {
    questionsData = questionsData.sort(() => Math.random() - 0.5);
  }

  // Limit questions if specified
  if (exam.questions_per_exam && exam.questions_per_exam < questionsData.length) {
    questionsData = questionsData.slice(0, exam.questions_per_exam);
  }

  // Create exam session
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + exam.duration * 60 * 1000);
  
  await supabase
    .from('exam_sessions')
    .insert({
      exam_id: examId,
      user_id: userId,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      answers: {}
    });

  res.json({ 
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      passing_score: exam.passing_score
    },
    questions: questionsData,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    serverTime: new Date().toISOString()
  });
});

router.post('/:examId/autosave', async (req, res) => {
  const { examId } = req.params;
  const { answers } = req.body;
  const userId = req.user.id;

  const { error } = await supabase
    .from('exam_sessions')
    .update({ 
      answers,
      last_activity: new Date().toISOString()
    })
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Answers saved' });
});

router.get('/:examId/session', async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.id;

  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!session) return res.status(404).json({ error: 'No active session found' });

  const timeLeft = Math.max(0, new Date(session.ends_at) - new Date());
  
  res.json({ 
    session,
    timeLeft: Math.floor(timeLeft / 1000),
    answers: session.answers || {}
  });
});

router.post('/:examId/submit', async (req, res) => {
  const { examId } = req.params;
  const { answers, totalTime, submittedAt, clientScore, clientPercentage } = req.body;
  const userId = req.user.id;

  // Check if session exists and is active
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!session) {
    return res.status(400).json({ error: 'No active exam session found' });
  }

  // Server-side validation: Check if time is valid
  const actualTime = Math.floor((new Date() - new Date(session.started_at)) / 1000);
  if (actualTime > (session.ends_at ? Math.floor((new Date(session.ends_at) - new Date(session.started_at)) / 1000) : Infinity) + 5) {
    return res.status(400).json({ error: 'Exam time exceeded' });
  }

  // Fetch questions for server-side validation
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('questions(id, correct_answer)')
    .eq('exam_id', examId);

  // Server-side score calculation for validation
  let serverScore = 0;
  const totalQuestions = questions.length;

  questions.forEach(q => {
    if (answers[q.questions.id] === q.questions.correct_answer) {
      serverScore++;
    }
  });

  const serverPercentage = (serverScore / totalQuestions) * 100;

  // Validate client calculation (allow small floating point differences)
  if (Math.abs(serverScore - clientScore) > 0 || Math.abs(serverPercentage - clientPercentage) > 0.1) {
    console.warn(`Score mismatch for user ${userId}: client=${clientScore}, server=${serverScore}`);
  }

  // Use server score as authoritative
  const finalScore = serverScore;
  const finalPercentage = serverPercentage;

  // Deactivate session
  await supabase
    .from('exam_sessions')
    .update({ is_active: false })
    .eq('id', session.id);

  // Store result
  const { data: result, error } = await supabase
    .from('exam_results')
    .insert({
      exam_id: examId,
      user_id: userId,
      score: finalScore,
      total_questions: totalQuestions,
      percentage: finalPercentage,
      total_time: totalTime || actualTime,
      submitted_at: submittedAt || new Date().toISOString()
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Update assignment
  await supabase
    .from('exam_assignments')
    .update({ completed_at: new Date().toISOString() })
    .eq('exam_id', examId)
    .eq('user_id', userId);

  // Async rank calculation and certificate generation (non-blocking)
  setImmediate(() => calculateRankAndGenerateCertificate(examId));

  // Return immediate response
  res.json({ 
    success: true,
    result: {
      id: result.id,
      score: finalScore,
      total_questions: totalQuestions,
      percentage: finalPercentage,
      total_time: result.total_time,
      submitted_at: result.submitted_at
    }
  });
});

async function calculateRankAndGenerateCertificate(examId) {
  const { data: results } = await supabase
    .from('exam_results')
    .select('*, users(name, employee_id)')
    .eq('exam_id', examId)
    .order('percentage', { ascending: false })
    .order('total_time', { ascending: true })
    .order('submitted_at', { ascending: true });

  for (let i = 0; i < results.length; i++) {
    const rank = i + 1;
    await supabase
      .from('exam_results')
      .update({ rank })
      .eq('id', results[i].id);

    if (results[i].percentage >= 50) {
      const certificateUrl = await generateCertificate(results[i]);
      await supabase
        .from('exam_results')
        .update({ certificate_url: certificateUrl })
        .eq('id', results[i].id);
    }
  }
}

export default router;
