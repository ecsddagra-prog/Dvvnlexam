import { requireRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default requireRole('employee')(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { examId, reason } = req.body;

    if (!examId || !reason) {
      return res.status(400).json({ error: 'Exam ID and reason required' });
    }

    // Check if request already exists for this exam
    const { data: existingRequest } = await supabase
      .from('reexam_requests')
      .select('id, status')
      .eq('employee_id', req.user.id)
      .eq('exam_id', examId)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ error: 'Re-exam request already submitted for this exam' });
      }
      if (existingRequest.status === 'approved') {
        return res.status(400).json({ error: 'Re-exam request already approved for this exam' });
      }
    }

    const { error } = await supabase
      .from('reexam_requests')
      .insert({
        employee_id: req.user.id,
        exam_id: examId,
        reason: reason.trim(),
        status: 'pending'
      });

    if (error) {
      console.error('Re-exam request insert error:', error);
      throw new Error('Failed to submit re-exam request');
    }

    res.json({ message: 'Re-exam request submitted successfully' });
  } catch (error) {
    console.error('Re-exam request error:', error);
    res.status(500).json({ error: error.message });
  }
});
