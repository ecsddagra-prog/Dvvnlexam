# HR Training & Exam System - Features

## ✅ Implemented Features

### Authentication & Security
- JWT-based authentication
- Forced password reset on first login
- Role-based access control (Admin, Contributor, Employee)
- Bcrypt password hashing
- Secure token storage

### Admin Features
- Excel upload for bulk employee creation
- Create and manage exams
- Assign exams to employees
- Approve/reject questions from contributors
- View exam results and rankings
- Certificate verification

### Contributor Features
- Add questions (MCQ, True/False)
- Tag questions by difficulty and category
- View submission status (pending/approved/rejected)

### Employee Features
- View assigned exams
- Take exams with timer
- View results and rankings
- Download certificates

### Exam System
- Minimal server hits (3 per exam: start, fetch, submit)
- Client-side answer tracking
- Auto-submit on timer expiry
- Real-time countdown timer
- Single submission per exam

### Results & Certificates
- Automatic score calculation
- Rank calculation (percentage → time → submission time)
- Auto-generate PDF certificates with QR code
- Certificate storage in Supabase
- Downloadable certificates

## 🎯 Performance Optimizations

- Questions fetched once per exam
- Client-side state management
- Background rank calculation
- Async certificate generation
- Minimal database queries

## 📊 Database Schema

- users (employees, contributors, admins)
- exams
- questions
- exam_questions (many-to-many)
- exam_assignments
- exam_attempts
- exam_results

## 🚀 Tech Stack

- Frontend: Next.js 14 + Tailwind CSS
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage
- Deployment: Vercel (Free tier)
- Auth: JWT + Bcrypt

## 📱 Responsive Design

- Mobile-friendly UI
- Clean and minimal interface
- Accessible forms and buttons
