-- Add new fields to exams table
ALTER TABLE exams ADD COLUMN total_questions INTEGER DEFAULT 10;
ALTER TABLE exams ADD COLUMN marks_per_question INTEGER DEFAULT 1;
ALTER TABLE exams ADD COLUMN total_marks INTEGER DEFAULT 10;