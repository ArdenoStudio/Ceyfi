# Market module (Chime-powered)

Ceyfi hosts the **Market** UI. Chime remains the CSE poller / alert engine.

## Routes

| Path | Purpose |
|---|---|
| `/market` | Watchlist summary + recent fires + cash context |
| `/market/watchlist` | Full watch list with activity badges + last fire |
| `/market/alerts` | Active rules + fire history |
| `/market/alerts/[id]` | Fire depth + path/candles + cash % + filings + disabled broker CTA |
| `/market/symbol/[symbol]` | Daily path/candles + disclosure PDF briefs |

## Backend

`GET /api/market/*` — authenticated with Ceyfi demo Bearer token.

| Endpoint | Notes |
|---|---|
| `/overview` | Enriched watchlist + fires + persona blurb |
| `/watchlist` | `alert_count`, `last_fire`, `activity` (`quiet`/`active`/`noisy`) |
| `/alerts`, `/fires`, `/fires/{id}` | Fire detail includes `depth` (still_true / cooled_off) + disclosures |
| `/symbols/{symbol}/bars` | Daily OHLC — Chime `daily-bars` or deterministic mock |
| `/symbols/{symbol}/path` | Close path + threshold + fire-day marker |
| `/symbols/{symbol}/disclosures` | Filings + Chime PDF briefs |

- Default: mock CSE payloads per persona (demo works offline)
- Optional live: set `CHIME_API_BASE` to proxy Chime `/api/v1/*` after demo login

```bash
# backend .env (production: set on Vercel backend service)
CHIME_API_BASE=https://your-chime-host
CHIME_DEMO_TELEGRAM_ID=123456789
```

Chime must have `DASH_DEMO_AUTH=1`, a non-empty `DASH_SESSION_SECRET`, and
`DASH_DEMO_TELEGRAM_IDS` including that id.

**Charts:** Line/area “path to alert” is default. Candles unlock when bars have
usable high/low ranges (`candle_ok`). Ceyfi never scrapes cse.lk — bars and
filings come from Chime’s Postgres path/disclosure pipelines.

## Compliance

Every Market surface carries NFA copy. **No Buy / Sell.** Broker handoff is
Phase 4 (licensed partner) — CTA stays disabled.
