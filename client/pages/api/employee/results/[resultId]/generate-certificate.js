import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { generateCertificatePDF } from '@/lib/certificateGenerator';

// Helper function to convert database column names to camelCase
function dbToCamelCase(dbObj) {
  if (!dbObj) return {};
  return {
    pageSize: dbObj.page_size,
    orientation: dbObj.orientation,
    margins: dbObj.margins,
    customWidth: dbObj.custom_width,
    customHeight: dbObj.custom_height,
    logoUrl: dbObj.logo_url,
    logoPosition: dbObj.logo_position,
    logoWidth: dbObj.logo_width,
    logoHeight: dbObj.logo_height,
    signatureUrl: dbObj.signature_url,
    signaturePosition: dbObj.signature_position,
    signatureWidth: dbObj.signature_width,
    signatureHeight: dbObj.signature_height,
    title: dbObj.title,
    subtitle: dbObj.subtitle,
    recipientText: dbObj.recipient_text,
    achievementText: dbObj.achievement_text,
    examText: dbObj.exam_text,
    scoreText: dbObj.score_text,
    rankText: dbObj.rank_text,
    dateText: dbObj.date_text,
    signatureText: dbObj.signature_text,
    titleFont: dbObj.title_font,
    titleSize: dbObj.title_size,
    titleColor: dbObj.title_color,
    bodyFont: dbObj.body_font,
    bodySize: dbObj.body_size,
    bodyColor: dbObj.body_color,
    backgroundColor: dbObj.background_color,
    borderColor: dbObj.border_color,
    accentColor: dbObj.accent_color,
    showBorder: dbObj.show_border,
    showSignature: dbObj.show_signature,
    showDate: dbObj.show_date,
    showScore: dbObj.show_score,
    showRank: dbObj.show_rank
  };
}

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resultId } = req.query;

    console.log('Certificate generation request:', { resultId, userId: req.user.id });

    // First check if result exists without user filter
    const { data: checkResult, error: checkError } = await supabase
      .from('exam_results')
      .select('id, user_id, exam_id, percentage')
      .eq('id', resultId)
      .single();

    console.log('Result check:', { checkResult, checkError });

    if (checkError || !checkResult) {
      return res.status(404).json({ error: `Result not found. ResultId: ${resultId}, Error: ${checkError?.message}` });
    }

    // Check if result belongs to current user
    if (checkResult.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Result does not belong to current user' });
    }

    const { data: result, error: resultError } = await supabase
      .from('exam_results')
      .select(`
        *,
        exams(title),
        users(name, employee_id)
      `)
      .eq('id', resultId)
      .single();

    if (resultError || !result) {
      return res.status(404).json({ error: 'Failed to fetch result details' });
    }

    if (result.percentage < (result.exams?.passing_score || 50)) {
      return res.status(400).json({ error: 'Certificate only for passed exams' });
    }

    const certificateNumber = `CERT-${Date.now()}-${result.id.substring(0, 8).toUpperCase()}`;

    // Load certificate settings
    const { data: certSettings, error: settingsError } = await supabase
      .from('certificate_settings')
      .select('*')
      .single();

    const settings = certSettings ? dbToCamelCase(certSettings) : {
      title: 'CERTIFICATE OF COMPLETION',
      subtitle: 'This is to certify that',
      recipientText: '{employee_name}',
      achievementText: 'has successfully completed the',
      examText: '{exam_title}',
      scoreText: 'with a score of {percentage}%',
      rankText: 'Rank: {rank}',
      dateText: 'Date: {date}',
      signatureText: 'Authorized Signature',
      titleFont: 'Helvetica-Bold',
      titleSize: 24,
      titleColor: '#000000',
      bodyFont: 'Helvetica',
      bodySize: 14,
      bodyColor: '#333333',
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      accentColor: '#0066cc',
      logoUrl: '',
      logoPosition: 'top-center',
      logoWidth: 150,
      logoHeight: 80,
      signatureUrl: '',
      signaturePosition: 'bottom-center',
      signatureWidth: 120,
      signatureHeight: 60,
      showBorder: true,
      showSignature: true,
      showDate: true,
      showScore: true,
      showRank: true
    };

    // Generate PDF with custom settings
    const pdfBuffer = await generateCertificatePDF({
      employeeName: result.users?.name || 'N/A',
      examTitle: result.exams?.title || 'Exam',
      score: result.score,
      percentage: result.percentage,
      rank: result.rank,
      date: result.submitted_at,
      certificateNumber,
      settings: settings
    });

    // Upload to Supabase Storage
    const fileName = `certificates/${certificateNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true // Allow overwriting if certificate already exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload certificate to storage');
    }

    const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get certificate URL');
    }

    // Update result with certificate info
    await supabase.from('exam_results').update({ 
      certificate_number: certificateNumber,
      certificate_url: urlData.publicUrl
    }).eq('id', resultId);

    res.json({ certificateNumber, certificateUrl: urlData.publicUrl });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: error.message });
  }
});
