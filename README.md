# CEYFI

**Clarity for every rupee** — AI-powered banking for Sri Lanka: diaspora wallets, voice assistant, loan health, and SME bookkeeping.

Built for **Cursor Buildathon Colombo 2026** by Ardeno Studio.

## Live Demo

🌐 [ceyfi-app.vercel.app](https://ceyfi-app.vercel.app)

## Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | Next.js 16, Tailwind v4, CEYFI design system | Persona login, live intelligence |
| Backend | FastAPI, Neon Postgres | Unified financial snapshot API |
| Realtime | Supabase Postgres Changes | Wallet spend notifications |
| AI | Groq llama-3.3-70b, ElevenLabs TTS | Bilingual assistant |
| Deploy | Vercel (frontend), Fly.io (backend) | Demo + production paths |

## Modules

| Module | Route | Persona |
|--------|-------|---------|
| Diaspora Family Wallet | `/wallet` | Nimal Fernando — diaspora parent |
| **Market (Chime)** | `/market` | CSE watchlist + alerts + cash context — not a broker |
| AI Assistant | `/assistant` | EN + Sinhala voice & chat |
| Loan Dashboard | `/loans` | Sunil Bandara — borrower |
| Business Bookkeeper | `/business` | Suresh Silva — SME owner |
| Financial Intelligence | `/intelligence` | Live health score from snapshot API |
| Decision Room | `/decisions` | Ranked actions from live data |
| Scenario Lab | `/scenarios` | Shock modeling on real balances |

See [`docs/MARKET_CHIME.md`](docs/MARKET_CHIME.md) for the Chime-powered Market module.

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3000/login
```

## Environment Variables

See `frontend/.env.example` and `backend/.env.example`.

Key demo settings:
- `DEMO_SESSION_SECRET` — signs persona login tokens (required in production)
- `DEMO_ADMIN_KEY` — server-only; protects reset/seed/warm-up (set on backend **and** Vercel as `DEMO_ADMIN_KEY`, never `NEXT_PUBLIC_*`)
- `DEMO_AUTH_REQUIRED=true` — enforces Bearer auth on API/mock routes (default)
- `USE_SEYLAN_REAL=true` + `SEYLAN_ENABLE_TRANSFERS=true` — live sandbox transfers

## Demo Notes

- **Persona login** at `/login` — three Sri Lankan banking journeys
- **Presenter controls** at `/demo` — full product tour autopilot (press `S` or **Play auto demo**); covers wallet, scenarios, market, intelligence, loans, tax jar, assistant, decisions
- Keyboard shortcuts on demo page: `1` spend · `2` tax · `3` reset · `4` prewarm
- **Financial snapshot API** (`GET /api/financial-snapshot/{user_id}`) powers intelligence, decisions, and scenarios

## Testing

```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend smoke
cd frontend && npm run test:smoke

# Frontend E2E (Playwright)
cd frontend && npm run test:e2e:install && npm run test:e2e
```

## Credits

- **Groq** — Fast LLM inference
- **ElevenLabs** — Text-to-speech
- **Vercel** — Frontend hosting
- **Cursor** — AI-assisted development

## Team — Ardeno Studio

- **Ovindu** — Frontend Lead
- **Suven** — Backend Lead
