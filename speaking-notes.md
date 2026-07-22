# CEYFI — Video Speaking Notes
### Cursor Buildathon Colombo 2026 | Ardeno Studio

---

## INTRO (30–45 sec)

"Hey everyone — we're Ardeno Studio, and this is **CEYFI**: clarity for every rupee — an AI-powered financial platform we built for Sri Lanka in 24 hours for the Cursor Buildathon Colombo 2026.

The core idea is simple: banking in Sri Lanka still feels like it was designed in 2005. You can't see where your money actually went. You don't understand your loan. You definitely don't have an accountant. And if you're sending money home from abroad, you're basically flying blind.

We picked three real personas — the diaspora expat, the anxious borrower, and the small business owner — and built one unified platform that speaks to all of them. In English, Sinhala, or Tamil — full app, not assistant-only."

---

## ARCHITECTURE OVERVIEW (30 sec)

"Before we jump in — quick tech overview.

- **Frontend:** Next.js 16, React 19, Tailwind v4, shadcn/ui — deployed on Vercel
- **Backend:** FastAPI on Fly.io in Singapore
- **Database:** Supabase Postgres with realtime subscriptions
- **AI:** Groq's llama-3.3-70b for the LLM work, ElevenLabs for voice
- **Payments / bank rails:** MPGS Hosted Checkout when credentials are present; Seylan client modules behind `USE_SEYLAN_REAL` + `SEYLAN_ENABLE_TRANSFERS` (not a one-flip go-live). JustPay is not configured yet.

Everything's live right now at ceyfi.app."

---

## FEATURE 1 — DIASPORA FAMILY WALLET `/wallet` (1.5–2 min)

"First up — the **Family Wallet**. Remittance-narrow MVP for Sri Lankan expats sending money home.

Banks and corridors like Wise already move FX. CEYFI does **not** compete with those rails. We add **control after the money arrives** — post-arrival visibility and guidance the family can actually use.

**Beat 1 — Post-arrival path.** Sender sees the remittance path: initiated → corridor → bank clearing → landed. Demo transfers return `IN_TRANSIT` and advance on a timer until a bank webhook can take over. No fake 'instant settled' claim.

**Beat 2 — Sender guidance + buckets.** Split the land: School / Household / Savings — rules stick. Sender guidance nudges how the family should spend and save this month. When someone spends from a bucket, you see it — realtime with a polling fallback.

**Beat 3 — Full-app localisation.** English, Sinhala, and Tamil across the **whole app** — chrome, wallet copy, not just the assistant. Sampath feedback: most remittances support blue-collar families — keep labels simple so everyone can follow.

Demo send is still clean: amount, confirm, allocation auto-applies. Pitch to a bank: remittance visibility + allocation MVP — not a multi-rail FX product."

---

## FEATURE 2 — AI ASSISTANT `/assistant` (1.5–2 min)

"Next — the **AI Assistant**. This is the heart of the whole experience.

Banking apps have terrible help. FAQs written in legalese, chatbots that say 'I didn't understand that.' We wanted something that actually knows your account and can talk to you like a person.

Our assistant is powered by **Groq's llama-3.3-70b** — one of the fastest LLMs available right now — and it streams responses in real time so there's no waiting. Every conversation includes live context: your actual balance, your loan status, your recent transactions, your wallet buckets. It's not generic. It knows *your* money.

You can ask it things like: 'How much did I spend on food this month?' or 'When's my next loan payment?' or 'Can you explain my repayment schedule?' and it gives you a real, specific answer.

**Language** — the full app is EN / Sinhala / Tamil. The assistant follows the same locale so answers match the chrome the family already sees.

**Voice responses** — via ElevenLabs TTS, the turbo model for low latency. You can listen to the answer instead of reading it. We cache up to 64 unique responses in-process so repeat questions are instant.

And it's not just informational — the assistant can actually **trigger actions**. If you ask about making a loan payment, it can hand you off straight into the payment flow.

The UI is an ambient dark theme with particle effects and a dot-grid texture. We wanted it to feel premium — not like a bank chatbot from 2018."

---

## FEATURE 3 — LOAN DASHBOARD `/loans` (1.5–2 min)

"Third — the **Loan Dashboard**. This one's for the anxious borrower.

Most people with a loan have one question they're always silently asking: *'Am I okay?'* They don't understand their repayment schedule. They don't know if they're falling behind. They're just anxious.

