# CEYFI — Frontend

AI banking platform for Sri Lanka: diaspora wallets, voice assistant, loan health, and bookkeeping for SMEs. Built for **Cursor Buildathon Colombo 2026**.

## Deploy URL

https://ceyfi-app.vercel.app

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Lucide React
- **Realtime:** Supabase JS client
- **AI:** Groq llama-3.3-70b (via backend), ElevenLabs TTS, Web Speech API STT

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE` | Backend API URL (default: `http://localhost:8000`). Required for production. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for wallet realtime) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Demo Reliability

- `/demo` contains the demo control panel for wallet spend, tax jar trigger,
  reset, and data prewarm actions.
- The wallet uses Supabase Realtime when connected and falls back to polling
  when realtime is unavailable.
- All module data comes from the FastAPI backend (`NEXT_PUBLIC_API_BASE`).
- Run `npm run test:smoke` before presenting to verify demo-critical files and
  routes are present.

## Modules

| Route | Persona | Description |
|-------|---------|-------------|
| `/` | All | Onboarding — persona selection |
| `/wallet` | P1 Diaspora Provider | Family wallet with buckets, real-time spend |
| `/assistant` | P2 Digital-Native | AI chat assistant (EN/SI) |
| `/loans` | P3 Anxious Borrower | Loan health dashboard |
| `/business` | P4 Mudalali | P&L, categorised feed, tax jar |

## Credits

- **Groq** — LLM inference
- **ElevenLabs** — Text-to-speech
- **Supabase** — Realtime database
- **Vercel** — Hosting & deployment
