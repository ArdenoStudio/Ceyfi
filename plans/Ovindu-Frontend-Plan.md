# Seylan Hub — Cursor Plan — Ovindu (Frontend)
*Written: 2026-05-16 (event day) | Role: Frontend lead | Stack: Next.js 15 + Tailwind + shadcn/ui + Vercel*

This is the single document you read on event day. Cursor prompts are pre-written. File paths are exact. Acceptance criteria are explicit. Where I have suggested an improvement on the existing plan, it is tagged **NEW** so you can take it or skip it without disturbing the rest.

Personas referenced as P1–P4. See [[Seylan Hub — Target User Personas]].

---

## 0. Pre-Event Cursor Hygiene (do once before May 16)

These five things make Cursor work for you, not the other way around.

1. **`.cursorrules` file in the repo root** — Cursor reads this on every prompt. Pre-write it so you don't repeat conventions in every prompt. Template at the bottom of this doc, section 11.
2. **Pin reference docs** in Cursor's chat sidebar at the start of the event:
   - `12-Research/Seylan Hub — Mock API Spec.md`
   - `12-Research/Seylan Hub — Brand Spec.md`
   - `12-Research/Seylan Hub — File Structure.md`
   - `12-Research/Seylan Hub — UI Flow.md`
   - `12-Research/Seylan Hub — Target User Personas.md`
3. **Use `@file:` and `@folder:` references** in every prompt — Cursor reads pinned context but is sharper when you point it directly.
4. **Composer for new files, Cmd+K for inline edits.** Composer (Cmd+I) for "build a new component"; Cmd+K for "rename this variable" or "add an error state to this hook." Mixing them up wastes turns.
5. **Disable auto-apply for risky changes.** Set Cursor to ask before applying multi-file edits during integration block (10pm onward).

---

## 1. Your Stack — Locked In

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 15 (App Router) | TypeScript, strict mode on |
| Styling | Tailwind CSS | use the Seylan tokens, not arbitrary hex |
| Components | shadcn/ui | Card, Badge, Progress, Tabs, Sheet, Toast, Skeleton, Avatar, Input, Label, Separator |
| Icons | Lucide React | ships with shadcn — no extra install |
| State | React local + Context for `useCurrentUser` | no Redux, no Zustand |
| Realtime | `@supabase/supabase-js` | subscription via hook |
| HTTP | native `fetch` wrapped in `lib/api.ts` | no axios |
| Charts | None for v1 | use CSS bars for P&L breakdown; **NEW** if time, add `recharts` for the sparkline below |
| Animations | shadcn defaults only | no Framer Motion |
| Deploy | Vercel | connect GitHub repo, auto-deploy on push to `main` |

---

## 2. Personas → Pages → Acceptance

Each page must serve its persona. If your build doesn't move the persona forward, cut it.

| Page | Persona | What persona must feel after 10s on this page |
|------|---------|-----------------------------------------------|
| `/` (onboarding) | All | "I know what this app is and which version I am" |
| `/wallet` | **P1** Diaspora Provider | "I can see exactly where my money went, in real time" |
| `/assistant` | **P2** Digital-Native Customer | "It knows my accounts and answers in my language" |
| `/loans` | **P3** Anxious Borrower | "I am OK. Or I am not OK and here's exactly why and what to do" |
| `/business` | **P4** Mudalali | "I made LKR 16,040 this week and 10% is already saved for tax" |

---

## 3. Hour-by-Hour Plan (10:00am May 16 → 10:00am May 17)

Each block has: tasks, exact Cursor prompts to paste, acceptance criteria, and a checkpoint.

---

### BLOCK 0 — Setup (10:00am – 11:00am)

**Goal:** repo scaffolded, Vercel auto-deploying, shadcn ready, env vars wired.

**Tasks (no Cursor needed for most of this):**
1. Create GitHub repo `seylan-hub` — public, MIT licence
2. Locally: `npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
3. `cd frontend && npx shadcn@latest init` — pick: Neutral base, CSS variables yes
4. Install components in one go:
   ```bash
   npx shadcn@latest add button card badge progress tabs sheet toast separator skeleton avatar input label dropdown-menu sonner dialog slider
   ```
5. `npm install @supabase/supabase-js lucide-react clsx tailwind-merge`
6. Push to GitHub, connect to Vercel, confirm deploy
7. Add the **NEW** `.cursorrules` file (section 11 below)
8. Add `.env.local` with `NEXT_PUBLIC_API_BASE=http://localhost:8000` and the Supabase keys Suven shares

**Cursor prompt — apply brand tokens:**
```
@file: globals.css
@file: tailwind.config.ts
@file: 12-Research/Seylan Hub — Brand Spec.md

Set up Seylan brand tokens as CSS custom properties in globals.css and as
named colours in tailwind.config.ts (extend, don't replace). Use the Brand
Spec doc as the source of truth — every hex value must match.

Also:
- Add the system font stack as the body font
- Load Noto Sans Sinhala (weights 400, 600) from Google Fonts in app/layout.tsx
- Add a `.sinhala` utility class that applies Noto Sans Sinhala
- Set page background to seylan-mist on <body>
- Keep all changes additive — don't break Tailwind defaults
```

**Acceptance:**
- `git push` triggers a Vercel deploy
- Visiting the deployed URL shows a blank page with the right background colour
- shadcn `<Button>` in `app/page.tsx` renders with Seylan red

