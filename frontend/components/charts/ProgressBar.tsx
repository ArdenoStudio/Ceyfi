"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  barClassName?: string;
  animated?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "#059669",
  className,
  barClassName,
  animated = true,
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between text-[10px] text-ceyfi-muted">
          <span>{label}</span>
          <span className="tabular-nums font-semibold">{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-ceyfi-sprout dark:bg-white/[0.08]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full will-change-transform",
            animated && "transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            barClassName
          )}
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
