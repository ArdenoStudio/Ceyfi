# CEYFI — Master Build Plan for Cursor Composer

> **Codename:** CEYFI  
> **Brand tagline:** "Clarity for every rupee"  
> **What this is:** Full redesign of SeylanHub. New name, new colour palette, new chart-rich UI, same FastAPI backend on Google Cloud Run (`https://ceyfi-backend-98470559362.asia-southeast1.run.app`).
> **Stack:** Next.js 15 (App Router), Tailwind CSS v4, Recharts 2.15.4, shadcn/ui, Sora font  
> **Working directory:** The existing `frontend/` folder — do a clean rewrite of every page

---

## 1. Brand Identity

| Token | Value | Use |
|-------|-------|-----|
| `ceyfi-green` | `#059669` | Primary CTA, active nav, headings |
| `ceyfi-deep` | `#052E16` | Sidebar background |
| `ceyfi-mint` | `#34D399` | Accent badges, highlights |
| `ceyfi-surface` | `#F0FDF4` | Light page bg |
| `ceyfi-border` | `#D1FAE5` | Borders |

Name: **Ceyfi** = Ceylon + Finance. Short, punchy, startup-native. Works as `ceyfi.app`, says exactly what it is, looks great on a sidebar.

---

## 2. Dependencies to Add

```bash
pnpm add recharts @remixicon/react date-fns nuqs tailwind-variants
```

`package.json` additions:
```json
{
  "recharts": "^2.15.4",
  "@remixicon/react": "^4.6.0",
  "date-fns": "^4.1.0",
  "nuqs": "^2.4.1",
  "tailwind-variants": "^0.3.0"
}
```

---

## 3. tailwind.config.ts

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ceyfi-green":   "#059669",
        "ceyfi-deep":    "#052E16",
        "ceyfi-mint":    "#34D399",
        "ceyfi-surface": "#F0FDF4",
        "ceyfi-border":  "#D1FAE5",
        // Keep Tailwind defaults for chart colours (blue, emerald, violet, amber, rose…)
      },
      fontFamily: {
        sans: ["var(--font-sora)", "DM Sans", "ui-sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
```

---

## 4. Core Chart Infrastructure

### 4.1 `lib/chartUtils.ts`
Copy **verbatim** from:
`C:\Users\Ovindu\Documents\Ardeno Studio\Templates\template-insights-main\template-insights-main\src\lib\chartUtils.ts`

Key exports: `chartColors`, `AvailableChartColorsKeys`, `constructCategoryColors`, `getColorClassName`, `getYAxisDomain`, `hasOnlyOneValueForKey`

### 4.2 `lib/useOnWindowResize.ts`
Copy **verbatim** from:
`C:\Users\Ovindu\Documents\Ardeno Studio\Templates\template-insights-main\template-insights-main\src\lib\useOnWindowResize.ts`

### 4.3 `lib/utils.ts` additions

Add to existing `lib/utils.ts`:
```ts
export const formatters = {
  currency: ({ number, maxFractionDigits = 2 }: { number: number; maxFractionDigits?: number }) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: maxFractionDigits,
    }).format(number),
  compact: (n: number) =>
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n),
  percent: (n: number) => `${(n * 100).toFixed(1)}%`,
}

export function cx(...args: (string | undefined | null | false)[]): string {
  return args.filter(Boolean).join(" ")
}
```

---

## 5. Chart Components

Copy these files **verbatim** from the template sources into `components/charts/`:

| Component | Source file | Use in CEYFI |
|-----------|-------------|-----------------|
| `AreaChart.tsx` | `template-insights-main/.../AreaChart.tsx` | Spending trends, balance history, SME revenue |
| `BarChart.tsx` | `template-insights-main/.../BarChart.tsx` | Category spending, transfer history |
| `BarChartVariant.tsx` | `template-insights-main/.../BarChartVariant.tsx` | Daily txn amount & count (date x-axis) |
| `LineChart.tsx` | `template-dashboard-main/.../LineChart.tsx` | Portfolio balance, exchange rates |
| `LineChartSupport.tsx` | `template-overview-main/.../LineChartSupport.tsx` | AI chat message volume; if necessary |
| `ComboChart.tsx` | `template-planner-main/.../ComboChart.tsx` | Loan EMI vs outstanding balance (biaxial) |
| `ConditionalBarChart.tsx` | `template-planner-main/.../ConditionalBarChart.tsx` | Spending heatmap, repayment consistency |
| `CategoryBar.tsx` | `template-overview-main/.../CategoryBar.tsx` | Budget bucket breakdown |
| `ProgressCircle.tsx` | `template-overview-main/.../ProgressCircle.tsx` | Loan health score ring |
| `CustomTooltips.tsx` | `template-planner-main/.../CustomTooltips.tsx` | Use if necessary for rich tooltips |

After copying, update all `@/lib/chartUtils` and `@/lib/useOnWindowResize` imports — they already match since we placed them at the same relative path.

---

## 6. App Shell & Navigation

### `app/layout.tsx` (root)
```tsx
import { Sora } from "next/font/google"
import "./globals.css"

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

export const metadata = {
  title: "CEYFI — Clarity for every rupee",
  description: "AI-powered financial clarity for Sri Lankans worldwide.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full bg-ceyfi-surface flex flex-col">{children}</body>
    </html>
  )
}
```

### `app/(app)/layout.tsx` (authenticated shell)
```tsx
import { AppSidebar } from "@/components/AppSidebar"
import { AppTopbar } from "@/components/AppTopbar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col md:ml-64">
        <AppTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
