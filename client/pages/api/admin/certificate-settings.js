import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

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

// Helper function to convert camelCase to database column names
function camelToDbCase(camelObj) {
  return {
    page_size: camelObj.pageSize,
    orientation: camelObj.orientation,
    margins: camelObj.margins,
    custom_width: camelObj.customWidth,
    custom_height: camelObj.customHeight,
    logo_url: camelObj.logoUrl,
    logo_position: camelObj.logoPosition,
    logo_width: camelObj.logoWidth,
    logo_height: camelObj.logoHeight,
    signature_url: camelObj.signatureUrl,
    signature_position: camelObj.signaturePosition,
    signature_width: camelObj.signatureWidth,
    signature_height: camelObj.signatureHeight,
    title: camelObj.title,
    subtitle: camelObj.subtitle,
    recipient_text: camelObj.recipientText,
    achievement_text: camelObj.achievementText,
    exam_text: camelObj.examText,
    score_text: camelObj.scoreText,
    rank_text: camelObj.rankText,
    date_text: camelObj.dateText,
    signature_text: camelObj.signatureText,
    title_font: camelObj.titleFont,
    title_size: camelObj.titleSize,
    title_color: camelObj.titleColor,
    body_font: camelObj.bodyFont,
    body_size: camelObj.bodySize,
    body_color: camelObj.bodyColor,
    background_color: camelObj.backgroundColor,
    border_color: camelObj.borderColor,
    accent_color: camelObj.accentColor,
    show_border: camelObj.showBorder,
    show_signature: camelObj.showSignature,
    show_date: camelObj.showDate,
    show_score: camelObj.showScore,
    show_rank: camelObj.showRank
  };
}

export default requireAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get certificate settings from database
      const { data: settings, error } = await supabase
        .from('certificate_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      // Return default settings if not found
      const defaultSettings = {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        logoUrl: '',
        logoPosition: 'top-center',
        logoWidth: 150,
        logoHeight: 80,
        signatureUrl: '',
        signaturePosition: 'bottom-center',
        signatureWidth: 120,
        signatureHeight: 60,
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
        showBorder: true,
        showSignature: true,
        showDate: true,
        showScore: true,
        showRank: true
      };

      res.json(settings ? dbToCamelCase(settings) : defaultSettings);
    } catch (error) {
      console.error('Error fetching certificate settings:', error);
      res.status(500).json({ error: 'Failed to fetch certificate settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const settings = req.body;

      // Convert camelCase to database column names
      const dbSettings = camelToDbCase(settings);

      // Upsert certificate settings
      const { data, error } = await supabase
        .from('certificate_settings')
        .upsert({
          id: 1, // Use a fixed ID since we only need one settings record
          ...dbSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({ success: true, settings: dbToCamelCase(data) });
    } catch (error) {
      console.error('Error saving certificate settings:', error);
      res.status(500).json({ error: error.message || 'Failed to save certificate settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
