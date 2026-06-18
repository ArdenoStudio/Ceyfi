# Seylan Hub — Cursor Plan — Suven (Backend)
*Written: 2026-05-16 (event day) | Role: Backend lead | Stack: FastAPI + Supabase + Groq + ElevenLabs + Railway*

This is your single document on event day. Cursor prompts are pre-written. Endpoints, schemas, and request/response shapes come straight from the [[Seylan Hub — Mock API Spec]] — that doc is the contract; this plan is the build order.

Personas referenced as P1–P4. See [[Seylan Hub — Target User Personas]]. Items tagged **NEW** are my improvement suggestions on top of the existing plan — take or skip without disturbing the rest.

---

## 0. Pre-Event Cursor Hygiene (do once before May 16)

These five things make Cursor far better at backend work.

1. **`.cursorrules` file at the repo root** — section 11 below. Cursor reads it on every prompt.
2. **Pin reference docs** in Cursor's chat sidebar:
   - `12-Research/Seylan Hub — Mock API Spec.md`
   - `12-Research/Seylan Hub — Supabase Schema.md`
   - `12-Research/Seylan Hub — Groq Prompt Templates.md`
   - `12-Research/Seylan Hub — Integration Architecture.md`
   - `12-Research/Seylan Hub — Target User Personas.md`
3. **`@file:` every prompt** — Cursor in pinned-context mode is sharper when you point at the exact file.
4. **Composer (Cmd+I) for new files; Cmd+K for inline edits.** Don't mix them up.
5. **Test endpoints with `curl` in a second terminal — not via Ovindu's UI.** Frontend integration is a dependency you don't need at build time.

---

## 1. Your Stack — Locked In

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | FastAPI | async, type-hinted, Pydantic v2 |
| Server | uvicorn | reload during dev |
| Database | Supabase (Postgres) | `supabase-py` client |
| Realtime | Supabase Realtime | INSERT on `transactions` triggers channel event |
| LLM | Groq (`groq` package) | llama-3.3-70b-versatile, streaming |
| Fallback LLM | Google Gemini Flash 2.0 | `google-generativeai` |
| TTS | ElevenLabs (`elevenlabs` package) | multilingual_v2 voice |
| HTTP client | `httpx` | async, used for the Seylan API proxy |
| Validation | Pydantic v2 | one schema per request and response |
| Auth | None for hackathon | Add Bearer header passthrough for the real Seylan API |
| Logging | Python `logging` at INFO | structured JSON lines if time allows (**NEW**) |
| Deploy | Railway | Procfile = `web: uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Secrets | Railway env vars | mirror the `.env` file shape |

---

## 2. Personas → Endpoints → Acceptance

Every endpoint exists because a persona needs it. If you find yourself writing an endpoint that doesn't serve a persona — cut it.

| Endpoint | Persona | What the persona gets |
|----------|---------|-----------------------|
| `GET /mock/account-context/{user_id}` | P1, P2, P3 | The bank knows me; AI can answer me |
| `GET /mock/family-wallet/{account_id}` | P1 | Buckets visible in real time |
| `POST /api/wallet/transfer` | P1 | Money pushed home with allocation rules |
| `POST /mock/trigger-spend` | P1 (demo) | Live real-time push on stage |
| `POST /api/chat` (streaming) | P2 | Plain-language banking answers |
| `POST /api/tts` | P2 | Voice playback in Sinhala |
| `GET /mock/loans/{user_id}` | P3 | Visibility into repayment progress |
| `GET /api/loans/{user_id}/health` | P3 | "On Track / At Risk / Critical" |
| `POST /api/loans/advisor` | P3 | Plain-language commentary |
| `GET /mock/business-account/{user_id}` | P4 | All transactions in one place |
| `POST /api/categorize-transactions` | P4 | AI-categorised feed in Sinhala |
| `GET /mock/pl-summary/{user_id}` | P4 | Weekly P&L with week-on-week direction |
| `POST /mock/tax-jar/rule` | P4 | Automated saving rule |
| `POST /mock/tax-jar/trigger` | P4 (demo) | Live tax jar increment on stage |

---

## 3. Hour-by-Hour Plan (10:00am May 16 → 10:00am May 17)

Each block has: tasks, exact Cursor prompts, acceptance criteria, and a checkpoint.

---

### BLOCK 0 — Setup (10:00am – 11:00am)

**Goal:** FastAPI scaffolded, Railway auto-deploying, Supabase schema live, env vars wired.

**Tasks (no Cursor needed for most of this):**

1. Receive Seylan API credentials. Read the docs in the next 20 minutes. Note what differs from the mock spec.
2. Create GitHub repo. Local: scaffold a backend folder.
   ```bash
   mkdir backend && cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install fastapi "uvicorn[standard]" httpx pydantic python-dotenv supabase groq google-generativeai elevenlabs
   pip freeze > requirements.txt
   ```
3. Create `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Create `runtime.txt`: `python-3.11`
5. Push to GitHub. Connect Railway. Add all env vars (see section 11 template). Confirm Railway deploys a hello-world `main.py`.
6. Create Supabase project. Run the schema SQL (section 12). Enable realtime on `transactions` table. Pre-insert one row in `demo_state` with `id=1, scenario='idle'`.
7. **Decision @ 11am:** if Seylan API matches mock shapes, set `SEYLAN_API_BASE` to the real URL and `USE_SEYLAN_REAL=true`. If not, stay on mock — the frontend doesn't care.

