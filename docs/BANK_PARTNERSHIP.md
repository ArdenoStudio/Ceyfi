# Bank partnership & remittance rails

Hackathon feedback (Sampath Bank): the hardest product risk is **backward integration with commercial banks**, not the wallet UI. Banks are cautious about APIs because of data privacy and cybersecurity. CEYFI should **piggyback one partner bank** (Seylan Hub path today; Sampath possible later) instead of multi-bank connectivity.

## Product stance

| Principle | Practice in CEYFI |
|-----------|-------------------|
| One bank first | Seylan client modules under `backend/app/seylan/` behind `USE_SEYLAN_REAL` |
| No premature multi-rail | JustPay stays `NotConfiguredError` until bank delivers the mandate/debit spec |
| Remittance MVP stays narrow | Tracking + bucket allocation + spend visibility — not USDT wallets or heavy budgeting |
| Sinhala / Tamil first-class | App chrome + wallet copy via `frontend/lib/i18n` (not assistant-only) |
| Security before integration asks | TLS, scoped demo auth, no secret leakage in error payloads |

## Current flags

```bash
USE_SEYLAN_REAL=false          # default — mocks / demo transfer
SEYLAN_ENABLE_TRANSFERS=false  # gate live internal / CEFTS calls
SEYLAN_ENABLE_QR=false
```

When a partner enables sandbox credentials, flip flags in the backend environment only after:

1. Signed API / data-processing agreement
2. Sandbox account numbers for source + destination
3. Enterprise security questionnaire answered (see checklist below)

## Remittance path tracking

Senders want to know when money lands. CEYFI exposes a demo multi-step path:

- `POST /api/wallet/transfer` → response includes `tracking`
- `GET /api/wallet/remittance/{transfer_id}/track`
- `GET /api/wallet/remittance/demo/track` — seeded completed path for demos

Steps: **initiated → corridor → bank clearing → landed**. Live bank webhooks can replace the demo timer later without changing the UI contract.

## Security checklist for bank reviews

- [ ] Secrets only in server env (never `NEXT_PUBLIC_*`)
- [ ] Demo Bearer tokens scoped per persona; transfer access asserted in `assert_transfer_access`
- [ ] Global exception handler must not echo credentials (keep `str(exc)` scrubbed for auth paths)
- [ ] Audit log for transfer attempts (`wallet_transfer` log line)
- [ ] Rate limits / PIN gate on send flows (frontend PinGate)
- [ ] No scraping of `cse.lk` — Market data via Chime partnership only
- [ ] NFA copy on Market surfaces; broker CTA remains disabled (no order entry)

## Recommended conversation with a partner bank

1. **MVP ask:** sandbox internal transfer + balance inquiry for diaspora remittance demo accounts.
2. **Not yet:** JustPay mandates, multi-bank CEFTS mesh, open banking aggregation.
3. **Value proof:** sender sees landed status + family bucket spend; blue-collar families get Sinhala/Tamil UI.
4. **Wise reality:** banks already capture remittance share via corridors like Wise — CEYFI adds **post-arrival control and visibility**, not a competing FX rail on day one.

## Related docs

- `docs/seylan-stakeholder-brief.md` — what to request from Seylan
- `docs/seylan-hub-api-mapping.md` — env ↔ module map
- `docs/MARKET_CHIME.md` — CSE alerts stay on Chime; CEYFI proxies
