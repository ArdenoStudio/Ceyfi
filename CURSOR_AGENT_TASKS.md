# CEYFI — Cursor Agent Master Build Plan
> **Objective:** Transform CEYFI into a Financial Intelligence Operating System that beats FlowPilot at the Buildathon by offering causal intelligence, scenario modelling, and deep Sri Lanka localisation.
>
> **How to use this file:** Each section is a standalone task for a Cursor background agent. Complete tasks in order. Tasks 0 → 1 → 2 are the critical path. Tasks 3–8 can run in parallel after Task 0.

---

## REQUIRED CONTEXT (read before any task)

### Repository
- Monorepo: `frontend/` contains the Next.js app. Backend is deployed at `https://seylan-hub-backend.vercel.app`.
- All frontend work happens inside `frontend/`.

### Tech Stack
- **Framework:** Next.js 15 App Router (`app/` directory, all pages are Server or Client Components)
- **Styling:** Tailwind CSS v4 — uses `@import "tailwindcss"` NOT `tailwind.config.ts`. Custom tokens are CSS vars in `app/globals.css`.
- **Components:** shadcn/ui in `components/ui/`
- **Charts:** Recharts 2.15.4
- **State:** React `useState`/`useEffect` — no Redux. URL state via `nuqs` for filters.
- **Fonts:** `font-heading` = Sora, `font-sans` = DM Sans, `font-mono` = Geist Mono

### CEYFI Design Tokens (Tailwind class → CSS var)
```
bg-ceyfi-deep      #052E16   Sidebar bg, dark hero banners
bg-ceyfi-green     #059669   Primary CTA, active nav, accents
bg-ceyfi-mint      #34D399   Highlight badges, chart accent
bg-ceyfi-surface   #F0FDF4   Light page background
bg-ceyfi-sprout    #E8F7EE   Green-tinted card surface
bg-ceyfi-canvas    #F4F8F3   Subtle card bg
bg-ceyfi-paper     #FBFDF9   White-ish card bg
bg-ceyfi-line      #D8E8DC   Borders and dividers
text-ceyfi-ink     #10261A   Main body text
text-ceyfi-muted   #617267   Secondary text
text-ceyfi-faint   #8C9A91   Tertiary/placeholder text
text-ceyfi-green   #059669   Accent text
text-ceyfi-mint    #34D399   Highlight text
```

### Recharts Chart Colors
Use these exact hex values for chart series:
```
Series 1 (primary):   #059669  (ceyfi-green)
Series 2 (secondary): #34D399  (ceyfi-mint)
Series 3 (blue):      #2563EB
Series 4 (amber):     #D97706
Series 5 (rose):      #E11D48
```

### Existing Components to Import and Reuse
- `@/components/ui/ChartCard` — `<ChartCard title="" subtitle="" action={}>children</ChartCard>`
- `@/components/ui/KpiCard` — `<KpiCard title="" value="" change="" changeType="positive|negative" subtitle="" icon={} />`
- `@/lib/utils` — `cn()`, `formatters.currency({number})`, `formatters.compact(n)`, `formatters.percent(n)`
- All shadcn components: `@/components/ui/button`, `tabs`, `badge`, `card`, `dialog`, `select`, `slider`, etc.

### API Functions (`@/lib/api`)
```ts
getAccountContext(userId: string): Promise<AccountContext>
getFamilyWallet(accountId: string): Promise<WalletState>
getLoans(userId: string): Promise<Loan>
```
Always provide full fallback data — backend may not be available during demo.

### Fallback User
```
user_id:  "SEY-USR-001"
name:     "Nimal Fernando"
balance:  LKR 245,000
savings:  LKR 125,400
```

### Important Rules
1. **Every page must work offline** — all API calls have fallback data.
2. **All currency = LKR** — use `formatters.currency({number, maxFractionDigits: 0})`.
3. **No dark mode required** — light mode only, ignore `.dark` selectors.
4. **Tailwind v4 syntax** — class names work as usual; to define new tokens add CSS vars to `globals.css` under `@theme inline {}` block.
5. **`"use client"` at top of every interactive page/component.**
6. **Font class pattern:** `font-heading text-2xl font-semibold tracking-[-0.035em]` for headings.

---

## TASK 0 — Shared Chart Infrastructure
**Priority:** MUST be done before Tasks 2–10 depend on it.
**Effort:** ~2 hours

### Goal
Build a reusable Recharts wrapper system: a custom tooltip, period comparison badge, and a set of typed helper functions for consistent chart appearance across all pages.

