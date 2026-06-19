"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ceyfi-sprout dark:bg-white/[0.06]">
        <Icon className="h-7 w-7 text-ceyfi-green dark:text-ceyfi-mint" />
      </div>
      <p className="font-medium text-ceyfi-ink dark:text-white">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-xs text-ceyfi-muted dark:text-white/50">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
