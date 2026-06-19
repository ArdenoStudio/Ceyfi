"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { formatLKR } from "@/lib/utils";
import { getPlSummary } from "@/lib/api";
import { PlSummary } from "@/types";

interface PlSummaryCardProps {
  userId: string;
}

export function PlSummaryCard({ userId }: PlSummaryCardProps) {
  const [data, setData] = useState<PlSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getPlSummary(userId)
      .then((res) => setData(res as PlSummary))
      .catch((err) => {
        setData(null);
        setError(err instanceof Error ? err.message : "Failed to load P&L");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    getPlSummary(userId)
      .then((res) => {
        if (!cancelled) setData(res as PlSummary);
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Failed to load P&L");
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
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const marginDiff = data.margin_pct - data.previous_margin_pct;
  const isUp = marginDiff >= 0;
  const isProfitable = data.net_lkr >= 0;

  return (
    <Card className="card-glass shadow-brand-lg border-0">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
              Profit & loss
            </p>
            <h3 className="font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
              This week
            </h3>
          </div>
          <div className="rounded-full bg-ceyfi-sprout dark:bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground dark:text-white/40">
            {data.week_label}
          </div>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-ceyfi-sprout/70 p-4 dark:bg-white/[0.06]">
            <div className="text-xs text-muted-foreground dark:text-white/40">Revenue</div>
            <div className="pl-profit text-xl font-semibold">
              {formatLKR(data.revenue_lkr)}
            </div>
          </div>
          <div className="rounded-2xl pl-card-loss p-4">
            <div className="text-xs text-muted-foreground dark:text-white/40">Expenses</div>
            <div className="pl-loss text-xl font-semibold">
              {formatLKR(data.expenses_lkr)}
            </div>
          </div>
          <div className={isProfitable ? "rounded-2xl pl-card-profit p-4" : "rounded-2xl pl-card-loss p-4"}>
            <div className="text-xs text-muted-foreground dark:text-white/40">Net</div>
            <div className={`text-xl font-semibold ${isProfitable ? "pl-profit" : "pl-loss"}`}>
              {formatLKR(data.net_lkr)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-semibold ${isProfitable ? "pl-profit" : "pl-loss"}`}>
            {data.margin_pct}%
          </span>
          <span className={`text-sm ${isUp ? "pl-profit" : "pl-loss"}`}>
            {isUp ? "↑" : "↓"} {Math.abs(marginDiff).toFixed(1)}pp
          </span>
        </div>
        <div className="text-xs text-muted-foreground dark:text-white/40 mt-1">
          Last week: {data.previous_margin_pct}%
        </div>
        {(() => {
          const points = [22, 28.5, 25, 31, data.margin_pct];
          const min = Math.min(...points);
          const max = Math.max(...points);
          const range = max - min || 1;
          const w = 80,
            h = 24,
            pad = 2;
          const coords = points
            .map((v, i) => {
              const x = pad + (i / (points.length - 1)) * (w - pad * 2);
              const y =
                h - pad - ((v - min) / range) * (h - pad * 2);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <svg width={w} height={h} className="mt-2 overflow-visible">
              <polyline
                points={coords}
                fill="none"
                stroke="#059669"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        })()}
      </CardContent>
    </Card>
  );
}