**Checkpoint @ 11:00am:** repo is green, brand tokens applied, Suven's mock API is reachable from your machine (`curl http://localhost:8000/mock/account-context/SEY-USR-001` returns JSON).

---

### BLOCK 1 — Shell, Onboarding, User Switcher (11:00am – 1:00pm)

**Goal:** the app's spine — every later module just slots into this shell. Persona switching works.

**Files to create:**
- `lib/demo-users.ts`
- `lib/api.ts`
- `lib/supabase.ts`
- `lib/utils.ts` (already exists from shadcn — extend it)
- `hooks/useCurrentUser.ts`
- `components/layout/Sidebar.tsx`
- `components/layout/UserSwitcher.tsx`
- `components/layout/Header.tsx`
- `app/layout.tsx` (update root)
- `app/page.tsx` (onboarding)
- `app/wallet/page.tsx` (placeholder)
- `app/assistant/page.tsx` (placeholder)
- `app/loans/page.tsx` (placeholder)
- `app/business/page.tsx` (placeholder)
- `types/index.ts`

**Cursor prompt — demo users + hook:**
```
@file: 12-Research/Seylan Hub — Onboarding Screen Spec.md
@file: 12-Research/Seylan Hub — Target User Personas.md

Create lib/demo-users.ts that exports a typed `DEMO_USERS` array with four
personas: Nimal Fernando (SEY-USR-001, London, diaspora_sender, /wallet),
Kumari Perera (SEY-ACC-002, Colombo, family_member, /assistant),
Sunil Bandara (SEY-USR-003, Kandy, borrower, /loans),
Suresh Silva (SEY-BIZ-001, Gampaha, business_owner, /business).

Each user has: id, name, location, role, defaultRoute, personaCode (P1-P4),
shortBio (one sentence pulled from the Personas doc).

Create hooks/useCurrentUser.ts — reads `seylan_hub_user_id` from localStorage,
exposes { userId, user, switchUser(id), allUsers }. SSR-safe (no localStorage
on first render — return null on server, hydrate on client mount).

No comments. No console.logs. No try/catch around localStorage — if it
throws on SSR we render null safely.
```

**Cursor prompt — types:**
```
@file: 12-Research/Seylan Hub — File Structure.md

Create types/index.ts with the TypeScript types listed in section 'TypeScript
Types' of the File Structure doc. Use string literal unions where specified
(HealthScore, Language, MessageRole). Export everything from this file.
Add a Bucket type, a Transaction type, a Loan type, a ScheduleEntry type,
a ChatMessage type, an AccountContext type, a FixedDeposit type, and a
WalletState type (account_id, account_holder, linked_sender,
total_balance_lkr, last_remittance, buckets, recent_transactions).
```

**Cursor prompt — onboarding page:**
```
@file: 12-Research/Seylan Hub — Onboarding Screen Spec.md

Build app/page.tsx as the onboarding screen described in the spec. Use
shadcn Card. Three cards: Diaspora Sender, Borrower (top row), Family
Member (bottom row, full width on desktop, half width on tablet, full on
mobile). NEW: add a fourth card 'Business Owner — Mudalali' next to
Family Member on desktop. Each card calls `switchUser(id)` from
useCurrentUser, then routes to the user's defaultRoute via next/navigation.

Layout: max-width 920px container, centered, vertical padding, Seylan red
logo centered above the heading. Use the brand tokens. No emoji — use
Lucide icons (Globe, CreditCard, Home, Store).

There is a small "Skip — view as Nimal Fernando" link at the bottom that
defaults to SEY-USR-001 and routes to /wallet.
```

**Cursor prompt — sidebar + user switcher:**
```
@file: 12-Research/Seylan Hub — UI Flow.md (Global Shell section)
@file: hooks/useCurrentUser.ts

Build components/layout/Sidebar.tsx (desktop only, 240px, charcoal bg) and
components/layout/UserSwitcher.tsx (shadcn DropdownMenu).

Sidebar shows: Seylan logo (white SVG, /public/seylan-logo-white.svg —
placeholder image until I add the real one), the active user card,
UserSwitcher, then four nav links: Wallet, Assistant, Loans, Business.
Active nav item gets a 3px left red border and red text. Use Lucide icons:
Wallet, Bot, CreditCard, Store.

On mobile (<768px) hide the sidebar, show a bottom tab bar with the same
four destinations.

Wire Sidebar into app/layout.tsx. Wrap the page content in a div that has
the sidebar on the left and the page on the right with overflow-auto.
```

**Cursor prompt — api + supabase client:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md

Create lib/api.ts: small typed wrapper around fetch. Export:
- getAccountContext(userId)
- getFamilyWallet(accountId)
- getLoans(userId)
- getBusinessAccount(userId)
- getPlSummary(userId)
- postWalletTransfer(payload)
- postChat(payload, onToken) — handles SSE streaming
- postTts({text, language})
- postCategorize(payload)
- postTaxJarRule(payload)
- postTaxJarTrigger(payload)
- postTriggerSpend(payload)

Read NEXT_PUBLIC_API_BASE from env. Throw a typed ApiError on non-2xx with
status and message. No retries — fail fast in a hackathon.

