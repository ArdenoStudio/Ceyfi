"use client";

import { useMemo, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { formatters } from "@/lib/utils";
import { lkrAxisTick } from "@/lib/chartUtils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const EMI = 22000;
const PRINCIPAL = 600000;
const RATE = 0.14 / 12;

function buildComboData() {
  let outstanding = PRINCIPAL;
  return Array.from({ length: 36 }, (_, i) => {
    const interest = outstanding * RATE;
    const principal = EMI - interest;
    outstanding = Math.max(0, outstanding - principal);
    return {
      month: `M${i + 1}`,
      emiPaid: EMI,
      outstanding: Math.round(outstanding),
    };
  });
}

function buildWaterfallData() {
  const years = [1, 2, 3];
  return years.map((year) => {
    let outstanding = PRINCIPAL;
    let totalPrincipal = 0;
    let totalInterest = 0;
    for (let m = 0; m < 12; m++) {
      const interest = outstanding * RATE;
      const principal = EMI - interest;
      totalPrincipal += principal;
      totalInterest += interest;
      outstanding -= principal;
    }
    return {
      year: `Year ${year}`,
      principal: Math.round(totalPrincipal),
      interest: Math.round(totalInterest),
    };
  });
}

function interestSaved(lumpSum: number) {
  const monthsSaved = Math.floor(lumpSum / EMI);
  return Math.round(monthsSaved * EMI * RATE * 6);
}

const PAYMENT_CALENDAR = [
  { month: "Jul 2025", status: "paid" as const, amount: EMI },
  { month: "Aug 2025", status: "paid" as const, amount: EMI },
  { month: "Sep 2025", status: "late" as const, amount: EMI },
  { month: "Oct 2025", status: "paid" as const, amount: EMI },
  { month: "Nov 2025", status: "paid" as const, amount: EMI },
  { month: "Dec 2025", status: "paid" as const, amount: EMI },
  { month: "Jan 2026", status: "paid" as const, amount: EMI },
  { month: "Feb 2026", status: "missed" as const, amount: EMI },
  { month: "Mar 2026", status: "paid" as const, amount: EMI },
  { month: "Apr 2026", status: "paid" as const, amount: EMI },
  { month: "May 2026", status: "late" as const, amount: EMI },
  { month: "Jun 2026", status: "future" as const, amount: EMI },
];

const STATUS_STYLES = {
  paid: { bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, color: "text-emerald-700" },
  late: { bg: "bg-amber-50 border-amber-200", icon: Clock, color: "text-amber-700" },
  missed: { bg: "bg-rose-50 border-rose-200", icon: XCircle, color: "text-rose-700" },
  future: { bg: "bg-stone-50 border-stone-200", icon: Clock, color: "text-stone-400" },
};

export function LoanIntelligenceCharts() {
  const [lumpSum, setLumpSum] = useState(50000);
  const comboData = useMemo(() => buildComboData(), []);
  const waterfallData = useMemo(() => buildWaterfallData(), []);

  const monthsSaved = Math.floor(lumpSum / EMI);
  const saved = interestSaved(lumpSum);
  const endDate = new Date(2028, 5, 25);
  endDate.setMonth(endDate.getMonth() - monthsSaved);

  return (
    <div className="space-y-6">
      <ChartCard title="EMI payments vs outstanding balance" subtitle="36-month personal loan · LKR 600,000">
        <ChartContainer height={260}>
          <ComposedChart data={comboData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#8C9A91" }} axisLine={false} tickLine={false} interval={5} />
            <YAxis yAxisId="left" tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={44} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Bar yAxisId="left" dataKey="emiPaid" fill="#059669" radius={[3, 3, 0, 0]} name="EMI paid" />
            <Line yAxisId="right" type="monotone" dataKey="outstanding" stroke="#E11D48" strokeWidth={2} dot={false} name="Outstanding" />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Principal vs interest breakdown" subtitle="How repayment composition shifts over time">
        <ChartContainer height={220}>
          <BarChart data={waterfallData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Bar dataKey="principal" stackId="a" fill="#059669" name="Principal" radius={[0, 0, 0, 0]} />
            <Bar dataKey="interest" stackId="a" fill="#D97706" name="Interest" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="What if I pay extra?" subtitle="Early settlement simulator">
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-ceyfi-muted">Lump-sum payment</span>
              <span className="font-mono font-semibold text-ceyfi-ink">
                {formatters.currency({ number: lumpSum, maxFractionDigits: 0 })}
              </span>
            </div>
            <Slider value={[lumpSum]} min={0} max={400000} step={5000} onValueChange={(v) => setLumpSum(Array.isArray(v) ? (v[0] ?? 0) : v)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Months saved", value: `${monthsSaved}` },
              { label: "Interest saved", value: formatters.currency({ number: saved, maxFractionDigits: 0 }) },
              { label: "New end date", value: endDate.toLocaleDateString("en", { month: "short", year: "numeric" }) },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-ceyfi-line/70 bg-ceyfi-canvas p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ceyfi-muted">{kpi.label}</div>
                <div className="mt-2 font-heading text-xl font-semibold text-ceyfi-ink">{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Payment calendar" subtitle="Last 12 months">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {PAYMENT_CALENDAR.map((item) => {
            const style = STATUS_STYLES[item.status];
            const Icon = style.icon;
            return (
              <div key={item.month} className={`rounded-xl border p-3 ${style.bg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-ceyfi-ink">{item.month}</span>
                  <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                </div>
                <div className="mt-2 font-mono text-xs font-semibold text-ceyfi-muted">
                  {formatters.currency({ number: item.amount, maxFractionDigits: 0 })}
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}
