-- Add exam session tracking
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  answers JSONB DEFAULT '{}',
  last_activity TIMESTAMP DEFAULT NOW(),
  UNIQUE(exam_id, user_id)
);

-- Add subject field to questions
ALTER TABLE questions ADD COLUMN subject VARCHAR(100);

-- Add randomization settings to exams
ALTER TABLE exams ADD COLUMN randomize_questions BOOLEAN DEFAULT true;
ALTER TABLE exams ADD COLUMN questions_per_exam INTEGER DEFAULT 10;

-- Create indexes for performance
CREATE INDEX idx_exam_sessions_active ON exam_sessions(is_active, user_id);
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);