### Files to Create
- `frontend/lib/chartUtils.ts`
- `frontend/components/charts/CeyfiTooltip.tsx`
- `frontend/components/charts/PeriodBadge.tsx`
- `frontend/components/charts/ChartContainer.tsx`

### Spec: `frontend/lib/chartUtils.ts`
```ts
// Chart color palette keyed by name
export const CHART_COLORS = {
  green:  '#059669',
  mint:   '#34D399',
  blue:   '#2563EB',
  amber:  '#D97706',
  rose:   '#E11D48',
  violet: '#7C3AED',
  sky:    '#0EA5E9',
  slate:  '#64748B',
} as const

export type ChartColorKey = keyof typeof CHART_COLORS

// Map a series index to a color
export function seriesColor(index: number): string {
  const keys = Object.keys(CHART_COLORS) as ChartColorKey[]
  return CHART_COLORS[keys[index % keys.length]]
}

// Y-axis domain with 10% padding
export function getYDomain(data: number[]): [number, number] {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = (max - min) * 0.1
  return [Math.max(0, min - pad), max + pad]
}

// Format axis tick values compactly in LKR
export function lkrAxisTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`
  return `${value}`
}

// Period comparison helper
export function periodDelta(current: number, previous: number): {
  pct: number
  positive: boolean
  label: string
} {
  const pct = previous === 0 ? 0 : ((current - previous) / previous) * 100
  return {
    pct: Math.abs(pct),
    positive: pct >= 0,
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
  }
}
```

### Spec: `frontend/components/charts/CeyfiTooltip.tsx`
A custom Recharts tooltip that:
- Has a white background, rounded-xl, shadow-lg, border border-ceyfi-line
- Shows the label (date/category) in text-xs text-ceyfi-muted font-medium
- Lists each payload item with a colored dot, series name, and LKR value
- Has a "vs previous" row at the bottom when `showComparison` prop is true
- Import from recharts: `import type { TooltipProps } from 'recharts'`

```tsx
interface CeyfiTooltipProps extends TooltipProps<number, string> {
  showComparison?: boolean
  formatter?: (value: number) => string
}
```

### Spec: `frontend/components/charts/PeriodBadge.tsx`
A small inline badge showing period-over-period change:
- Props: `value: number` (percentage), `positive: boolean`, `label?: string`
- If positive: `bg-emerald-50 text-emerald-700` with `▲` prefix
- If negative: `bg-rose-50 text-rose-700` with `▼` prefix
- Size: `text-[10px] font-semibold px-2 py-0.5 rounded-full`

### Spec: `frontend/components/charts/ChartContainer.tsx`
A thin responsive wrapper using Recharts `ResponsiveContainer`:
```tsx
export function ChartContainer({
  children,
  height = 240,
  className,
}: {
  children: React.ReactNode
  height?: number
  className?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      {children}
    </ResponsiveContainer>
  )
}
```

### Success Criteria
- `import { CHART_COLORS, lkrAxisTick } from '@/lib/chartUtils'` works
- `<CeyfiTooltip />` renders in Recharts without TypeScript errors
- `<PeriodBadge value={12.3} positive={true} />` shows a green +12.3% badge

---

## TASK 1 — The Time River Component (SIGNATURE FEATURE)
**Priority:** Highest. This is the one thing judges will remember.
**Effort:** ~5 hours
**Depends on:** Task 0

### Goal
Build the Time River: a single continuous area chart spanning 90 days of historical balance data → a "Today" marker → a 90-day forecast with a confidence band. When the user clicks any future data point, a slide-out panel explains what caused the projected balance and offers 3 action plans.

This is CEYFI's signature feature. FlowPilot has no equivalent.

### Files to Create
- `frontend/components/charts/TimeRiver.tsx` — the chart component
- `frontend/components/charts/CausalityPanel.tsx` — the slide-out explanation panel

### Data Structure
```ts
interface TimeRiverPoint {
  date: string        // "Jun 18", "Jul 03"
  balance: number     // actual (historical) or null for future
  forecast: number    // projected balance (null for past)
  upper: number       // confidence upper bound (null for past)
  lower: number       // confidence lower bound (null for past)
  event?: string      // "Salary", "EMI", "School Fees", "Remittance"
  isToday?: boolean
  isDanger?: boolean  // true when forecast < danger threshold
}

interface CausalityEvent {
  cause: string       // "Salary delayed 4 days"
  probability: number // 0–100
  impact: number      // LKR impact
}

