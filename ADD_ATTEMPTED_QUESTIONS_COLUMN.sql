-- Add attempted_questions column to exam_results table
ALTER TABLE exam_results ADD COLUMN attempted_questions INTEGER DEFAULT 0;

-- Update existing records to set attempted_questions equal to total_questions
-- (since we don't have historical data, we'll assume all questions were attempted)
UPDATE exam_results SET attempted_questions = total_questions WHERE attempted_questions IS NULL OR attempted_questions = 0;
