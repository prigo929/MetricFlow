# MetricFlow — Deployment Guide

## Prerequisites
- Vercel account (free tier works)
- Supabase project with schema migrated
- Node.js 18+

## Step-by-step Vercel deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login and link project
```bash
vercel login
vercel link   # follow prompts, choose "create new project"
```

### 3. Set environment variables in Vercel
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```
Paste values from: Supabase Dashboard → Project Settings → API

### 4. Deploy
```bash
vercel --prod
```
Your app will be live at: `https://metricflow-xxxx.vercel.app`

## Supabase production config

### Enable email confirmations (optional for demo)
Supabase Dashboard → Authentication → Email Templates → disable "Confirm email" for demo simplicity.

### Set allowed redirect URLs
Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-vercel-url.vercel.app`
- Redirect URLs: `https://your-vercel-url.vercel.app/auth/callback`

### Connection pooling (important for Edge functions)
Supabase Dashboard → Project Settings → Database → Connection pooling:
- Mode: Transaction
- The `@supabase/ssr` package handles this automatically.

## Environment variables reference

| Variable | Where to find | Required |
|----------|---------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Server-only |

## Custom domain (optional)
Vercel Dashboard → your project → Settings → Domains → Add domain.
Update Supabase redirect URLs to match.