interface ActionPlan {
  id: string
  title: string       // "Move LKR 22,000 from savings bucket"
  benefit: number     // LKR saved/protected
  risk: 'Low' | 'Medium' | 'High'
  reversible: boolean
  effort: string      // "2 minutes"
}
```

### Spec: `TimeRiver.tsx`
Use Recharts `ComposedChart` with:
1. **Historical area** (days 1–90): `<Area dataKey="balance" fill="#E8F7EE" stroke="#059669" strokeWidth={2} />` — solid, no dash
2. **Forecast area** (days 91–180): `<Area dataKey="forecast" fill="rgba(5,150,105,0.08)" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 3" />` — dashed, lighter fill
3. **Confidence band**: render as two `<Area>` layers (upper/lower) stacked to create a shaded region — upper area has `fill="rgba(52,211,153,0.12)"`, lower area has `fill="white"` (to cut out the bottom)
4. **Today reference line**: `<ReferenceLine x={todayLabel} stroke="#059669" strokeDasharray="3 3" label={{ value: 'Today', fill: '#059669', fontSize: 10, fontWeight: 600 }} />`
5. **Danger threshold**: `<ReferenceLine y={dangerThreshold} stroke="#E11D48" strokeDasharray="2 3" label={{ value: 'Min buffer', fill: '#E11D48', fontSize: 9 }} />`
6. **Event annotations**: Use `<ReferenceLine>` with `label` for each annotated event (salary, EMI, fees). Show as vertical lines with tiny icon labels above.
7. **Click handler**: `onClick` on future data points opens `CausalityPanel` (use `useState` for open/selectedPoint)

Props:
```tsx
interface TimeRiverProps {
  data: TimeRiverPoint[]
  dangerThreshold?: number  // default 20000
  height?: number           // default 280
  onPlanSelect?: (plan: ActionPlan) => void
}
```

Axes: X-axis shows dates every 14 days. Y-axis uses `lkrAxisTick`. Hide axis lines, use light grid lines (`stroke="#D8E8DC" strokeDasharray="3 3"`).

Generate rich fallback data (180 points: 90 historical + 90 forecast) inside the component with realistic LKR values for Nimal Fernando (balance ~245,000 LKR, salary 185,000 on 1st of month, EMI 22,000 on 25th, school fees 15,000 on 5th).

### Spec: `CausalityPanel.tsx`
A Sheet (from shadcn `@/components/ui/sheet`) that slides in from the right:
- Header: "Why does the balance dip here?" with the date and projected amount
- **Cause chain section**: Each `CausalityEvent` shown as a row with a colored probability bar (Recharts `Bar` in a tiny horizontal chart or CSS progress bar) and LKR impact
- **Three action plans**: Cards in a 1-column list. Each shows: title, benefit (green), risk badge, reversible tag, effort, and a prominent "Select this plan" button
- Footer: "Simulate this scenario →" link that navigates to `/scenarios` (future page)

### Success Criteria
- Chart renders with 180 data points, split at today marker
- Forecast region is visually distinct (dashed line, lighter fill, confidence band)
- Danger threshold line visible in red
- Clicking a future dip opens the causality panel
- Panel shows causes + 3 action plans
- Component is responsive (works at 375px and 1440px)

---

## TASK 2 — Overview Page Full Rebuild
**Priority:** High. First page judges see.
**Effort:** ~3–4 hours
**Depends on:** Task 0, Task 1

### Goal
Replace the current `frontend/app/page.tsx` with the Financial Twin command centre. Time River is the full-width hero. Every KPI has a period comparison badge. AI signal card is embedded at the bottom.

### File to Modify
- `frontend/app/page.tsx` — complete rewrite

### Page Sections (top to bottom)

#### Section 1: Page Header
- Left: "Good morning, {firstName}" heading (font-heading text-[2rem])
- Sub: "Here's what moved, what's protected, and what needs your attention."
- Right: "Ask CEYFI" button (ceyfi-deep bg, Sparkles icon, links to /assistant)
- Below heading: a 4-item **safe-to-spend strip** — horizontal row of 4 stat chips:
  - Available now: `current_balance` in green
  - Protected: `savings_balance` in blue
  - Committed (sum of upcoming obligations): in amber
  - Safe to move: `Math.max(0, current - upcoming_obligations - 20000)` in ceyfi-green

#### Section 2: Time River Hero
- Full-width `<ChartCard>` with title "Financial timeline" and subtitle "90-day history · today · 90-day forecast"
- Contains `<TimeRiver>` with `dangerThreshold={20000}`
- Add a `<PeriodBadge>` showing balance change vs 30 days ago in the card action slot

