"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { formatLKR } from "@/lib/utils";
import { getPlSummary } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PlData {
  expense_breakdown: Record<string, number>;
  previous_expense_breakdown?: Record<string, number>;
}

interface ExpenseBreakdownProps {
  userId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  INVENTORY: "#059669",
  UTILITIES: "#D97706",
  WAGES: "#2563EB",
  TRANSPORT: "#34D399",
  MISC: "#94A3B8",
};

const DEFAULT_COLOR = "#D8E8DC";

interface TooltipPayloadEntry {
  value: number;
  name: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#06231a] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold capitalize text-white">
        {payload[0].name.toLowerCase()}
      </p>
      <p className="text-ceyfi-mint">{formatLKR(payload[0].value)}</p>
    </div>
  );
}

export function ExpenseBreakdown({ userId }: ExpenseBreakdownProps) {
  const [breakdown, setBreakdown] = useState<Record<string, number> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getPlSummary(userId)
      .then((res) => {
        const data = res as PlData;
        setBreakdown(data.expense_breakdown);
      })
      .catch((err) => {
        setBreakdown(null);
        setError(
          err instanceof Error ? err.message : "Failed to load expenses"
        );
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    getPlSummary(userId)
      .then((res) => {
        if (cancelled) return;
        const data = res as PlData;
        setBreakdown(data.expense_breakdown);
      })
      .catch((err) => {
        if (!cancelled) {
          setBreakdown(null);
          setError(
            err instanceof Error ? err.message : "Failed to load expenses"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (error && !breakdown) return <ErrorState message={error} onRetry={load} />;
  if (!breakdown) return null;

  const chartData = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount }));

  return (
    <Card className="card-glass shadow-brand border-0">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
          Spend categories
        </p>
        <h3 className="mb-4 font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
          Expense Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            barCategoryGap="30%"
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <XAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)", textAnchor: "middle" }}
              tickFormatter={(v: string) =>
                v.charAt(0) + v.slice(1).toLowerCase()
              }
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} name="category">
              {chartData.map(({ category }) => (
                <Cell
                  key={category}
                  fill={CATEGORY_COLORS[category] ?? DEFAULT_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
