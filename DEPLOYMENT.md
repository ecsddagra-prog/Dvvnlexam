# Deployment Guide

## 1. Supabase Setup

1. Go to https://supabase.com and create account
2. Create new project
3. Go to SQL Editor and run migrations:
   - Run `server/migrations/001_initial_schema.sql`
   - Run `server/migrations/002_seed_admin.sql`
4. Go to Storage and create bucket named `certificates` (make it public)
5. Copy Project URL and anon key from Settings > API

## 2. Backend Deployment (Vercel)

```bash
cd server
npm install
vercel login
vercel
```

Set environment variables in Vercel dashboard:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- JWT_SECRET (generate random 32+ char string)
- NODE_ENV=production

## 3. Frontend Deployment (Vercel)

```bash
cd client
npm install
vercel
```

Set environment variables:
- NEXT_PUBLIC_API_URL (your backend URL from step 2)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## 4. Test Login

Default Admin:
- Employee ID: ADMIN001
- Password: Admin@123

## 5. Excel Format for Employee Upload

Create Excel file with columns:
- EmployeeID
- Name
- Department
- Email
- Mobile
- DefaultPassword

Example:
```
EmployeeID | Name        | Department | Email              | Mobile      | DefaultPassword
EMP001     | John Doe    | IT         | john@example.com   | 9876543210  | Pass@123
EMP002     | Jane Smith  | HR         | jane@example.com   | 9876543211  | Pass@123
```

## Performance Notes

- Exam questions fetched once on start (1 API call)
- All answers tracked client-side
- Single submit API call
- Rank & certificate generated in background
- Total: 3 API calls per exam (start, fetch, submit)