**Cursor prompt — main.py scaffold:**
```
@file: 12-Research/Seylan Hub — File Structure.md (Backend section)
@file: 12-Research/Seylan Hub — Integration Architecture.md

Build backend/main.py for a FastAPI app:
- Imports FastAPI, CORSMiddleware
- Loads dotenv from .env
- Mounts routers from routers/mock.py, routers/chat.py, routers/tts.py,
  routers/wallet.py, routers/loans.py, routers/business.py
- CORS open to * for the hackathon
- Health check at GET /health returning {"status": "ok", "version": "0.1.0"}
- Catch unhandled exceptions globally, return {"error": str(e)} with 500

Build backend/config.py: reads env vars (SEYLAN_API_BASE, SEYLAN_API_KEY,
USE_SEYLAN_REAL, GROQ_API_KEY, GEMINI_API_KEY, ELEVENLABS_API_KEY,
ELEVENLABS_VOICE_ID, SUPABASE_URL, SUPABASE_SERVICE_KEY). Expose them as
module-level constants. Default mock-friendly fallbacks for the Seylan vars.

Build models/schemas.py with Pydantic v2 models for every request/response
shape in the Mock API Spec doc. One model per shape. Use Field with
descriptions for the OpenAPI schema. Use Decimal? No — use float for LKR.

Create all five router files as empty FastAPI APIRouters with the right
prefixes (/mock, /api/chat, /api/tts, /api/wallet, /api/loans). Each
mounted on main.py.
```

**Cursor prompt — Supabase client + Groq client + ElevenLabs client:**
```
@file: backend/config.py

Build services/supabase_client.py: a singleton supabase-py client created
once with SUPABASE_URL + SUPABASE_SERVICE_KEY. Expose:
- get_client() → returns the client
- insert_transaction(account_id, merchant, amount_lkr, bucket_id,
  bucket_label, source) → inserts into transactions table; the INSERT is
  what fires the realtime event
- save_allocation_rule(sender_id, account_id, buckets) → upsert into
  allocation_rules
- get_allocation_rules(sender_id, account_id) → returns the row or None
- save_session(user_id, language, history) → upsert into sessions
- save_tax_jar_rule(user_id, from_account_id, to_account_id, percentage,
  label) → insert/replace into tax_jar_rules

Build services/groq_client.py: thin wrapper around the groq python SDK.
Expose:
- stream_chat(system_prompt, messages, max_tokens=512, temperature=0.3)
  → async generator yielding tokens
- complete(system_prompt, messages, max_tokens=512, temperature=0.3)
  → returns full text (non-streaming, used by advisor + categorisation)

Use llama-3.3-70b-versatile. If GROQ_API_KEY is missing, raise a clear
ConfigError on import.

Build services/elevenlabs_client.py:
- text_to_speech(text, language) → returns audio bytes
Use eleven_multilingual_v2. Voice ID from config.
```

**Acceptance:**
- `curl https://<railway-url>/health` returns `{"status": "ok"}`
- Supabase dashboard shows all four tables and the demo_state seed row
- `curl http://localhost:8000/health` works locally
- Groq + ElevenLabs clients import without throwing if env vars are set

**Checkpoint @ 11:00am:** Ovindu cannot start frontend work without your mock endpoints. **Block 1 is on the critical path. Ship it fast.**

---

### BLOCK 1 — Mock Endpoints + Fixtures (11:00am – 1:00pm)

**Goal:** every mock endpoint live and returning the fixture data exactly as the spec defines.

**Files to create:**
- `backend/routers/mock.py`
- `backend/fixtures/account_context.json` (Nimal)
- `backend/fixtures/family_wallet.json` (Kumari)
- `backend/fixtures/loans.json` (Nimal ON_TRACK + Sunil AT_RISK)
- `backend/fixtures/business_account.json` (Suresh — 51 transactions)
- `backend/fixtures/pl_summary.json` (Suresh weekly P&L)
- `backend/services/seylan_client.py` (stub for now)

**Cursor prompt — fixtures:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md
@file: 12-Research/Seylan Hub — Demo Data Scenario.md

Create the following JSON fixtures inside backend/fixtures/. Each one
matches the exact response shape in the Mock API Spec doc. Numbers come
from the Demo Data Scenario doc — do NOT round or alter.

