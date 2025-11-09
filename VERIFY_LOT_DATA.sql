-- Verify lot values in approved questions
SELECT DISTINCT lot 
FROM questions 
WHERE status = 'approved' AND lot IS NOT NULL
ORDER BY lot;
