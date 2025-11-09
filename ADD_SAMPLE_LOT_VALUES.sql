-- Add sample lot values to existing questions
UPDATE questions 
SET lot = 'Lot-1' 
WHERE id IN (
  SELECT id FROM questions WHERE lot IS NULL LIMIT 10
);

UPDATE questions 
SET lot = 'Lot-2' 
WHERE id IN (
  SELECT id FROM questions WHERE lot IS NULL LIMIT 10
);

UPDATE questions 
SET lot = 'Lot-3' 
WHERE id IN (
  SELECT id FROM questions WHERE lot IS NULL LIMIT 10
);
