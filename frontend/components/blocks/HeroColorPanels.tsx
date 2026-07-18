"use client";

/**
 * Split-layout hero with animated gradient color panels.
 * Adapted from Cult UI Hero Color Panels (cult-ui.com/docs/components/hero-color-panels)
 * using CSS/Tailwind instead of @paper-design/shaders-react.
 */

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  ChartLine,
  Globe2,
  PiggyBank,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CEYFI_PANELS = [
  { from: "#059669", to: "#34D399", rotate: -8, delay: 0, icon: Banknote, label: "Cash flow" },
  { from: "#047857", to: "#6EE7B7", rotate: 12, delay: 0.4, icon: ChartLine, label: "Growth" },
  { from: "#065F46", to: "#10B981", rotate: -14, delay: 0.8, icon: PiggyBank, label: "Savings" },
  { from: "#064E3B", to: "#A7F3D0", rotate: 6, delay: 1.2, icon: ShieldCheck, label: "Protect" },
  { from: "#075C3E", to: "#34D399", rotate: -10, delay: 0.6, icon: Globe2, label: "Diaspora" },
  { from: "#052E16", to: "#059669", rotate: 18, delay: 1.0, icon: Sparkles, label: "Insights" },
] as const;

export interface HeroColorPanelsBadge {
  label: string;
  value?: string;
  icon?: LucideIcon;
}

export interface HeroColorPanelsProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  badges?: HeroColorPanelsBadge[];
  actions?: React.ReactNode;
  /** Compact strip for narrow pages; default split hero */
  variant?: "hero" | "strip";
  className?: string;
  srTitle?: string;
}

