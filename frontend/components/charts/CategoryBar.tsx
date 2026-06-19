"use client";

import { cn } from "@/lib/utils";
import { seriesColor } from "@/lib/chartUtils";

export interface CategoryBarItem {
  label: string;
  value: number;
  color?: string;
}

interface CategoryBarProps {
  items: CategoryBarItem[];
  className?: string;
  height?: number;
  showLabels?: boolean;
}

export function CategoryBar({
  items,
  className,
  height = 12,
  showLabels = true,
}: CategoryBarProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="flex overflow-hidden rounded-full bg-ceyfi-sprout dark:bg-white/[0.06]"
        style={{ height }}
        role="img"
        aria-label="Category breakdown"
      >
        {items.map((item, index) => (
          <span
            key={item.label}
            className="h-full first:rounded-l-full last:rounded-r-full will-change-transform transition-[width] duration-700 ease-out"
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: item.color ?? seriesColor(index),
            }}
            title={`${item.label}: ${Math.round((item.value / total) * 100)}%`}
          />
        ))}
      </div>
      {showLabels ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: item.color ?? seriesColor(index),
                }}
              />
              <span className="text-xs text-ceyfi-ink dark:text-white">
                {item.label}
              </span>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-ceyfi-faint">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