Create lib/supabase.ts: export a singleton client using
NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Also export
a subscribeToTransactions(accountId, onInsert) helper.
```

**Acceptance:**
- Visit `/` → see four persona cards
- Click "Diaspora Sender" → URL changes to `/wallet`, sidebar shows Nimal
- Click UserSwitcher in sidebar → switch to Kumari → page reloads data
- All four placeholder pages render with sidebar
- `lib/api.ts` functions type-check; calling `getAccountContext` works against Suven's running mock

**Checkpoint @ 1:00pm:** the shell is solid. If you are behind here, *do not start Module 1 until the shell is done*. The shell is the load-bearing wall.

---

### BLOCK 2 — Module 1: Diaspora Family Wallet (1:00pm – 4:00pm)

**Persona:** P1 — Diaspora Provider. **Demo character:** Nimal (sender), Kumari (recipient).
**This is the most important module.** If only one module works on stage tomorrow, it is this one.

**Files to create:**
- `components/wallet/BucketCard.tsx`
- `components/wallet/BucketGrid.tsx`
- `components/wallet/AllocationEditor.tsx`
- `components/wallet/TransactionFeed.tsx`
- `components/wallet/TransactionRow.tsx`
- `components/wallet/SendMoneyModal.tsx`
- `components/wallet/SpendNotificationToast.tsx`
- `components/wallet/LastRemittanceBanner.tsx`
- `hooks/useWalletRealtime.ts`
- `app/wallet/page.tsx` (replace placeholder)

**Cursor prompt — BucketCard + Grid:**
```
@file: 12-Research/Seylan Hub — UI Flow.md (Module 1 section)
@file: 12-Research/Seylan Hub — Brand Spec.md
@file: types/index.ts

Build components/wallet/BucketCard.tsx. Props: bucket (Bucket type), onClick.
Shows: bucket icon (School=GraduationCap, Household=Home, Savings=PiggyBank),
label, current balance (large, 28px, bold), progress bar (% spent), allocation %
small text, spent LKR small text.

Use shadcn Card. Progress bar: bucket colour (school=blue-500, household=
emerald-500, savings=violet-500). Format LKR with formatLKR() — add this to
lib/utils.ts using Intl.NumberFormat('en-LK').

Build components/wallet/BucketGrid.tsx: 3-column grid desktop, 1-column
mobile. Pass buckets in, render a BucketCard for each.
```

**Cursor prompt — AllocationEditor (sliders):**
```
@file: 12-Research/Seylan Hub — UI Flow.md (Send Money + Edit Rules)

Build components/wallet/AllocationEditor.tsx using shadcn Slider.
Props: buckets, onSave(newAllocations).

Behaviour: three linked sliders that sum to 100%. When the user drags one,
the other two are redistributed proportionally so the total stays at 100%.
Display the running total. Disable the Save button if total !== 100.

On Save, POST to /api/wallet/rules via api.ts (Suven owns this endpoint —
if it doesn't exist yet, just persist to localStorage as a fallback and
flag a TODO comment to swap to API later).
```

**Cursor prompt — SendMoneyModal:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md
@file: 12-Research/Seylan Hub — Demo Data Scenario.md

Build components/wallet/SendMoneyModal.tsx using shadcn Dialog.
Trigger: a FAB button bottom-right of the wallet page labelled "Send Money".

Fields: amount in GBP (default 600), live LKR conversion at rate 408.30
(hardcoded — NEW: pull from /api/fx if Suven exposes one, else hardcode).
Allocation summary (read-only display of current rules). Submit button
calls postWalletTransfer with sender_account_id (current user.id),
recipient_account_id 'SEY-ACC-002', amount_lkr (converted), corridor
'GBP->LKR', and the active allocation rules.

On success: close modal, fire a toast "Sent LKR 245,000 to Kumari",
refetch the family wallet data.
```

**Cursor prompt — real-time hook + toast:**
```
@file: lib/supabase.ts
@file: 12-Research/Seylan Hub — Supabase Schema.md

Build hooks/useWalletRealtime.ts: takes accountId, returns { transactions,
buckets } that update live when Supabase fires an INSERT on the transactions
table filtered to account_id=eq.{accountId}.

On each new transaction:
1. Append to the transactions state (newest first)
2. Recompute the bucket balance for the affected bucket_id
3. Call onSpend(newTransaction) callback if provided

Build components/wallet/SpendNotificationToast.tsx — a thin wrapper around
shadcn Toast (sonner). Exports a fireSpendToast(transaction) function that
shows: "🔔 Kumari just spent LKR {amount} — {merchant} · {bucket_label}".
NEW: include the new bucket balance on the second line of the toast for
extra demo impact.

Wire into app/wallet/page.tsx: useWalletRealtime with the family account ID
'SEY-ACC-002', pass fireSpendToast as onSpend.
```

**Cursor prompt — wallet page assembly:**
```
@file: app/wallet/page.tsx
@file: components/wallet/*
@file: 12-Research/Seylan Hub — UI Flow.md

Build app/wallet/page.tsx as the diaspora sender view (Nimal looking at
Kumari's account).

Layout (top to bottom):
1. LastRemittanceBanner — "Last remittance: LKR 245,000, sent 1 May 2026,
   GBP 600 at 408.30, via Tempo. [Send Again]" — Send Again opens
   SendMoneyModal
2. BucketGrid — uses live buckets state from useWalletRealtime
3. AllocationEditor — collapsed by default, expand toggle
4. TransactionFeed — last 10 transactions, scrollable
5. SendMoney FAB

Initial data: fetch getFamilyWallet('SEY-ACC-002') on mount with a Skeleton
state while loading.

NEW: under LastRemittanceBanner, add a tiny inline FX widget showing
"GBP→LKR @ 408.30 today" with a faint "↑ 0.4% this week" — this hits the
diaspora persona's mental model directly. Hardcode the values.
```

