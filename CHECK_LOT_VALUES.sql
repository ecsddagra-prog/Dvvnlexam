-- Check if questions have lot values
SELECT 
  COUNT(*) as total_questions,
  COUNT(lot) as questions_with_lot,
  COUNT(DISTINCT lot) as unique_lots
FROM questions;

-- Show sample lot values
SELECT DISTINCT lot 
FROM questions 
WHERE lot IS NOT NULL 
ORDER BY lot;