#### Section 3: KPI Grid (small multiples)
- 4-column grid on xl, 2-column on sm, 1-column on mobile
- Use existing `<KpiCard>` component
- KPIs: Total Balance (+2.4%), Savings (+LKR 12,400), Loan Health (82/100), Spent in June (+6% vs May)
- Each KpiCard must include `change` and `changeType` props

#### Section 4: Two-column charts
Left (2/3 width): Income and spending `CashflowChart` — existing component from `@/components/charts/OverviewCharts`
Right (1/3 width): Loan health `ProgressCircle` — existing component

#### Section 5: Two-column
Left (wider): Recent transactions list (keep existing pattern from current page.tsx)
Right: CEYFI AI Signal card (keep existing pattern)

#### Section 6: Quick links row (bottom)
3-column row of link cards: Next loan payment / Family wallet / Ask CEYFI (keep existing pattern)

### Design Notes
- The safe-to-spend strip should be a horizontal scrollable row on mobile
- Time River hero should have `min-h-[300px]`
- Keep the dark `bg-ceyfi-deep` hero banner section from the current page that shows total balance + 3 sub-cards (Everyday, Savings, Family Wallet)

### Success Criteria
- Page loads with Time River visible without scrolling on a 1440px viewport
- All 6 sections render correctly
- Safe-to-spend strip shows 4 meaningful values
- No TypeScript errors

---

## TASK 3 — Transactions Full Analytics
**Priority:** High
**Effort:** ~5 hours
**Depends on:** Task 0

### Goal
Transform the current basic transactions list at `frontend/app/transactions/page.tsx` into a full analytical workspace with 8 visualizations, URL-synced filters, and an anomaly detection view.

### File to Modify
- `frontend/app/transactions/page.tsx` — complete rewrite

### Tabs Structure
Use shadcn `<Tabs>` at the top of the page with 3 tabs: **Overview** | **Analytics** | **Transactions**

---

#### Tab 1: Overview
Four charts in a 2×2 grid:

**Chart A — Transaction Amount Over Time (top-left)**
- Recharts `BarChart` with vertical bars, one bar per week
- X-axis: week label ("May W1", "May W2", etc.)
- Y-axis: LKR amount, use `lkrAxisTick`
- Use `CeyfiTooltip`
- Bar fill: `#059669`

**Chart B — Transaction Count Over Time (top-right)**
- Same structure as Chart A but for count (number of transactions per week)
- Bar fill: `#2563EB`

**Chart C — Top 5 Categories (bottom-left)**
- Recharts `BarChart` with `layout="vertical"`
- Categories: Food & Dining, Bills & Utilities, Transport, Healthcare, Shopping
- Horizontal bars, Y-axis shows category name, X-axis shows LKR amount
- Fill: `#D97706`

**Chart D — Top 5 Merchants (bottom-right)**
- Same as Chart C but for merchants: Keells, Dialog, CEB, Lanka Hospitals, Uber
- Fill: `#7C3AED`

---

#### Tab 2: Analytics

**Chart E — Weekday × Hour Heatmap**
A CSS grid heatmap (NOT Recharts — build with `div` grid):
- 7 columns (Mon–Sun) × 24 rows (0–23 hours) or aggregate by time-of-day bands (Morning 6-12, Afternoon 12-18, Evening 18-22, Night 22-6) × day → 7×4 grid
- Each cell colored by transaction count: no transactions = `bg-ceyfi-canvas`, 1-2 = `bg-emerald-100`, 3-5 = `bg-emerald-300`, 6+ = `bg-emerald-600 text-white`
- Cell shows count on hover (use `title` attribute)
- Label rows and columns clearly
- Title: "When do you spend? · tap a cell to filter"

**Chart F — Anomaly Scatter Plot**
Recharts `ScatterChart`:
- X-axis: date (days 1–30)
- Y-axis: amount LKR
- Normal transactions: small green dots (r=4, fill="#059669", opacity=0.6)
- Anomaly transactions (> 2 std deviations): larger red dots (r=8, fill="#E11D48", opacity=0.9)
- Clicking an anomaly dot shows a tooltip explaining "This is 3.2× your average grocery spend"
- Use `<Scatter>` component with custom `shape` prop

**Chart G — Recurring Payment Timeline**
A visual calendar built with CSS (not Recharts):
- Shows a 4-week horizontal timeline
- Each recurring payment is a colored horizontal bar spanning its recurrence
- Items: Dialog bill (monthly, LKR 2,800), Personal Loan EMI (monthly, LKR 22,000), Netflix (monthly, LKR 1,750), Keells delivery (weekly, LKR 3,500)
- Color each subscription a different chart color
- Label shows name + amount + next due date

