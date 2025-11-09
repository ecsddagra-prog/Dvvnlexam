# Certificate Storage Setup

## Supabase Storage Bucket Setup

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Bucket name: `certificates`
4. Make it **Public** (so certificates can be downloaded)
5. Click "Create bucket"

## Bucket Policies (Optional - for security)

If you want to restrict access, add these policies:

```sql
-- Allow public read access to certificates
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

-- Allow authenticated users to upload certificates
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');
```

## Done!

Certificate generation is now ready. When a certificate is generated:
- PDF will be created with proper design
- Uploaded to Supabase Storage
- URL saved in exam_results table
- Accessible via "View" link in admin dashboard