```

### `components/AppSidebar.tsx`
```tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiDashboardLine, RiWalletLine, RiExchangeLine,
  RiLineChartLine, RiStoreLine, RiSparklingLine, RiActivityLine,
} from "@remixicon/react"
import Image from "next/image"
import { cx } from "@/lib/utils"

const NAV = [
  { href: "/",            label: "Overview",     icon: RiDashboardLine },
  { href: "/wallet",      label: "Wallet",       icon: RiWalletLine },
  { href: "/transactions",label: "Transactions", icon: RiExchangeLine },
  { href: "/loans",       label: "Loans",        icon: RiLineChartLine },
  { href: "/business",    label: "Business",     icon: RiStoreLine },
  { href: "/assistant",   label: "CEYFI AI",  icon: RiSparklingLine },
  { href: "/metrics",     label: "Metrics",      icon: RiActivityLine },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ceyfi-deep text-white shadow-2xl md:flex">
      {/* Logo */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ceyfi-green text-white font-bold text-lg">C</div>
          <div>
            <div className="text-base font-bold tracking-wide">CEYFI</div>
            <div className="text-xs text-white/50">AI Banking</div>
          </div>
        </div>
      </div>

      {/* User pill */}
      <div className="border-b border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <div className="h-8 w-8 rounded-full bg-ceyfi-green/60 flex items-center justify-center text-sm font-bold">N</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Nimal Fernando</div>
            <div className="text-xs text-white/50 truncate">SEY-USR-001</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-ceyfi-green text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className="text-xs text-white/30 px-3">CEYFI v2.0 · Buildathon 2026</div>
      </div>
    </aside>
  )
}
```

### `components/AppTopbar.tsx`
```tsx
import { RiBellLine, RiSettings3Line } from "@remixicon/react"

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ceyfi-border bg-white/95 backdrop-blur px-4 sm:px-6 md:hidden">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-ceyfi-green text-white flex items-center justify-center text-sm font-bold">C</div>
        <span className="font-semibold text-sm">CEYFI</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-gray-500 hover:text-gray-900"><RiBellLine className="h-5 w-5" /></button>
        <button className="text-gray-500 hover:text-gray-900"><RiSettings3Line className="h-5 w-5" /></button>
      </div>
    </header>
  )
}
```

### Mobile bottom nav — add to `AppLayout`:
```tsx
// Mobile bottom nav bar (inside AppLayout, below <main>)
<nav className="fixed inset-x-3 bottom-3 z-30 flex rounded-2xl border border-ceyfi-border bg-white/95 backdrop-blur p-1 shadow-xl md:hidden">
  {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 text-xs text-gray-500 hover:text-ceyfi-green">
      <Icon className="h-5 w-5 mb-0.5" />
      <span className="hidden xs:block">{label}</span>
    </Link>
  ))}
</nav>
```

---

## 7. Shared UI Components

### `components/ui/KpiCard.tsx`
```tsx
import { cx } from "@/lib/utils"
import { RiArrowUpLine, RiArrowDownLine } from "@remixicon/react"

