-- Add major_subject column to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS major_subject VARCHAR(100);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_major_subject ON questions(major_subject);

-- Optional: Add some common major subjects as examples
COMMENT ON COLUMN questions.major_subject IS 'Major subject area like Electrical Engineering, Civil Engineering, Mechanical Engineering, etc.';
