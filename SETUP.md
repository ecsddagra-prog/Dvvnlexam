# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier)

## Step 1: Supabase Setup (5 minutes)

1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor → New Query
4. Copy and run `server/migrations/001_initial_schema.sql`
5. Copy and run `server/migrations/002_seed_admin.sql`
6. Go to Storage → Create bucket → Name: `certificates` → Public: Yes
7. Go to Settings → API → Copy:
   - Project URL
   - anon public key
   - service_role key (keep secret!)

## Step 2: Backend Setup

```bash
cd server
npm install
```

Edit `server/.env`:
```
PORT=3001
SUPABASE_URL=<your_project_url>
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_KEY=<your_service_role_key>
JWT_SECRET=<random_32_char_string>
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

## Step 3: Frontend Setup

```bash
cd client
npm install
```

Edit `client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=<your_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

Start frontend:
```bash
npm run dev
```

## Step 4: Test

1. Open http://localhost:3000
2. Login with:
   - Employee ID: `ADMIN001`
   - Password: `Admin@123`

## Next Steps

1. Upload employees via Excel
2. Create exams
3. Assign exams to employees
4. Employees login and take exams

## Excel Format

Create Excel with these columns:
```
EmployeeID | Name | Department | Email | Mobile | DefaultPassword
```

Example:
```
EMP001 | John Doe | IT | john@example.com | 9876543210 | Pass@123
```
