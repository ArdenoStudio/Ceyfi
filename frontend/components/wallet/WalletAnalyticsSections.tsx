"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { MoneyFlowDiagram } from "@/components/wallet/MoneyFlowDiagram";
import { CHART_COLORS } from "@/lib/chartUtils";
import { lkrAxisTick } from "@/lib/chartUtils";

function buildBalanceHistory() {
  const start = new Date();
  start.setDate(start.getDate() - 89);
  let total = 218000;
  let savings = 98000;
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    total += Math.round(Math.sin(i / 8) * 1200 + 400);
    savings += Math.round(Math.sin(i / 12) * 600 + 200);
    return {
      date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      total: Math.round(total),
      savings: Math.round(savings),
    };
  });
}

function buildFxHistory() {
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      aed: 78.2 + Math.sin(i / 5) * 0.8,
      aud: 198.5 + Math.sin(i / 4) * 1.2,
      gbp: 408.3 + Math.sin(i / 6) * 2.1,
    };
  });
}

export function WalletAnalyticsSections() {
  const balanceData = useMemo(() => buildBalanceHistory(), []);
  const fxData = useMemo(() => buildFxHistory(), []);

  return (
    <div className="space-y-6">
      <ChartCard title="Where your money flows" subtitle="Salary, freelance, and remittance paths">
        <MoneyFlowDiagram />
      </ChartCard>

      <ChartCard title="Wallet balance · last 90 days" subtitle="Total and savings component">
        <ChartContainer height={260}>
          <AreaChart data={balanceData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.mint} stopOpacity={0.25} />
                <stop offset="100%" stopColor={CHART_COLORS.mint} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#8C9A91" }} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Area type="monotone" dataKey="total" stroke={CHART_COLORS.green} fill="url(#totalGrad)" name="Total balance" />
            <Area type="monotone" dataKey="savings" stroke={CHART_COLORS.mint} fill="url(#savingsGrad)" name="Savings" />
          </AreaChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Exchange rate history" subtitle="Click best day to remit · last 30 days">
        <ChartContainer height={240}>
          <LineChart data={fxData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#8C9A91" }} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={44} domain={["auto", "auto"]} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} valueFormatter={(v) => v.toFixed(2)} />} />
            <Line type="monotone" dataKey="aed" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} name="LKR/AED" />
            <Line type="monotone" dataKey="aud" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} name="LKR/AUD" />
            <Line type="monotone" dataKey="gbp" stroke={CHART_COLORS.violet} strokeWidth={2} dot={{ r: 3 }} name="LKR/GBP" />
          </LineChart>
        </ChartContainer>
      </ChartCard>
    </div>
  );
}
