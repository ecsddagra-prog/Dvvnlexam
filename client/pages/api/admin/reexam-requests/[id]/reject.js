import { requireRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default requireRole('admin')(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    const { error } = await supabase
      .from('reexam_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Request rejected' });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: error.message });
  }
});
