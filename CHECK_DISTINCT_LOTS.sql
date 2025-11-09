-- Check all distinct lot values in questions
SELECT 
  lot,
  COUNT(*) as count
FROM questions
WHERE status = 'approved'
GROUP BY lot
ORDER BY lot;
