"use client";

/**
 * Gradient hero with KPI stats strip adapted from shadcnblocks stats-card1 + hero12.
 * @see https://www.shadcnblocks.com/block/stats-card1
 * @see https://www.shadcnblocks.com/block/hero12
 */

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface BusinessStatItem {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
}

export interface BusinessHeroStatsProps {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  stats: BusinessStatItem[];
  className?: string;
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
}: BusinessStatItem) {
  const isPositive = change === undefined || change >= 0;
  const showTrend = change !== undefined;

  return (
    <Card className="h-full gap-0 border-white/10 bg-white/[0.06] py-0 ring-white/10 backdrop-blur-sm">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            {title}
          </CardTitle>
          {Icon ? (
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ceyfi-green/15 text-ceyfi-mint">
              <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            </span>
          ) : null}
        </div>

        <p className="mt-2 font-heading text-2xl font-semibold tabular-nums tracking-[-0.03em] text-white">
          {value}
        </p>

        <div className="mt-3 flex min-h-5 items-center text-xs leading-5">
          {showTrend ? (
            <div className="flex flex-wrap items-center gap-1">
              {isPositive ? (
                <TrendingUp className="size-3.5 shrink-0 text-ceyfi-mint" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5 shrink-0 text-red-400" aria-hidden />
              )}
              <span className={isPositive ? "text-ceyfi-mint" : "text-red-400"}>
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel ? (
                <span className="text-white/40">{changeLabel}</span>
              ) : null}
            </div>
          ) : changeLabel ? (
            <span className="text-white/40">{changeLabel}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessHeroStats({
  eyebrow,
  title,
  description,
  meta,
  stats,
  className,
}: BusinessHeroStatsProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] bg-ceyfi-deep p-5 text-white sm:p-7 lg:p-8",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.22),transparent_32rem)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-white/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border border-white/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex h-full items-center justify-center opacity-30"
        aria-hidden
      >
        <div className="h-full w-full max-w-3xl [mask-image:radial-gradient(70%_70%_at_center,white,transparent)] bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[24px_24px]" />
      </div>

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow ? (
              <Badge
                variant="outline"
                className="border-white/15 bg-white/5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-mint"
              >
                {eyebrow}
              </Badge>
            ) : null}
            <h1 className="mt-3 font-heading text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                {description}
              </p>
            ) : null}
            {meta ? <div className="mt-4">{meta}</div> : null}
          </div>
        </div>

        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