---

#### Tab 3: Transactions
Full filterable table with these columns:
- Date (sortable)
- Description
- Category badge (colored)
- Amount (color: green for credit, ink for debit)
- Type chip

Filter bar above table:
- Date range selector (simple month selector)
- Category dropdown (using shadcn `<Select>`)
- Type toggle (All / Debit / Credit)
- Search input

Below table: pagination (Show 10 per page, "Showing 1–10 of 47")

### Fallback Data
Generate 47 transactions covering the last 3 months with:
- Monthly salary (LKR 185,000)
- EMI (LKR 22,000)
- Keells (weekly, LKR 3,500–5,500)
- Dialog bill (monthly, LKR 2,800)
- CEB electricity (monthly, LKR 4,200)
- Various debit entries for food, transport, healthcare

### Success Criteria
- All 3 tabs render without errors
- Heatmap shows a 7×4 grid with color intensity
- Anomaly scatter correctly identifies outlier transactions
- Table filters work client-side
- Page is fully responsive

---

## TASK 4 — Loans Intelligence Upgrade
**Priority:** Medium-High
**Effort:** ~3 hours
**Depends on:** Task 0

### Goal
Upgrade `frontend/app/loans/page.tsx` to add 4 new visualizations: a dual-axis combo chart, amortization waterfall, payment calendar heatmap, and an early-settlement simulator.

### File to Modify
- `frontend/app/loans/page.tsx` — add new chart sections below existing content

### New Sections to Add

#### Section A: Loan Overview Combo Chart
Recharts `ComposedChart`:
- X-axis: months remaining (Month 1 to Month 36)
- Left Y-axis: EMI paid (bars) — `#059669`
- Right Y-axis: Outstanding balance (line) — `#E11D48`
- `<Bar dataKey="emiPaid" yAxisId="left" fill="#059669" radius={[3,3,0,0]} />`
- `<Line dataKey="outstanding" yAxisId="right" stroke="#E11D48" strokeWidth={2} dot={false} />`
- Title: "EMI payments vs outstanding balance"
- Show LKR 22,000/month EMI for a 3-year loan starting at LKR 600,000

#### Section B: Principal vs Interest Waterfall
Recharts `BarChart` stacked:
- X-axis: year (Year 1, Year 2, Year 3)
- Stacked bars: principal portion (green) + interest portion (amber)
- Shows how principal grows and interest shrinks over time
- Title: "Principal vs interest breakdown"

#### Section C: Early Settlement Simulator
Interactive section with:
- shadcn `<Slider>` for lump-sum amount (LKR 0 – 400,000)
- Shows live calculation:
  - Months saved: `Math.floor(lumpSum / emiAmount)`
  - Interest saved: `interestSavedCalculation(lumpSum)`
  - New end date: original end date minus months saved
- Display in 3 KPI-style cards with the computed values
- Title: "What if I pay extra?"

#### Section D: Payment Calendar
A 12-month CSS grid calendar showing:
- Each month as a small card
- Color: green if paid on time, amber if paid late, red if missed, gray if future
- Use a simple month-grid layout (3 columns × 4 rows)
- Each card shows: month name + status icon + amount

### Success Criteria
- Combo chart renders with dual Y-axes
- Stacked bar chart shows correct principal/interest split
- Slider updates the 3 simulator cards in real time
- Calendar shows 12 months with correct colors

---

## TASK 5 — Wallet Upgrade with Sankey Flow
**Priority:** Medium
**Effort:** ~3 hours
**Depends on:** Task 0

### Goal
Upgrade `frontend/app/wallet/page.tsx` with a Sankey-style money flow diagram and FX rate history chart.

### Files to Modify
- `frontend/app/wallet/page.tsx` — add new sections

### New Sections

#### Section A: Money Flow Diagram
Build a **visual Sankey-style diagram using SVG** (install `d3-sankey` or build manually with SVG paths):
- Left column (sources): Salary, Freelance, Remittance
- Middle column (accounts): Savings Account, Current Account
- Right column (destinations): School Fees bucket, Household bucket, Savings bucket, Loan EMI, Bills
- Draw curved SVG paths between columns with width proportional to LKR amount
- Color paths by source: Salary = green, Freelance = blue, Remittance = violet
- Title: "Where your money flows"

If `d3-sankey` is not installed, install it: `npm install d3-sankey @types/d3-sankey`

If Sankey is too complex, replace with a simpler **Alluvial / Chord-style table** showing source → destination with amounts.