interface KpiCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  subtitle?: string
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ title, value, change, changeType, subtitle, icon, className }: KpiCardProps) {
  return (
    <div className={cx("rounded-2xl border border-ceyfi-border bg-white p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {icon && <div className="text-ceyfi-green">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>}
      <div className={cx(
        "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        changeType === "positive" && "bg-emerald-50 text-emerald-700",
        changeType === "negative" && "bg-rose-50 text-rose-700",
        changeType === "neutral" && "bg-gray-100 text-gray-600",
      )}>
        {changeType === "positive" && <RiArrowUpLine className="h-3 w-3" />}
        {changeType === "negative" && <RiArrowDownLine className="h-3 w-3" />}
        {change}
      </div>
    </div>
  )
}
```

### `components/ui/ChartCard.tsx`
```tsx
interface ChartCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, action, children, className }: ChartCardProps) {
  return (
    <div className={`rounded-2xl border border-ceyfi-border bg-white p-5 shadow-sm ${className ?? ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
```

---

## 8. API Layer

### `lib/api.ts` — keep existing file, update `API_BASE`:
```ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production"
    ? "https://ceyfi-backend-98470559362.asia-southeast1.run.app"
    : "http://localhost:8000")
```

### `lib/types.ts` — all data types used across pages:
```ts
export interface AccountContext {
  user_id: string
  name: string
  balance_lkr: number
  savings_balance: number
  current_balance: number
  recent_transactions: Transaction[]
  loans?: Loan[]
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount_lkr: number
  type: "debit" | "credit"
  bucket_id?: string | null
  merchant?: string
  category?: string
}

export interface Loan {
  id: string
  type: string
  principal: number
  outstanding: number
  emi: number
  health_score: number
  next_payment_date: string
  payments_remaining: number
  payments_made: number
}

export interface AllocationBucket {
  id: string
  label: string
  pct: number
}

export interface TaxJarRule {
  from_account_id: string
  to_account_id: string
  percentage: number
  label: string
}

// Chart data shapes
export interface TimeSeriesPoint {
  date: string      // "MMM dd" formatted
  [key: string]: number | string
}

export interface CategoryPoint {
  key: string
  value: number
}
```

---

## 9. Page: Overview Dashboard (`app/(app)/page.tsx`)

**Charts used:** LineChart, AreaChart, CategoryBar, ProgressCircle, KpiCard

```tsx
"use client"
import React from "react"
import useSWR from "swr"
import { KpiCard } from "@/components/ui/KpiCard"
import { ChartCard } from "@/components/ui/ChartCard"
import { AreaChart } from "@/components/charts/AreaChart"
import { LineChart } from "@/components/charts/LineChart"
import { CategoryBar } from "@/components/charts/CategoryBar"
import { ProgressCircle } from "@/components/charts/ProgressCircle"
import { API_BASE } from "@/lib/api"
import { formatters } from "@/lib/utils"
import {
  RiWalletLine, RiBankLine, RiLineChartLine, RiArrowUpDownLine,
} from "@remixicon/react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Mock time-series for balance history (last 30 days)
// Replace with real backend call when available
function buildBalanceHistory(currentBalance: number): { date: string; Balance: number; Savings: number }[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      Balance: currentBalance - (29 - i) * 2000 + Math.random() * 8000 - 4000,
      Savings: 125400 - (29 - i) * 800 + Math.random() * 2000 - 1000,
    }
  })
}

// Spending vs Income last 6 months
const spendingData = [
  { month: "Jan", Income: 185000, Expenses: 92000 },
  { month: "Feb", Income: 185000, Expenses: 108000 },
  { month: "Mar", Income: 185000, Expenses: 87500 },
  { month: "Apr", Income: 207000, Expenses: 115000 },
  { month: "May", Income: 185000, Expenses: 98000 },
  { month: "Jun", Income: 185000, Expenses: 104000 },
]

export default function OverviewPage() {
  const { data: ctx } = useSWR(`${API_BASE}/mock/account-context/SEY-USR-001`, fetcher)
  const { data: rules } = useSWR(`${API_BASE}/wallet/rules/SEY-USR-001`, fetcher)

  const balance = ctx?.balance_lkr ?? 245000
  const savings = ctx?.savings_balance ?? 125400
  const balanceHistory = buildBalanceHistory(balance)

  const buckets: { id: string; label: string; pct: number }[] = rules?.buckets ?? [
    { id: "school", label: "School Fees", pct: 40 },
    { id: "household", label: "Household", pct: 40 },
    { id: "savings", label: "Savings", pct: 20 },
  ]
  const bucketValues = buckets.map(b => b.pct)
  const bucketColors: ("blue" | "emerald" | "amber" | "violet" | "rose")[] = ["blue", "emerald", "amber", "violet", "rose"]

  const loanHealthScore = 78 // pulled from loans endpoint in real build

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, {ctx?.name?.split(" ")[0] ?? "Nimal"}</h1>
        <p className="text-sm text-gray-500 mt-1">Here's your financial picture for today.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          title="Total Balance"
          value={formatters.currency({ number: balance, maxFractionDigits: 0 })}
          change="+2.4% this month"
          changeType="positive"
          subtitle="Current + Savings"
          icon={<RiWalletLine className="h-5 w-5" />}
        />
        <KpiCard
          title="Savings"
          value={formatters.currency({ number: savings, maxFractionDigits: 0 })}
          change="+LKR 12,400 this month"
          changeType="positive"
          icon={<RiBankLine className="h-5 w-5" />}
        />
        <KpiCard
          title="Loan Health"
          value={`${loanHealthScore}/100`}
          change="Good standing"
          changeType="positive"
          subtitle="All loans on track"
          icon={<RiLineChartLine className="h-5 w-5" />}
        />
        <KpiCard
          title="This Month Spent"
          value="LKR 104,000"
          change="+6% vs last month"
          changeType="negative"
          icon={<RiArrowUpDownLine className="h-5 w-5" />}
        />
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Balance trend — 2/3 width */}
        <ChartCard
          title="Portfolio Balance"
          subtitle="Last 30 days · Current + Savings"
          className="lg:col-span-2"
        >
          <LineChart
            data={balanceHistory}
            index="date"
            categories={["Balance", "Savings"]}
            colors={["blue", "emerald"]}
            valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
            showLegend
            showXAxis
            showYAxis
            className="h-64"
          />
        </ChartCard>

        {/* Loan health ring — 1/3 width */}
        <ChartCard title="Loan Health Score" subtitle="Combined across all active loans">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <ProgressCircle
                value={loanHealthScore}
                max={100}
                radius={60}
                strokeWidth={10}
                variant={loanHealthScore >= 75 ? "success" : loanHealthScore >= 50 ? "warning" : "error"}
              >
                <span className="text-2xl font-bold text-gray-900">{loanHealthScore}</span>
              </ProgressCircle>
            </div>
            <div className="w-full space-y-2 text-sm">
              {[
                { label: "Personal Loan", value: 82, color: "text-emerald-600" },
                { label: "Home Loan", value: 71, color: "text-amber-600" },
              ].map(l => (
                <div key={l.label} className="flex justify-between">
                  <span className="text-gray-500">{l.label}</span>
                  <span className={`font-semibold ${l.color}`}>{l.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Spending vs Income + Bucket allocation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Income vs Expenses" subtitle="Last 6 months" className="lg:col-span-2">
          <AreaChart
            data={spendingData}
            index="month"
            categories={["Income", "Expenses"]}
            colors={["emerald", "rose"]}
            fill="gradient"
            valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
            showLegend
            className="h-56"
          />
        </ChartCard>

        <ChartCard title="Budget Allocation" subtitle="Active remittance buckets">
          <div className="py-2 space-y-4">
            <CategoryBar
              values={bucketValues}
              colors={bucketColors}
              className="mt-2"
            />
            <ul className="space-y-2">
              {buckets.map((b, i) => (
                <li key={b.id} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-sm ${["bg-blue-500","bg-emerald-500","bg-amber-500"][i]}`} />
                    <span className="text-gray-600">{b.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{b.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
```

---

## 10. Page: Transactions (`app/(app)/transactions/page.tsx`)

**Charts used:** BarChartVariant (amount, count), BarChart (categories, merchants), ConditionalBarChart (weekly heatmap)

```tsx
"use client"
import React from "react"
import useSWR from "swr"
import { useQueryState } from "nuqs"
import { ChartCard } from "@/components/ui/ChartCard"
import { BarChartVariant } from "@/components/charts/BarChartVariant"
import { BarChart } from "@/components/charts/BarChart"
import { ConditionalBarChart } from "@/components/charts/ConditionalBarChart"
import { API_BASE } from "@/lib/api"
import { formatters } from "@/lib/utils"
import { subDays, format } from "date-fns"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Builds daily spend data from DB transactions
function buildDailyAmounts(txns: any[]): { key: string; value: number }[] {
  const map: Record<string, number> = {}
  txns.forEach(t => {
    if (t.type === "debit") {
      const d = t.timestamp?.split("T")[0] ?? t.date
      map[d] = (map[d] ?? 0) + Math.abs(t.amount_lkr)
    }
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([key, value]) => ({ key, value }))
}

function buildCategoryTotals(txns: any[]): { key: string; value: number }[] {
  const map: Record<string, number> = {}
  txns.forEach(t => {
    if (t.type === "debit") {
      const cat = t.bucket_label ?? t.category ?? "Other"
      map[cat] = (map[cat] ?? 0) + Math.abs(t.amount_lkr)
    }
  })
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, value]) => ({ key, value }))
}

// Day-of-week spending heatmap (0 = very low, 1 = high)
function buildDowHeatmap(txns: any[]): { key: string; value: number }[] {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  const totals: Record<string, number> = {}
  txns.forEach(t => {
    if (t.type === "debit") {
      const d = new Date(t.timestamp ?? t.date)
      const dow = days[d.getDay() === 0 ? 6 : d.getDay() - 1]
      totals[dow] = (totals[dow] ?? 0) + Math.abs(t.amount_lkr)
    }
  })
  const max = Math.max(...Object.values(totals), 1)
  return days.map(d => ({ key: d, value: (totals[d] ?? 0) / max }))
}

export default function TransactionsPage() {
  const { data: dbTxns } = useSWR(
    `${API_BASE}/mock/account-context/SEY-USR-001`,
    fetcher,
    { revalidateOnFocus: false }
  )
  const txns: any[] = dbTxns?.recent_transactions ?? []
  const daily = buildDailyAmounts(txns)
  const cats = buildCategoryTotals(txns)
  const dow = buildDowHeatmap(txns)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Patterns across your spending history.</p>
      </div>

      {/* Daily spend amount */}
      <ChartCard title="Daily Spend" subtitle="Last 30 days · LKR">
        <BarChartVariant
          data={daily}
          index="key"
          categories={["value"]}
          colors={["blue"]}
          valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
          xValueFormatter={(d) => {
            const dt = new Date(d)
            return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })
          }}
          yAxisWidth={80}
          className="h-64"
        />
      </ChartCard>