1. account_context.json — keyed by user_id. Two entries:
   - "SEY-USR-001" — Nimal Fernando (savings 125,400 / current 34,200 /
     5 recent transactions, 1 personal loan, 1 FD)
   - "SEY-USR-003" — Sunil Bandara (1 business loan AT RISK variant)

2. family_wallet.json — keyed by account_id. One entry "SEY-ACC-002"
   for Kumari Perera. Three buckets: school 40% / household 40% / savings
   20%. Household has 26,500 already spent, balance 71,500. Three
   pre-loaded transactions.

3. loans.json — keyed by user_id. Two entries:
   - "SEY-USR-001" — Nimal's Personal Loan, full 36-month schedule with
     months 1–24 PAID, 25–36 DUE. ON_TRACK.
   - "SEY-USR-003" — Sunil's Business Loan, 36-month schedule with
     months 1–18 mostly PAID but month 17 MISSED, 19–36 DUE. AT_RISK.

4. business_account.json — keyed by user_id. One entry "SEY-BIZ-001".
   All 51 transactions verbatim from the Mock API Spec doc Module 4
   section. Tax jar balance 15,070 at demo start.

5. pl_summary.json — keyed by user_id. One entry "SEY-BIZ-001" with
   current_week (47,200 revenue, 34% margin), previous_week (37,300
   revenue, 28.5% margin), week_on_week.direction = "UP".

Verify totals before writing — current week revenue must equal the sum
of credits May 5–10 in the transaction fixture. Margins must match.
```

**Cursor prompt — mock router endpoints:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md
@file: backend/fixtures/*

Build backend/routers/mock.py. All endpoints under /mock prefix.

Endpoints:
- GET /mock/account-context/{user_id} → load account_context.json,
  return entry. 404 if missing.
- GET /mock/family-wallet/{account_id} → load family_wallet.json.
  Also compute current bucket balances by reading Supabase transactions
  for this account_id and subtracting from allocated_lkr. Fall back to
  fixture balances if Supabase is unreachable.
- GET /mock/loans/{user_id} → load loans.json. Also call
  health_score(loan) for each loan and set the health_score field.
- GET /mock/business-account/{user_id} → load business_account.json.
- GET /mock/pl-summary/{user_id} → load pl_summary.json.
- POST /mock/trigger-spend → validate payload, call
  supabase_client.insert_transaction(account_id, merchant, amount_lkr,
  bucket_id, bucket_label, source='mock'). Compute the new bucket
  balance after the insert. Return the response shape in the spec.
- POST /mock/tax-jar/rule → call supabase_client.save_tax_jar_rule. Return
  rule_id and the success message (both English and Sinhala).
- POST /mock/tax-jar/trigger → compute tax_transfer_amount =
  round(incoming_amount_lkr * 0.10, 2). Insert a transaction row
  representing the auto-transfer. Return the new tax jar balance
  (previous + tax_transfer_amount). Use 15,070 as the base if no prior
  rule was triggered.

Pydantic schemas for every request and response, imported from
models/schemas.py. No 'Any' types.

NEW: log every mock endpoint hit with a single-line JSON log:
{event: "mock_call", endpoint, user_id, duration_ms}.
```

**Acceptance:**
- `curl http://localhost:8000/mock/account-context/SEY-USR-001` returns Nimal's full JSON
- `curl http://localhost:8000/mock/family-wallet/SEY-ACC-002` returns Kumari's buckets with 71,500 in household
- `curl http://localhost:8000/mock/loans/SEY-USR-001` returns ON_TRACK; `SEY-USR-003` returns AT_RISK
- `curl -X POST http://localhost:8000/mock/trigger-spend -d '{...}'` inserts a row into Supabase; Ovindu's frontend sees it via realtime
- `curl -X POST http://localhost:8000/mock/tax-jar/trigger -d '{...}'` returns the new balance 15,890

**Checkpoint @ 1:00pm:** Ovindu is unblocked. Module 1 frontend can begin.

---

### BLOCK 2 — Module 1 backend: Wallet transfer + health score logic (1:00pm – 4:00pm)

**Goal:** the wallet transfer endpoint, allocation rules persistence, and the health score function.

**Files to create:**
- `backend/routers/wallet.py`
- `backend/routers/loans.py`
- `backend/services/health_score.py`

**Cursor prompt — wallet router:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md (POST /wallet/transfer)
@file: backend/services/supabase_client.py

Build backend/routers/wallet.py.

Endpoints:
- POST /api/wallet/transfer
  Request: sender_account_id, recipient_account_id, amount_lkr, corridor,
  allocation_rules (list of {bucket_id, pct}).
  Behaviour:
  1. Validate the sum of pct values == 100. 422 if not.
  2. For each rule, compute bucket_amount = amount_lkr * pct / 100.
  3. Return a TransferResponse with transfer_id (uuid4), status COMPLETED,
     amount_lkr, timestamp (now UTC ISO), buckets_credited list.
  4. NEW: persist the rule via supabase_client.save_allocation_rule with
     the buckets array. This way Ovindu's allocation editor reads the
     same rule back on page load.

