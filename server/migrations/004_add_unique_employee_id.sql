-- Add unique constraint to employee_id column
ALTER TABLE users ADD CONSTRAINT unique_employee_id UNIQUE (employee_id);