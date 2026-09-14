# SpendSmart — Deployment Guide

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local
# Fill in your Supabase and Gemini API keys

# 3. Run development server
npm run dev
# Open http://localhost:3000
```

---

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to India (e.g., Singapore `ap-southeast-1`)
3. Once created, go to **SQL Editor** → paste & run `supabase/schema.sql`
4. Go to **Authentication → Providers** → ensure **Email** is enabled
5. Go to **Project Settings → API** → copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Get Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com) → **Get API Key**
2. Create API key → copy it → `GEMINI_API_KEY`
3. Model used: `gemini-2.0-flash-exp` (free, 15 RPM)

---

## Step 3: Local Development

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm install
npm run dev
```

Sign up at `/signup` — demo data will be automatically seeded!

---

## Step 4: Deploy to Vercel

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Framework: **Next.js** (auto-detected)
4. Add all 5 environment variables in Vercel dashboard
5. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g., `https://spend-smart.vercel.app`)
6. Click **Deploy**

### Update Supabase Auth
After deploying:
- Supabase → **Authentication → URL Configuration**
- Add your Vercel URL to **Allowed Redirect URLs**: `https://your-app.vercel.app/**`
- Set **Site URL** to your Vercel deployment URL

---

## Architecture Diagram

```
User Browser
    │
    ├── Next.js App Router (Vercel Edge)
    │       ├── /login, /signup (Auth pages)
    │       ├── / (Dashboard — SSR)
    │       ├── /expenses (SSR + Client filter)
    │       ├── /expenses/new (Client form)
    │       ├── /analytics (SSR + Client charts)
    │       ├── /budgets (SSR + Client CRUD)
    │       └── /ai-chat (Client chat UI)
    │
    ├── API Routes (Edge Functions)
    │       ├── /api/ai/categorize → Gemini Flash
    │       ├── /api/ai/receipt   → Gemini Vision
    │       ├── /api/ai/chat      → Gemini Pro
    │       ├── /api/ai/insights  → Gemini Pro
    │       └── /api/ai/budget-recommend → Gemini Pro
    │
    └── Supabase
            ├── Auth (email/password)
            ├── PostgreSQL
            │   ├── profiles
            │   ├── expenses
            │   ├── budgets
            │   └── ai_insights
            └── Storage (receipts bucket)
```

---

## AI Model Selection

| Task | Model | Reason |
|------|-------|--------|
| Auto-categorization | `gemini-2.0-flash-exp` | Speed (<500ms), real-time |
| Receipt OCR | `gemini-2.0-flash-exp` | Multimodal vision support |
| Chat assistant | `gemini-1.5-flash` | Better reasoning, context |
| Insights generation | `gemini-1.5-flash` | Analytical depth |
| Budget recommendations | `gemini-1.5-flash` | Nuanced financial advice |

Both models have a **generous free tier** on Google AI Studio.

---

## Features Checklist

- [x] Email + password authentication (Supabase Auth)
- [x] Dashboard with spending stats and trends
- [x] AI auto-categorization of expenses (Gemini Flash)
- [x] Receipt upload + OCR auto-fill (Gemini Vision)
- [x] Expenses list with search and category filter
- [x] 6-month analytics charts (Recharts)
- [x] Category pie chart with percentages
- [x] Daily spending area chart
- [x] Budget manager with CRUD
- [x] Budget vs actual progress bars
- [x] AI budget recommendations
- [x] AI chat assistant with expense context
- [x] AI insights generation and storage
- [x] Dismissable insight notifications on dashboard
- [x] Demo data seeded on signup
- [x] Fully responsive (mobile, tablet, desktop)
- [x] Dark mode UI with glassmorphism
- [x] Row Level Security (RLS) on all tables
- [x] Supabase Storage for receipts (private, user-scoped)
