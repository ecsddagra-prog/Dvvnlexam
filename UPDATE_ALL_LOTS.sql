-- Update all questions with lot values based on their ID
UPDATE questions 
SET lot = CASE 
  WHEN MOD(CAST(SUBSTRING(id::text, 1, 8) AS INTEGER), 3) = 0 THEN 'Lot-1'
  WHEN MOD(CAST(SUBSTRING(id::text, 1, 8) AS INTEGER), 3) = 1 THEN 'Lot-2'
  ELSE 'Lot-3'
END
WHERE lot IS NULL OR lot = '';
