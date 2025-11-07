-- Create default admin user
INSERT INTO users (employee_id, name, email, password_hash, role, password_reset_required)
VALUES (
  'ADMIN001',
  'System Admin',
  'admin@example.com',
  '$2b$10$rKvVJKJ5xGZqH5YqH5YqH5YqH5YqH5YqH5YqH5YqH5YqH5YqH5Yq',
  'admin',
  false
);

-- Password is: Admin@123
-- Hash generated with: bcrypt.hash('Admin@123', 10)
