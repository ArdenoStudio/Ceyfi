"use client";

/**
 * Feature quick-links grid adapted from shadcnblocks feature17.
 * @see https://www.shadcnblocks.com/block/feature17
 */

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface QuickLinkItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

export interface FeatureQuickLinksGridProps {
  eyebrow?: string;
  heading?: string;
  links: QuickLinkItem[];
  className?: string;
}

export function FeatureQuickLinksGrid({
  eyebrow = "Quick actions",
  heading = "Jump to what matters",
  links,
  className,
}: FeatureQuickLinksGridProps) {
  return (
    <section className={cn("space-y-5", className)}>
      {(eyebrow || heading) && (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow ? (
              <Badge
                variant="secondary"
                className="border-ceyfi-line bg-ceyfi-sprout text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-green"
              >
                {eyebrow}
              </Badge>
            ) : null}
            {heading ? (
              <h2 className="mt-2 font-heading text-xl font-semibold tracking-[-0.03em] text-ceyfi-ink dark:text-white sm:text-2xl">
                {heading}
              </h2>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              className="group flex gap-4 rounded-[18px] border border-ceyfi-line/70 bg-ceyfi-paper p-4 transition hover:border-ceyfi-green/25 hover:bg-ceyfi-canvas hover:shadow-[0_4px_24px_rgba(5,150,105,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-ceyfi-green/30"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ceyfi-sprout text-ceyfi-green transition group-hover:bg-ceyfi-green group-hover:text-white dark:bg-ceyfi-green/15">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ceyfi-ink dark:text-white">
                    {link.title}
                  </span>
                  {link.badge ? (
                    <Badge
                      variant="outline"
                      className="h-5 border-ceyfi-line px-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ceyfi-muted"
                    >
                      {link.badge}
                    </Badge>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ceyfi-muted dark:text-white/50">
                  {link.description}
                </span>
              </span>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-ceyfi-faint transition group-hover:translate-x-0.5 group-hover:text-ceyfi-green"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