#### Section B: Balance History Area Chart
Recharts `AreaChart`:
- X-axis: last 90 days
- Series 1: Total balance (green area)
- Series 2: Savings component (mint area, slightly lighter)
- Use gradient fill on both areas
- Title: "Wallet balance · last 90 days"

#### Section C: FX Rate History (for remittance)
Recharts `LineChart`:
- Shows LKR/AED, LKR/AUD, LKR/GBP exchange rates over last 30 days
- 3 lines, each a different chart color
- Best rate day highlighted with a dot annotation
- Title: "Exchange rate history · click best day to remit"

### Success Criteria
- Money flow diagram shows at least 3 sources and 3 destinations
- Area chart shows 90 days of data
- FX chart shows 3 currency lines

---

## TASK 6 — Business Page Upgrade
**Priority:** Medium
**Effort:** ~4 hours
**Depends on:** Task 0

### Goal
Upgrade `frontend/app/business/page.tsx` with a cash-flow waterfall, expense treemap, and receivables ageing grid.

### File to Modify
- `frontend/app/business/page.tsx` — add new chart sections

### New Sections

#### Section A: Cash-Flow Waterfall Chart
Build a waterfall chart using Recharts `BarChart` with custom rendering:
- Steps: Revenue (+LKR 450,000) → COGS (−LKR 180,000) → Gross Profit → Operating Expenses (−LKR 90,000) → EBIT → Taxes (−LKR 36,000) → Net Profit
- Positive steps: green bars from 0
- Negative steps: red bars that appear as decrements
- Net result bar: dark green
- Label each bar with the LKR amount
- Title: "Where did revenue go?"

Implementation tip: Use a custom bar shape. Each bar needs a `base` (start Y) and `height`. Calculate cumulatively. Use Recharts `Cell` to color each bar.

#### Section B: Expense Treemap
Use Recharts `Treemap`:
```tsx
import { Treemap, ResponsiveContainer } from 'recharts'
```
- Data: Staff (35%), Inventory (25%), Marketing (15%), Rent (12%), Utilities (8%), Other (5%)
- Each cell shows category name + percentage
- Colors: use CHART_COLORS cycling
- Custom `content` prop for cell rendering
- Title: "Expense distribution · click to drill down"

#### Section C: Revenue/Expense Trend
Recharts `ComposedChart`:
- Monthly data for last 6 months
- Grouped bars: Revenue (green) and Expenses (amber) side by side
- Line overlay: Net Profit margin % (violet, right Y-axis)
- Title: "Revenue vs expenses · 6 months"

#### Section D: Receivables Ageing Grid
Table (not chart) with columns: Client | Invoice | Amount | Due Date | Days Overdue | Status
- Status color coding: green (current), amber (1–30 days), orange (31–60 days), red (60+)
- "Send reminder" button on each row — shows a `Dialog` with pre-written Sinhala + English message
- Title: "Outstanding receivables"

### Success Criteria
- Waterfall chart clearly shows cumulative flow from revenue to net profit
- Treemap renders with clickable cells
- Receivables table shows status colors
- "Send reminder" dialog opens and shows bilingual message

---

## TASK 7 — Intelligence Page (New)
**Priority:** High (no FlowPilot equivalent)
**Effort:** ~4 hours
**Depends on:** Task 0

### Goal
Create a new page at `frontend/app/intelligence/page.tsx` with an explainable financial health score, anomaly event feed, and forecasting accuracy tracker.

### Files to Create
- `frontend/app/intelligence/page.tsx`

### Sections

#### Section A: Financial Health Score
A large score display (0–100) with component breakdown:

Use a Recharts `BarChart layout="vertical"` to show each component:
- Spending Discipline: 78/100 — "Spending grew 6% this month vs your 5% budget"
- Savings Rate: 85/100 — "Saving 14.2% of income, target is 15%"
- Debt Service Ratio: 72/100 — "EMI is 12% of income, healthy range is under 15%"
- Bill Reliability: 95/100 — "11/12 bills paid on time this year"
- Liquidity: 68/100 — "Emergency fund covers 2.1 months, target is 3+"

Each bar has a "Improve" button that opens a small drawer with 2–3 specific actions.

Total score = weighted average, displayed as large `font-heading text-7xl` number with a `ProgressCircle`.

Color: 80+ = green, 60–79 = amber, below 60 = red.

#### Section B: Anomaly Feed
A list of AI-detected financial anomalies, most recent first:
- Each item: icon + title + description + date + "Ask CEYFI" link
- Examples:
  - "Electricity bill 40% above your average — LKR 4,200 vs usual LKR 3,000"
  - "You spent LKR 18,000 at Keells last week — 3× your normal grocery spend"
  - "No income detected in 12 days — salary usually arrives by the 2nd"
