# CLAUDE.md — Kreation Codebase Guide

This file provides context for AI assistants working on the Kreation codebase.

---

## Project Overview

**Kreation** is an AI-powered social media ghostwriting tool. It captures a user's writing "voice" during onboarding, then generates platform-optimized content (X/Twitter, LinkedIn, Instagram, TikTok, YouTube) from a simple topic input.

**Tech stack:**
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Anthropic SDK (`@anthropic-ai/sdk`) — Claude Opus 4.5 for generation
- Supabase — PostgreSQL database + auth
- Tailwind CSS 4

---

## Repository Structure

```
kreation/
├── app/
│   ├── api/
│   │   ├── generate/route.ts     # POST — AI content generation (main feature)
│   │   └── waitlist/route.ts     # POST — email waitlist signup
│   ├── auth/page.tsx             # Login / signup page
│   ├── dashboard/page.tsx        # Main content generation UI (largest file)
│   ├── onboarding/page.tsx       # Voice capture (Q&A + past writing)
│   ├── layout.tsx                # Root layout, dark theme
│   ├── page.tsx                  # Public landing page
│   └── globals.css               # Tailwind base + global styles
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client (cookie-aware)
├── supabase/
│   └── migrations/
│       ├── 001_profiles.sql      # profiles table with RLS
│       └── 002_waitlist.sql      # waitlist table
├── middleware.ts                 # Route protection (auth redirects)
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Development Commands

```bash
npm run dev     # Start dev server (http://localhost:3000)
npm run build   # Production build
npm start       # Run production build
npm run lint    # ESLint check
```

There are **no tests** configured. No Jest, Vitest, or testing library is installed.

---

## Environment Variables

Create a `.env.local` file (never commit it — it is gitignored):

```env
# Supabase — exposed to browser
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase — server-only
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is used only in `/api/waitlist` (server route, bypasses RLS).
`ANTHROPIC_API_KEY` is used only in `/api/generate` (server route).

---

## Core Application Flow

```
Landing page (/) → waitlist email capture
        ↓
Auth (/auth) → Supabase email+password signup/login
        ↓  (middleware redirects if not authed)
Onboarding (/onboarding) → voice capture stored in profiles.voice_samples
        ↓
Dashboard (/dashboard) → topic input + platform select → /api/generate → display results
```

### Route Protection (`middleware.ts`)

- `/onboarding`, `/dashboard` — redirect to `/auth` if no session
- `/auth` — redirect to `/dashboard` if already logged in
- Static assets excluded from middleware

---

## AI Content Generation (`app/api/generate/route.ts`)

This is the core feature. Key details:

- **Model:** `claude-opus-4-5`
- **Endpoint:** `POST /api/generate`
- **Request body:** `{ topic: string, voiceSamples: string, platforms: string[] }`
- **Response:** `{ results: Array<{ platform: string, content: string }> }`

**Platform-specific behavior:**

| Platform  | Style                                        | max_tokens |
|-----------|----------------------------------------------|------------|
| X         | ≤280 chars, punchy, no hashtags              | 512        |
| LinkedIn  | 150–300 words, hook opener, professional     | 512        |
| Instagram | 50–150 words, conversational, optional emoji | 512        |
| TikTok    | Spoken script, 60–90 seconds                 | 1024       |
| YouTube   | Full script [INTRO]/[MAIN]/[OUTRO], 3–5 min  | 2048       |

All platforms are generated in **parallel** using `Promise.all`.

---

## Database Schema

### `profiles` table
```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id     UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE
voice_samples TEXT                     -- raw text from onboarding
created_at  TIMESTAMPTZ DEFAULT now()
updated_at  TIMESTAMPTZ DEFAULT now()  -- auto-updated by trigger
```
- RLS enabled: users can only SELECT/INSERT/UPDATE their own row
- Onboarding upserts to this table keyed by `user_id`

### `waitlist` table
```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
email       TEXT UNIQUE
created_at  TIMESTAMPTZ DEFAULT now()
```
- RLS: anyone can INSERT, no read access
- Duplicate emails return a friendly error (Postgres error code `23505`)

---

## Code Conventions

### File & Component Patterns
- All pages and interactive components use `'use client'` directive
- No shared component library — UI is built inline with Tailwind
- State is managed entirely with `useState` / `useEffect` / `useCallback` — no Redux or Context
- Forms use controlled inputs (no form libraries)

### Naming
- `camelCase` — variables, functions, imports
- `PascalCase` — React components
- `UPPER_SNAKE_CASE` — module-level constants (e.g., `PLATFORMS`, `PLATFORM_INSTRUCTIONS`, `QUESTIONS`)

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig)
- Use explicit union types for state machines: `'idle' | 'loading' | 'success' | 'error'`
- Use `as const` for tuple/array constants that TypeScript should narrow

### Styling
- Tailwind utility classes only — no CSS modules, no styled-components
- Dark theme throughout: base is `bg-[#0a0a0a]` with `text-white`
- Use opacity variants for hierarchy: `white/10`, `white/30`, `white/60`
- Responsive: `sm:`, `md:` prefixes where needed

### Error Handling
- Wrap async operations in `try/catch`
- Show user-friendly messages in the UI (avoid raw error messages)
- Log with `console.error(err)` on the server side
- Type-check caught errors: `if (err instanceof Error) err.message`

### Supabase Client Usage
- **Browser components** → import from `lib/supabase/client.ts`
- **Server components / API routes** → import from `lib/supabase/server.ts`
- Use `SUPABASE_SERVICE_ROLE_KEY` only in API routes that need to bypass RLS

### API Routes
- All routes are `POST` with JSON body + JSON response
- Validate inputs at the top of the handler before any async work
- Return `{ error: string }` with appropriate HTTP status on failure

---

## Deployment

- Deployed on **Vercel** (`.vercel` is gitignored)
- No Docker, no custom build scripts
- Standard `next build` output
- Environment variables must be set in the Vercel dashboard

---

## What Does Not Exist (Do Not Add Without Discussion)

- Tests — none configured; adding them requires choosing a framework
- Global state management — avoid Redux/Zustand/Context unless needed
- Shared component library — keep UI co-located in page files for now
- CI/CD pipelines — no GitHub Actions workflows exist
- Server Components that fetch data — all pages are currently client components
