-- Delete all questions from the questions table
DELETE FROM questions;

-- Optional: Reset the auto-increment counter (if using serial/auto-increment)
-- For PostgreSQL:
-- ALTER SEQUENCE questions_id_seq RESTART WITH 1;

-- If you want to delete related data as well (exam_questions mapping):
-- DELETE FROM exam_questions;
