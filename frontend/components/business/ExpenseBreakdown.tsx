"use client";

import { useCallback, useEffect, useState } from "react";
import { BarList } from "@/components/charts/BarList";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { formatLKR } from "@/lib/utils";
import { getPlSummary } from "@/lib/api";
import { seriesColor } from "@/lib/chartUtils";

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

  const barListData = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount], index) => ({
      name: category.charAt(0) + category.slice(1).toLowerCase(),
      value: amount,
      color: CATEGORY_COLORS[category] ?? seriesColor(index),
    }));

  return (
    <Card className="card-glass shadow-brand border-0">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
          Spend categories
        </p>
        <h3 className="mb-4 font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
          Expense Breakdown
        </h3>
        <BarList
          data={barListData}
          valueFormatter={(value) => formatLKR(value)}
        />
      </CardContent>
    </Card>
  );
}
