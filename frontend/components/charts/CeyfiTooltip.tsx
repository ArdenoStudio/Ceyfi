"use client";

import type { TooltipContentProps } from "recharts";
import { formatters } from "@/lib/utils";
import { periodDelta } from "@/lib/chartUtils";

interface CeyfiTooltipProps {
  active?: boolean;
  payload?: TooltipContentProps<number, string>["payload"];
  label?: TooltipContentProps<number, string>["label"];
  showComparison?: boolean;
  valueFormatter?: (value: number) => string;
}

export function CeyfiTooltip({
  active,
  payload,
  label,
  showComparison = false,
  valueFormatter,
}: CeyfiTooltipProps) {
  if (!active || !payload?.length) return null;

  const formatValue = valueFormatter ?? ((value: number) =>
    formatters.currency({ number: value, maxFractionDigits: 0 }));

  const primaryValue = Number(payload[0]?.value ?? 0);
  const previousValue = Number(payload[0]?.payload?.previous ?? 0);
  const comparison =
    showComparison && previousValue > 0
      ? periodDelta(primaryValue, previousValue)
      : null;

  return (
    <div className="rounded-xl border border-ceyfi-line bg-white px-3.5 py-3 shadow-lg">
      <div className="text-xs font-medium text-ceyfi-muted">{label}</div>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry, index) => (
          <div
            key={String(entry.dataKey ?? entry.name ?? index)}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? "#059669" }}
              />
              <span className="text-xs text-ceyfi-ink">{entry.name}</span>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-ceyfi-ink">
              {formatValue(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
      {comparison ? (
        <div className="mt-2.5 flex items-center justify-between border-t border-ceyfi-line/60 pt-2.5">
          <span className="text-[10px] text-ceyfi-faint">vs previous</span>
          <span
            className={
              comparison.positive
                ? "text-[10px] font-semibold text-emerald-700"
                : "text-[10px] font-semibold text-rose-700"
            }
          >
            {comparison.label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