**Acceptance — Module 1:**
- `/wallet` shows three buckets with the demo numbers from Demo Data Scenario
- "Send Money" opens modal, submitting it credits buckets according to rules
- Trigger Suven's `/mock/trigger-spend` endpoint (use Postman or `curl` in the second terminal): within ~500ms the household bucket drops from 71,500 to 59,100 **and** a toast fires **and** a new row appears in the feed
- Allocation editor: drag a slider, total stays at 100, save persists
- Switch user to Kumari: same page should still work (Kumari is the family member viewing her own account)

**Checkpoint @ 4:00pm — DEMO CRITICAL:**
If real-time isn't working at 4pm, fall back to 5-second polling — Suven knows. Do not let real-time stall Module 2.

---

### BLOCK 3 — Module 2: AI Assistant (4:00pm – 7:00pm)

**Persona:** P2 — Digital-Native Customer. **Demo character:** Kumari (Sinhala voice) + Nimal (English chat).

**English chat is the target. Sinhala text and voice are stretch — only if English works by 6pm.**

**Files to create:**
- `components/assistant/ChatThread.tsx`
- `components/assistant/MessageBubble.tsx`
- `components/assistant/ChatInput.tsx`
- `components/assistant/VoiceButton.tsx` (stretch)
- `components/assistant/AudioPlayer.tsx` (stretch)
- `components/assistant/LanguageToggle.tsx` (stretch)
- `components/assistant/SuggestedQuestions.tsx`
- `hooks/useChat.ts`
- `hooks/useVoice.ts` (stretch)
- `app/assistant/page.tsx`

**Cursor prompt — chat thread + bubbles:**
```
@file: 12-Research/Seylan Hub — UI Flow.md (Module 2)
@file: 12-Research/Seylan Hub — Brand Spec.md (Chat Bubbles)
@file: types/index.ts

Build components/assistant/MessageBubble.tsx — props: message (ChatMessage),
isStreaming (boolean). User bubble: Seylan red bg, white text, right-aligned,
asymmetric border radius (top-right square, others 18px). AI bubble: mist
background, charcoal text, left-aligned, top-left square. Timestamp as
small grey text below the bubble.

Build components/assistant/ChatThread.tsx — scrollable column of bubbles,
auto-scroll to bottom on new message. Empty state: render
<SuggestedQuestions /> centred.

Build components/assistant/SuggestedQuestions.tsx — 4 chips in English:
"What is my savings balance?" / "When is my next loan payment?" / "How much
have I paid on my loan?" / "What's my biggest expense this month?"
Plus 2 Sinhala chips (only shown when language=='si'): "මගේ ඉතිරිකිරීමේ
ශේෂය කොපමණද?" / "මගේ ඊළඟ ණය වාරිකය කවදාද?". Apply .sinhala class to
Sinhala chips. Clicking a chip dispatches the question into the chat.
```

**Cursor prompt — useChat hook + streaming:**
```
@file: lib/api.ts
@file: 12-Research/Seylan Hub — Mock API Spec.md (POST /api/chat)

Build hooks/useChat.ts. State: messages (ChatMessage[]), isStreaming (bool),
language ('en' | 'si').
Functions:
- send(content) — appends user message, calls postChat from api.ts with the
  current user id, a stable session id (uuid generated once on mount and
  cached in state), the message, the current language, and history.
- During streaming: accumulate tokens into a single AI message, mutate
  messages state on each token so MessageBubble re-renders.
- On done: set isStreaming false.

postChat signature in api.ts uses SSE — read response.body as a stream,
parse `data: {"token": "..."}` lines, call onToken for each. End on
`data: {"done": true}`.

NEW: if postChat throws (Groq down), gracefully append a fallback AI message:
"I'm having trouble connecting right now. Try again in a moment." Do not
crash the chat.
```

**Cursor prompt — assistant page assembly:**
```
@file: app/assistant/page.tsx
@file: components/assistant/*

Build app/assistant/page.tsx.

Layout:
- Top right: LanguageToggle (EN | SI) — stretch only, build a stub today
  that just sets language state
- Centre: ChatThread (flex-grow)
- Bottom (sticky): ChatInput with text input, mic button (stretch), send

ChatInput: enter submits, shift+enter newlines, send button disabled while
isStreaming.

Account context is fetched server-side by Suven (the /api/chat endpoint
injects it) — frontend does not need to fetch it separately.

Wire ChatInput → useChat.send. SuggestedQuestions → also call useChat.send.
```

**Stretch — voice (only if English chat works by 6pm):**

```
Cursor prompt — voice hook:
@file: 12-Research/Sinhala STT & TTS — Options & Benchmarks.md

Build hooks/useVoice.ts using Web Speech API SpeechRecognition.
- start(lang) where lang is 'en-US' or 'si-LK'
- stop()
- on result, return the final transcript
- expose isListening, transcript, error

Detect browser support: if window.SpeechRecognition or webkitSpeechRecognition
is undefined, return a disabled state so the mic button can render disabled
gracefully.

Build components/assistant/VoiceButton.tsx — Lucide Mic icon, hold-to-record
behaviour (mouseDown starts, mouseUp stops; touch equivalents). Shows a
recording indicator (red pulse). On stop, dispatches transcript to useChat.send.
```