So we built a **Health Score** — a number from 0 to 100, colour-coded: green is On Track, yellow is At Risk, red is Critical. It's computed from two things: have you missed payments, and how many days overdue are you. Clean and honest.

Alongside that you get:
- A **repayment progress bar** showing exactly how far through your loan you are
- A **countdown** to your next due date — e.g. "6 days until payment" for Nimal's personal loan
- Outstanding balance and next payment amount front and center — **LKR 22,000** for Nimal Fernando (`SEY-USR-001`)

Then there's the **AI Advisor panel** — powered by Groq, cached so it loads instantly. It reads your loan profile and gives you a plain-English summary: 'You're on track. Your next payment is LKR 22,000 on 25 July. You've paid 67% of your total loan.' For Sunil Bandara's business loan, the score shows **AT RISK** with LKR 18,500 overdue — that's the anxious-borrower moment. Actionable, specific, not scary.

And if you're ready to pay — you click **Pay Now**, and it opens **MPGS Hosted Checkout**. That's Mastercard's payment gateway, fully integrated. You pay, you're redirected back with `?paid=1`, we fire a success toast, update your loan state, and insert the transaction into Supabase. The whole loop, end to end."

---

## FEATURE 4 — BUSINESS BOOKKEEPER `/business` (1.5–2 min)

"Last module — the **Business Bookkeeper**. This one's for the Mudalali — the small business owner who's running a shop, a restaurant, a supplier operation — without an accountant.

SMEs in Sri Lanka mostly don't track their books properly. Not because they don't care — because the tools don't exist for them. Accounting software assumes you have a finance team.

We built something that works from your bank transactions. You've got 51 business transactions in the demo — groceries, utilities, wages, rent, transport — and our **AI categorization engine** (Groq again) reads each one and assigns it an expense category automatically. In English and in Sinhala. If Groq is unavailable or rate-limited, we fall back to deterministic regex patterns — the app never breaks.

You see a **Weekly P&L** — revenue, expenses, net income, margin percentage. Clean numbers, no jargon. And a **expense breakdown pie chart** so you can see at a glance that 35% of your spending went to suppliers last week.

Then there's the **Tax Jar**. This is one of our favourite features. Sri Lankan SME owners almost never set aside money for taxes — it hits them as a surprise bill. So we built an auto-save rule: every time a customer payment comes in, 10% goes straight into a tax reserve bucket. Automatic. Invisible. Responsible.

You can also **accept payments from customers** via MPGS — and that 10% auto-saves to the tax jar on every transaction capture. The whole thing is wired together end to end."

---

## INTEGRATIONS HIGHLIGHT (30–45 sec)

"A few integrations worth calling out — honestly:

**Seylan Bank Gateway** — client modules exist for account inquiry, internal transfers, CEFTS, and Merchant QR shapes. Live calls need **both** `USE_SEYLAN_REAL=true` **and** `SEYLAN_ENABLE_TRANSFERS=true` (plus sandbox credentials and an agreement). TLS verify defaults **on** (`SEYLAN_TLS_VERIFY=true`). JustPay is **not built** — it raises `NotConfiguredError` until the bank delivers the mandate/debit spec. One env flip is not how this goes live.

**MPGS** — Mastercard Hosted Checkout wired for remittance / loan / business collection demos when credentials are present.

**ElevenLabs + Groq** — voice and intelligence across assistant, advisor, and categorizer, with deterministic fallbacks when keys are absent."

---

## CLOSING (20–30 sec)

"We built this in 24 hours. The frontend is live on Vercel. The backend is running on Fly.io in Singapore. The database is on Supabase with realtime subscriptions firing across every module.

CEYFI isn't a mockup. It's a working remittance-narrow MVP — post-arrival visibility, allocation, and localisation — with real AI where keys exist, honest demo rails where the bank isn't live yet, and a clear path to one partner bank.

Thanks — we're Ardeno Studio."

---

## QUICK REFERENCE — Timing

| Section | Target Time |
|---|---|
| Intro | 30–45 sec |
| Architecture | 30 sec |
| Wallet | 1.5–2 min |
| Assistant | 1.5–2 min |
| Loans | 1.5–2 min |
| Business | 1.5–2 min |
| Integrations | 30–45 sec |
| Closing | 20–30 sec |
| **Total** | **~9–11 min** |

---

*Tips: Don't rush the persona framing at the start of each module — that's what makes it land. Pause after the Health Score reveal and after the Tax Jar explanation, those are the "oh that's clever" moments.*
