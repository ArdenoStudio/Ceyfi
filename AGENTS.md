# CEYFI

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Command | Notes |
|---------|------|---------|-------|
| Frontend (Next.js 16) | 3000 | `cd frontend && npm run dev` | Point it at the local backend via `NEXT_PUBLIC_API_BASE=http://localhost:8000` |
| Backend (FastAPI) | 8000 | `cd backend && python3 -m uvicorn app.main:app --port 8000` | Works without external API keys — Groq/ElevenLabs/DB degrade gracefully |

### Running the app

- **The backend MUST run for the frontend to show data.** There is no client-side mock toggle — `frontend/lib/api.ts` always fetches from `NEXT_PUBLIC_API_BASE` (default `http://localhost:8000`). (Older docs mention `NEXT_PUBLIC_USE_MOCK`; that variable does not exist in the code.)
- Start backend first (`python3 -m uvicorn app.main:app --port 8000`), then frontend with `NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev`.
- The backend's "mock" data is server-side: it serves fixture data at `/mock/*` endpoints (no API keys needed) and AI-powered endpoints at `/api/*`. AI endpoints fall back to deterministic heuristics when `GROQ_API_KEY` is absent.
- The `uvicorn` console script is installed under `~/.local/bin` (not on PATH); use `python3 -m uvicorn ...` to run the backend.

### Lint / test / build

- **Frontend lint:** `cd frontend && npm run lint` — ESLint 9 with next config. Currently passes with 0 errors (a few `@next/next/no-img-element` warnings in `components/wallet/*`).
- **Frontend smoke test:** `cd frontend && npm run test:smoke` — checks demo-critical files exist.
- **Frontend build:** `cd frontend && npm run build`
- **Backend smoke test:** `cd backend && bash scripts/smoke.sh http://localhost:8000` — requires running backend. 13 endpoint checks.
- No unit test suites exist for either frontend or backend (only smoke tests).

### Gotchas

- The frontend uses Next.js **16** (not 15 as some docs say). Read `node_modules/next/dist/docs/` before making changes.
- Backend `requirements.txt` pins `groq`, `openai`, `elevenlabs`, and `psycopg2-binary`, which pull in many transitive deps; `pip install` can take ~30s. (There is no `supabase` package in the requirements — Supabase is marked legacy/unused in `app/config.py`.)
- The DB (Postgres) is optional: without it the backend logs `connection ... failed` warnings and falls back to fixture data — this is expected, not a failure.
- The backend global exception handler (`app/main.py`) returns raw `str(exc)` — be careful not to leak secrets in error paths.
- `USE_SEYLAN_REAL=false` (default) keeps all Seylan Bank API calls disabled. The JustPay module raises `NotConfiguredError` unconditionally.