```
Cursor prompt — audio player for ElevenLabs:
Build components/assistant/AudioPlayer.tsx — props: text, language.
Renders a small Play icon button. On click, POST to /api/tts via api.ts,
receive { audio_base64, content_type }, decode to a Blob, create an object
URL, play via a HTMLAudioElement, dispose URL on ended.

Wire into MessageBubble for AI messages only.
```

**Acceptance — Module 2 core:**
- Open `/assistant` → suggested questions visible
- Click "What is my savings balance?" → AI streams the correct LKR amount character by character
- Ask follow-up "When is my next loan payment?" → answers correctly with date and amount
- Switch user (Kumari) → context refreshes, asking the same question gets a Kumari-shaped answer

**Acceptance — Module 2 stretch (if voice ships):**
- Toggle to SI → suggested questions show Sinhala
- Hold mic, say "මගේ ණය ශේෂය කොපමණද?" → transcript appears, response streams in Sinhala, Play button reads it back

**Checkpoint @ 7:00pm:** if voice isn't working but English chat is, **freeze** voice and move on. English chat is a complete demo on its own.

---

### BLOCK 4 — Module 3: Loan Dashboard (7:00pm – 10:00pm)

**Persona:** P3 — Anxious Borrower. **Demo character:** Nimal (ON_TRACK) + Sunil (AT_RISK).

**Files to create:**
- `components/loans/LoanSummaryCard.tsx`
- `components/loans/HealthScoreBadge.tsx`
- `components/loans/RepaymentProgressBar.tsx`
- `components/loans/PaymentCountdown.tsx`
- `components/loans/RepaymentTimeline.tsx`
- `components/loans/AIAdvisorPanel.tsx`
- `app/loans/page.tsx`

**Cursor prompt — health badge + summary + progress:**
```
@file: 12-Research/Seylan Hub — Brand Spec.md (Health Score Badges)
@file: 12-Research/Seylan Hub — UI Flow.md (Module 3)
@file: types/index.ts

Build components/loans/HealthScoreBadge.tsx — three variants. Pill shape,
coloured dot left, label right. ON_TRACK=green-100/green-700 + CheckCircle,
AT_RISK=amber-100/amber-700 + AlertTriangle, CRITICAL=red-100/red-700 +
XCircle.

Build components/loans/LoanSummaryCard.tsx — top-level card on /loans.
Title: "{type} · {purpose}". Below: HealthScoreBadge. Then two rows:
"LKR {outstanding} outstanding · LKR {disbursed} original".

Build components/loans/RepaymentProgressBar.tsx — uses shadcn Progress.
Shows: "Paid: X of Y payments" on the left, "Remaining: Z" on the right,
percentage label, then LKR paid vs LKR remaining below.

Build components/loans/PaymentCountdown.tsx — large LKR amount, "due in
N days", date. Compute days from new Date() to next_payment_date.
```

**Cursor prompt — timeline + advisor:**
```
@file: 12-Research/Seylan Hub — UI Flow.md
@file: types/index.ts

Build components/loans/RepaymentTimeline.tsx — uses shadcn Tabs.
Tabs: All / Paid / Upcoming / Missed. Render schedule entries as rows:
month #, due_date, amount, status (with coloured pill).

Build components/loans/AIAdvisorPanel.tsx — fetches /api/loans/advisor
on mount, displays the text in a Card with a subtle Bot icon. Renders
a Skeleton while loading. NEW: add a small sparkline above the text
showing the projected payoff curve — use a simple SVG (24 monthly points)
even without recharts. The shape matters more than precision.

Assemble app/loans/page.tsx:
1. LoanSummaryCard
2. RepaymentProgressBar
3. PaymentCountdown
4. AIAdvisorPanel
5. RepaymentTimeline
```

**Acceptance — Module 3:**
- `/loans` as Nimal: ON_TRACK green badge, 24/36 progress bar at 66%, AI advisor mentions debt-free by May 2027 and LKR 18,400 saving
- Switch to Sunil via UserSwitcher: badge flips to amber AT_RISK, advisor text changes tone (Suven returns a different prompt response for Sunil)
- Timeline filter tabs work: clicking "Paid" shows only PAID entries

**Checkpoint @ 10:00pm:** if Module 3 isn't clean by 10pm, freeze it where it is and pivot to Module 4. A working Module 1+2+3 is a winning submission; a half-broken Module 4 is not.

---

### BLOCK 4B — Module 4: Mudalali Business Bookkeeper (10:00pm – 1:00am)

**Persona:** P4 — Mudalali. **Demo character:** Suresh Silva.

**Files to create:**
- `components/business/PlSummaryCard.tsx`
- `components/business/ExpenseBreakdown.tsx`
- `components/business/TaxJarPanel.tsx`
- `components/business/CategorisedTransactionRow.tsx`
- `components/business/CategorisedTransactionFeed.tsx`
- `components/business/CategoryBadge.tsx`
- `app/business/page.tsx`

**Cursor prompt — category badge:**
```
Build components/business/CategoryBadge.tsx. Props: categoryEn, categorySi.
Renders both labels in a single pill, English first then Sinhala.

Colour map (Tailwind class on the pill background, dark text):
INCOME → emerald-100 / emerald-700
SUPPLIER → orange-100 / orange-700
UTILITIES → blue-100 / blue-700
WAGES → violet-100 / violet-700
RENT → red-100 / red-700
TRANSPORT → amber-100 / amber-700
MISC → slate-100 / slate-700

Apply .sinhala class to the Sinhala portion.
```

