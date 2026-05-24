# MetricFlow — B2B Sales Intelligence Platform

Bachelor thesis project: "B2B Sales Intelligence and Order Management Web Application Based on Data Analysis"

## Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment**: Vercel + Supabase Cloud

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
cp .env.example .env.local
```

### 3. Set up database
Run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

### 4. Seed demo data
```bash
cd supabase/seed
pip install faker
python seed_data.py > seed.sql
# Replace ADMIN_USER_ID in seed.sql with your auth user ID
# Then run seed.sql in Supabase SQL Editor
```

### 5. Run development server
```bash
npm run dev
```

## Project Structure
```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (dashboard)/     # Protected app pages
│   └── auth/callback/   # Supabase OAuth callback
├── actions/             # Server Actions (mutations)
├── components/
│   ├── charts/          # Recharts wrappers
│   ├── forms/           # React Hook Form components
│   ├── layout/          # Sidebar, TopBar
│   ├── shared/          # KpiCard, StatusBadge, etc.
│   └── ui/              # Base UI primitives
├── lib/
│   ├── supabase/        # Client, server, middleware
│   ├── utils/           # Formatting helpers
│   └── validations/     # Zod schemas
└── types/               # TypeScript types
```

## Modules
1. **Auth** — Email/password login with Supabase Auth
2. **Companies** — B2B client CRM
3. **Contacts** — Company contacts
4. **Products** — Product catalog
5. **Orders** — Order management pipeline
6. **Analytics** — KPI dashboard + charts
7. **Reports** — Filterable reports + CSV export

## Deployment
```bash
vercel --prod
```
Set environment variables in Vercel dashboard.