- Status: resolved (green check) / active (amber pulse dot)

#### Section C: Forecast Accuracy (if backend has historical forecasts)
Recharts `ComposedChart`:
- Bars: actual balance per day for last 30 days
- Line: what CEYFI predicted on day −7
- Title: "How accurate were last month's projections?"
- Show prediction error as a `<PeriodBadge>` — "±8.3% average error"

#### Section D: Financial Opportunity List
A ranked list of 5 personalised opportunities:
- Icon + title + potential LKR benefit + confidence + "Simulate" button
- Examples: "Refinance your personal loan → save LKR 42,000 in interest", "Move salary-day surplus to savings → earn LKR 8,400 more per year"

### Files to Also Update
- `frontend/components/layout/Sidebar.tsx` — add Intelligence nav item: `{ href: '/intelligence', label: 'Intelligence', icon: Lightbulb }` (import Lightbulb from lucide-react)
- `frontend/components/layout/MobileNav.tsx` — add same item

### Success Criteria
- Health score shows 5 components with bars
- Anomaly feed shows at least 3 items
- New nav item appears in sidebar

---

## TASK 8 — Scenario Laboratory (New)
**Priority:** High (core demo feature)
**Effort:** ~5 hours
**Depends on:** Task 0

### Goal
Create `frontend/app/scenarios/page.tsx` — a page where users model multiple simultaneous financial shocks and see projected outcomes as a fan chart.

### Files to Create
- `frontend/app/scenarios/page.tsx`
- `frontend/components/charts/ScenarioFanChart.tsx`

### Spec: `ScenarioFanChart.tsx`
A Recharts `AreaChart` showing multiple probability paths:
```tsx
interface ScenarioPath {
  id: string
  label: string     // "Base case", "Pessimistic", "Optimistic"
  color: string
  data: { date: string; balance: number }[]
}
```
- Each path is an `<Area>` with a different color and opacity
- Pessimistic: rose, opacity 0.15 fill
- Base case: green, opacity 0.3 fill
- Optimistic: mint, opacity 0.15 fill
- Lines on top: same colors, `strokeWidth={2}`

### Page Layout

#### Section A: Shock Controls
5 rows of controls, each a shock type:
- **Salary Delay**: `<Slider>` 0–30 days + toggle enabled/disabled
- **FX Depreciation**: `<Slider>` 0–40% depreciation + currency selector (AED/AUD/GBP)
- **Expense Spike**: `<Slider>` +0% to +100% extra spending this month + toggle
- **Emergency Cost**: numeric `<Input>` LKR 0–500,000
- **Interest Rate Change**: `<Slider>` ±5% change

Each control shows estimated LKR impact inline: "(−LKR 32,000 projected impact)"

"Reset all" button, "Save this scenario" button.

#### Section B: Fan Chart
Full-width `<ScenarioFanChart>` showing 90-day projection.
Updates in real time as sliders change (use `useState` for shock values, compute scenarios in a `useMemo`).

#### Section C: Scenario Metrics
3-column card grid showing:
- Minimum projected balance (LKR, color: red if < danger threshold)
- Projected financial runway (months)
- Probability of shortfall (%)
Updates live as sliders change.

#### Section D: Saved Scenarios
A card list of up to 4 saved scenarios with:
- Scenario name + date saved
- Worst-case balance
- "Load" and "Delete" buttons
- "Compare" button appears when 2+ scenarios are selected

### Also Update
- `frontend/components/layout/Sidebar.tsx`: add `{ href: '/scenarios', label: 'Scenarios', icon: FlaskConical }` (import FlaskConical from lucide-react)
- `frontend/components/layout/MobileNav.tsx`: add same

### Success Criteria
- Sliders update the fan chart in real time
- Fan chart shows 3 probability paths simultaneously
- Scenario metrics cards update with slider changes
- Saved scenarios can be added and removed

---

## TASK 9 — Decision Room (New)
**Priority:** High (core demo feature)
**Effort:** ~3 hours
**Depends on:** Task 0

### Goal
Create `frontend/app/decisions/page.tsx` — a ranked list of every financial recommendation, each with evidence, trade-offs, and an execute action.

### Files to Create
- `frontend/app/decisions/page.tsx`

