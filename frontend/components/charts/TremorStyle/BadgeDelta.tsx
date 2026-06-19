"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeltaType =
  | "increase"
  | "moderateIncrease"
  | "decrease"
  | "moderateDecrease"
  | "unchanged";

interface BadgeDeltaProps {
  deltaType?: DeltaType;
  isIncreasePositive?: boolean;
  children?: React.ReactNode;
  className?: string;
  size?: "xs" | "sm";
}

function resolveTone(
  deltaType: DeltaType,
  isIncreasePositive: boolean
): "positive" | "negative" | "neutral" {
  if (deltaType === "unchanged") return "neutral";
  const isUp =
    deltaType === "increase" || deltaType === "moderateIncrease";
  const positive = isIncreasePositive ? isUp : !isUp;
  return positive ? "positive" : "negative";
}

export function BadgeDelta({
  deltaType = "unchanged",
  isIncreasePositive = true,
  children,
  className,
  size = "sm",
}: BadgeDeltaProps) {
  const tone = resolveTone(deltaType, isIncreasePositive);
  const Icon =
    deltaType === "unchanged"
      ? Minus
      : deltaType === "increase" || deltaType === "moderateIncrease"
        ? ArrowUpRight
        : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex w-max shrink-0 items-center gap-0.5 rounded-full font-medium tabular-nums",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        tone === "positive" &&
          "bg-[#059669]/15 text-[#059669] dark:bg-[#34D399]/20 dark:text-[#34D399]",
        tone === "negative" &&
          "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400",
        tone === "neutral" &&
          "bg-muted text-muted-foreground dark:bg-white/10 dark:text-white/50",
        className
      )}
    >
      <Icon className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {children}
    </span>
  );
}

/** Map a numeric percent change to Tremor delta type */
export function deltaTypeFromChange(pct: number): DeltaType {
  if (Math.abs(pct) < 0.5) return "unchanged";
  if (pct >= 5) return "increase";
  if (pct > 0) return "moderateIncrease";
  if (pct <= -5) return "decrease";
  return "moderateDecrease";
}
