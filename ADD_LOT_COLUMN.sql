-- Add lot column to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS lot VARCHAR(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_lot ON questions(lot);

-- Optional: Add comment for documentation
COMMENT ON COLUMN questions.lot IS 'Lot identifier for question categorization (e.g., Lot-1, Lot-2, etc.)';
