"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  action,
}: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.5rem] border border-ceyfi-line bg-[linear-gradient(135deg,#f7fdfa_0%,#eaf7ef_48%,#d8efe0_100%)] p-4 shadow-[0_24px_80px_rgba(5,46,22,0.10)] sm:rounded-[2rem] sm:p-7 dark:[background:rgba(255,255,255,0.05)] dark:border-white/[0.08] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)] dark:backdrop-blur-xl">
      {/* Orbs — red glow only in dark, warm blobs only in light */}
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-ceyfi-green/10 blur-3xl dark:bg-ceyfi-green/25" />
      <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-ceyfi-mint/20 blur-3xl dark:opacity-0" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ceyfi-green">
              {eyebrow}
            </p>
          )}
          <h1 className="font-heading text-2xl font-semibold leading-[1.15] tracking-[-0.025em] text-ceyfi-ink dark:text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground dark:text-white/45 sm:text-base">
            {description}
          </p>
          {meta && <div className="mt-4">{meta}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
