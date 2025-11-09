-- Delete old certificate records from exam_results table
-- This will remove certificate_number and certificate_url from old exam results
-- Adjust the date condition as needed

-- Example: Delete certificates older than 1 year
DELETE FROM exam_results
WHERE certificate_url IS NOT NULL
  AND submitted_at < NOW() - INTERVAL '1 year';

-- Example: Delete certificates older than 6 months
-- Uncomment and modify as needed
-- DELETE FROM exam_results
-- WHERE certificate_url IS NOT NULL
--   AND submitted_at < NOW() - INTERVAL '6 months';

-- Example: Delete certificates older than a specific date
-- DELETE FROM exam_results
-- WHERE certificate_url IS NOT NULL
--   AND submitted_at < '2024-01-01';

-- To delete all certificates (use with caution):
-- DELETE FROM exam_results
-- WHERE certificate_url IS NOT NULL;

-- Note: This only removes the database records.
-- The actual PDF files in Supabase storage will remain.
-- To delete from storage, you would need to use Supabase storage API or dashboard.
