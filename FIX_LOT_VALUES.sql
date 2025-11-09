-- Update lot values from "Lot-1" to "1", "Lot-2" to "2", etc.
UPDATE questions 
SET lot = REPLACE(lot, 'Lot-', '')
WHERE lot LIKE 'Lot-%';

-- Verify the update
SELECT DISTINCT lot 
FROM questions 
WHERE status = 'approved' AND lot IS NOT NULL
ORDER BY lot;
