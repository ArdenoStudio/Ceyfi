# CEYFI Deployment

Single source of truth for live URLs and environment setup.

## Live URLs (target)

| Surface | URL | Git repo branch |
|---------|-----|-----------------|
| **Frontend** | https://ceyfi.vercel.app (or https://seylan-hub.vercel.app) | `ArdenoStudio/Ceyfi` `main` |
| **Backend API** | https://seylan-hub-backend.vercel.app | same monorepo `backend/` |
| **Status** | https://seylanhub-www.vercel.app | `status-site/` |

> **Action:** Link the Vercel project to **Ceyfi** (not legacy seylan-hub) so production matches this repo.

## Vercel (monorepo)

Root `vercel.json` uses experimental services:

- `frontend/` → `/`
- `backend/` → `/_/backend` (or deploy backend as separate Vercel project at `seylan-hub-backend.vercel.app`)

### Frontend env

```env
NEXT_PUBLIC_API_BASE=https://seylan-hub-backend.vercel.app
NEXT_PUBLIC_SITE_URL=https://ceyfi.vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_DEMO_ADMIN_KEY=ceyfi-demo-admin
```

### Backend env

```env
DATABASE_URL=postgresql://...  # Neon
GROQ_API_KEY=...
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
DEMO_SESSION_SECRET=...
USE_SEYLAN_REAL=false
SEYLAN_API_KEY=...
MPGS_ENABLE=false
```

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