- GET /api/wallet/rules/{sender_id}
  Returns the saved rule from Supabase. Defaults to 40/40/20 (school/
  household/savings) if no row exists.

NEW endpoint:
- POST /api/wallet/rules
  Body: sender_id, account_id, buckets (list of {id, label, pct}).
  Calls supabase_client.save_allocation_rule. Returns success.

Pydantic schemas everywhere. 422 on validation failure.
```

**Cursor prompt — health score service + loans router:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md (Health Score Logic)
@file: backend/fixtures/loans.json

Build backend/services/health_score.py.

Function: compute_health_score(loan: dict) -> Literal["ON_TRACK",
"AT_RISK", "CRITICAL"]

Rules:
- missed_payments == 0 AND current_overdue_days == 0 → ON_TRACK
- missed_payments <= 1 OR current_overdue_days <= 30 → AT_RISK
- else → CRITICAL

Build backend/routers/loans.py.

Endpoints:
- GET /api/loans/{user_id} → load loans.json entry, run health_score on
  each loan, return.
- GET /api/loans/{user_id}/health → return {health_score, summary} where
  summary describes the score in one sentence (no LLM call — just a
  templated string based on the score).
- POST /api/loans/advisor → request: user_id, loan_id (optional). Loads
  the loan, builds the advisor prompt per Groq Prompt Templates doc,
  calls groq_client.complete with temperature 0.3 and max_tokens 256.
  Returns {advisor_text, language}. Cache the result per (user_id,
  loan_id) for the lifetime of the process — same loan should not be
  re-generated each load.

NEW: in advisor endpoint, if Groq raises any exception, return a
deterministic fallback string built from loan fields (paid X of Y,
debt-free by date, optional saving). Demo never fails.
```

**Acceptance:**
- `curl -X POST .../api/wallet/transfer -d '{...}'` returns COMPLETED with bucket amounts summing to amount_lkr
- `curl .../api/wallet/rules/SEY-USR-001` returns the saved rule (or default 40/40/20)
- `curl .../api/loans/SEY-USR-001` returns ON_TRACK with full schedule
- `curl .../api/loans/SEY-USR-003` returns AT_RISK
- `curl -X POST .../api/loans/advisor -d '{"user_id": "SEY-USR-001"}'` returns ~2 sentences mentioning "May 2027" and "LKR 18,400"

**Checkpoint @ 4:00pm:** verify with Ovindu that the wallet trigger-spend → frontend toast flow works end-to-end. **Demo critical.** If realtime is flaky at 4pm, suggest he polls every 3 seconds.

---

### BLOCK 3 — Module 2 backend: Groq chat streaming + ElevenLabs TTS (4:00pm – 7:00pm)

**Goal:** the streaming chat endpoint with account context injection, and the TTS endpoint.

**Files to create:**
- `backend/routers/chat.py`
- `backend/routers/tts.py`
- `backend/services/context_builder.py`

**Cursor prompt — context builder:**
```
@file: 12-Research/Seylan Hub — Groq Prompt Templates.md (Prompt 1)
@file: backend/fixtures/account_context.json

Build backend/services/context_builder.py.

Function: build_assistant_system_prompt(account_context: dict, language:
Literal["en", "si"]) -> str

Compose the system prompt verbatim from the Groq Prompt Templates doc
Prompt 1. Inject:
- Customer name
- Savings balance (formatted with comma separators, "LKR 125,400")
- Current balance
- Recent 5 transactions as bulleted lines
- Active loans as bulleted lines (type, outstanding, monthly, next date)
- Fixed deposits (amount, rate, maturity)

Language switch:
- en → "Always respond in English. Be clear and concise."
- si → "Always respond in Sinhala (Sinhala script). If the user writes in
  English, still respond in Sinhala."

Return the full string.

NEW: also add at the end: "Today's date is {today_iso}. Use this when
the customer asks about dates relative to today."
```

**Cursor prompt — chat router with SSE streaming:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md (POST /api/chat)
@file: backend/services/groq_client.py
@file: backend/services/context_builder.py

Build backend/routers/chat.py.

Endpoint:
- POST /api/chat → StreamingResponse with media_type="text/event-stream"

Behaviour:
1. Parse request: user_id, session_id, message, language, history (list of
   {role, content}).
2. Fetch account context via internal call to /mock/account-context/{user_id}
   (use an httpx AsyncClient with base_url=localhost:8000 for the internal
   call — or just call the function directly to avoid the network hop).
3. Build the system prompt via context_builder.
4. Compose Groq messages = [{role:system, content:system_prompt}, *history,
   {role:user, content:message}].
