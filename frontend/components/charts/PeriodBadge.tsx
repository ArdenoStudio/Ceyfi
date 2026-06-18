"use client";

import { cn } from "@/lib/utils";

interface PeriodBadgeProps {
  value: number;
  positive: boolean;
  label?: string;
  className?: string;
}

export function PeriodBadge({
  value,
  positive,
  label,
  className,
}: PeriodBadgeProps) {
  const display = label ?? `${positive ? "+" : "−"}${value.toFixed(1)}%`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
        className
      )}
    >
      {positive ? "▲" : "▼"} {display}
    </span>
  );
}