      {/* Categories + Merchants */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top 5 Categories" subtitle="By spend amount">
          <BarChart
            data={cats}
            index="key"
            categories={["value"]}
            colors={["emerald"]}
            layout="vertical"
            valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
            yAxisWidth={110}
            className="h-64"
          />
        </ChartCard>

        <ChartCard title="Day-of-Week Heatmap" subtitle="Relative spending intensity">
          <ConditionalBarChart
            data={dow}
            index="key"
            categories={["value"]}
            valueFormatter={(v) => formatters.percent(v)}
            className="h-64"
          />
        </ChartCard>
      </div>
    </div>
  )
}
```

---

## 11. Page: Wallet & Remittance (`app/(app)/wallet/page.tsx`)

**Charts used:** AreaChart (balance trend), BarChart (transfer history), LineChart (FX rates)

```tsx
"use client"
import React from "react"
import useSWR from "swr"
import { ChartCard } from "@/components/ui/ChartCard"
import { KpiCard } from "@/components/ui/KpiCard"
import { AreaChart } from "@/components/charts/AreaChart"
import { BarChart } from "@/components/charts/BarChart"
import { LineChart } from "@/components/charts/LineChart"
import { API_BASE } from "@/lib/api"
import { formatters } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Mock 60-day balance trend
function buildBalanceTrend(current: number) {
  return Array.from({ length: 60 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (59 - i))
    return {
      date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      "Current Account": current - (59 - i) * 1200 + Math.random() * 6000 - 3000,
      "Savings Account": 125400 - (59 - i) * 600 + Math.random() * 2000 - 1000,
    }
  })
}

// Mock FX rates LKR per 1 foreign unit
const fxData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
    "LKR/AUD": 195 + Math.sin(i / 5) * 3 + Math.random() * 2 - 1,
    "LKR/GBP": 340 + Math.sin(i / 4) * 5 + Math.random() * 3 - 1.5,
    "LKR/USD": 300 + Math.sin(i / 6) * 4 + Math.random() * 2 - 1,
  }
})

// Recent transfer history
const transferHistory = [
  { month: "Jan", Sent: 45000, Received: 0 },
  { month: "Feb", Sent: 52000, Received: 12000 },
  { month: "Mar", Sent: 38000, Received: 0 },
  { month: "Apr", Sent: 61000, Received: 0 },
  { month: "May", Sent: 47000, Received: 8000 },
  { month: "Jun", Sent: 55000, Received: 0 },
]

