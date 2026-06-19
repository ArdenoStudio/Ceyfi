"use client";

import { useMemo } from "react";
import { AreaChart } from "@/components/charts/AreaChart";
import { ChartCard } from "@/components/ui/ChartCard";
import { CHART_BRAND } from "@/lib/chartUtils";
import { formatters } from "@/lib/utils";

function buildWalletBalanceHistory(currentBalance: number) {
  const start = new Date();
  start.setDate(start.getDate() - 29);
  let balance = Math.round(currentBalance * 0.88);

  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    balance += Math.round(Math.sin(i / 5) * 1800 + 900);
    if (i === 29) balance = currentBalance;

    return {
      date: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      balance: Math.max(0, balance),
    };
  });
}

export function WalletBalanceHistory({
  currentBalance,
}: {
  currentBalance: number;
}) {
  const data = useMemo(
    () => buildWalletBalanceHistory(currentBalance),
    [currentBalance]
  );

  return (
    <ChartCard
      title="Balance history"
      subtitle="Family wallet total · last 30 days"
    >
      <AreaChart
        data={data}
        index="date"
        categories={["balance"]}
        colors={[CHART_BRAND.primary]}
        series={[{ key: "balance", name: "Total balance", color: CHART_BRAND.primary }]}
        height={220}
        valueFormatter={(value) =>
          formatters.currency({ number: value, maxFractionDigits: 0 })
        }
      />
    </ChartCard>
  );
}
