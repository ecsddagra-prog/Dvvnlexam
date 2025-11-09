import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
});

// Create upload middleware
const uploadMiddleware = upload.single('signature');

export default requireAuth(async function handler(req, res) {
  return new Promise((resolve, reject) => {
    if (req.method === 'POST') {
      uploadMiddleware(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
            }
          }
          return res.status(400).json({ error: err.message });
        }

        try {
          const file = req.file;
          if (!file) {
            return res.status(400).json({ error: 'No signature file provided' });
          }

          // Generate unique filename with proper extension
          const fileExt = file.originalname.split('.').pop().toLowerCase();
          const fileName = `certificate-signature-${Date.now()}.${fileExt}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(`signatures/${fileName}`, file.buffer, {
              contentType: file.mimetype,
              upsert: true
            });

          if (uploadError) {
            console.error('Signature upload error:', uploadError);
            throw new Error('Failed to upload signature to storage');
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(`signatures/${fileName}`);

          if (!urlData?.publicUrl) {
            throw new Error('Failed to get signature URL');
          }

          // Save signature URL to certificate settings
          const { error: updateError } = await supabase
            .from('certificate_settings')
            .upsert({
              id: 1,
              signature_url: urlData.publicUrl,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (updateError) {
            console.error('Failed to save signature URL:', updateError);
            // Don't throw, just log
          }

          res.json({
            success: true,
            signatureUrl: urlData.publicUrl,
            fileName: fileName
          });
          resolve();
        } catch (error) {
          console.error('Error uploading signature:', error);
          res.status(500).json({ error: error.message || 'Failed to upload signature' });
          resolve();
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
      resolve();
    }
  });
});

export const config = {
  api: {
    bodyParser: false,
  },
};
