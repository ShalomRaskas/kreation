# Kreation v2

AI-powered content script generator. Built with Next.js 14, Supabase, and Anthropic. Deploy on Vercel.

## Stack
- **Next.js 14** App Router + TypeScript + Tailwind CSS
- **Supabase** — Auth (email + Google OAuth) + Postgres database
- **Anthropic** claude-sonnet-4-6 — server-side script generation
- **Vercel** — deployment

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase-schema.sql`
3. In **Authentication → Providers**, enable Email and Google OAuth
4. Copy **Project URL** and **anon public key** from **Settings → API**

### 2. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add the same env vars in Vercel project settings
4. Deploy

## Routes
| Route | Description |
|---|---|
| `/` | Landing page — typewriter headline + email signup |
| `/auth` | Signup / Login (email or Google) |
| `/onboarding` | 5-question voice profile setup |
| `/dashboard` | Profile card + script history + idea input |
| `/script/[id]` | Script output — copy, share, refine |
| `/api/generate` | POST: generates script via Claude (server-side) |
| `/api/refine` | POST: refines script with feedback |

## Features
- **Voice profile** — 5 onboarding questions saved to Supabase
- **Script history** — every generated script saved with timestamp + topic
- **Voice learning** — last 2 scripts included in every new generation prompt
- **Refine** — iteratively improve scripts with feedback
- **Share** — shareable URLs per script
- **Google OAuth** — one-click sign in
