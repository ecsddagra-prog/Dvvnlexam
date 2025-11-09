import { supabase } from '../../../../lib/supabase';
import { requireAuth } from '../../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { examId } = req.query;
  const { answers, totalTime, submittedAt, clientScore, clientPercentage } = req.body;
  const userId = req.user.id;

  const { data: exam } = await supabase
    .from('exams')
    .select('passing_score')
    .eq('id', examId)
    .single();

  const { data: questions } = await supabase
    .from('exam_questions')
    .select('questions(*)')
    .eq('exam_id', examId);

  let score = 0;
  const totalQuestions = questions.length;
  let attemptedQuestions = 0;

  questions.forEach(eq => {
    const userAnswer = answers[eq.questions.id];
    if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
      attemptedQuestions++;
      if (userAnswer === eq.questions.correct_answer) {
        score++;
      }
    }
  });

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const { data: allResults } = await supabase
    .from('exam_results')
    .select('percentage')
    .eq('exam_id', examId)
    .order('percentage', { ascending: false });

  const rank = allResults.filter(r => r.percentage > percentage).length + 1;

  const resultData = {
    exam_id: examId,
    user_id: userId,
    answers: answers,
    score: score,
    total_questions: totalQuestions,
    attempted_questions: attemptedQuestions,
    percentage: percentage,
    total_time: totalTime,
    submitted_at: submittedAt,
    rank: rank
  };

  const { data: result, error } = await supabase
    .from('exam_results')
    .insert(resultData)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await supabase.rpc('update_exam_ranks', { exam_id_param: examId });

  const passingScore = exam?.passing_score || 50;
  const status = percentage >= passingScore ? 'passed' : 'failed';

  await supabase
    .from('exam_results')
    .update({ status: status })
    .eq('id', result.id);

  res.json({
    result: { ...result, status: status },
    message: percentage >= passingScore ? 'Congratulations! You passed the exam.' : 'Better luck next time!'
  });
});
