"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertBannerTone = "info" | "success" | "warning" | "alert";

const toneStyles: Record<
  AlertBannerTone,
  { container: string; icon: string; title: string; description: string }
> = {
  info: {
    container:
      "border-ceyfi-line/70 bg-gradient-to-br from-ceyfi-sprout to-ceyfi-paper text-ceyfi-ink dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.03] dark:text-white",
    icon: "text-ceyfi-green dark:text-ceyfi-mint",
    title: "text-ceyfi-ink dark:text-white",
    description: "text-ceyfi-muted dark:text-white/60",
  },
  success: {
    container:
      "border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-ceyfi-sprout text-emerald-900 dark:border-emerald-400/25 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:text-emerald-200",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-100",
    description: "text-emerald-700/80 dark:text-emerald-300/80",
  },
  warning: {
    container:
      "border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/60 text-amber-900 dark:border-amber-400/25 dark:from-amber-950/35 dark:to-orange-950/20 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100",
    description: "text-amber-800/80 dark:text-amber-300/80",
  },
  alert: {
    container:
      "border-red-200/70 bg-gradient-to-br from-red-50 to-rose-50/60 text-red-900 dark:border-red-400/25 dark:from-red-950/35 dark:to-rose-950/20 dark:text-red-200",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-900 dark:text-red-100",
    description: "text-red-800/80 dark:text-red-300/80",
  },
};

export interface AlertBannerProps {
  tone?: AlertBannerTone;
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: ReactNode;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/** HyperUI alert pattern — neobrutalism/alerts + announcements, CEYFI rounded card style. */
export function AlertBanner({
  tone = "info",
  title,
  description,
  icon: Icon,
  action,
  href,
  actionLabel,
  onAction,
  className,
}: AlertBannerProps) {
  const styles = toneStyles[tone];

  const actionNode =
    action ??
    (actionLabel && (href || onAction) ? (
      href ? (
        <Link
          href={href}
          className="shrink-0 rounded-full bg-ceyfi-green px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-ceyfi-deep dark:hover:bg-ceyfi-mint dark:hover:text-ceyfi-deep"
        >
          {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-full bg-ceyfi-green px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-ceyfi-deep dark:hover:bg-ceyfi-mint dark:hover:text-ceyfi-deep"
        >
          {actionLabel}
        </button>
      )
    ) : null);

  return (
    <div
      role="alert"
      className={cn(
        "rounded-[22px] border p-4 sm:p-5 shadow-brand",
        styles.container,
        className
      )}
    >
      <div className="flex items-start gap-3 sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Icon className={cn("mt-0.5 size-5 shrink-0", styles.icon)} aria-hidden />
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold leading-snug", styles.title)}>
              {title}
            </p>
            {description ? (
              <p className={cn("mt-1 text-xs leading-relaxed", styles.description)}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actionNode}
      </div>
    </div>
  );
}
