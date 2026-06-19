# CEYFI — Video Speaking Notes
### Cursor Buildathon Colombo 2026 | Ardeno Studio

---

## INTRO (30–45 sec)

"Hey everyone — we're Ardeno Studio, and this is **CEYFI**: an AI-powered banking platform we built for Seylan Bank in 24 hours for the Cursor Buildathon Colombo 2026.

The core idea is simple: banking in Sri Lanka still feels like it was designed in 2005. You can't see where your money actually went. You don't understand your loan. You definitely don't have an accountant. And if you're sending money home from abroad, you're basically flying blind.

We picked four real personas — the diaspora expat, the digital-native customer, the anxious borrower, and the small business owner — and built one unified platform that speaks to all of them. In English. Or Sinhala."

---

## ARCHITECTURE OVERVIEW (30 sec)

"Before we jump in — quick tech overview.

- **Frontend:** Next.js 16, React 19, Tailwind v4, shadcn/ui — deployed on Vercel
- **Backend:** FastAPI on Fly.io in Singapore
- **Database:** Supabase Postgres with realtime subscriptions
- **AI:** Groq's llama-3.3-70b for the LLM work, ElevenLabs for voice
- **Payments:** Mastercard's MPGS Hosted Checkout, plus Seylan Bank's own gateway integration — feature-flagged so we can flip it live the moment the bank provisions us

Everything's live right now at seylan-hub.vercel.app."

---

## FEATURE 1 — DIASPORA FAMILY WALLET `/wallet` (1.5–2 min)

"First up — the **Family Wallet**. This is for Sri Lankan expats living in the UK, Australia, the US — people sending money home to their family every month.

The problem is: you send £500, and two weeks later you have no idea if it paid for school fees or got spent on something else. There's no visibility. No control.

So we built **allocation buckets**. When you send money, you split it: 40% Education, 25% Food, 20% Savings, 15% Rent — whatever the family needs. Those rules stick.

The moment your family member spends from a bucket — say Mum buys groceries — you get a **live notification**. Not a day later. Instantly. That's powered by **Supabase Realtime**: we're listening to Postgres changes on the transactions table and pushing updates to the frontend the second they hit the database. There's also a polling fallback so nothing breaks if the websocket drops.

You can also see the **live balance**, the full transaction feed, and today's forex rates — GBP, USD, EUR, AUD all converting to LKR in real time. And sending money is a clean two-step flow: pick the amount, confirm, and the allocation rules auto-apply.

This is the module that makes remittance feel like something you're actually in control of."

---

## FEATURE 2 — AI ASSISTANT `/assistant` (1.5–2 min)

"Next — the **AI Assistant**. This is the heart of the whole experience.

Banking apps have terrible help. FAQs written in legalese, chatbots that say 'I didn't understand that.' We wanted something that actually knows your account and can talk to you like a person.

Our assistant is powered by **Groq's llama-3.3-70b** — one of the fastest LLMs available right now — and it streams responses in real time so there's no waiting. Every conversation includes live context: your actual balance, your loan status, your recent transactions, your wallet buckets. It's not generic. It knows *your* money.

You can ask it things like: 'How much did I spend on food this month?' or 'When's my next loan payment?' or 'Can you explain my repayment schedule?' and it gives you a real, specific answer.

**Language toggle** — one click switches between English and Sinhala. The model dynamically switches its response language. This matters a lot in Sri Lanka.

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
- A **countdown** to your next due date — '12 days until payment'
- Outstanding balance and next payment amount front and center

Then there's the **AI Advisor panel** — powered by Groq, cached so it loads instantly. It reads your loan profile and gives you a plain-English summary: 'You're on track. Your next payment is LKR 45,000 in 12 days. You've paid 60% of your total loan.' Actionable, specific, not scary.

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

"A few integrations worth calling out:

**Seylan Bank Gateway** — we've built the full client: account inquiry, internal transfers, CEFTS cross-bank transfers, QR code generation, JustPay mandates. It's all feature-flagged right now — `USE_SEYLAN_REAL=false` — because we're in sandbox mode until the bank provisions us. One environment variable flip and it's live.

**MPGS** — Mastercard Payment Gateway Services. Hosted Checkout across three flows: remittances, loan payments, and business collections. Session creation, redirect, webhook capture, Supabase write — complete.

**ElevenLabs + Groq** — voice and intelligence baked into every module. Not bolt-ons. The assistant, the advisor, the categorizer — all of it is AI-native."

---

## CLOSING (20–30 sec)

"We built this in 24 hours. The frontend is live on Vercel. The backend is running on Fly.io in Singapore. The database is on Supabase with realtime subscriptions firing across every module.

CEYFI isn't a mockup. It's a working product, with real AI, real payments, and real-time data — designed for real people.

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
