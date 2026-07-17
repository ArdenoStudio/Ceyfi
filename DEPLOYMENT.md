# CEYFI Deployment

Single source of truth for live URLs and environment setup.

## Live URLs (canonical)

| Surface | URL | Git repo branch |
|---------|-----|-----------------|
| **Frontend** | https://ceyfi-app.vercel.app | `ArdenoStudio/Ceyfi` `main` |
| **Backend API** | https://ceyfi-app.vercel.app/_/backend | Vercel `services` backend (`backend/`) |
| **Status** | https://ceyfi-app.vercel.app/status | frontend status route |

> **Vercel:** Project serves the Next.js app at `/` and the FastAPI backend at `/_/backend`. The old Cloud Run URL (`ceyfi-backend-…run.app`) is retired — leave `NEXT_PUBLIC_API_*` unset so the app uses `/_/backend`.

## Vercel (monorepo)

Root `vercel.json` uses Vercel `services` for monorepo builds:

- `frontend/` → `/` (Next.js)
- `backend/` → `/_/backend` (FastAPI `app.main:app`, path strip transform)

Production frontend traffic calls same-origin `/_/backend` by default.

### Frontend env

```env
# Prefer unset — app defaults to same-origin /_/backend
# NEXT_PUBLIC_API_BASE=
NEXT_PUBLIC_SITE_URL=https://ceyfi-app.vercel.app
NEXT_PUBLIC_APP_URL=https://ceyfi-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Server-only (Vercel → Settings → Environment Variables, NOT exposed to browser):
DEMO_ADMIN_KEY=...
DEMO_RESET_ENABLED=false
# Server proxies; defaults to https://$VERCEL_URL/_/backend when unset
# BACKEND_URL=
```

Shared URL constants for code fallbacks live in `frontend/lib/urls.ts` (`PRODUCTION_FRONTEND_URL`, `PRODUCTION_BACKEND_URL`, `absoluteBackendUrl()`).

### Backend env

```env
DATABASE_URL=postgresql://...  # Neon
GROQ_API_KEY=...
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
DEMO_SESSION_SECRET=...   # optional; code has a demo default — override in real deploys
DEMO_ADMIN_KEY=...
DEMO_AUTH_REQUIRED=true
CORS_ORIGINS=https://ceyfi-app.vercel.app,https://ceyfi.app
USE_SEYLAN_REAL=false
SEYLAN_API_KEY=...
MPGS_ENABLE=false
```

`CORS_ORIGINS` must include every frontend origin that calls the API when the backend is on a different host. Same-origin `/_/backend` does not need CORS. Code defaults also cover local dev ports `3000`/`3003`/`3005`.

## Google Cloud Build (backend)

The single canonical `main` branch trigger is:

`rmgpgab-ceyfi-backend-asia-southeast1-ArdenoStudio-Ceyfi--mamsl`

It builds the backend with Dockerfile `backend/Dockerfile` and build context `backend/`, pushes the image to Artifact Registry, and deploys Cloud Run service `ceyfi-backend` in `asia-southeast1`.

Do not create a duplicate trigger that expects a repository-root `Dockerfile`; this monorepo has no root Dockerfile, so that configuration fails before the image build starts.

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

GitHub Actions on `main`: frontend lint/smoke/e2e + backend pytest. Vercel Git integration deploys the frontend, and the canonical Google Cloud Build trigger above deploys the backend.
