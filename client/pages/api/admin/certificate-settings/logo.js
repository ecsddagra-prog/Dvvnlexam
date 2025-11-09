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
const uploadMiddleware = upload.single('logo');

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
            return res.status(400).json({ error: 'No logo file provided' });
          }

          // Generate unique filename with proper extension
          const fileExt = file.originalname.split('.').pop().toLowerCase();
          const fileName = `certificate-logo-${Date.now()}.${fileExt}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(`logos/${fileName}`, file.buffer, {
              contentType: file.mimetype,
              upsert: true
            });

          if (uploadError) {
            console.error('Logo upload error:', uploadError);
            throw new Error('Failed to upload logo to storage');
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(`logos/${fileName}`);

          if (!urlData?.publicUrl) {
            throw new Error('Failed to get logo URL');
          }

          res.json({
            success: true,
            logoUrl: urlData.publicUrl,
            fileName: fileName
          });
          resolve();
        } catch (error) {
          console.error('Error uploading logo:', error);
          res.status(500).json({ error: error.message || 'Failed to upload logo' });
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
