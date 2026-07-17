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
import { useChartTheme } from "@/hooks/useChartTheme";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Loan } from "@/types";

function buildComboData(emi: number, principal: number, rate: number, months: number) {
  let outstanding = principal;
  return Array.from({ length: months }, (_, i) => {
    const interest = outstanding * rate;
    const principalPaid = emi - interest;
    outstanding = Math.max(0, outstanding - principalPaid);
    return {
      month: `M${i + 1}`,
      emiPaid: emi,
      outstanding: Math.round(outstanding),
    };
  });
}

function buildWaterfallData(emi: number, principal: number, rate: number) {
  const years = [1, 2, 3];
  let outstanding = principal;
  return years.map((year) => {
    let totalPrincipal = 0;
    let totalInterest = 0;
    for (let m = 0; m < 12; m++) {
      if (outstanding <= 0) break;
      const interest = outstanding * rate;
      const principalPaid = Math.min(emi - interest, outstanding);
      totalPrincipal += principalPaid;
      totalInterest += interest;
      outstanding -= principalPaid;
    }
    return {
      year: `Year ${year}`,
      principal: Math.round(totalPrincipal),
      interest: Math.round(totalInterest),
    };
  });
}

function interestSaved(lumpSum: number, emi: number, rate: number) {
  const monthsSaved = Math.floor(lumpSum / emi);
  return Math.round(monthsSaved * emi * rate * 6);
}

const STATUS_STYLES = {
  paid: { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50", icon: CheckCircle2, color: "text-emerald-700 dark:text-emerald-400" },
  late: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/50", icon: Clock, color: "text-amber-700 dark:text-amber-400" },
  missed: { bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/50", icon: XCircle, color: "text-rose-700 dark:text-rose-400" },
  future: { bg: "bg-stone-50 border-stone-200 dark:bg-white/5 dark:border-white/10", icon: Clock, color: "text-stone-400 dark:text-white/40" },
};

type CalStatus = keyof typeof STATUS_STYLES;

export function LoanIntelligenceCharts({ loan }: { loan: Loan }) {
  const { colors } = useChartTheme();
  const [lumpSum, setLumpSum] = useState(50000);

  // Derive everything from the loan actually on screen so the charts match the header.
  const EMI = loan.monthly_payment_lkr;
  const PRINCIPAL = loan.outstanding_lkr;
  const RATE = (loan.interest_rate_pct || 14) / 100 / 12;
  const MONTHS = Math.max(6, Math.min(loan.total_payments || 36, Math.ceil(PRINCIPAL / EMI) + 2));

  const comboData = useMemo(() => buildComboData(EMI, PRINCIPAL, RATE, MONTHS), [EMI, PRINCIPAL, RATE, MONTHS]);
  const waterfallData = useMemo(() => buildWaterfallData(EMI, PRINCIPAL, RATE), [EMI, PRINCIPAL, RATE]);

  const monthsSaved = Math.floor(lumpSum / EMI);
  const saved = interestSaved(lumpSum, EMI, RATE);
  const endDate = new Date(2028, 5, 25);
  endDate.setMonth(endDate.getMonth() - monthsSaved);

  // Illustrative recent calendar; amounts tie to this loan's EMI and the
  // paid/late pattern reflects the health signal.
  const atRisk = loan.health_score !== "ON_TRACK";
  const paymentCalendar: { month: string; status: CalStatus; amount: number }[] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  ].map((m, i) => ({
    month: `${m} 2026`,
    status: i === 5 ? "future" : atRisk && (i === 2 || i === 4) ? "late" : "paid",
    amount: EMI,
  }));

  const outstandingLabel = `LKR ${PRINCIPAL.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <ChartCard title="EMI payments vs outstanding balance" subtitle={`${loan.total_payments}-month loan · ${outstandingLabel} outstanding`}>
        <ChartContainer height={260}>
          <ComposedChart data={comboData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 8, fill: colors.axis }} axisLine={false} tickLine={false} interval={5} />
            <YAxis yAxisId="left" tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: colors.axis }} axisLine={false} tickLine={false} width={44} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: colors.axis }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Bar yAxisId="left" dataKey="emiPaid" fill="#059669" radius={[3, 3, 0, 0]} name="EMI paid" />
            <Line yAxisId="right" type="monotone" dataKey="outstanding" stroke="#E11D48" strokeWidth={2} dot={false} name="Outstanding" />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Principal vs interest breakdown" subtitle="How repayment composition shifts over time">
        <ChartContainer height={220}>
          <BarChart data={waterfallData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: colors.axis }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: colors.axis }} axisLine={false} tickLine={false} width={44} />
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
              <span className="text-ceyfi-muted dark:text-white/50">Lump-sum payment</span>
              <span className="font-mono font-semibold text-ceyfi-ink dark:text-white">
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
              <div key={kpi.label} className="rounded-xl border border-ceyfi-line/70 bg-ceyfi-canvas p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ceyfi-muted dark:text-white/50">{kpi.label}</div>
                <div className="mt-2 font-heading text-xl font-semibold text-ceyfi-ink dark:text-white">{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Payment calendar" subtitle="Last 6 months">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {paymentCalendar.map((item) => {
            const style = STATUS_STYLES[item.status];
            const Icon = style.icon;
            return (
              <div key={item.month} className={`rounded-xl border p-3 ${style.bg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-ceyfi-ink dark:text-white">{item.month}</span>
                  <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                </div>
                <div className="mt-2 font-mono text-xs font-semibold text-ceyfi-muted dark:text-white/50">
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
