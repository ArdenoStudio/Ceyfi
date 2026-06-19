"use client";

import { cn } from "@/lib/utils";
import { BadgeDelta, deltaTypeFromChange, type DeltaType } from "./BadgeDelta";

export interface MetricProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  deltaType?: DeltaType;
  isIncreasePositive?: boolean;
  className?: string;
  valueClassName?: string;
}

export function Metric({
  label,
  value,
  delta,
  deltaLabel,
  deltaType,
  isIncreasePositive = true,
  className,
  valueClassName,
}: MetricProps) {
  const resolvedDeltaType =
    deltaType ?? (delta !== undefined ? deltaTypeFromChange(delta) : undefined);
  const showDelta = Boolean(resolvedDeltaType || deltaLabel);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ceyfi-muted dark:text-white/50">
          {label}
        </p>
        {showDelta ? (
          <BadgeDelta
            deltaType={resolvedDeltaType ?? "unchanged"}
            isIncreasePositive={isIncreasePositive}
            size="xs"
          >
            {deltaLabel ??
              (delta !== undefined
                ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`
                : null)}
          </BadgeDelta>
        ) : null}
      </div>
      <p
        className={cn(
          "font-heading text-2xl font-semibold tabular-nums tracking-tight text-ceyfi-ink dark:text-white",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
}
