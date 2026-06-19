"use client";

import { cn, formatters } from "@/lib/utils";
import { CHART_BRAND, seriesColor } from "@/lib/chartUtils";

export interface BarListItem {
  name: string;
  value: number;
  color?: string;
  href?: string;
}

interface BarListProps {
  data: BarListItem[];
  valueFormatter?: (value: number) => string;
  className?: string;
  showAnimation?: boolean;
}

export function BarList({
  data,
  valueFormatter = (v) =>
    formatters.currency({ number: v, maxFractionDigits: 0 }),
  className,
  showAnimation = true,
}: BarListProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const color = item.color ?? seriesColor(index);
        const pct = (item.value / max) * 100;

        const row = (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-ceyfi-ink dark:text-white">
                {item.name}
              </span>
              <span className="font-mono font-semibold tabular-nums text-ceyfi-muted">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ceyfi-sprout dark:bg-white/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full will-change-transform",
                  showAnimation &&
                    "transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                )}
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );

        if (item.href) {
          return (
            <a
              key={item.name}
              href={item.href}
              className="block rounded-lg transition hover:opacity-90"
            >
              {row}
            </a>
          );
        }

        return row;
      })}
      <div
        className="mt-1 h-px w-full"
        style={{ backgroundColor: CHART_BRAND.grid }}
        aria-hidden
      />
    </div>
  );
}
