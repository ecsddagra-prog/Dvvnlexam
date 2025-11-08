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
    .maybeSingle();

  if (existingSession) {
    // Check if session has expired
    const sessionEndsAt = new Date(existingSession.ends_at);
    const now = new Date();
    
    if (now > sessionEndsAt || !existingSession.is_active) {
      // Delete expired or inactive session
      const { error: deleteError } = await supabase
        .from('exam_sessions')
        .delete()
        .eq('id', existingSession.id);
      
      if (deleteError) {
        console.error('Failed to delete old session:', deleteError);
      }
      // Continue to create new session below
    } else {
      // Return existing active session to continue
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

      const { data: exam } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      return res.json({ 
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          passing_score: exam.passing_score
        },
        questions: questionsData,
        startedAt: new Date(existingSession.started_at).toISOString(),
        endsAt: new Date(existingSession.ends_at).toISOString(),
        serverTime: new Date().toISOString(),
        resuming: true
      });
    }
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  // Check if exam is within time window (allow 15 min late start after exam start_time)
  const now = new Date();
  const startTime = exam.start_time ? new Date(exam.start_time) : null;
  const lateStartAllowed = startTime ? new Date(startTime.getTime() + 15 * 60 * 1000) : null;
  
  if (startTime && now < startTime) {
    return res.status(400).json({ error: 'Exam has not started yet' });
  }
  if (lateStartAllowed && now > lateStartAllowed) {
    return res.status(400).json({ error: 'Late start time exceeded (15 min after start)' });
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

  // Create exam session - end time calculation
  const startedAt = new Date();
  let endsAt;
  
  if (exam.end_time) {
    // Fixed end time - but ensure user gets at least the duration
    const fixedEndTime = new Date(exam.end_time);
    const durationBasedEndTime = new Date(startedAt.getTime() + exam.duration * 60 * 1000);
    // Use whichever is later to give user full duration
    endsAt = fixedEndTime > durationBasedEndTime ? fixedEndTime : durationBasedEndTime;
  } else {
    // Duration based - standard calculation
    endsAt = new Date(startedAt.getTime() + exam.duration * 60 * 1000);
  }
  
  const { data: sessionData, error: sessionError } = await supabase
    .from('exam_sessions')
    .upsert({
      exam_id: examId,
      user_id: userId,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      answers: {},
      is_active: true,
      last_activity: new Date().toISOString()
    }, {
      onConflict: 'exam_id,user_id'
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Failed to create session:', sessionError);
    return res.status(400).json({ error: 'Failed to create exam session: ' + sessionError.message });
  }

  console.log('Session created:', sessionData);

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
    endsAt: new Date(endsAt).toISOString(),
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

  console.log('Submit attempt:', { examId, userId, timestamp: new Date().toISOString() });

  // FIRST: Check if result already exists (idempotency check)
  const { data: existingResult } = await supabase
    .from('exam_results')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingResult) {
    console.log('Result already exists, returning existing result:', existingResult.id);
    return res.json({ 
      success: true,
      result: {
        id: existingResult.id,
        score: existingResult.score,
        total_questions: existingResult.total_questions,
        percentage: existingResult.percentage,
        total_time: existingResult.total_time,
        submitted_at: existingResult.submitted_at
      },
      message: 'Exam already submitted'
    });
  }

  // Check if session exists (active or inactive - we'll validate time separately)
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .maybeSingle();

  console.log('Session query result:', { session, sessionError });

  if (!session) {
    // No session found at all
    return res.status(400).json({ error: 'No exam session found. Please start the exam first.' });
  }

  // Server-side validation: Check if time is valid (allow 15 min buffer for flexibility)
  const now = new Date();
  const endsAt = new Date(session.ends_at);
  const buffer = 900000; // 15 minutes (increased for auto-submit delays and network issues)
  const timeRemaining = endsAt - now;
  const timeExceeded = now - endsAt;
  
  console.log('Submit validation:', {
    sessionEndsAt: session.ends_at,
    now: now.toISOString(),
    endsAt: endsAt.toISOString(),
    timeRemaining: Math.floor(timeRemaining / 1000) + ' seconds',
    timeExceeded: Math.floor(timeExceeded / 1000) + ' seconds',
    bufferAllowed: buffer / 1000 + ' seconds',
    willReject: timeExceeded > buffer,
    sessionActive: session.is_active
  });
  
  // Allow submission if within buffer OR if session is inactive (recovery scenario)
  // Only reject if time exceeded AND buffer exceeded
  if (timeExceeded > buffer) {
    console.log('Time exceeded beyond buffer - rejecting submit');
    return res.status(400).json({ 
      error: 'Exam time exceeded. Please contact administrator.',
      details: `Exam ended at ${endsAt.toISOString()}, current time is ${now.toISOString()}`
    });
  }
  
  if (!session.is_active) {
    console.log('Session inactive but allowing submission as recovery (within buffer)');
  } else {
    console.log('Time validation passed');
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

  // Client doesn't calculate actual score for security - server is authoritative
  console.log(`Score calculated: ${serverScore}/${totalQuestions} (${serverPercentage}%)`);

  const finalScore = serverScore;
  const finalPercentage = serverPercentage;

  // Deactivate session AFTER result is created to prevent race conditions
  // This will be done after result insertion

  // Store result
  const { data: result, error } = await supabase
    .from('exam_results')
    .insert({
      exam_id: examId,
      user_id: userId,
      score: finalScore,
      total_questions: totalQuestions,
      percentage: finalPercentage,
      total_time: totalTime,
      submitted_at: submittedAt || new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to insert result:', error);
    return res.status(400).json({ error: 'Failed to save exam result: ' + error.message });
  }

  // NOW deactivate session after result is successfully created
  await supabase
    .from('exam_sessions')
    .update({ is_active: false })
    .eq('id', session.id);

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

    const { data: exam } = await supabase
      .from('exams')
      .select('certificate_enabled')
      .eq('id', examId)
      .single();

    if (exam?.certificate_enabled && results[i].percentage >= 50) {
      const certificateUrl = await generateCertificate(results[i]);
      await supabase
        .from('exam_results')
        .update({ certificate_url: certificateUrl })
        .eq('id', results[i].id);
    }
  }
}

export default router;
