# HR Training & Examination System

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth + JWT
- Storage: Supabase Storage
- Deployment: Vercel (Frontend + Backend)

## Setup

### 1. Supabase Setup
1. Create account at https://supabase.com
2. Create new project
3. Copy Project URL and anon key
4. Run SQL migrations from `server/migrations/`

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Add Supabase credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.example .env.local
# Add API URL and Supabase credentials
npm run dev
```

## Deployment
- Frontend: `vercel --prod` from client/
- Backend: `vercel --prod` from server/

## Features
✅ Excel employee import
✅ Role-based access (Admin/Contributor/Employee)
✅ Forced password reset on first login
✅ Minimal server hits (3 per exam)
✅ Auto rank & certificate generation
✅ QR verification for certificates
