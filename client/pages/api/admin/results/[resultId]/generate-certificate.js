import { requireRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { generateCertificatePDF } from '@/lib/certificateGenerator';
import { createClient } from '@supabase/supabase-js';

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

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resultId } = req.query;

    const { data: result, error: resultError } = await supabase
      .from('exam_results')
      .select(`
        *,
        exams(title, passing_score),
        users(name, employee_id)
      `)
      .eq('id', resultId)
      .single();

    if (resultError || !result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.percentage < result.exams?.passing_score || result.status !== 'passed') {
      return res.status(400).json({ error: 'Certificate only for passed exams' });
    }

    const certificateNumber = `CERT-${Date.now()}-${result.id.substring(0, 8).toUpperCase()}`;

    // Get certificate settings
    const { data: certSettings, error: settingsError } = await supabase
      .from('certificate_settings')
      .select('*')
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching certificate settings:', settingsError);
    }

    const settings = certSettings ? dbToCamelCase(certSettings) : {};

    // Create authenticated Supabase client for downloads
    const token = req.headers.authorization?.replace('Bearer ', '');
    const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Download logo and signature buffers
    let logoBuffer = null;
    if (settings.logoUrl) {
      try {
        const logoPath = settings.logoUrl.split('/logos/')[1];
        if (logoPath) {
          const { data, error } = await supabaseAuth.storage.from('certificates').download(`logos/${logoPath}`);
          if (!error && data) {
            logoBuffer = Buffer.from(await data.arrayBuffer());
          }
        }
      } catch (e) {
        console.log('Logo download failed:', e.message);
      }
    }

    let signatureBuffer = null;
    if (settings.signatureUrl) {
      try {
        const signaturePath = settings.signatureUrl.split('/signatures/')[1];
        if (signaturePath) {
          const { data, error } = await supabaseAuth.storage.from('certificates').download(`signatures/${signaturePath}`);
          if (!error && data) {
            signatureBuffer = Buffer.from(await data.arrayBuffer());
          }
        }
      } catch (e) {
        console.log('Signature download failed:', e.message);
      }
    }

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF({
      employeeName: result.users?.name || 'N/A',
      examTitle: result.exams?.title || 'Exam',
      score: result.score,
      percentage: result.percentage,
      rank: result.rank,
      date: result.submitted_at,
      certificateNumber,
      settings: settings,
      logoBuffer,
      signatureBuffer
    });

    // Upload to Supabase Storage
    const fileName = `certificates/${certificateNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(fileName);

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
