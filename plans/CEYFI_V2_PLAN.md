# CEYFI v2 — Financial Twin OS · Build Plan
> Beat FlowPilot by changing the category, not just the color
> Date: 2026-06-18

---

## The Concept
CEYFI is not a dashboard. It is a living financial twin — a persistent model of the user's money that perceives, reasons, simulates, executes, and learns.

**FlowPilot** = AI CFO dashboard (broad, shallow, 15 separate pages)
**CEYFI** = Financial Intelligence Operating System (deep, causal, one connected twin)

**Tagline:** "Clarity for every rupee"
**Signature feature:** The Time River — 90d history → today → 90d forecast with confidence bands, annotated events, danger thresholds, and clickable causal explanations

---

## Build Order

### Phase 0 — Shared Chart Infrastructure (2–3 hrs, blocks everything)
- Copy `lib/chartUtils.ts` and `lib/useOnWindowResize.ts` from template-insights
- Build `BaseChart.tsx` wrapper with: LKR formatter, custom tooltip, period comparison badge, confidence band renderer
- Integrate nuqs for filter → URL state

### Phase 1 — The Time River (4–6 hrs, demo centrepiece)
- Continuous area chart: 90d history + today marker + 90d forecast + confidence cone
- Animated event annotations: salary, EMI, school fees, remittance, bills
- Danger threshold line
- Click any future point → Causality panel (cause chain + probability bars)
- Causality panel → 3 response plans with LKR impact + trade-offs
- Plan approval → action execution + Time River recalculates

### Phase 2 — Overview Page Rebuild (3–4 hrs, first screen judges see)
- Time River as full-width hero
- Safe-to-spend strip (4 signals: available, protected, committed, safe-to-move)
- Net-worth bridge chart (income → spending → savings → obligations → net position)
- 7-day obligations timeline
- 8 small-multiple KPI cards with period comparison and trend lines
- Goal progress probability cones
- AI morning brief card
- "Ask CEYFI" embedded on every insight

### Phase 3 — Transactions Full Analytics (4–5 hrs, deepest analytical page)
- All 4 Insights template charts (amount trend, count trend, category H-bars, merchant H-bars)
- Weekday × hour heatmap (calendar-style, click cell → transactions)
- Anomaly scatter plot (amount vs date, outliers highlighted + AI explanation)
- Recurring-payment timeline (visual subscription calendar)
- Subscription detector (auto-detected recurring charges)
- Filterable table with embedded microcharts
- All filters stored in URL via nuqs (date range, category, merchant, amount, type)

### Phase 4 — Loans, Wallet, Business Upgrades (5–7 hrs, breadth)

**Loans:**
- Dual-axis combo chart: bars = EMI paid, line = outstanding balance
- Amortization waterfall: principal/interest breakdown through full term
- Early-settlement simulator: drag lump-sum → see interest saved
- Snowball vs avalanche comparison
- Payment calendar heatmap
- Affordability gauge (debt-to-income ratio + signal)

**Wallet:**
- Remittance Sankey flow: income → accounts → family → buckets → obligations
- FX rate history + corridor comparison for remittance optimization
- Goal forecast cone per bucket
- Liquidity projection area chart

**Business:**
- Cash-flow waterfall (where did profit go)
- Expense treemap (drill-down categories)
- Customer/supplier concentration bars
- Receivables ageing grid (click row → send bilingual reminder)
- Tax reserve adequacy gauge
- Runway area chart with scenario toggle

### Phase 5 — New Pages: Intelligence, Scenario Lab, Decision Room (6–8 hrs, competitive moat)

**Intelligence (new page):**
- Explainable financial health score: each component (spending discipline, savings rate, debt ratio, bill reliability) shown as bar with evidence + improvement simulation
- Anomaly feed with AI explanation per event
- Forecast vs actual chart
- Peer benchmark comparison
- Financial season calendar

**Scenario Laboratory (new page):**
- Model up to 5 simultaneous shocks (salary delay, FX shift, expense spike, emergency cost, rate change)
- Scenario fan chart with probability-weighted paths
- Runway comparison bars across scenarios
- Stress-test waterfall
- Before/after overlay on Time River
- Save and compare up to 4 scenarios

**Decision Room (new page):**
- Ranked action cards: LKR benefit, risk reduced, confidence %, evidence, trade-offs, deadline, reversibility, approval required
- "Ask why" → assistant, "Simulate first" → Scenario Lab, "Execute" → confirmation flow
- Decision impact matrix visualization
- Trade-off radar per decision

---

## Navigation Rename
Current: Overview, Transactions, Wallet, Loans, Business, Assistant, Metrics, Status
New: Today | Timeline | Map | Transactions | Decide | Simulate | Debt | Household | Business | Intelligence | Metrics

---

## Demo Story (8 steps for judges)
1. CEYFI connects to bank → financial twin assembles
2. Time River appears with annotated events
3. CEYFI auto-flags a projected dip on July 3
4. User clicks dip → causality panel shows 3 causes with probability
5. Scenario Lab: simulate 10-day salary delay + FX shock
6. Decision Room: 3 plans with quantified trade-offs
7. User approves Plan B → CEYFI executes sandbox CEFTS transfer + bilingual message
8. Time River recalculates → dip resolved → guardrail created

---

## Visualization Arsenal (29 chart types)

### Must Have (Phase 0–2)
- Time River (hero, custom Recharts area + annotations)
- Scenario fan chart
- Cash-flow waterfall
- Weekday × hour heatmap
- Remittance Sankey flow
- Debt amortization combo chart (dual-axis)
- Net-worth bridge chart
- Health score decomposition bars

### Should Have (Phase 3–4)
- Anomaly scatter plot
- Decision impact matrix
- Goal probability cone
- FX corridor comparison H-bars
- Early-settlement simulator (interactive slider)
- Expense treemap
- Receivables ageing grid
- Merchant Pareto H-bars
- Recurring-payment timeline
- 7-day obligations timeline
- Category ranking H-bars
- Payment calendar heatmap

### Nice to Have (Phase 5+)
- Bucket burn rate bars
- Cohort retention heatmap
- Tax reserve gauge
- Saved scenario comparison
- Small-multiple KPI grid (dashboard-style)
- Before/after overlay
- Liquidity projection area
- Peer benchmark bars
- Embedded AI insight cards

---

## Tech Stack Additions Needed
- `nuqs` — filter state in URL (already in plan, check if installed)
- `d3-sankey` — for remittance Sankey flow
- `@visx/heatmap` or custom CSS grid — for heatmaps
- Recharts 2.15.4 — already in place
- Custom `<ConfidenceBand />` Recharts custom shape

---

## Sri Lanka Localisation (differentiator)
- LKR as default currency (Intl.NumberFormat en-LK)
- Sinhala/English bilingual toggle on all AI explanations
- CEFTS as payment method
- Seasons: April new year, December shopping, school fees (January/May)
- Remittance corridors: AE, AU, UK, IT tracked
- Local merchants auto-detected: Keells, Cargills, Dialog, SLT, CEB