5. Async-iterate groq_client.stream_chat; for each token, yield
   `data: {"token": "<escaped>"}\n\n`. End with `data: {"done": true}\n\n`.
6. After streaming completes, fire-and-forget save the updated history
   to Supabase sessions table. Do not block the stream on the save.

NEW: if Groq raises mid-stream, yield a final
`data: {"error": "<message>", "done": true}` event so the frontend can
gracefully finalise the partial message instead of hanging.

NEW: if GROQ_API_KEY is missing or all Groq calls fail, fall back to
Gemini Flash 2.0 via google-generativeai with the same system prompt and
streaming.
```

**Cursor prompt — TTS router:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md (POST /api/tts)
@file: backend/services/elevenlabs_client.py
@file: 12-Research/Seylan Hub — ElevenLabs Submission Strategy.md

Build backend/routers/tts.py.

Endpoint:
- POST /api/tts
  Request: text (str), language ("en" | "si").
  Behaviour: call elevenlabs_client.text_to_speech(text, language) →
  bytes. Base64-encode. Return {audio_base64, content_type:"audio/mpeg",
  duration_ms: approx len(audio_bytes) / 16 (rough estimate)}.

NEW: in-process LRU cache (functools.lru_cache size 32) keyed by
(text, language) — repeat plays during the demo don't re-hit ElevenLabs.

NEW: if ELEVENLABS_API_KEY is missing or the call fails, return 503 with
a clean error body — frontend hides the Play button if the TTS endpoint
returns 503. Demo continues without audio.
```

**Acceptance — Module 2 core:**
- `curl -N -X POST .../api/chat -d '{"user_id":"SEY-USR-001","session_id":"s1","message":"What is my loan balance?","language":"en","history":[]}'` streams tokens correctly, ending with `done: true`
- Response correctly mentions LKR 480,000 and May 2027
- Same call with `"language":"si"` → response is in Sinhala script
- `curl -X POST .../api/tts -d '{"text":"Hello", "language":"en"}'` returns base64 audio

**Checkpoint @ 7:00pm:** at minimum English chat works. If Sinhala or TTS are flaky, freeze them. Ovindu will hide the failing controls cleanly.

---

### BLOCK 4 — Module 3 backend: loan advisor (consolidate) (7:00pm – 8:00pm — fast)

You built the bulk of this in Block 2 already. This hour is for cleanup:

- [ ] Confirm /api/loans/advisor returns plausible commentary for both Nimal (ON_TRACK) and Sunil (AT_RISK)
- [ ] **NEW**: pre-generate both advisor responses on startup and cache, so the first page load is instant
- [ ] Verify schedule entries are ISO-formatted dates (frontend parses them)

That's it. Ovindu has more to do in this block than you.

---

### BLOCK 4B — Module 4 backend: categorisation + tax jar (8:00pm – 11:00pm)

**Goal:** AI categorisation of the 51 transactions and the tax jar trigger.

**Files to create:**
- `backend/routers/business.py`
- `backend/services/categorizer.py`

**Cursor prompt — categorisation service:**
```
@file: 12-Research/Seylan Hub — Mock API Spec.md (POST /api/categorize-transactions)
@file: backend/fixtures/business_account.json

Build backend/services/categorizer.py.

Function: categorize_transactions(transactions: list[dict]) -> list[dict]

Each input transaction has id, description, amount_lkr, type.
Output is a list of {id, description, amount_lkr, category_en,
category_si, subcategory, confidence}.

Implementation:
1. Build a Groq system prompt:
   "You are a transaction classifier for a Sri Lankan small business.
   Categorise each transaction into one of: INCOME / SUPPLIER / UTILITIES
   / WAGES / RENT / TRANSPORT / MISC. Always provide the Sinhala label
   from this map: INCOME=ආදායම, SUPPLIER=සැපයුම්කරු, UTILITIES=උපයෝගිතා,
   WAGES=වැටුප්, RENT=කුලිය, TRANSPORT=ප්‍රවාහන, MISC=විවිධ. Return JSON
   only with shape: {results: [{id, category_en, category_si,
   subcategory, confidence}]}."
2. Send all 51 transactions in one batch (Groq handles this comfortably
   with llama-3.3-70b 8k context).
3. Parse JSON, merge with the original transactions on id, return.

NEW: graceful fallback if Groq returns malformed JSON or fails:
deterministic heuristic categoriser using description regexes
(supplier names, utility names, "Lorry"|"PickMe"|"Three-Wheeler"=
TRANSPORT, "Cash Sale"|"LankaPay QR"=INCOME, etc.). Demo never breaks.

NEW: cache the categorisation result for the demo user in-process —
first call is slow, repeats are instant.
```