**Cursor prompt — P&L card + expense breakdown:**
```
@file: 12-Research/Seylan Hub — Demo Data Scenario.md (Suresh week-on-week)
@file: 12-Research/Seylan Hub — UI Flow.md (Module 4)

Build components/business/PlSummaryCard.tsx — fetches /mock/pl-summary
on mount. Shows: current week label, revenue (large LKR), expenses (large
LKR), net (large LKR, bold), margin % large with up/down arrow vs previous
week (green ↑ if up, red ↓ if down). Below in muted text: "Last week:
{previous_margin}%".

Build components/business/ExpenseBreakdown.tsx — uses the
expense_breakdown object from the P&L response. Horizontal CSS bars for
each category sorted descending, each bar labelled with category, LKR,
and % of total expenses. NEW: add a "vs last week" arrow next to each
category if there's headroom; skip if running out of time.
```

**Cursor prompt — transaction feed with categorisation:**
```
@file: lib/api.ts

Build components/business/CategorisedTransactionFeed.tsx.

On mount:
1. Fetch /mock/business-account/SEY-BIZ-001 → list of 51 transactions
2. POST to /api/categorize-transactions with all 51 ids → get categorisation
3. Merge: transactions joined with category_en, category_si, subcategory

Render: shadcn Tabs (All / Income / Expenses). Then a virtualised-feeling
list (just CSS overflow-y-auto with max-h-[480px]) of rows.

Each row: date, description, amount (green if credit, red if debit), then
CategoryBadge.

NEW: group rows by day with a sticky-ish day header showing the date and
"Net for the day: LKR X" computed on the client. Reads way better than a
flat list.

Loading state: show skeleton rows while categorisation pending. If
categorisation errors out, fall back to displaying transactions with a
"Uncategorised" badge — do not block the feed on the AI call.
```

**Cursor prompt — tax jar + demo trigger:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md (POST /mock/tax-jar/trigger)
@file: 12-Research/Seylan Hub — Demo Data Scenario.md (Tax Jar state)

Build components/business/TaxJarPanel.tsx. Shows: current balance (animated
counter using a simple setInterval-driven number tween — 30 frames over
~800ms when balance changes), active rule "10% of every incoming payment",
status pill (ACTIVE green).

Big button at the bottom: "Simulate Incoming Payment LKR 8,200". On click,
disable the button, show a spinner, POST to /mock/tax-jar/trigger with
user_id SEY-BIZ-001, incoming_amount_lkr 8200, description "Cash Sale —
Electrical Fittings". On response: update the balance state (counter
animates from old → new), fire a toast "🔔 LKR 8,200 received — LKR 820
auto-saved to Tax Jar", re-enable button.

NEW: after the trigger, also append the simulated incoming transaction to
the top of the CategorisedTransactionFeed in-memory (so judges see it
appear in the feed). Pass an addTransaction callback up to the page.
```

**Cursor prompt — business page assembly:**
```
@file: app/business/page.tsx

Build app/business/page.tsx.

Top: business name + location header ("Silva Hardware & Electricals · Gampaha").
Two-column layout on desktop (stack on mobile):
- Left column: PlSummaryCard, ExpenseBreakdown
- Right column: TaxJarPanel

Below (full width): CategorisedTransactionFeed.