function ColorPanelsVisual({ compact }: { compact?: boolean }) {
  const panels = compact ? CEYFI_PANELS.slice(0, 4) : CEYFI_PANELS;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        compact ? "h-[140px] w-full sm:h-[160px]" : "h-[280px] sm:h-[320px] lg:h-full lg:min-h-[340px] xl:min-h-[400px]"
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 rounded-[2rem] opacity-60 blur-3xl",
          "bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.35),transparent_70%)]"
        )}
      />
      <div
        className={cn(
          "relative grid gap-2 sm:gap-3",
          compact
            ? "grid-cols-4 grid-rows-1 w-full max-w-md px-2"
            : "grid-cols-3 grid-rows-2 h-[85%] w-[85%] max-w-[420px]"
        )}
      >
        {panels.map((panel, i) => {
          const PanelIcon = panel.icon;
          return (
          <motion.div
            key={i}
            className={cn(
              "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(5,46,22,0.18)]",
              compact ? "h-16 sm:h-20" : "min-h-[80px]"
            )}
            style={{
              background: `linear-gradient(135deg, ${panel.from} 0%, ${panel.to} 100%)`,
            }}
            initial={{ opacity: 0, scale: 0.92, rotate: panel.rotate }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: [panel.rotate, panel.rotate + 3, panel.rotate - 2, panel.rotate],
              y: [0, -4, 2, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: panel.delay * 0.15 },
              scale: { duration: 0.5, delay: panel.delay * 0.15 },
              rotate: { duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay: panel.delay },
              y: { duration: 6 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: panel.delay },
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:14px_14px] opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10" />
            <div className="absolute -right-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-white/20 blur-xl" />
            <PanelIcon
              className={cn(
                "relative z-10 text-white/90 drop-shadow-sm",
                compact ? "size-5 sm:size-6" : "size-7 sm:size-8"
              )}
              strokeWidth={1.6}
              aria-hidden
            />
            {!compact ? (
              <span className="relative z-10 mt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/75">
                {panel.label}
              </span>
            ) : null}
          </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function HeroColorPanels({
  eyebrow,
  title,
  subtitle,
  description,
  badges,
  actions,
  variant = "hero",
  className,
  srTitle,
}: HeroColorPanelsProps) {
  const isStrip = variant === "strip";
  const resolvedSrTitle =
    srTitle ?? (typeof title === "string" ? title : "Hero section");

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-ceyfi-line/80 bg-ceyfi-paper shadow-[0_24px_80px_rgba(5,46,22,0.08)] sm:rounded-[2rem] dark:border-white/[0.08] dark:bg-ceyfi-deep/40 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
        isStrip ? "p-4 sm:p-5" : "p-4 sm:p-6 lg:p-8",
        className
      )}
      data-slot="hero-color-panels"
    >
      <h2 className="sr-only">{resolvedSrTitle}</h2>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-40 dark:opacity-25",
          "bg-[radial-gradient(circle_at_0%_0%,rgba(5,150,105,0.12),transparent_50%)]"
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10",
          isStrip
            ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
            : "grid gap-6 lg:grid-cols-[1fr_minmax(280px,420px)] lg:items-center lg:gap-10 xl:grid-cols-[1fr_1fr]"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col gap-3",
            isStrip ? "flex-1 sm:gap-2" : "justify-center sm:gap-4"
          )}
        >
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
              {eyebrow}
            </p>
          ) : null}

          <div className={cn(isStrip ? "text-left" : "text-center lg:text-left")}>
            <h1
              className={cn(
                "font-heading font-semibold tracking-[-0.025em] text-ceyfi-ink dark:text-white",
                isStrip
                  ? "text-xl leading-snug sm:text-2xl"
                  : "text-2xl leading-snug sm:text-3xl sm:leading-tight md:text-4xl lg:text-[2.6rem] lg:leading-[1.12]"
              )}
            >
              {title}
              {subtitle ? (
                <span className="mt-1.5 block text-ceyfi-green dark:text-ceyfi-mint">
                  {subtitle}
                </span>
              ) : null}
            </h1>
          </div>

          {description ? (
            <p
              className={cn(
                "text-sm leading-6 text-muted-foreground dark:text-white/55 sm:text-base",
                isStrip ? "max-w-xl" : "mx-auto max-w-xl lg:mx-0 lg:max-w-none"
              )}
            >
              {description}
            </p>
          ) : null}

          {badges && badges.length > 0 ? (
            <div
              className={cn(
                "flex flex-wrap gap-2",
                isStrip ? "pt-1" : "justify-center pt-1 lg:justify-start"
              )}
              data-slot="hero-colorpanels-badges"
            >
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <Badge
                    key={badge.label}
                    variant="outline"
                    className={cn(
                      "border-ceyfi-line/80 bg-ceyfi-sprout/60 px-3 py-1.5 font-medium text-ceyfi-ink",
                      "shadow-[0_1px_3px_rgba(5,46,22,0.06)] transition-all duration-150",
                      "hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(5,46,22,0.1)]",
                      "dark:border-white/10 dark:bg-white/5 dark:text-white/90"
                    )}
                  >
                    {Icon ? <Icon className="mr-1.5 size-3.5 text-ceyfi-green" aria-hidden /> : null}
                    <span className="text-[11px]">{badge.label}</span>
                    {badge.value ? (
                      <span className="ml-1.5 font-semibold tabular-nums text-ceyfi-green dark:text-ceyfi-mint">
                        {badge.value}
                      </span>
                    ) : null}
                  </Badge>
                );
              })}
            </div>
          ) : null}

          {actions ? (
            <div
              className={cn(
                "flex flex-wrap gap-2 pt-1",
                isStrip ? "" : "justify-center lg:justify-start"
              )}
              data-slot="hero-colorpanels-actions"
            >
              {actions}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "relative",
            isStrip ? "w-full shrink-0 sm:max-w-[280px]" : "hidden lg:block"
          )}
          data-slot="hero-colorpanels-visual"
        >
          <ColorPanelsVisual compact={isStrip} />
        </div>
      </div>

      {!isStrip ? (
        <div className="relative z-10 mt-4 lg:hidden" aria-hidden>
          <ColorPanelsVisual />
        </div>
      ) : null}
    </section>
  );
}