**Cursor prompt — business router:**
```
@file: backend/services/categorizer.py
@file: backend/fixtures/business_account.json
@file: 12-Research/Seylan Hub — Mock API Spec.md

Build backend/routers/business.py.

Endpoints:
- POST /api/categorize-transactions
  Request: user_id (defaults to SEY-BIZ-001), transaction_ids (optional
  list — if omitted, categorise ALL).
  Behaviour: load the business_account fixture, filter by transaction_ids
  if provided, call categorizer.categorize_transactions, return the list.

Note: the /mock/business-account, /mock/pl-summary, /mock/tax-jar/rule,
/mock/tax-jar/trigger endpoints already live in routers/mock.py from
Block 1 — verify they still work after this block's changes.

NEW endpoint:
- GET /api/business/insight
  Returns 2-3 sentence Groq summary of the current week P&L. Same
  pattern as the loan advisor — cache in-process. Frontend can show this
  above the P&L card.
```

**Acceptance — Module 4:**
- `curl -X POST .../api/categorize-transactions -d '{"user_id":"SEY-BIZ-001"}'` returns 51 categorised entries with both English and Sinhala labels
- "Cash Sale — Hardware Assorted" → INCOME / ආදායම
- "Nippon Paint Lanka — Supplier Invoice" → SUPPLIER / සැපයුම්කරු
- "PickMe — Supplier Visit" → TRANSPORT / ප්‍රවාහන
- "Staff Wages — Pradeep" → WAGES / වැටුප්
- `/mock/tax-jar/trigger` returns new balance 15,890 when triggered with 8,200 incoming

**Checkpoint @ 11:00pm:** if categorisation is slow on first call (5+ seconds), Ovindu can pre-warm it during page load with a skeleton showing. If it fails entirely, the heuristic fallback runs — demo still works.

---

### BLOCK 5 — Integration + Polish (11:00pm – 2:00am)

Both together. **No new endpoints after 1am.**

**Tasks:**
- [ ] Run all `curl` smoke tests in one shell script (write `scripts/smoke.sh`)
- [ ] Verify Railway has all env vars set correctly: `railway variables`
- [ ] Confirm Vercel can reach Railway (CORS, URL in `NEXT_PUBLIC_API_BASE`)
- [ ] **NEW**: add a `/admin/seed` endpoint that resets demo state — deletes all rows in `transactions` and re-inserts the demo seed transactions. One-click demo reset between practice runs.
- [ ] **NEW**: pre-warm Groq advisor for both Nimal and Sunil on server startup (FastAPI `@app.on_event("startup")`) — first page load is instant
- [ ] **NEW**: pre-warm Groq categorisation for Suresh on startup — same reason
- [ ] **NEW**: log a "DEMO READY" line on startup once all pre-warms complete — Ovindu can see in Railway logs
- [ ] Verify Supabase realtime is firing in production (Vercel → Railway → Supabase round trip)
- [ ] Verify all Sinhala category labels render correctly (no question marks in JSON responses)

---

### SLEEP ROTATION (2:00am – 8:00am)

| Time | Suven |
|------|--------|
| 2:00am – 5:00am | Awake, bug fixes only |
| 5:00am – 8:00am | **Sleep** |

Rules during your awake shift: **bug fixes only**. No new endpoints. If something breaks the demo, fix it. If something is just rough, leave it.

---

### BLOCK 6 — Submission (8:00am – 9:45am)

**No new code.**

- [ ] Final smoke test: run all `curl` calls, confirm 200s
- [ ] Confirm Railway deployment is green
- [ ] Final commit, push, verify Railway redeploys cleanly
- [ ] Help Ovindu fill the Project Overview Document — paste Railway URL
- [ ] **You drive the mouse during the demo recording** — Ovindu narrates. Practice the trigger sequence twice before pressing record.
- [ ] Submit by 9:45am with Ovindu

---

## 4. Cursor-Specific Tactics (Backend)

1. **Always include the exact fixture data in the prompt** — Cursor invents shapes if you don't paste the JSON.
2. **Test-driven prompts win**: "Build endpoint X. Acceptance: `curl ...` returns `...`." Cursor optimises for the test.
3. **One endpoint per Composer turn.** A whole router in one shot produces broken code.
4. **For Groq/ElevenLabs SDK code, paste the latest SDK example.** Cursor's training cutoff is often behind SDK releases.
5. **Don't let Cursor add try/except around every call.** Ask explicitly: "Only catch errors at the route boundary. Let services raise." Cursor's default is too defensive.
6. **For Pydantic, ask for v2 syntax explicitly.** Cursor defaults to v1 sometimes. v2 uses `model_config = ConfigDict(...)` instead of inner `class Config`.

---

## 5. Cursor Prompt Templates (Copy-Paste-Ready)

### Add caching to an endpoint
```
@file: backend/routers/<file>.py
Add an in-process functools.lru_cache(maxsize=64) to <function>. Key on
all hashable arguments. Skip if any arg is unhashable. Comment with the
TTL behaviour (it's process-lifetime — restart clears).
```

