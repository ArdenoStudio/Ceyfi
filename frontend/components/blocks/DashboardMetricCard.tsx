"use client";

/**
 * Dashboard metric card adapted from Watermelon UI stats-2.
 * @see https://ui.watermelon.sh/ — stats-2
 * @see https://github.com/WatermelonCorp/watermellon-registry/blob/main/src/components/watermelon-ui/stats-2.tsx
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardMetricAccent = "seylan" | "ceyfi" | "amber" | "neutral";

export interface DashboardMetricItem {
  label: string;
  metric: string;
  subLabel?: string;
  description?: string;
  icon: LucideIcon;
  accent?: DashboardMetricAccent;
}

export interface DashboardMetricCardProps extends DashboardMetricItem {
  className?: string;
}

const accentStyles: Record<
  DashboardMetricAccent,
  {
    pillBg: string;
    pillText: string;
    glowColor: string;
    accentGradient: string;
    iconBg: string;
    iconText: string;
  }
> = {
  seylan: {
    pillBg: "bg-seylan-red/10",
    pillText: "text-seylan-red",
    glowColor: "rgba(227,24,33,0.12)",
    accentGradient: "from-seylan-red via-rose-400 to-amber-400",
    iconBg: "bg-seylan-red/15",
    iconText: "text-seylan-red",
  },
  ceyfi: {
    pillBg: "bg-ceyfi-green/10",
    pillText: "text-ceyfi-green",
    glowColor: "rgba(5,150,105,0.12)",
    accentGradient: "from-ceyfi-green via-ceyfi-mint to-emerald-400",
    iconBg: "bg-ceyfi-green/15",
    iconText: "text-ceyfi-green",
  },
  amber: {
    pillBg: "bg-amber-500/10",
    pillText: "text-amber-600 dark:text-amber-400",
    glowColor: "rgba(245,158,11,0.12)",
    accentGradient: "from-amber-400 via-orange-400 to-rose-400",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-500",
  },
  neutral: {
    pillBg: "bg-muted/60 dark:bg-white/10",
    pillText: "text-muted-foreground dark:text-white/50",
    glowColor: "rgba(148,163,184,0.08)",
    accentGradient: "from-slate-400 via-zinc-400 to-neutral-400",
    iconBg: "bg-muted/60 dark:bg-white/10",
    iconText: "text-muted-foreground dark:text-white/60",
  },
};

export function DashboardMetricCard({
  label,
  metric,
  subLabel,
  description,
  icon: Icon,
  accent = "neutral",
  className,
}: DashboardMetricCardProps) {
  const styles = accentStyles[accent];

  return (
    <>
      <style jsx global>{`
        @keyframes wm-metric-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes wm-metric-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .wm-stat-card {
          transition: all 0.45s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .wm-stat-card:hover .wm-accent-bar {
          height: 100% !important;
          top: 0 !important;
        }
        .wm-stat-card:hover .wm-card-glow {
          opacity: 1;
        }
        .wm-stat-card:hover .wm-metric-value {
          animation: wm-metric-float 3s ease-in-out infinite;
        }
        .wm-stat-card:hover .wm-pill-badge {
          transform: scale(1.03);
        }
        .wm-stat-card:hover .wm-stat-icon {
          transform: rotate(-6deg) scale(1.1);
        }
        .wm-stat-card:hover .wm-shimmer-line {
          animation: wm-metric-shimmer 2s linear infinite;
          background-size: 200% 100%;
        }
      `}</style>

      <div
        className={cn(
          "wm-stat-card group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]",
          className
        )}
      >
        <div
          className="wm-card-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at 20% 0%, ${styles.glowColor}, transparent 55%)` }}
          aria-hidden
        />

        <div
          className={cn(
            "wm-accent-bar absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b transition-all duration-500",
            styles.accentGradient
          )}
          aria-hidden
        />

        <div className="relative space-y-3">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "wm-pill-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-transform duration-300",
                styles.pillBg,
                styles.pillText
              )}
            >
              <span
                className={cn(
                  "wm-stat-icon grid size-5 place-items-center rounded-md transition-transform duration-300",
                  styles.iconBg
                )}
              >
                <Icon className={cn("size-3", styles.iconText)} aria-hidden />
              </span>
              {label}
            </span>
          </div>

          <p className="wm-metric-value font-heading text-2xl font-semibold tabular-nums tracking-[-0.03em] text-foreground dark:text-white">
            {metric}
          </p>

          {subLabel ? (
            <p className="text-xs font-medium text-muted-foreground dark:text-white/45">{subLabel}</p>
          ) : null}

          {description ? (
            <>
              <div
                className={cn(
                  "wm-shimmer-line h-px w-full bg-gradient-to-r from-transparent via-border to-transparent dark:via-white/10"
                )}
                aria-hidden
              />
              <p className="text-xs leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80 dark:text-white/40 dark:group-hover:text-white/60">
                {description}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export interface DashboardMetricGridProps {
  items: DashboardMetricItem[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function DashboardMetricGrid({
  items,
  className,
  columns = 3,
}: DashboardMetricGridProps) {
  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-3";

  return (
    <div className={cn("grid gap-4", colClass, className)}>
      {items.map((item) => (
        <DashboardMetricCard key={item.label} {...item} />
      ))}
    </div>
  );
}
