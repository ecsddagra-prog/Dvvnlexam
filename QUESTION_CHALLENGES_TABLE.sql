-- Create question_challenges table for employees to challenge questions
CREATE TABLE IF NOT EXISTS question_challenges (
    id SERIAL PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_result_id UUID NOT NULL REFERENCES exam_results(id) ON DELETE CASCADE,
    challenge_reason TEXT NOT NULL,
    suggested_correct_answer VARCHAR(10), -- A, B, C, D or null
    admin_response TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),

    -- Ensure one challenge per question per employee per exam result
    UNIQUE(question_id, employee_id, exam_result_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_challenges_question_id ON question_challenges(question_id);
CREATE INDEX IF NOT EXISTS idx_question_challenges_employee_id ON question_challenges(employee_id);
CREATE INDEX IF NOT EXISTS idx_question_challenges_status ON question_challenges(status);
CREATE INDEX IF NOT EXISTS idx_question_challenges_exam_result_id ON question_challenges(exam_result_id);

-- Add comments
COMMENT ON TABLE question_challenges IS 'Stores employee challenges to questions in exam results';
COMMENT ON COLUMN question_challenges.challenge_reason IS 'Reason why employee is challenging the question';
COMMENT ON COLUMN question_challenges.admin_response IS 'Admin response to the challenge';
COMMENT ON COLUMN question_challenges.status IS 'Status: pending, reviewed, resolved';