### Add graceful fallback to a Groq call
```
@file: backend/services/<file>.py
Wrap the Groq call in a try/except. On exception, log the error and
return a deterministic fallback constructed from the input data. The
demo must never see a 500.
```

### Add Pydantic v2 response model
```
@file: backend/models/schemas.py
Add a Pydantic v2 BaseModel named <Name>Response. Fields: <list>.
Include Field(..., description=...) on each so the OpenAPI schema is
useful. Add it as the response_model on the matching endpoint.
```

### Add a smoke test for an endpoint
```
@file: scripts/smoke.sh
Add a curl call hitting <endpoint> with <payload> and grep-asserting
the response contains <substring>. Exit 1 on mismatch.
```

---

## 6. Improvements I'm Suggesting (Beyond the Existing Plan)

### Tier 1 — high ROI, build during integration

1. **`@app.on_event("startup")` pre-warming** of Groq advisor (Nimal + Sunil) and categorisation (Suresh) — first page load is instant
2. **`/admin/seed` endpoint** to reset demo state between practice runs — saves headache during dry runs
3. **In-process LRU cache on every Groq call** — repeated demo runs hit cache instantly
4. **Deterministic fallbacks for Groq** — heuristic regex categoriser, templated advisor, hardcoded chat fallback. Demo never crashes.
5. **Structured JSON logging on every mock call** — easy to debug from Railway logs if anything misbehaves

### Tier 2 — medium ROI, build only if ahead

6. **Gemini fallback for chat streaming** — single env var swap if Groq rate-limits at 9am
7. **OpenAPI docs polish** — Field descriptions on every schema. Judges may open `/docs`.
8. **Health check that ping-tests Supabase + Groq** — surfaces failures before they bite

### Tier 3 — pitch enhancers (no code)

9. **README in the backend folder** with architecture diagram (ASCII is fine) and the env var list — judges open the GitHub repo
10. **`/version` endpoint** returning git SHA + build time — looks production-aware

---

## 7. Emergency Decision Tree (Backend-Specific)

| Problem | Decision |
|---------|---------|
| Railway deploy failing | Deploy to Render. Same Procfile, takes 5 min. |
| Supabase real-time not firing | Disable realtime in frontend, switch to 3-second polling. The Supabase INSERT still happens — it's the channel that's missing. |
| Groq rate limit error | Flip to Gemini Flash 2.0. Same prompt structure, same shape. |
| Groq returns malformed JSON in categorisation | Heuristic regex fallback kicks in automatically. Demo continues. |
| ElevenLabs failing | Return 503 from /api/tts. Frontend hides Play button. STT-only voice demo. |
| Mock fixture doesn't match real Seylan API | Stay on mock for the demo. Real API was a stretch goal anyway. |
| Supabase schema deploy fails | Run the SQL manually in the Supabase SQL editor. 5 minutes. |
| Sinhala characters returning as question marks | Ensure responses are JSON-encoded with `ensure_ascii=False`. FastAPI's `JSONResponse` defaults to ASCII — set `default_response_class` to `ORJSONResponse` or build a custom one. |

---

## 8. What "Done" Means For You Specifically

| Module | Backend minimum to ship |
|--------|--------------------------|
| Mock layer | All `/mock/*` endpoints return correct fixture data |
| Wallet | Transfer + rule persistence + trigger-spend → realtime fire |
| Chat | English streaming works with correct account context |
| TTS | ElevenLabs audio returns (or 503 cleanly if dead) |
| Loans | Health score computes correctly, advisor returns 2–3 sentences |
| Business | Categorisation returns 51 rows with correct English + Sinhala labels |
| Tax Jar | Trigger returns new balance 15,890 from base 15,070 |

If any of these slips, ship anyway with a README note.

---

## 9. Numbers You Must Know Cold

If a judge asks about the backend, answer in <2 seconds.

| Question | Answer |
|----------|--------|
| What LLM are you using? | Groq llama-3.3-70b-versatile, streaming |
| Why Groq over OpenAI? | Lowest latency at this model class — under 400ms first token |
| What about Gemini? | Fallback only; same prompts work |
| Why FastAPI? | Async, fast to write, Pydantic gives us OpenAPI for free |
| How do you handle Sinhala? | UTF-8 throughout, model handles Sinhala script natively, dedicated category map for SME bookkeeping |
| Why Supabase? | Realtime out of the box; Postgres if we need to migrate; single anon key per env |
| How does the swap to real Seylan API work? | One env var: `SEYLAN_API_BASE`. No code changes. |
| What happens at scale? | The mock and proxy share the same interface; backend horizontally scales on Railway; LLM calls are independent |
| Security? | Hackathon — service key only on the server, anon key client-side, no PII in logs, RLS disabled for demo |

