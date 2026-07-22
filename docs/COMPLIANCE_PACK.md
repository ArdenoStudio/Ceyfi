# Compliance pack (bank security questionnaire stub)

**Status:** Template / work-in-progress.  
**Do not present this as a completed certification package.** No SOC 2, ISO 27001, PCI DSS, or similar attestations are claimed here.

Use this document to answer partner-bank security questionnaires honestly. Mark every unanswered item as **TODO** until evidenced.

Related: `docs/BANK_PARTNERSHIP.md`, `docs/seylan-hub-api-mapping.md`.

---

## 1. Threat model outline (draft)

| Asset | Threat | Mitigation today | Gap / TODO |
|-------|--------|------------------|------------|
| Remittance transfer API | Unauthorized send / spoofed sender | Demo Bearer scoped per persona; `assert_transfer_access` | TODO: production auth (bank SSO / OAuth / mTLS) |
| Seylan API key | Leak via env, logs, or client | Server env only; header `x-api-key` | TODO: rotation runbook + bank key-delivery process |
| Remittance webhook | Spoofed step advances | Demo endpoint accepts JSON body | TODO: HMAC / shared secret / IP allowlist / mTLS before bank UAT |
| Exception payloads | Credential echo in `str(exc)` | Aware of risk in `app/main.py` | TODO: scrub secrets on auth/gateway error paths |
| Family wallet PII | Excess retention / cross-tenant leak | Demo personas / fixtures | TODO: DPA data map + retention schedule |
| Market / CSE data | Scraping / unlicensed redistribution | No `cse.lk` scrape; Chime partnership / mocks | Keep NFA; broker CTA disabled |
| Card / checkout | Card data in CEYFI systems | Prefer hosted checkout (MPGS) when enabled | TODO: confirm PCI scope with PSP; CEYFI must not store PAN |

**In scope for remittance MVP:** post-arrival tracking, bucket allocation, spend visibility, one-bank sandbox transfer when flags + credentials allow.

**Out of scope (MVP):** JustPay mandates (raises `NotConfiguredError`), multi-bank CEFTS mesh, competing FX corridor, CSE order entry.

---

## 2. DPA checklist (template)

| # | Item | Status |
|---|------|--------|
| 1 | Controllers / processors named (CEYFI operator ↔ partner bank) | TODO |
| 2 | Categories of personal data (account refs, amounts, names, locale) | TODO — draft list |
| 3 | Purpose limitation: remittance visibility + allocation only | TODO — legal wording |
| 4 | Lawful basis / customer consent flow | TODO |
| 5 | Cross-border transfer clauses (if any hosting outside LK) | TODO |
| 6 | Subprocessors list (hosting, AI, TTS, DB) | TODO — inventory |
| 7 | Retention & deletion on request | TODO |
| 8 | Breach notification window | TODO — align with bank SLA |
| 9 | Audit / inspection rights | TODO |
| 10 | Signed DPA attached | TODO — not signed |

---

## 3. Secrets handling

| Practice | Status |
|----------|--------|
| Bank / PSP / AI keys in server environment only | Done (pattern) |
| No secrets in `NEXT_PUBLIC_*` | Done (pattern) |
| Secrets not committed to git | Done (pattern) — verify before each release |
| Key rotation documented | TODO |
| Separate sandbox vs production keys | TODO — after bank provisions |
| `SEYLAN_TLS_VERIFY=true` by default | Done |
| Live Seylan calls gated by `USE_SEYLAN_REAL` + `SEYLAN_ENABLE_TRANSFERS` | Done |

---

## 4. Logging & audit

| Practice | Status |
|----------|--------|
| Transfer attempts logged (`wallet_transfer`) | Done |
| Remittance tracks persisted (`backend/data/remittance_tracks.json`) | Done (demo store) |
| Production durable audit store | TODO |
| Log redaction for API keys / PANs | TODO |
| Access logs retained per bank policy | TODO |

---

## 5. Market / data sourcing commitments

| Commitment | Status |
|------------|--------|
| Ceyfi **never scrapes** `cse.lk` | Done (product rule) |
| Market data via Chime partnership or mocks | Done |
| NFA (not financial advice) on Market surfaces | Done |
| Broker CTA disabled — no order entry | Done |

---

## 6. Questionnaire answer bank (fill as evidence exists)

Copy into the bank’s form; leave blank or “Not yet — see TODO” rather than inventing controls.

- **Hosting region / provider:** TODO  
- **Encryption in transit:** TLS; Seylan client verify default on (`SEYLAN_TLS_VERIFY`)  
- **Encryption at rest:** TODO (hosting provider default + confirm)  
- **Vulnerability scanning / pentest:** TODO — no report claimed  
- **Employee access control / MFA:** TODO  
- **Incident response contact:** TODO  
- **Business continuity / RTO-RPO:** TODO  
- **Certifications held:** **None claimed in this pack**

---

## Document control

| Field | Value |
|-------|-------|
| Last honest review | 2026-07-22 |
| Owner | TODO |
| Bank form version attached | TODO |
