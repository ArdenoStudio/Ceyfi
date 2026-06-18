# Seylan Hub

**AI banking for Sri Lanka** — diaspora wallets, voice assistant, loan health, and bookkeeping for SMEs.

Built in 24 hours for **Cursor Buildathon Colombo 2026** by Ardeno Studio.

## Live Demo

🌐 **Frontend:** [seylan-hub.vercel.app](https://seylan-hub.vercel.app) _(Vercel)_

**Backend:** [seylan-hub-api.fly.dev](https://seylan-hub-api.fly.dev) *(Fly.io — Singapore region)*

## Architecture

| Layer | Tech | Owner |
|-------|------|-------|
| Frontend | Next.js 16, Tailwind v4, shadcn/ui | Ovindu |
| Backend | FastAPI, Supabase, Groq | Suven |
| Realtime | Supabase Postgres Changes | Both |
| AI | Groq llama-3.3-70b, ElevenLabs TTS | Suven |
| Deploy | Vercel (frontend), Fly.io (backend — sin) | Both |

## Modules

| Module | Route | Persona |
|--------|-------|---------|
| Diaspora Family Wallet | `/wallet` | P1 — Sri Lankan expat sending money home |
| AI Assistant | `/assistant` | P2 — Digital-native customer (EN + Sinhala) |
| Loan Dashboard | `/loans` | P3 — Anxious borrower needing clarity |
| Business Bookkeeper | `/business` | P4 — Mudalali (SME owner) |

## Quick Start

```bash
# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

# Backend (separate repo/directory)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

## Environment Variables

See `frontend/.env.example` for all required variables. Set `NEXT_PUBLIC_USE_MOCK=true` to run with demo data (no backend needed).

## Demo Notes

- Frontend demo controls live at `/demo` for spend trigger, tax jar trigger,
  reset, and prewarm actions.
- The deployed UI shows whether it is using demo data or the live API.
- Wallet realtime has a polling fallback so the demo can continue if Supabase
  realtime is unavailable.

## Seylan Bank integration notes

Stakeholder onboarding brief (non-technical and technical checkpoints for Seylan): [docs/seylan-stakeholder-brief.md](docs/seylan-stakeholder-brief.md).

Hub modules mapped to gateway Python packages and environment toggles:
[docs/seylan-hub-api-mapping.md](docs/seylan-hub-api-mapping.md).

## Credits

- **Seylan Bank** — Sponsor & banking domain
- **Groq** — Fast LLM inference (llama-3.3-70b)
- **ElevenLabs** — Text-to-speech
- **Supabase** — Realtime database & auth
- **Vercel** — Frontend hosting & edge functions
- **Cursor** — AI-assisted development

## Team — Ardeno Studio

- **Ovindu** — Frontend Lead
- **Suven** — Backend Lead
