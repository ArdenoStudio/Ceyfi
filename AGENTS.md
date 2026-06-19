# CEYFI

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Command | Notes |
|---------|------|---------|-------|
| Frontend (Next.js 16) | 3000 | `cd frontend && npm run dev` | Set `NEXT_PUBLIC_USE_MOCK=true` for demo mode (no backend/keys needed) |
| Backend (FastAPI) | 8000 | `cd backend && uvicorn app.main:app --port 8000` | Works without external API keys — Groq/Supabase/ElevenLabs degrade gracefully |

### Running the app

- **Mock mode (default, no secrets needed):** Frontend runs standalone with hardcoded demo data when `NEXT_PUBLIC_USE_MOCK=true`.
- **With backend:** Start backend first (`uvicorn app.main:app --port 8000`), then frontend with `NEXT_PUBLIC_USE_MOCK=false NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev`.
- Backend serves mock fixture data at `/mock/*` endpoints and AI-powered endpoints at `/api/*`. AI endpoints fall back to deterministic heuristics when `GROQ_API_KEY` is absent.

### Lint / test / build

- **Frontend lint:** `cd frontend && npm run lint` — ESLint 9 with next config. Currently passes clean (0 errors).
- **Frontend smoke test:** `cd frontend && npm run test:smoke` — checks demo-critical files exist.
- **Frontend build:** `cd frontend && npm run build`
- **Backend smoke test:** `cd backend && bash scripts/smoke.sh http://localhost:8000` — requires running backend. 13 endpoint checks.
- **Backend unit tests:** `cd backend && python3 -m pytest tests/ -q` — full pytest suite (~565 tests, all pass). Needs `pytest` + `pytest-asyncio` (installed by the update script; not in `requirements.txt`).
- No frontend unit test suite exists (only the smoke check above).

### Gotchas

- `uvicorn` and `pytest` install to `~/.local/bin`, which is **not on PATH**. Run them as `python3 -m uvicorn ...` / `python3 -m pytest ...`.
- The frontend uses Next.js **16** (not 15 as some docs say). Read `node_modules/next/dist/docs/` before making changes.
- Backend `requirements.txt` uses `supabase>=2.5.0` which pulls in many transitive deps; `pip install` can take ~30s.
- The backend global exception handler (`app/main.py`) returns raw `str(exc)` — be careful not to leak secrets in error paths.
- `USE_SEYLAN_REAL=false` (default) keeps all Seylan Bank API calls disabled. The JustPay module raises `NotConfiguredError` unconditionally.
