# Bank partnership & remittance rails

Hackathon feedback (Sampath Bank): the hardest product risk is **backward integration with commercial banks**, not the wallet UI. Banks are cautious about APIs because of data privacy and cybersecurity. CEYFI should **piggyback one partner bank** (Seylan Hub path today; Sampath possible later) instead of multi-bank connectivity.

## Product stance

| Principle | Practice in CEYFI |
|-----------|-------------------|
| One bank first | Seylan client modules under `backend/app/seylan/` behind `USE_SEYLAN_REAL` |
| No premature multi-rail | JustPay stays `NotConfiguredError` until bank delivers the mandate/debit spec |
| Remittance MVP stays narrow | Tracking + bucket allocation + spend visibility — not USDT wallets or heavy budgeting |
| Post-arrival, not FX competition | CEYFI adds control **after** money lands; does not replace Wise / corridor FX rails |
| Sinhala / Tamil first-class | App chrome + wallet copy via `frontend/lib/i18n` (not assistant-only) |
| Security before integration asks | TLS on by default, scoped demo auth, no secret leakage in error payloads |

## Current flags

```bash
USE_SEYLAN_REAL=false          # default — mocks / demo transfer
SEYLAN_ENABLE_TRANSFERS=false  # gate live internal / CEFTS calls
SEYLAN_ENABLE_MERCHANT_QR=false
SEYLAN_TLS_VERIFY=true         # default — set false only for broken sandbox certs on local UAT
```

Auth header on gateway requests: **`x-api-key`** (from `SEYLAN_API_KEY`). Not `api_key`.

Live internal transfer requires **both** `USE_SEYLAN_REAL=true` **and** `SEYLAN_ENABLE_TRANSFERS=true`, plus provisioned credentials. A single env flip is **not** enough.

When a partner enables sandbox credentials, flip flags in the backend environment only after:

1. Signed API / data-processing agreement
2. Sandbox account numbers for source + destination
3. Enterprise security questionnaire answered (see checklist below + `docs/COMPLIANCE_PACK.md`)

## Remittance path tracking

Senders want to know when money lands. CEYFI exposes a multi-step path:

| Endpoint | Role |
|----------|------|
| `POST /api/wallet/transfer` | Creates transfer; response includes `tracking` |
| `GET /api/wallet/remittance/{transfer_id}/track` | Poll current path |
| `GET /api/wallet/remittance/demo/track` | Seeded completed path for demos |
| `POST /api/wallet/remittance/webhook` | Bank/partner advances steps |

**Steps:** initiated → corridor → bank clearing → landed.

### Demo behaviour (honest)

- Demo transfers (Seylan flags off) return status **`IN_TRANSIT`**, not `COMPLETED`.
- The tracker advances on a **timer** (~6s per step) so the UI can animate the path without a live bank rail.
- Persistence: `backend/data/remittance_tracks.json` (loaded/saved by `backend/app/services/remittance_tracking.py`).

### Bank webhook contract

```http
POST /api/wallet/remittance/webhook
Content-Type: application/json

{
  "transfer_id": "TRF-XXXXXXXX",
  "step": "clearing",
  "amount_lkr": 245000
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `transfer_id` | yes | Must match a known track (or pass `amount_lkr` to seed) |
| `step` | yes | `initiated` \| `corridor` \| `clearing` \| `landed` \| `failed` |
| `amount_lkr` | no | Optional; used when seeding / updating amount |
| `corridor` | no | Optional corridor label |

Webhook advances replace the demo timer without changing the UI tracking contract.

## Security checklist for bank reviews

| Item | Status | Notes |
|------|--------|-------|
| Secrets only in server env (never `NEXT_PUBLIC_*`) | Done | Bank keys, MPGS, Groq stay server-side |
| Demo Bearer tokens scoped per persona; `assert_transfer_access` | Done | Transfer access asserted in wallet router |
| Global exception handler must not echo credentials | Open | `app/main.py` still returns raw `str(exc)` — scrub auth paths before prod |
| Audit log for transfer attempts (`wallet_transfer` log line) | Done | Structured log on transfer |
| Rate limits / PIN gate on send flows | Partial | Frontend `PinGate` present; backend rate limits still light |
| No scraping of `cse.lk` | Done | Market via Chime partnership / mocks only |
| NFA copy on Market surfaces; broker CTA disabled | Done | No order entry |
| TLS verify on Seylan HTTPS (`SEYLAN_TLS_VERIFY=true`) | Done (default) | Override only for broken sandbox certs |
| Gateway auth header `x-api-key` | Done | See `backend/app/seylan/client.py` |
| JustPay / mandate debit | Not built | Raises `NotConfiguredError` |
| Signed DPA / security questionnaire pack | Open | Template in `docs/COMPLIANCE_PACK.md` — not filled certifications |
| Production webhook auth (HMAC / mTLS / IP allowlist) | Open | Demo webhook is unauthenticated — bank UAT must add auth |

## Sandbox ask package

Minimum package to request from a partner bank for a remittance pilot:

1. **Sandbox / UAT base URL(s)** for account inquiry + internal transfer (and QR host if in scope).
2. **API key** delivered out-of-band; confirm header name **`x-api-key`** (or document the bank’s actual auth scheme).
3. **Two test accounts** — source (diaspora/sender stand-in) + destination (family wallet stand-in), with known balances.
4. **TLS** — confirm public CA chain works with `SEYLAN_TLS_VERIFY=true`, or provide trust material if required.
5. **Webhook endpoint agreement** — bank (or test harness) POSTs step updates to `/api/wallet/remittance/webhook` with agreed auth.
6. **Scope letter** — remittance tracking + internal transfer only; JustPay / CEFTS mesh / multi-bank **out of scope** for MVP.
7. **Security questionnaire** — bank’s form + our answers in `docs/COMPLIANCE_PACK.md` (honest TODOs where not yet evidenced).

Related ask detail: `docs/seylan-stakeholder-brief.md`.

## Recommended conversation with a partner bank

1. **MVP ask:** sandbox internal transfer + balance inquiry for diaspora remittance demo accounts + webhook step posts.
2. **Not yet:** JustPay mandates, multi-bank CEFTS mesh, open banking aggregation.
3. **Value proof:** sender sees landed status + family bucket spend; blue-collar families get Sinhala/Tamil UI.
4. **Wise reality:** banks already capture remittance share via corridors like Wise — CEYFI adds **post-arrival control and visibility**, not a competing FX rail on day one.

## Related docs

- `docs/seylan-stakeholder-brief.md` — what to request from Seylan
- `docs/seylan-hub-api-mapping.md` — env ↔ module map
- `docs/COMPLIANCE_PACK.md` — security questionnaire stub (no fake certifications)
- `docs/MARKET_CHIME.md` — CSE alerts stay on Chime; CEYFI proxies
