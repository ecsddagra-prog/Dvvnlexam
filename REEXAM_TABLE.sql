-- Re-exam Requests Table
CREATE TABLE IF NOT EXISTS reexam_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  admin_notes TEXT
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_reexam_employee ON reexam_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_reexam_status ON reexam_requests(status);
