"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTrend = "up" | "down" | "neutral";

const trendStyles: Record<
  StatTrend,
  { text: string; icon: typeof ArrowUpRight }
> = {
  up: { text: "text-emerald-600 dark:text-emerald-400", icon: ArrowUpRight },
  down: { text: "text-red-600 dark:text-red-400", icon: ArrowDownRight },
  neutral: { text: "text-ceyfi-muted dark:text-white/50", icon: Minus },
};

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: StatTrend;
  trendValue?: string;
  trendLabel?: string;
  iconTone?: "green" | "blue" | "amber" | "violet";
  className?: string;
}

const iconToneStyles = {
  green: "bg-ceyfi-sprout text-ceyfi-green dark:bg-emerald-900/40 dark:text-ceyfi-mint",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
};

/** HyperUI stats/6 — title, value, icon, themed growth stat. */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  iconTone = "green",
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendStyles[trend].icon : null;

  return (
    <article
      className={cn(
        "rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-paper p-5 transition-all duration-200 hover:border-ceyfi-green/25 hover:shadow-[0_4px_24px_rgba(5,150,105,0.07)] dark:border-white/10 dark:bg-white/[0.04]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ceyfi-muted dark:text-white/50">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums tracking-[-0.03em] text-ceyfi-ink dark:text-white">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full",
            iconToneStyles[iconTone]
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>

      {trend && trendValue ? (
        <div className={cn("mt-3 flex items-center gap-1.5", trendStyles[trend].text)}>
          {TrendIcon ? <TrendIcon className="size-3.5" aria-hidden /> : null}
          <p className="flex flex-wrap gap-x-2 text-xs">
            <span className="font-semibold">{trendValue}</span>
            {trendLabel ? (
              <span className="text-ceyfi-muted dark:text-white/45">{trendLabel}</span>
            ) : null}
          </p>
        </div>
      ) : null}
    </article>
  );
}