Use SEY-BIZ-001 as the user id throughout — this page is locked to Suresh
regardless of UserSwitcher state (or, NEW, gate the page so the UserSwitcher
auto-switches to Suresh when navigating to /business).
```

**Acceptance — Module 4:**
- `/business` loads with the AI-categorised feed (51 rows, colour coded)
- P&L card shows LKR 47,200 revenue, 34% margin, ↑ 5.5pp vs last week
- Click the demo trigger button → tax jar balance animates 15,070 → 15,890, toast fires, new INCOME row appears at the top of the feed
- Filter tabs (All / Income / Expenses) work

**Checkpoint @ 1:00am:** Module 4 is bonus. If broken at 1am, ship without it. The README marks it as work in progress.

---

### BLOCK 5 — Integration + Polish (1:00am – 2:00am)

Both together. **No new features after 2am.**

**Tasks:**
- [ ] Add Skeleton loaders to every data fetch
- [ ] Add error boundary at app/layout.tsx — if any page crashes, show a friendly fallback that lets you switch user / retry
- [ ] Mobile responsiveness check — open Vercel URL on your phone, walk all four pages
- [ ] Seylan logo (white SVG to /public/seylan-logo-white.svg, red SVG to /public/seylan-logo.svg) — download from seylan.lk
- [ ] Favicon — convert logo to .ico, drop in /app/favicon.ico
- [ ] **NEW** — set `metadata` in app/layout.tsx: title "Seylan Hub", description "AI banking for Sri Lanka — diaspora wallets, voice assistant, loan health, and bookkeeping for SMEs", OG image (use a Vercel OG image route or hardcode a PNG)
- [ ] **NEW** — README in repo root: 1-paragraph what it is, deploy URL, env var list, deploy instructions (`vercel`, `railway up`), credits to sponsor APIs (Groq, ElevenLabs, Supabase). README is graded — judges read it
- [ ] Final dry run of the 2-minute demo with Suven — time it
- [ ] **NEW** — pre-load all four pages in tabs before the demo. Cold loads during 2 minutes are death

---

### SLEEP ROTATION (2:00am – 8:00am)

| Time | Ovindu |
|------|--------|
| 2:00am – 5:00am | **Sleep** |
| 5:00am – 8:00am | Awake, polish + bug fixes only |

Rules during your awake shift: **bug fixes only**. No new features. If you find a critical demo-breaking bug, wake Suven.

---

### BLOCK 6 — Submission (8:00am – 9:45am)

**No new code. Submission only.**

- [ ] Record 2-minute demo video on a local screen recorder (OBS or QuickTime). You narrate; Suven drives. See [[Seylan Hub — Demo Video Script]]
- [ ] Upload video to YouTube (unlisted) or Loom — paste link into submission
- [ ] Fill the Project Overview Document — paste Vercel URL, Railway URL, GitHub URL — see [[Seylan Hub — Project Overview Document]]
- [ ] Final git commit and push — confirm Vercel deploy succeeds
- [ ] Submit at **9:45am** — 15-minute buffer
- [ ] Submission confirmation screenshot saved

---

## 4. Cursor-Specific Tactics

These save 30–60 minutes across the build.

1. **One concern per Composer turn.** Don't ask Cursor to build BucketCard + AllocationEditor + TransactionFeed in one prompt. Compose one component at a time. Better diff, easier review.
2. **Always paste the doc you want as ground truth via `@file:`.** Cursor without context invents. Cursor with context is sharp.
3. **Ask Cursor to type its arguments.** End every prompt with "All props typed, no `any`." Cursor will obey.
4. **For bug fixing, paste the error first.** Don't describe the bug — paste the actual error text and the offending file. Cursor diagnoses 5× faster.
5. **Reject the first draft of anything stateful.** Cursor often over-engineers hooks. If the first version has 6 useState calls, ask for a simpler version.
6. **Don't let Cursor invent API routes.** If it tries to use `/api/wallet/balances` and Suven's spec says `/family-wallet`, stop and correct. The mock API spec is the contract.

---

## 5. Cursor Prompt Templates (Copy-Paste-Ready)

When you're tired at 4am, paste these.

### Add a loading skeleton
```
@file: app/<route>/page.tsx
Add a Skeleton loading state to this page using shadcn Skeleton. The
Skeleton should match the rough shape of the loaded layout. Render while
data is undefined; swap to real content once data is defined. No flash.
```

### Add an error state
```
@file: app/<route>/page.tsx
Wrap data fetching with try/catch. On error, render a small Card with
the message "We couldn't load this right now" and a Retry button that
re-runs the fetch. Use the Seylan red for the icon.
```

### Make a component responsive
```
@file: components/<path>.tsx
Make this component responsive: on mobile (<768px) stack to a single
column; on desktop keep the existing layout. Tailwind classes only,
no JS detection.
```

### Add the .sinhala class to Sinhala strings
```
@file: components/<path>.tsx
Find every string that contains Sinhala script (U+0D80–U+0DFF range) and
ensure it's wrapped in a span with className="sinhala". Do not touch
English strings.
```

---

## 6. Improvements I'm Suggesting (Beyond the Plan as Written)

These are **NEW** — not in your existing planning docs. Pick the ones with cheap ROI.

### Tier 1 — very high ROI, build during integration block

1. **OG image / metadata on the deployed site** — judges will paste your Vercel URL into Slack and a clean preview card is "polish" they remember
2. **README with badges + deploy URL + sponsor credits** — the GitHub link gets opened during judging
3. **Pre-loaded tabs before the demo** — cold loads during 2 minutes are death
4. **Toast shows new bucket balance on second line** — extra demo impact for one line of code
5. **Group business transactions by day with daily net** — much easier to scan than 51 flat rows

### Tier 2 — medium ROI, build only if ahead

6. **FX widget on wallet page** — "GBP→LKR @ 408.30 today, ↑ 0.4% this week" — locks in P1's mental model
7. **Sparkline above AI advisor panel** — projected payoff curve, 24 SVG points
8. **`recharts` for the expense breakdown** — fancier than CSS bars; ~20 minutes to wire up

### Tier 3 — only if Module 4 is humming along

9. **Daily net headers in transaction feed** — already mentioned above
10. **"vs last week" arrows per expense category** — directional pressure on the data

### Tier 4 — pitch/judge Q&A enhancers (no code)

11. **Personas doc on screen during Q&A** — open it on a second tab to refer to when judges ask "who is this for"
12. **Pre-load `gh repo view --web` for the GitHub repo** — saves you fumbling for the link

---

## 7. Emergency Decision Tree (Frontend-Specific)

| Problem | Decision |
|---------|---------|
| Vercel build fails 30 min before submission | Deploy to Netlify (same Next.js build, takes ~5 min). Push to a new repo if needed. |
| shadcn dialog/modal won't open | Ensure `<Toaster />` and dialog roots are in `app/layout.tsx`. Common miss. |
| Supabase real-time silently doesn't fire | Switch to 3-second polling in `useWalletRealtime`. Demo still works. |
| Sinhala font looks like boxes | Verify Noto Sans Sinhala is loaded in `layout.tsx` and `.sinhala` class is applied. |
| Web Speech API not supported | Hide the mic button entirely if `window.SpeechRecognition` is undefined. Don't show a broken control. |
| ElevenLabs audio doesn't play | Browser may have blocked autoplay. The first Play button is fine — it's user-gestured. Don't auto-play AI responses. |
| Streaming chat hangs midway | Add a 30-second timeout that closes the SSE stream and finalises the partial message. |
| Cursor keeps rewriting files you didn't ask it to touch | Disable auto-apply. Manually accept changes per file. |

---

## 8. What "Done" Means For You Specifically

| Module | Frontend minimum to ship |
|--------|--------------------------|
| Shell | All four pages routable, user switcher works, brand applied |
| Wallet | Buckets render with live numbers, trigger spend updates UI |
| Assistant | English chat streams correctly with the right account context |
| Loans | Health badge correct, progress bar correct, advisor text renders |
| Business | Feed categorised, P&L card right, tax jar trigger animates |

If any of these slips, **ship it anyway with a note in the README** explaining what's incomplete. Partial submission beats no submission.

---

## 9. Numbers You Must Know Cold

You will narrate the demo. Judges will throw a number at you. Answer in <2 seconds.

| Fact | Number |
|------|--------|
| Sri Lanka annual remittances | $6B USD |
| Nimal's remittance | LKR 245,000 (GBP 600 @ 408.30) |
| Bucket allocation | 40% school / 40% household / 20% savings |
| Household balance pre-trigger | LKR 71,500 |
| Demo trigger spend | LKR 12,400 at Softlogic Glomark |
| Household balance post-trigger | LKR 59,100 |
| Nimal's loan outstanding | LKR 480,000 |
| Nimal's loan payments made | 24 of 36 (66%) |
| Nimal's projected payoff date | May 2027 |
| Extra-payment interest saving | LKR 18,400 |
| Sri Lankan SMEs | ~800,000 |
| SMEs with no proper books | 99% |
| Suresh's current week revenue | LKR 47,200 |
| Suresh's margin current / previous | 34% / 28.5% |
| Tax jar pre-trigger | LKR 15,070 |
| Tax jar post-trigger | LKR 15,890 |
| Seylan branches | 172 |
| Seylan NPL AR2024 | 3.85% → 2.10% |
| BofA Erica interactions | 3.2 billion |

---

## 10. Persona-to-Component Trace Table

If you find yourself building something that doesn't appear here, **stop** and ask: which persona is this for? If the answer is "none," cut it.

| Component | Persona | Persona need it serves |
|-----------|---------|------------------------|
| BucketCard | P1 | Visibility into allocation, real-time |
| AllocationEditor | P1 | Pre-decide where the money goes |
| SpendNotificationToast | P1 | Real-time visibility |
| ChatThread + streaming | P2 | Answer fast in plain language |
| SuggestedQuestions | P2 | Lower entry barrier |
| LanguageToggle + Sinhala chips | P2 | Inclusion |
| VoiceButton + AudioPlayer | P2 | Inclusion (Sinhala-speaking parents/grandparents) |
| HealthScoreBadge | P3 | "Am I OK?" in 1 second |
| AIAdvisorPanel | P3 | Plain-language commentary |
| RepaymentProgressBar | P3 | Visual progress, not a 36-row table |
| CategorisedTransactionFeed | P4 | Read my transactions back categorised in Sinhala |
| PlSummaryCard | P4 | Am I making money this week, yes or no |
| TaxJarPanel | P4 | Auto-save without thinking |

---

## 11. `.cursorrules` Template

Save this at the repo root. Cursor reads it on every prompt.

```
# Seylan Hub — Cursor Project Rules

