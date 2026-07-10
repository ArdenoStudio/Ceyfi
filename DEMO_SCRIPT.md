# CEYFI — 90-Second Demo Script

Presenter cheat sheet for the Cursor Buildathon Colombo 2026 judges walkthrough.

## Before you start

1. Open **https://ceyfi.app** (or local `http://localhost:3000`).
2. Ensure backend is running (`uvicorn app.main:app --port 8000`) unless using mock-only mode.
3. Go to **`/login`** and sign in as **Nimal Fernando** (diaspora persona · `SEY-USR-001`).
4. Optional: open **`/demo`** in a second tab for keyboard shortcuts.

## Fixture numbers (must match on screen)

| Item | Value | Source |
|------|-------|--------|
| Family wallet total | LKR 245,000 | `SEY-ACC-002` |
| Household bucket (before spend) | LKR 71,500 | `family_wallet.json` |
| Demo spend trigger | LKR 12,400 @ Softlogic Glomark | `/mock/trigger-spend` |
| Household after spend | LKR 59,100 | 71,500 − 12,400 |
| Personal loan next due | **2026-07-25** · LKR 22,000 | `SEY-USR-001` |
| Business loan (Sunil) | **2026-06-08** · LKR 18,500 · AT RISK | `SEY-USR-003` |
| Tax jar balance | LKR 15,070 | `SEY-BIZ-001` |
| Tax jar demo trigger | LKR 8,200 in → LKR 820 saved (10%) | `/mock/tax-jar/trigger` |

## Demo personas (login screen)

| Name | Persona | Route | Tagline |
|------|---------|-------|---------|
| Nimal Fernando | Diaspora wallet | `/wallet` | Sends money home · wallet `SEY-ACC-002` |
| Sunil Bandara | Loan dashboard | `/loans` | Business borrower · overdue instalment |
| Suresh Silva | Business bookkeeper | `/business` | Silva Hardware · tax jar & P&L |

## 90-second click path

Press **`S`** on `/demo` to auto-run, or follow manually:

| Step | ~Time | Route / action | Say this |
|------|-------|----------------|----------|
| 1 | 16s | `/` Overview · pick a **Time River** plan | "CEYFI shows your financial future — select a plan on Time River." |
| 2 | 18s | `/wallet` then **Simulate family spend** (or key `1`) | "Nimal sends GBP home; Kumari spends from Household — watch LKR 12,400 drop." |
| 3 | 14s | `/scenarios` (brief) | "What-if scenarios — stress the plan before you commit." |
| 4 | 14s | `/assistant` | "Ask in Sinhala or English — live balances and loan context." |
| 5 | 16s | `/decisions` (auto-expands from `?plan=`) | "One ranked recommendation with evidence — execute in one tap." |
| 6 | 12s | **Reset demo** (key `3`) | "Clean slate for the next judge." |

**Total: ~90 seconds**

## Extended module demos (if time allows)

### Tax jar (Suresh Silva)

1. Log in as **Suresh Silva** → `/business`
2. Scroll to **Tax Jar** — balance should read **LKR 15,070**
3. On `/demo`, press **`2`** or click **Trigger tax jar**
4. Confirm toast: LKR 8,200 received · LKR 820 auto-saved

### Loans (Sunil Bandara)

1. Log in as **Sunil Bandara** → `/loans`
2. Health score: **AT RISK** · next payment LKR 18,500 · 12 days overdue
3. Mention MPGS **Pay Now** for live payment demo

## Keyboard shortcuts (`/demo`)

| Key | Action |
|-----|--------|
| `1` | Wallet spend — LKR 12,400, Household bucket |
| `2` | Tax jar — LKR 8,200 inbound, LKR 820 saved |
| `3` | Reset demo state |
| `4` | Prewarm wallet, loans, business paths |
| `S` | Run full 90-second script |

## Troubleshooting

- **Spend doesn't update wallet:** Check backend URL (`NEXT_PUBLIC_API_BASE`). Press `4` to prewarm.
- **Login fails:** Start backend on port 8000; frontend falls back to embedded personas.
- **Wrong loan date on screen:** Fixture next due for Nimal is **2026-07-25**, not June 1.
