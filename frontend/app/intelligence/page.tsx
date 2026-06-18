"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { PeriodBadge } from "@/components/charts/PeriodBadge";
import { ProgressCircle } from "@/components/charts/OverviewCharts";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CHART_COLORS } from "@/lib/chartUtils";
import { formatters } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COMPONENTS = [
  { name: "Spending Discipline", score: 78, insight: "Spending grew 6% this month vs your 5% budget", actions: ["Set a weekly grocery cap of LKR 4,500", "Enable bill-pay alerts 3 days before due"] },
  { name: "Savings Rate", score: 85, insight: "Saving 14.2% of income, target is 15%", actions: ["Auto-transfer LKR 2,800 on salary day", "Round-up spare change to savings bucket"] },
  { name: "Debt Service Ratio", score: 72, insight: "EMI is 12% of income, healthy range is under 15%", actions: ["Review refinancing options", "Consider a 5-day EMI date shift"] },
  { name: "Bill Reliability", score: 95, insight: "11/12 bills paid on time this year", actions: ["Enable auto-pay for Dialog and CEB"] },
  { name: "Liquidity", score: 68, insight: "Emergency fund covers 2.1 months, target is 3+", actions: ["Move LKR 18,000 from everyday to savings", "Pause non-essential subscriptions"] },
];

const ANOMALIES = [
  { id: "a1", title: "Electricity bill 40% above average", description: "LKR 4,200 vs usual LKR 3,000", date: "Jun 10", resolved: false },
  { id: "a2", title: "Keells spend 3× normal", description: "LKR 18,000 last week vs usual LKR 6,000", date: "May 31", resolved: false },
  { id: "a3", title: "No income detected in 12 days", description: "Salary usually arrives by the 2nd", date: "Jun 14", resolved: true },
];

const FORECAST_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  actual: 240000 + Math.sin(i / 4) * 8000 + i * 200,
  predicted: 238000 + Math.sin(i / 4) * 7500 + i * 180,
}));

const OPPORTUNITIES = [
  { icon: TrendingUp, title: "Refinance personal loan", benefit: 42000, confidence: 82 },
  { icon: Lightbulb, title: "Move salary-day surplus to savings", benefit: 8400, confidence: 91 },
  { icon: Sparkles, title: "Time remittance on best FX day", benefit: 3200, confidence: 76 },
  { icon: AlertTriangle, title: "Cancel unused subscriptions", benefit: 2100, confidence: 88 },
  { icon: CheckCircle2, title: "Consolidate Dialog + CEB auto-pay", benefit: 0, confidence: 70 },
];

export default function IntelligencePage() {
  const [improveTarget, setImproveTarget] = useState<typeof COMPONENTS[0] | null>(null);
  const totalScore = Math.round(
    COMPONENTS.reduce((s, c) => s + c.score, 0) / COMPONENTS.length
  );
  const scoreColor =
    totalScore >= 80 ? "text-emerald-700" : totalScore >= 60 ? "text-amber-700" : "text-rose-700";

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10">
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
          Financial intelligence
        </div>
        <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.035em] text-ceyfi-ink">
          Explainable financial health
        </h1>
        <p className="mt-2 text-sm text-ceyfi-muted">
          Score breakdown, anomaly feed, forecast accuracy, and ranked opportunities.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col items-center justify-center rounded-[22px] border border-ceyfi-line/75 bg-ceyfi-paper p-8">
          <ProgressCircle value={totalScore} size={160} strokeWidth={12}>
            <div className="text-center">
              <div className={cn("font-heading text-5xl font-semibold tracking-[-0.05em]", scoreColor)}>
                {totalScore}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ceyfi-faint">Health score</div>
            </div>
          </ProgressCircle>
        </div>

        <ChartCard title="Score components" subtitle="Weighted breakdown with improve actions">
          <ChartContainer height={240}>
            <BarChart layout="vertical" data={COMPONENTS} margin={{ top: 4, right: 80, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#D8E8DC" strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#617267" }} width={110} axisLine={false} tickLine={false} />
              <Tooltip content={(p) => <CeyfiTooltip {...p} valueFormatter={(v) => `${v}/100`} />} />
              <Bar dataKey="score" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} name="Score" />
            </BarChart>
          </ChartContainer>
          <div className="mt-4 space-y-2">
            {COMPONENTS.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg bg-ceyfi-canvas px-3 py-2 text-xs">
                <div>
                  <span className="font-medium text-ceyfi-ink">{c.name}</span>
                  <span className="ml-2 text-ceyfi-muted">— {c.insight}</span>
                </div>
                <Button variant="outline" size="sm" className="text-[10px]" onClick={() => setImproveTarget(c)}>
                  Improve
                </Button>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <ChartCard title="Anomaly feed" subtitle="AI-detected financial events">
        <div className="space-y-3">
          {ANOMALIES.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-ceyfi-line/60 p-4">
              <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", a.resolved ? "bg-emerald-500" : "animate-pulse bg-amber-500")} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ceyfi-ink">{a.title}</div>
                <div className="mt-1 text-xs text-ceyfi-muted">{a.description}</div>
                <div className="mt-1 text-[10px] text-ceyfi-faint">{a.date}</div>
              </div>
              <Link href={`/assistant?prompt=${encodeURIComponent(a.title)}`} className="shrink-0 text-[11px] font-semibold text-ceyfi-green hover:text-ceyfi-deep">
                Ask CEYFI
              </Link>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard
        title="How accurate were last month's projections?"
        subtitle="Actual vs CEYFI forecast from day −7"
        action={<PeriodBadge value={8.3} positive={false} label="±8.3% avg error" />}
      >
        <ChartContainer height={240}>
          <ComposedChart data={FORECAST_DATA} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#8C9A91" }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Bar dataKey="actual" fill={CHART_COLORS.green} name="Actual" radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="predicted" stroke={CHART_COLORS.violet} strokeWidth={2} dot={false} name="Predicted" />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Financial opportunities" subtitle="Ranked by potential benefit">
        <div className="space-y-3">
          {OPPORTUNITIES.map((o, i) => (
            <div key={o.title} className="flex items-center gap-4 rounded-xl border border-ceyfi-line/60 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-ceyfi-sprout text-ceyfi-green">
                <o.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ceyfi-ink">{i + 1}. {o.title}</div>
                {o.benefit > 0 && (
                  <div className="mt-1 font-mono text-sm font-semibold text-emerald-700">
                    +{formatters.currency({ number: o.benefit, maxFractionDigits: 0 })}
                  </div>
                )}
              </div>
              <PeriodBadge value={o.confidence} positive label={`${o.confidence}%`} />
              <Link href="/scenarios" className="inline-flex items-center gap-1 text-[11px] font-semibold text-ceyfi-green">
                Simulate <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </ChartCard>

      <Sheet open={!!improveTarget} onOpenChange={(o) => !o && setImproveTarget(null)}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Improve {improveTarget?.name}</SheetTitle>
          </SheetHeader>
          <ul className="mt-4 space-y-3 px-4">
            {improveTarget?.actions.map((action) => (
              <li key={action} className="flex items-start gap-2 text-sm text-ceyfi-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ceyfi-green" />
                {action}
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