export default function WalletPage() {
  const { data: ctx } = useSWR(`${API_BASE}/mock/account-context/SEY-USR-001`, fetcher)
  const { data: rules } = useSWR(`${API_BASE}/wallet/rules/SEY-USR-001`, fetcher)

  const balance = ctx?.current_balance ?? 34200
  const savings = ctx?.savings_balance ?? 125400
  const balanceTrend = buildBalanceTrend(balance)
  const buckets: any[] = rules?.buckets ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">Accounts, remittances, and exchange rates.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard title="Current Account" value={formatters.currency({ number: balance, maxFractionDigits: 0 })} change="SEY-CUR-001" changeType="neutral" />
        <KpiCard title="Savings Account" value={formatters.currency({ number: savings, maxFractionDigits: 0 })} change="+LKR 12,400 this month" changeType="positive" />
        <KpiCard title="LKR/AUD" value="195.40" change="+0.8% today" changeType="positive" subtitle="1 AUD" />
        <KpiCard title="LKR/GBP" value="340.10" change="-0.3% today" changeType="negative" subtitle="1 GBP" />
      </div>

      {/* Balance trend */}
      <ChartCard title="Account Balance History" subtitle="Last 60 days · Both accounts">
        <AreaChart
          data={balanceTrend}
          index="date"
          categories={["Current Account", "Savings Account"]}
          colors={["blue", "emerald"]}
          fill="gradient"
          valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
          showLegend
          className="h-64"
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* FX rates */}
        <ChartCard title="Exchange Rates" subtitle="LKR per foreign unit · 30 days">
          <LineChart
            data={fxData}
            index="date"
            categories={["LKR/AUD", "LKR/GBP", "LKR/USD"]}
            colors={["blue", "violet", "amber"]}
            valueFormatter={(v) => `LKR ${v.toFixed(2)}`}
            showLegend
            className="h-56"
          />
        </ChartCard>

        {/* Transfer history */}
        <ChartCard title="Remittance History" subtitle="Monthly sent vs received (LKR)">
          <BarChart
            data={transferHistory}
            index="month"
            categories={["Sent", "Received"]}
            colors={["blue", "emerald"]}
            valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
            showLegend
            className="h-56"
          />
        </ChartCard>
      </div>

      {/* Bucket allocation if set */}
      {buckets.length > 0 && (
        <ChartCard title="Active Remittance Buckets" subtitle="How incoming transfers are split">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {buckets.map((b: any, i: number) => (
              <div key={b.id} className="rounded-xl border border-ceyfi-border p-4">
                <div className="text-sm font-medium text-gray-900">{b.label}</div>
                <div className="text-2xl font-bold text-ceyfi-green mt-1">{b.pct}%</div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-ceyfi-green"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  )
}
```

---

## 12. Page: Loans (`app/(app)/loans/page.tsx`)

**Charts used:** ComboChart (EMI vs balance, biaxial), AreaChart (repayment progress), ConditionalBarChart (payment consistency), ProgressCircle (health score)

```tsx
"use client"
import React from "react"
import useSWR from "swr"
import { ChartCard } from "@/components/ui/ChartCard"
import { KpiCard } from "@/components/ui/KpiCard"
import { ComboChart } from "@/components/charts/ComboChart"
import { AreaChart } from "@/components/charts/AreaChart"
import { ConditionalBarChart } from "@/components/charts/ConditionalBarChart"
import { ProgressCircle } from "@/components/charts/ProgressCircle"
import { API_BASE } from "@/lib/api"
import { formatters } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Simulate loan amortization data (24 months)
function buildAmortizationData(principal: number, emi: number) {
  let outstanding = principal
  return Array.from({ length: 24 }, (_, i) => {
    const interest = outstanding * 0.01
    const principalPaid = emi - interest
    outstanding = Math.max(0, outstanding - principalPaid)
    const d = new Date(); d.setMonth(d.getMonth() - 12 + i)
    return {
      month: d.toLocaleDateString("en", { month: "short", year: "2-digit" }),
      EMI: emi,
      Outstanding: Math.round(outstanding),
    }
  })
}

// Payment consistency (1 = on time, 0 = missed, 0.5 = partial)
const paymentConsistency = [
  { key: "Jan", value: 1 }, { key: "Feb", value: 1 }, { key: "Mar", value: 0.8 },
  { key: "Apr", value: 1 }, { key: "May", value: 1 }, { key: "Jun", value: 0.5 },
  { key: "Jul", value: 1 }, { key: "Aug", value: 1 }, { key: "Sep", value: 1 },
  { key: "Oct", value: 0.9 }, { key: "Nov", value: 1 }, { key: "Dec", value: 1 },
]

export default function LoansPage() {
  const { data } = useSWR(`${API_BASE}/mock/loans/SEY-USR-001`, fetcher)
  const loans: any[] = data?.loans ?? []
  const primaryLoan = loans[0] ?? {
    type: "Personal Loan",
    principal: 1500000,
    outstanding: 980000,
    emi: 28500,
    health_score: 82,
    payments_made: 18,
    payments_remaining: 30,
  }

  const amortization = buildAmortizationData(primaryLoan.outstanding, primaryLoan.emi)
  const repaidPct = Math.round((primaryLoan.payments_made / (primaryLoan.payments_made + primaryLoan.payments_remaining)) * 100)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loan Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your active loans and repayment health.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard title="Outstanding" value={formatters.currency({ number: primaryLoan.outstanding, maxFractionDigits: 0 })} change="Personal Loan" changeType="neutral" />
        <KpiCard title="Monthly EMI" value={formatters.currency({ number: primaryLoan.emi, maxFractionDigits: 0 })} change="Due 5th of each month" changeType="neutral" />
        <KpiCard title="Paid So Far" value={`${repaidPct}%`} change={`${primaryLoan.payments_made} of ${primaryLoan.payments_made + primaryLoan.payments_remaining} payments`} changeType="positive" />
        <KpiCard title="Health Score" value={`${primaryLoan.health_score}/100`} change="Good standing" changeType="positive" />
      </div>

      {/* ComboChart: EMI (bar) + Outstanding balance (line) — biaxial */}
      <ChartCard title="EMI vs Outstanding Balance" subtitle="24-month amortization view">
        <ComboChart
          data={amortization}
          index="month"
          barSeries={{
            categories: ["EMI"],
            colors: ["blue"],
            valueFormatter: (v) => formatters.currency({ number: v, maxFractionDigits: 0 }),
            yAxisWidth: 80,
            yAxisLabel: "EMI (LKR)",
          }}
          lineSeries={{
            categories: ["Outstanding"],
            colors: ["rose"],
            valueFormatter: (v) => formatters.currency({ number: v, maxFractionDigits: 0 }),
            yAxisLabel: "Outstanding (LKR)",
          }}
          enableBiaxial={true}
          className="h-72"
        />
      </ChartCard>

      {/* Payment consistency heatmap + Health ring */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Payment Consistency" subtitle="Monthly — 1.0 = on time, 0 = missed" className="lg:col-span-2">
          <ConditionalBarChart
            data={paymentConsistency}
            index="key"
            categories={["value"]}
            valueFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            className="h-48"
          />
        </ChartCard>

        <ChartCard title="Repayment Progress">
          <div className="flex flex-col items-center gap-4 py-6">
            <ProgressCircle
              value={repaidPct}
              max={100}
              radius={56}
              strokeWidth={10}
              variant="success"
            >
              <span className="text-xl font-bold">{repaidPct}%</span>
            </ProgressCircle>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">Loan Repaid</div>
              <div className="text-xs text-gray-400 mt-0.5">{primaryLoan.payments_remaining} payments remaining</div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
```

---

## 13. Page: Business / SME (`app/(app)/business/page.tsx`)

**Charts used:** AreaChart (revenue vs expenses, stacked), ComboChart (revenue vs tax savings, biaxial), BarChart (top expense categories), ConditionalBarChart (monthly revenue heatmap)

```tsx
"use client"
import React from "react"
import useSWR from "swr"
import { ChartCard } from "@/components/ui/ChartCard"
import { KpiCard } from "@/components/ui/KpiCard"
import { AreaChart } from "@/components/charts/AreaChart"
import { ComboChart } from "@/components/charts/ComboChart"
import { BarChart } from "@/components/charts/BarChart"
import { ConditionalBarChart } from "@/components/charts/ConditionalBarChart"
import { API_BASE } from "@/lib/api"
import { formatters } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

const monthlyData = [
  { month: "Jan", Revenue: 485000, Expenses: 312000, "Tax Savings": 48500 },
  { month: "Feb", Revenue: 520000, Expenses: 298000, "Tax Savings": 52000 },
  { month: "Mar", Revenue: 390000, Expenses: 340000, "Tax Savings": 39000 },
  { month: "Apr", Revenue: 610000, Expenses: 380000, "Tax Savings": 61000 },
  { month: "May", Revenue: 558000, Expenses: 320000, "Tax Savings": 55800 },
  { month: "Jun", Revenue: 630000, Expenses: 410000, "Tax Savings": 63000 },
]

const expenseCats = [
  { key: "Inventory",  value: 180000 },
  { key: "Payroll",    value: 150000 },
  { key: "Utilities",  value: 42000  },
  { key: "Marketing",  value: 28000  },
  { key: "Transport",  value: 20000  },
]

// Normalize revenue to 0-1 for heatmap
const maxRevenue = Math.max(...monthlyData.map(d => d.Revenue))
const revenueHeatmap = monthlyData.map(d => ({ key: d.month, value: d.Revenue / maxRevenue }))

export default function BusinessPage() {
  const { data: taxRule } = useSWR(`${API_BASE}/mock/business/SEY-BIZ-001`, fetcher)

  const taxPct = taxRule?.percentage ?? 10
  const totalTaxSaved = monthlyData.reduce((a, d) => a + d["Tax Savings"], 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue, expenses, and automatic tax savings.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard title="This Month Revenue" value="LKR 630,000" change="+12.9% vs last month" changeType="positive" />
        <KpiCard title="Net Profit" value="LKR 220,000" change="34.9% margin" changeType="positive" />
        <KpiCard title="Tax Jar Saved (YTD)" value={formatters.currency({ number: totalTaxSaved, maxFractionDigits: 0 })} change={`${taxPct}% auto-sweep`} changeType="positive" />
        <KpiCard title="Expense Ratio" value="65.1%" change="-2.3% vs last month" changeType="positive" />
      </div>

      {/* Stacked area: Revenue vs Expenses */}
      <ChartCard title="Revenue vs Expenses" subtitle="Last 6 months · LKR">
        <AreaChart
          data={monthlyData}
          index="month"
          categories={["Revenue", "Expenses"]}
          colors={["emerald", "rose"]}
          fill="gradient"
          type="default"
          valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
          showLegend
          className="h-64"
        />
      </ChartCard>

      {/* ComboChart: Revenue (bar) + Tax Savings (line) */}
      <ChartCard title="Revenue vs Tax Savings" subtitle="Tax jar auto-sweep at 10% of revenue">
        <ComboChart
          data={monthlyData}
          index="month"
          barSeries={{
            categories: ["Revenue"],
            colors: ["emerald"],
            valueFormatter: (v) => formatters.currency({ number: v, maxFractionDigits: 0 }),
            yAxisWidth: 90,
          }}
          lineSeries={{
            categories: ["Tax Savings"],
            colors: ["amber"],
            valueFormatter: (v) => formatters.currency({ number: v, maxFractionDigits: 0 }),
          }}
          enableBiaxial={false}
          className="h-64"
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top expense categories */}
        <ChartCard title="Top Expense Categories" subtitle="This month · LKR">
          <BarChart
            data={expenseCats}
            index="key"
            categories={["value"]}
            colors={["violet"]}
            layout="vertical"
            valueFormatter={(v) => formatters.currency({ number: v, maxFractionDigits: 0 })}
            yAxisWidth={100}
            className="h-56"
          />
        </ChartCard>

        {/* Revenue heatmap by month */}
        <ChartCard title="Revenue Intensity" subtitle="Relative month-by-month performance">
          <ConditionalBarChart
            data={revenueHeatmap}
            index="key"
            categories={["value"]}
            valueFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            className="h-56"
          />
        </ChartCard>
      </div>
    </div>
  )
}
```

---

## 14. Page: AI Assistant (`app/(app)/assistant/page.tsx`)

Keep the existing chat UI but restyle it with CEYFI colours. The backend endpoint `POST /api/chat` stays the same.

```tsx
"use client"
import React, { useRef, useState } from "react"
import { API_BASE } from "@/lib/api"
import { RiSendPlanLine, RiSparklingLine, RiMicLine } from "@remixicon/react"
import { cx } from "@/lib/utils"

interface Message { role: "user" | "assistant"; content: string }

const QUICK_PROMPTS = [
  "What's my loan health score?",
  "How much did I spend this month?",
  "Show me my savings progress",
  "Can I afford a new car loan?",
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your CEYFI AI. Ask me anything about your finances." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function send(text: string) {
    if (!text.trim()) return
    const userMsg: Message = { role: "user", content: text }
    setMessages(m => [...m, userMsg])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "SEY-USR-001",
          message: text,
          language: "en",
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: "assistant", content: data.response ?? data.text ?? "Sorry, I couldn't process that." }])
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Connection error. Please try again." }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiSparklingLine className="h-6 w-6 text-ceyfi-green" />
          CEYFI AI
        </h1>
        <p className="text-sm text-gray-500 mt-1">Bilingual financial assistant · EN / සිං</p>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => send(p)}
            className="rounded-full border border-ceyfi-border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-ceyfi-green hover:text-ceyfi-green transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-ceyfi-border bg-white p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cx(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "user"
                ? "bg-ceyfi-green text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm",
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="h-2 w-2 rounded-full bg-ceyfi-green animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about your finances..."
          className="flex-1 rounded-xl border border-ceyfi-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ceyfi-green/30 focus:border-ceyfi-green"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 rounded-xl bg-ceyfi-green px-4 py-3 text-sm font-medium text-white transition hover:bg-ceyfi-green/90 disabled:opacity-50"
        >
          <RiSendPlanLine className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

---

## 15. Page: Metrics (`app/(app)/metrics/page.tsx`)

**Charts used:** LineChartSupport (API latency trend), BarChart (requests per route), ProgressCircle (uptime)

```tsx
"use client"
import React from "react"
import useSWR from "swr"
import { ChartCard } from "@/components/ui/ChartCard"
import { KpiCard } from "@/components/ui/KpiCard"
import { LineChartSupport } from "@/components/charts/LineChartSupport"
import { BarChart } from "@/components/charts/BarChart"
import { ProgressCircle } from "@/components/charts/ProgressCircle"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function MetricsPage() {
  const { data } = useSWR("/api/metrics", fetcher, { refreshInterval: 30000 })
  const agents: any[] = data?.agents ?? []

  // Build latency sparklines from agent data
  const latencyData = agents.map((a: any) => ({
    agent: a.name ?? a.route,
    "Avg Latency (ms)": Math.round(a.avg_latency_ms ?? 0),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Metrics</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time API performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard title="API Status" value="Operational" change="All systems go" changeType="positive" />
        <KpiCard title="Avg Latency" value={`${Math.round(agents.reduce((a, b) => a + (b.avg_latency_ms ?? 0), 0) / Math.max(agents.length, 1))} ms`} change="p95" changeType="neutral" />
        <KpiCard title="Success Rate" value={`${(agents.length ? (agents.filter(a => a.success_rate >= 0.99).length / agents.length * 100) : 100).toFixed(0)}%`} change="Last hour" changeType="positive" />
        <KpiCard title="Active Routes" value={String(agents.length)} change="monitored" changeType="neutral" />
      </div>

      {agents.length > 0 && (
        <ChartCard title="Latency by Route" subtitle="Average response time (ms)">
          <BarChart
            data={latencyData}
            index="agent"
            categories={["Avg Latency (ms)"]}
            colors={["blue"]}
            layout="vertical"
            valueFormatter={(v) => `${v} ms`}
            yAxisWidth={160}
            className="h-72"
          />
        </ChartCard>
      )}
    </div>
  )
}
```

---

## 16. Mobile Bottom Navigation (full component)

```tsx
// components/MobileNav.tsx — import in AppLayout below <main>
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiDashboardLine, RiWalletLine, RiExchangeLine, RiLineChartLine, RiSparklingLine,
} from "@remixicon/react"
import { cx } from "@/lib/utils"

const MOB_NAV = [
  { href: "/",             label: "Home",     icon: RiDashboardLine },
  { href: "/wallet",       label: "Wallet",   icon: RiWalletLine },
  { href: "/transactions", label: "Txns",     icon: RiExchangeLine },
  { href: "/loans",        label: "Loans",    icon: RiLineChartLine },
  { href: "/assistant",    label: "AI",       icon: RiSparklingLine },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 flex rounded-2xl border border-ceyfi-border bg-white/95 p-1 shadow-xl backdrop-blur md:hidden">
      {MOB_NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} className={cx(
            "flex-1 flex flex-col items-center py-2 text-xs transition",
            active ? "text-ceyfi-green" : "text-gray-400 hover:text-gray-700",
          )}>
            <Icon className="h-5 w-5 mb-0.5" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
```

---

## 17. Demo Reset Page (`app/(app)/demo/page.tsx`)

Keep existing demo controls, reskin with CEYFI colours:
```tsx
"use client"
import { API_BASE } from "@/lib/api"
import { useState } from "react"

export default function DemoPage() {
  const [status, setStatus] = useState<string | null>(null)

  async function reset() {
    setStatus("Resetting…")
    const r = await fetch(`${API_BASE}/mock/reset`, { method: "POST" })
    const d = await r.json()
    setStatus(`Done — cleared ${d.transactions_cleared} transactions`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Demo Controls</h1>
      <div className="rounded-2xl border border-ceyfi-border bg-white p-6 space-y-4">
        <div className="text-sm text-gray-600">Reset all mock data for a clean demo run.</div>
        <button
          onClick={reset}
          className="rounded-xl bg-ceyfi-green px-5 py-2.5 text-sm font-medium text-white hover:bg-ceyfi-green/90 transition"
        >
          Reset Demo Data
        </button>
        {status && <div className="text-sm text-gray-500">{status}</div>}
      </div>
    </div>
  )
}
```

---

## 18. Vercel Deployment

Set on the `seylan-hub` Vercel frontend project:
```
NEXT_PUBLIC_API_BASE = https://ceyfi-backend-98470559362.asia-southeast1.run.app
```

Update `next.config.mjs` if needed:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // existing config …
  async rewrites() {
    return [] // remove any old Fly.io proxy rewrites
  },
}
export default nextConfig
```

---

## 19. Quick Reference: What Chart Goes Where

| Page | Chart | Props summary |
|------|-------|---------------|
| Overview | LineChart | Balance + Savings, 30 days, `colors={["blue","emerald"]}` |
| Overview | AreaChart | Income vs Expenses, fill="gradient", `type="default"` |
| Overview | CategoryBar | `values={[40,40,20]}` bucket pcts |
| Overview | ProgressCircle | `value={loanHealth}` variant="success" |
| Wallet | AreaChart | Current + Savings balance, 60 days, fill="gradient" |
| Wallet | LineChart | FX rates LKR/AUD, LKR/GBP, LKR/USD |
| Wallet | BarChart | Monthly remittances sent vs received |
| Transactions | BarChartVariant | Daily spend, xValueFormatter date |
| Transactions | BarChart | Top 5 categories, layout="vertical" |
| Transactions | ConditionalBarChart | Day-of-week heatmap, value 0–1 |
| Loans | ComboChart | EMI bars + Outstanding line, enableBiaxial=true |
| Loans | ConditionalBarChart | Payment consistency 0–1 per month |
| Loans | ProgressCircle | `value={repaidPct}` variant="success" |
| Business | AreaChart | Revenue vs Expenses stacked, fill="gradient" |
| Business | ComboChart | Revenue bars + Tax Savings line |
| Business | BarChart | Expense categories, layout="vertical" |
| Business | ConditionalBarChart | Monthly revenue heatmap |
| Metrics | BarChart | Latency per route, layout="vertical" |

---

## 20. File Structure Summary

```
frontend/
├── app/
│   ├── layout.tsx                    (root layout, Sora font)
│   ├── (app)/
│   │   ├── layout.tsx                (AppSidebar + AppTopbar + MobileNav)
│   │   ├── page.tsx                  ← Overview Dashboard
│   │   ├── wallet/page.tsx           ← Wallet & FX
│   │   ├── transactions/page.tsx     ← Transaction Analytics
│   │   ├── loans/page.tsx            ← Loan Dashboard
│   │   ├── business/page.tsx         ← SME Dashboard
│   │   ├── assistant/page.tsx        ← AI Chat
│   │   ├── metrics/page.tsx          ← System Metrics
│   │   └── demo/page.tsx             ← Demo Controls
│   └── api/ (keep existing Next.js API routes)
├── components/
│   ├── AppSidebar.tsx
│   ├── AppTopbar.tsx
│   ├── MobileNav.tsx
│   ├── charts/
│   │   ├── AreaChart.tsx             ← copy from insights-main
│   │   ├── BarChart.tsx              ← copy from insights-main
│   │   ├── BarChartVariant.tsx       ← copy from insights-main
│   │   ├── LineChart.tsx             ← copy from dashboard-main
│   │   ├── LineChartSupport.tsx      ← copy from overview-main (if necessary)
│   │   ├── ComboChart.tsx            ← copy from planner-main
│   │   ├── ConditionalBarChart.tsx   ← copy from planner-main
│   │   ├── CategoryBar.tsx           ← copy from overview-main
│   │   ├── ProgressCircle.tsx        ← copy from overview-main
│   │   └── CustomTooltips.tsx        ← copy from planner-main (use if necessary)
│   └── ui/
│       ├── KpiCard.tsx
│       ├── ChartCard.tsx
│       └── (keep all existing shadcn components)
└── lib/
    ├── api.ts           (update API_BASE fallback)
    ├── chartUtils.ts    ← copy from insights-main
    ├── useOnWindowResize.ts ← copy from insights-main
    ├── types.ts         (new — all shared types)
    └── utils.ts         (add formatters + cx)
```

---

*End of CEYFI Master Plan — hand to Cursor Composer 2.5 and let it rip.*
