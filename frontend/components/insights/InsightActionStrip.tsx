"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type InsightTone = "alert" | "success" | "info" | "neutral";

interface InsightItem {
  label: string;
  value: string;
  detail: string;
  tone?: InsightTone;
  icon: LucideIcon;
}

interface InsightAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
}

interface InsightActionStripProps {
  eyebrow: string;
  title: string;
  insights: InsightItem[];
  actions?: InsightAction[];
}

const toneConfig: Record<
  InsightTone,
  { card: string; icon: string; iconBg: string; pulse?: boolean }
> = {
  alert: {
    card: "border-red-200/70 bg-gradient-to-br from-red-50 to-rose-50/60 text-red-700 dark:border-red-400/25 dark:from-red-900/35 dark:to-red-950/20 dark:text-red-300",
    icon: "text-red-600 dark:text-red-300",
    iconBg: "bg-red-100 dark:bg-red-800/40",
    pulse: true,
  },
  success: {
    card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50/60 text-emerald-700 dark:border-emerald-400/25 dark:from-emerald-900/35 dark:to-emerald-950/20 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-800/40",
  },
  info: {
    card: "border-blue-200/70 bg-gradient-to-br from-blue-50 to-sky-50/60 text-blue-700 dark:border-blue-400/25 dark:from-blue-900/35 dark:to-blue-950/20 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-300",
    iconBg: "bg-blue-100 dark:bg-blue-800/40",
  },
  neutral: {
    card: "border-ceyfi-line bg-gradient-to-br from-ceyfi-sprout to-white/60 text-ceyfi-deep dark:border-white/[0.10] dark:from-white/[0.07] dark:to-transparent dark:text-white/80",
    icon: "text-ceyfi-deep dark:text-white/70",
    iconBg: "bg-ceyfi-line/50 dark:bg-white/[0.10]",
  },
};

const actionIconColors = [
  "text-ceyfi-green bg-emerald-50 hover:bg-emerald-100",
  "text-violet-600 bg-violet-50 hover:bg-violet-100",
  "text-amber-600 bg-amber-50 hover:bg-amber-100",
];

export function InsightActionStrip({
  eyebrow,
  title,
  insights,
  actions = [],
}: InsightActionStripProps) {
  return (
    <section className="rounded-[1.5rem] card-glass shadow-brand p-4 sm:p-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-ceyfi-ink dark:text-white sm:text-2xl">
            {title}
          </h2>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 xl:shrink-0">
            {actions.map((action, i) => {
              const Icon = action.icon;
              const colorCls = actionIconColors[i % actionIconColors.length];
              const inner = (
                <>
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                      colorCls
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-ceyfi-ink dark:text-white/80">
                    {action.label}
                  </span>
                </>
              );

              const sharedCls =
                "inline-flex items-center gap-2 rounded-full border border-ceyfi-line bg-white/80 px-3 py-1.5 shadow-sm transition-all hover:shadow-brand hover:-translate-y-px dark:border-white/[0.10] dark:bg-white/[0.06] dark:hover:bg-white/[0.10]";

              if (action.href) {
                return (
                  <Link key={action.label} href={action.href} className={sharedCls}>
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={sharedCls}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Insight cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {insights.map((insight) => {
          const Icon = insight.icon;
          const cfg = toneConfig[insight.tone ?? "neutral"];
          return (
            <article
              key={insight.label}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 transition-transform hover:-translate-y-0.5",
                cfg.card
              )}
            >
              {/* Label + icon row */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
                  {insight.label}
                </span>
                <span className={cn("relative flex h-7 w-7 items-center justify-center rounded-full", cfg.iconBg)}>
                  <Icon className={cn("h-3.5 w-3.5", cfg.icon)} />
                  {cfg.pulse && (
                    <span className="absolute inset-0 animate-ping rounded-full opacity-30 bg-current" />
                  )}
                </span>
              </div>

              {/* Value */}
              <div className="font-heading text-2xl font-bold leading-none tabular-nums dark:opacity-100">
                {insight.value}
              </div>

              {/* Detail */}
              <p className="mt-2 text-xs leading-[1.6] opacity-70">
                {insight.detail}
              </p>

              {/* Subtle corner glow for success */}
              {insight.tone === "success" && (
                <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-emerald-300/20 blur-2xl" />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
