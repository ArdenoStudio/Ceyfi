# Seylan Hub — Backend API

FastAPI backend for Seylan Hub AI banking platform.

## Architecture

```
Frontend (Next.js) ──→ Backend (FastAPI) ──→ Groq (LLM)
                            │                 ElevenLabs (TTS)
                            ├──→ Supabase (Postgres + Realtime)
                            └──→ Seylan Bank Gateway (feature-flagged)
```

## Quick Start

```bash
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

## Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Liveness probe |
| `/mock/account-context/{user_id}` | GET | Account context (fixture or live Seylan) |
| `/mock/family-wallet/{account_id}` | GET | Family wallet buckets |
| `/mock/loans/{user_id}` | GET | Loan data with health scores |
| `/mock/business-account/{user_id}` | GET | Business transactions (51 rows) |
| `/mock/pl-summary/{user_id}` | GET | Weekly P&L summary |
| `/mock/trigger-spend` | POST | Simulate wallet spend (fires Supabase realtime) |
| `/mock/tax-jar/trigger` | POST | Simulate tax jar auto-save |
| `/mock/reset-demo` | POST | Reset demo state |
| `/mock/seed` | POST | Full demo reset (DB + caches) |
| `/api/wallet/transfer` | POST | Execute wallet transfer with allocation rules |
| `/api/wallet/rules/{sender_id}` | GET | Get saved allocation rules |
| `/api/wallet/rules` | POST | Save allocation rules |
| `/api/chat` | POST | SSE streaming chat with Groq (account-aware) |
| `/api/tts` | POST | Text-to-speech via ElevenLabs |
| `/api/loans/{user_id}/health` | GET | Loan health score |
| `/api/loans/advisor` | POST | AI loan advisor summary |
| `/api/categorize-transactions` | POST | AI transaction categorization |
| `/api/tax-jar/rule` | POST | Create tax jar auto-save rule |
| `/api/business/insight` | GET | AI business P&L insight |

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | For AI features | Groq API key (llama-3.3-70b) |
| `SUPABASE_URL` | For realtime | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | For realtime | Supabase service role key |
| `ELEVENLABS_API_KEY` | For TTS | ElevenLabs API key |
| `USE_SEYLAN_REAL` | No (default: false) | Enable live Seylan Bank API |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |

## Testing

```bash
pip install pytest pytest-asyncio httpx
python -m pytest tests/ -v
```

## Feature Flags

- `USE_SEYLAN_REAL=false` — All Seylan Bank API calls disabled
- `SEYLAN_ENABLE_TRANSFERS=false` — Real bank transfers disabled
- `SEYLAN_ENABLE_MERCHANT_QR=false` — QR payment generation disabled
