"use client";

/**
 * Animated stat card adapted from 21st.dev community component by kavikatiyar.
 * @see https://21st.dev/community/components/kavikatiyar/stats-card
 */

import * as React from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { GradientBorder } from "@/components/blocks/GradientBorder";
import { cn } from "@/lib/utils";

export interface StatMetricItem {
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "error" | "neutral";
  change?: number;
  changeDescription?: string;
  icon?: LucideIcon;
}

export interface AnimatedStatCardProps {
  className?: string;
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "error" | "neutral";
  change?: number;
  changeDescription?: string;
  icon?: LucideIcon;
}

export function AnimatedStatCard({
  className,
  label,
  value,
  sub,
  tone = "neutral",
  change,
  changeDescription,
  icon: Icon,
}: AnimatedStatCardProps) {
  const ChangeIndicator =
    change === undefined || change === 0
      ? Minus
      : change > 0
        ? ArrowUpRight
        : ArrowDownRight;

  const changeColor =
    change === undefined || change === 0
      ? "text-muted-foreground"
      : change > 0
        ? "text-ceyfi-green"
        : "text-red-500";

  const valueColor =
    tone === "error"
      ? "text-red-600 dark:text-red-400"
      : tone === "success"
        ? "text-ceyfi-green dark:text-ceyfi-mint"
        : "text-foreground dark:text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "flex h-full flex-col rounded-2xl bg-card/90 p-4 backdrop-blur-sm dark:bg-white/[0.04]",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-white/40">
          {label}
        </span>
        {Icon ? (
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>

      <motion.p
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08, type: "spring", stiffness: 300, damping: 20 }}
        className={cn("font-mono text-2xl font-semibold tabular-nums", valueColor)}
      >
        {value}
      </motion.p>

      {change !== undefined ? (
        <div className={cn("mt-1 flex items-center gap-1 text-xs", changeColor)}>
          <ChangeIndicator className="h-3.5 w-3.5" />
          <span>
            {Math.abs(change)}%{" "}
            {changeDescription ? (
              <span className="text-muted-foreground">{changeDescription}</span>
            ) : null}
          </span>
        </div>
      ) : sub ? (
        <span className="mt-1 text-[11px] text-muted-foreground/80 dark:text-white/30">{sub}</span>
      ) : null}
    </motion.div>
  );
}

export interface StatHeaderStripProps {
  stats: StatMetricItem[];
  className?: string;
}

export function StatHeaderStrip({ stats, className }: StatHeaderStripProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <GradientBorder
          key={stat.label}
          animationMode="rotate-on-hover"
          borderRadius={16}
          style={{ animationDelay: `${index * 0.15}s` }}
        >
          <AnimatedStatCard {...stat} />
        </GradientBorder>
      ))}
    </div>
  );
}
