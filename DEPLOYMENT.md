# CEYFI Deployment

Single source of truth for live URLs and environment setup.

## Live URLs (canonical)

| Surface | URL | Git repo branch |
|---------|-----|-----------------|
| **Frontend** | https://frontend-taupe-three-96.vercel.app | `ArdenoStudio/Ceyfi` `main` |
| **Backend API** | https://ceyfi-backend-98470559362.asia-southeast1.run.app | Cloud Run service `ceyfi-backend` |
| **Status** | https://frontend-taupe-three-96.vercel.app/status | frontend status route |

> **Vercel:** Project `frontend` serves the Next.js app. The FastAPI backend is deployed separately to Google Cloud Run in `asia-southeast1`.

## Vercel (monorepo)

Root `vercel.json` uses experimental services for monorepo builds:

- `frontend/` → `/`
- `backend/` → `/_/backend`

Production frontend traffic calls the canonical Cloud Run backend above.

### Frontend env

```env
NEXT_PUBLIC_API_BASE=https://ceyfi-backend-98470559362.asia-southeast1.run.app
NEXT_PUBLIC_SITE_URL=https://frontend-taupe-three-96.vercel.app
NEXT_PUBLIC_APP_URL=https://frontend-taupe-three-96.vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Server-only (Vercel → Settings → Environment Variables, NOT exposed to browser):
DEMO_ADMIN_KEY=...
DEMO_RESET_ENABLED=false
BACKEND_URL=https://ceyfi-backend-98470559362.asia-southeast1.run.app
```

Shared URL constants for code fallbacks live in `frontend/lib/urls.ts` (`PRODUCTION_FRONTEND_URL`, `PRODUCTION_BACKEND_URL`). Set the env vars above in Vercel so builds do not rely on hardcoded defaults.

### Backend env

```env
DATABASE_URL=postgresql://...  # Neon
GROQ_API_KEY=...
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
DEMO_SESSION_SECRET=...
DEMO_ADMIN_KEY=...
DEMO_AUTH_REQUIRED=true
CORS_ORIGINS=https://frontend-taupe-three-96.vercel.app,https://ceyfi.app
USE_SEYLAN_REAL=false
SEYLAN_API_KEY=...
MPGS_ENABLE=false
```

`CORS_ORIGINS` must include every frontend origin that calls the API. The Cloud Run value should contain only production aliases. Code defaults also cover local dev ports `3000`/`3003`/`3005`; add a specific preview origin temporarily only when browser testing that preview against the production API.

## Local dev

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm ci && npm run dev
```

Login at http://localhost:3000/login — pick diaspora, borrower, or SME persona.

## Banking MCP (Cursor)

See [docs/MCP.md](docs/MCP.md). Stdio server:

```bash
python backend/scripts/banking_mcp_stdio.py
```

HTTP bridge (when API is running):

- `GET /api/mcp/tools`
- `POST /api/mcp/call`

## CI

GitHub Actions on `main`: frontend lint/smoke/e2e + backend pytest. No auto-deploy — Vercel Git integration handles deploys.
