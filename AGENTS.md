# Seylan Hub

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Command | Notes |
|---------|------|---------|-------|
| Frontend (Next.js 16) | 3000 | `cd frontend && npm run dev` | Set `NEXT_PUBLIC_USE_MOCK=true` for demo mode (no backend/keys needed) |
| Backend (FastAPI) | 8000 | `cd backend && . .venv/bin/activate && uvicorn app.main:app --port 8000` | Works without external API keys — Groq/Supabase/ElevenLabs degrade gracefully |

### Running the app

- Backend Python deps install into a venv at `backend/.venv` (created by the startup update script). Activate it (`. .venv/bin/activate`) before running `uvicorn`/`pytest`.
- **Mock mode (default, no secrets needed):** Frontend runs standalone with hardcoded demo data when `NEXT_PUBLIC_USE_MOCK=true`.
- **With backend:** Start backend first (`cd backend && . .venv/bin/activate && uvicorn app.main:app --port 8000`), then frontend with `NEXT_PUBLIC_USE_MOCK=false NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev`.
- Backend serves mock fixture data at `/mock/*` endpoints and AI-powered endpoints at `/api/*`. AI endpoints fall back to deterministic heuristics when `GROQ_API_KEY` is absent.

### Lint / test / build

- **Frontend lint:** `cd frontend && npm run lint` — ESLint 9 with next config. Pre-existing failures: 2 errors (`react-hooks/set-state-in-effect`) plus 6 `@next/next/no-img-element` warnings.
- **Frontend smoke test:** `cd frontend && npm run test:smoke` — checks demo-critical files exist.
- **Frontend build:** `cd frontend && npm run build`
- **Backend unit tests:** `cd backend && . .venv/bin/activate && pytest tests/ -v` — 41 tests; requires `pytest-asyncio` + `httpx` (installed by the update script).
- **Backend smoke test:** `cd backend && bash scripts/smoke.sh http://localhost:8000` — requires running backend. 13 endpoint checks.

### Gotchas

- The frontend uses Next.js **16** (not 15 as some docs say). Read `node_modules/next/dist/docs/` before making changes.
- Backend `requirements.txt` pulls in `groq`, `openai`, `elevenlabs`, `mcp`, etc.; a fresh `pip install` takes ~10–30s.
- Card payments require enabling **Demo Mode** in the Send Money modal; without it the UI shows "Card payments are not available in test mode" (real gateway is feature-flagged off).
- `USE_SEYLAN_REAL=false` (default) keeps all Seylan Bank API calls disabled. The JustPay module raises `NotConfiguredError` unconditionally.