You are building Seylan Hub, an AI banking platform for Sri Lanka.
Audience: judges at Cursor Buildathon Colombo. 24-hour build. Polish > breadth.

## Tech
- Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui, lucide-react.
- FastAPI backend at NEXT_PUBLIC_API_BASE. Supabase for real-time + sessions.
- Groq llama-3.3-70b for AI. ElevenLabs for TTS. Web Speech API for STT.

## Conventions
- Brand colours via Tailwind tokens (seylan-red #C8102E, seylan-charcoal
  #1A1A2E, seylan-mist #F7F8FA). Health: green-700 / amber-700 / red-700.
- Format LKR via formatLKR() in lib/utils.ts. Always "LKR 1,234,567".
- Sinhala text wrapped in span.sinhala. Font: Noto Sans Sinhala.
- No comments in code unless explaining a non-obvious workaround.
- No console.log left in. No `any` types. No `// TODO` without a reason.
- All props typed via interfaces in the component file or types/index.ts.

## Style
- shadcn primitives only. No custom Button. No new Card variants.
- Cards: white bg, 12px radius, border seylan-border, subtle shadow.
- No emoji in production UI — use Lucide icons.
- No gradients, no animations beyond shadcn defaults, no dark mode.

## File structure (follow exactly)
See 12-Research/Seylan Hub — File Structure.md

## Mock API (this is the contract)
See 12-Research/Seylan Hub — Mock API Spec.md. Do not invent endpoints.

## Personas
P1 Diaspora Provider → /wallet
P2 Digital-Native Customer → /assistant
P3 Anxious Borrower → /loans
P4 Mudalali → /business
Every feature must serve at least one persona.
```

---

## 12. End-of-Day Mantras

- Module 1 is the most important module.
- Polish beats breadth.
- Ship something on every block — never let perfect block "good enough by checkpoint."
- When in doubt: persona first, judge second, code third.

Good luck.
