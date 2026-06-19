"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterPillVariant = "solid" | "outline";

export interface FilterPillProps {
  label: string;
  active?: boolean;
  variant?: FilterPillVariant;
  icon?: LucideIcon;
  onClick?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/** HyperUI badges/1 + badges/3 — pill filter with solid/outlined variants. */
export function FilterPill({
  label,
  active = false,
  variant = "solid",
  icon: Icon,
  onClick,
  onDismiss,
  className,
}: FilterPillProps) {
  const isButton = Boolean(onClick || onDismiss);

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition";

  const activeSolid =
    "bg-ceyfi-green text-white shadow-sm dark:bg-ceyfi-mint dark:text-ceyfi-deep";
  const inactiveSolid =
    "bg-ceyfi-sprout text-ceyfi-green hover:bg-ceyfi-green/15 dark:bg-white/[0.06] dark:text-ceyfi-mint dark:hover:bg-white/10";
  const activeOutline =
    "border border-ceyfi-green bg-ceyfi-green/10 text-ceyfi-green dark:border-ceyfi-mint dark:text-ceyfi-mint";
  const inactiveOutline =
    "border border-ceyfi-line text-ceyfi-muted hover:border-ceyfi-green/40 hover:text-ceyfi-ink dark:border-white/15 dark:text-white/55 dark:hover:border-ceyfi-mint/40 dark:hover:text-white";

  const tone =
    variant === "outline"
      ? active
        ? activeOutline
        : inactiveOutline
      : active
        ? activeSolid
        : inactiveSolid;

  const content = (
    <>
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
      <span>{label}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={cn(
            "ms-0.5 -me-0.5 inline-flex rounded-full p-0.5 transition",
            active
              ? "bg-white/20 hover:bg-white/30 dark:bg-ceyfi-deep/20 dark:hover:bg-ceyfi-deep/30"
              : "bg-ceyfi-green/10 hover:bg-ceyfi-green/20 dark:bg-white/10 dark:hover:bg-white/20"
          )}
          aria-label={`Remove ${label} filter`}
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : null}
    </>
  );

  if (isButton && onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, tone, className)}>
        {content}
      </button>
    );
  }

  return (
    <span className={cn(base, tone, className)}>
      {content}
    </span>
  );
}

export interface FilterPillGroupProps {
  children: React.ReactNode;
  className?: string;
}

/** Container for grouped filter pills — HyperUI badge row in CEYFI card shell. */
export function FilterPillGroup({ children, className }: FilterPillGroupProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 rounded-full border border-ceyfi-line/70 bg-ceyfi-paper p-1 dark:border-white/10 dark:bg-white/[0.04]",
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}