### Decision Card Data Structure
```ts
interface Decision {
  id: string
  title: string             // "Move LKR 18,000 to savings this week"
  category: 'Grow' | 'Protect' | 'Move' | 'Save'
  benefitLkr: number        // 18000
  benefitLabel: string      // "LKR 18,000 moved to savings"
  riskReduced: string       // "Reduces shortfall probability by 34%"
  confidence: number        // 87 (percent)
  evidence: string[]        // ["Salary cleared yesterday", "No bills due for 9 days"]
  tradeoffs: string[]       // ["Reduces everyday account to LKR 26,000"]
  deadline: string          // "Act within 3 days"
  reversible: boolean
  urgency: 'High' | 'Medium' | 'Low'
}
```

### Page Layout

#### Section A: Filter/Sort Bar
Row of filter chips: All | Grow | Protect | Move | Save
Sort selector: By Impact | By Urgency | By Confidence

#### Section B: Decision Cards (full-width list)
Each card:
- Left: category badge (color coded) + urgency indicator (red/amber/green dot)
- Title in `font-heading text-base font-semibold`
- Benefit amount in large `text-emerald-700 font-bold`
- Confidence: `<PeriodBadge value={confidence}>`
- Collapsed by default, click to expand
- Expanded state shows:
  - Evidence list (bullet points, green check icons)
  - Trade-offs list (bullet points, amber warning icons)
  - Deadline chip
  - Reversible badge
  - Action buttons: "Ask why →" (links to `/assistant?prompt=...`), "Simulate →" (links to `/scenarios`), "Execute" (opens confirmation Dialog)
- "Execute" Dialog shows:
  - Summary of action
  - "Confirm" button (shows success toast after 1.5s delay — simulated backend call)
  - "Cancel" button

Pre-populate with 8 decisions covering: savings move, EMI optimization, remittance timing, subscription cancellation, loan refinancing, emergency fund top-up, business invoice chase, FX timing.

#### Section C: Impact Summary Strip
At the top of the page, above the filter bar:
- Total potential benefit: sum of all benefits in LKR
- High urgency count
- Decisions pending action count

### Also Update
- Sidebar + MobileNav: add `{ href: '/decisions', label: 'Decisions', icon: Zap }` (import Zap from lucide-react)

### Success Criteria
- Cards expand/collapse correctly
- Filter chips filter the list by category
- Execute dialog shows and simulates an action
- 8+ decisions pre-populated

---

## TASK 10 — Navigation & Layout Update
**Priority:** Must do after Tasks 7, 8, 9 add new pages.
**Effort:** ~1 hour

### Goal
Update sidebar and mobile nav to include all new pages, rename existing items where needed, and ensure nav is fully responsive.

### Files to Modify
- `frontend/components/layout/Sidebar.tsx`
- `frontend/components/layout/MobileNav.tsx`

### New Nav Items (add to existing list)
```ts
{ href: '/intelligence', label: 'Intelligence', icon: 'Lightbulb' },
{ href: '/scenarios',    label: 'Scenarios',    icon: 'FlaskConical' },
{ href: '/decisions',    label: 'Decisions',    icon: 'Zap' },
```

### Sidebar Grouping
Organise nav items into 2 groups with a small divider label:

**My Money**
- Overview (LayoutDashboard)
- Wallet (Wallet)
- Transactions (ArrowUpDown)
- Loans (CreditCard)
- Business (BriefcaseBusiness)

**Intelligence**
- Intelligence (Lightbulb)
- Scenarios (FlaskConical)
- Decisions (Zap)
- CEYFI AI (Sparkles)

**System** (push to bottom)
- Metrics (Activity)

### Mobile Nav
Mobile nav shows bottom tab bar. Include the 5 most important items:
- Overview, Transactions, Decisions, Intelligence, CEYFI AI
- Others accessible via a "More" menu slide-up

### Success Criteria
- All 3 new pages appear in sidebar
- Sidebar shows 2 labelled groups
- Mobile nav shows 5 tabs + More
- Active state highlights correctly on all new routes

---

## FINAL: Git & Deploy Checklist
After all tasks are complete:

1. Run `npm run build` inside `frontend/` — fix any TypeScript or build errors
2. Run `node scripts/smoke.mjs` — all smoke tests must pass
3. Commit with message: `feat(frontend): CEYFI v2 — Financial Twin OS full rebuild`
4. Push to `main` on ArdenoStudio/Ceyfi
5. Vercel will auto-deploy from the push

### Environment Variables Required
The Vercel deployment needs:
- `NEXT_PUBLIC_API_BASE=https://seylan-hub-backend.vercel.app`

Check the `frontend/.env.local` or Vercel dashboard to verify this is set.