---

## 10. Persona-to-Endpoint Trace Table

| Endpoint | Persona served | What persona experience this enables |
|----------|----------------|--------------------------------------|
| GET /mock/account-context | P1, P2, P3 | Sender sees balance; AI knows the customer; borrower sees their loan |
| GET /mock/family-wallet | P1 | Bucket-level visibility |
| POST /api/wallet/transfer | P1 | Send-with-rules action |
| POST /mock/trigger-spend | P1 (demo) | The real-time moment |
| POST /api/chat (stream) | P2 | Plain-language banking |
| POST /api/tts | P2 | Sinhala voice playback |
| GET /api/loans/{id}/health | P3 | The 1-second "am I OK" answer |
| POST /api/loans/advisor | P3 | Plain-language commentary |
| POST /api/categorize-transactions | P4 | The bookkeeping illusion |
| GET /mock/pl-summary | P4 | Weekly margin in one glance |
| POST /mock/tax-jar/trigger | P4 | The "I never have to think about tax" moment |

---

## 11. `.cursorrules` Template (Repo Root)

```
# Seylan Hub — Cursor Project Rules (Backend)

Backend for Seylan Hub, an AI banking platform for Sri Lanka.
24-hour build at Cursor Buildathon Colombo. Demo > breadth.

## Tech
- FastAPI + uvicorn. Pydantic v2. Python 3.11.
- Supabase (postgres + realtime). supabase-py.
- Groq (llama-3.3-70b-versatile) for chat + advisor + categorisation.
- ElevenLabs multilingual_v2 for TTS.
- httpx for outbound HTTP.

## Conventions
- All endpoints have Pydantic request and response models in
  models/schemas.py. No `Any`.
- All amounts are float LKR. All dates are ISO 8601 strings.
- Sinhala text passes through unmodified. Use ORJSONResponse or set
  json_encoders to ensure non-ASCII is preserved.
- No catch-all exception handlers around individual calls — let services
  raise; catch at the route boundary or in the global exception handler.
- No `print()` — use the `logging` module at INFO.
- No comments unless explaining a non-obvious workaround.

## File structure (follow exactly)
See 12-Research/Seylan Hub — File Structure.md (Backend section).

## Mock API (contract)
See 12-Research/Seylan Hub — Mock API Spec.md.
Do not invent endpoints. Do not change response shapes.

## Personas
P1 Diaspora Provider → /mock/family-wallet, /api/wallet/*
P2 Digital-Native Customer → /api/chat, /api/tts
P3 Anxious Borrower → /mock/loans, /api/loans/*
P4 Mudalali → /mock/business-account, /api/categorize-transactions,
  /mock/pl-summary, /mock/tax-jar/*

## Env vars (`.env` and Railway both)
SEYLAN_API_BASE, SEYLAN_API_KEY, USE_SEYLAN_REAL
GROQ_API_KEY, GEMINI_API_KEY
ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
SUPABASE_URL, SUPABASE_SERVICE_KEY
```

---

## 12. Supabase Schema SQL (Run in Block 0)

Paste this into Supabase SQL editor → Run. After running, enable Realtime on the `transactions` table from the dashboard.

```sql
-- allocation_rules
create table if not exists allocation_rules (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  account_id text not null,
  buckets jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (sender_id, account_id)
);
create index if not exists idx_allocation_rules_sender on allocation_rules(sender_id);
create index if not exists idx_allocation_rules_account on allocation_rules(account_id);

-- transactions (REALTIME ENABLED)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  account_id text not null,
  merchant text not null,
  amount_lkr numeric not null,
  bucket_id text,
  bucket_label text,
  txn_date timestamptz default now(),
  source text default 'mock'
);
create index if not exists idx_transactions_account on transactions(account_id);
create index if not exists idx_transactions_date on transactions(txn_date desc);

-- sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  language text default 'en',
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_sessions_user on sessions(user_id);

-- demo_state (single-row control table)
create table if not exists demo_state (
  id int primary key check (id = 1),
  scenario text default 'idle',
  last_spend jsonb,
  updated_at timestamptz default now()
);
insert into demo_state (id, scenario) values (1, 'idle')
  on conflict (id) do nothing;

-- tax_jar_rules
create table if not exists tax_jar_rules (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  from_account_id text not null,
  to_account_id text not null,
  percentage numeric not null,
  label text default 'Tax Savings',
  active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_tax_jar_user on tax_jar_rules(user_id);
```

After running: **Supabase dashboard → Table Editor → transactions → Replication → toggle INSERT events ON.** That is the single click that makes the demo's real-time moment work.

---

## 13. End-of-Day Mantras

- Mock layer first — Ovindu is blocked until it ships.
- Every Groq call has a fallback. Demo never crashes.
- One env var swap is the entire "real Seylan API" story.
- Pre-warm everything before sleep.

Good luck.
