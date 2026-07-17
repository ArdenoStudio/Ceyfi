# CEYFI — Full Product Demo Script

Presenter cheat sheet for the Cursor Buildathon Colombo 2026 judges walkthrough.

## Before you start

1. Open **https://ceyfi.app** (or local `http://localhost:3000`).
2. Ensure backend is running (`uvicorn app.main:app --port 8000`) unless using mock-only mode.
3. Go to **`/login`** and sign in as **Nimal Fernando** (diaspora persona · `SEY-USR-001`) — the autopilot also forces Nimal at start.
4. Optional: open **`/demo`** in a second tab for keyboard shortcuts, or press the floating **Play auto demo** button.

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
| Market fire | COMB crossed above LKR 125 | mock `f-1` |

## Demo personas (login screen)

| Name | Persona | Route | Tagline |
|------|---------|-------|---------|
| Nimal Fernando | Diaspora wallet | `/wallet` | Sends money home · wallet `SEY-ACC-002` |
| Sunil Bandara | Loan dashboard | `/loans` | Business borrower · overdue instalment |
| Suresh Silva | Business bookkeeper | `/business` | Silva Hardware · tax jar & P&L |

## Full product tour (auto demo)

Press **`S`** on `/demo`, or the floating **Play auto demo** button, to auto-run (~2 minutes). The autopilot switches personas mid-run.

| Chapter | Route / action | Say this |
|---------|----------------|----------|
| Time River | `/` · Inspect next risk → Select plan | "CEYFI shows your financial future — pick a plan on Time River." |
| Wallet | `/wallet` · Simulate family spend | "Nimal sends GBP home; Kumari spends from Household — watch LKR 12,400 drop." |
| Scenarios | `/scenarios` · Salary delay On | "What-if shocks — stress the plan before you commit." |
| Market | `/market` → `/market/alerts/f-1` | "CSE alerts via Chime next to cash. Broker CTA stays disabled — NFA." |
| Intelligence | `/intelligence` | "Explainable health score, anomalies and forecast." |
| Loans · Nimal | `/loans` | "Personal loan next due and repayment progress." |
| Loans · Sunil | switch persona → `/loans` | "Borrower lens — AT RISK overdue instalment." |
| Business | switch to Suresh → `/business` · tax jar | "Inbound sale auto-saves 10% to the tax jar." |
| Assistant | back to Nimal → Sinhala prompt | "Ask in Sinhala or English — live balances and loan context." |
| Decisions | `/decisions?plan=d1` · execute | "One ranked recommendation with evidence — execute in one tap." |
| Reset | admin reset + restore Nimal | "Clean slate for the next judge." |

## Keyboard shortcuts (`/demo`)

| Key | Action |
|-----|--------|
| `1` | Wallet spend — LKR 12,400, Household bucket |
| `2` | Tax jar — LKR 8,200 inbound, LKR 820 saved |
| `3` | Reset demo state |
| `4` | Prewarm wallet, loans, business paths |
| `S` | Run full product tour (autopilot) |
| `Esc` | Stop autopilot mid-run |

## Manual module demos (if time allows)

### Tax jar only (Suresh Silva)

1. Log in as **Suresh Silva** → `/business`
2. Scroll to **Tax Jar** — balance should read **LKR 15,070**
3. On `/demo`, press **`2`** or click **Trigger tax jar**
4. Confirm toast: LKR 8,200 received · LKR 820 auto-saved

### Loans only (Sunil Bandara)

1. Log in as **Sunil Bandara** → `/loans`
2. Health score: **AT RISK** · next payment LKR 18,500 · 12 days overdue
3. Mention MPGS **Pay Now** for live payment demo

### Market only

1. Open `/market` — watchlist + recent fires
2. Open a fire → cash context + disabled **Open my broker**

## Troubleshooting

- **Spend doesn't update wallet:** Check backend URL (`NEXT_PUBLIC_API_BASE`). Press `4` to prewarm.
- **Login / persona switch fails:** Start backend on port 8000; frontend falls back to embedded personas when `NEXT_PUBLIC_SKIP_AUTH=true`.
- **Wrong loan date on screen:** Fixture next due for Nimal is **2026-07-25**, not June 1.
- **Reset fails:** Needs `DEMO_RESET_ENABLED` + `DEMO_ADMIN_KEY` on the deployment.
