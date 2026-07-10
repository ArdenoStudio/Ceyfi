"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import { CeyfiMark } from "@/components/brand/CeyfiMark";
import { cn, formatLKR } from "@/lib/utils";
import { dueLabel, formatShortDate } from "@/lib/dates";

interface RotatingInsightsCardProps {
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
}

export function RotatingInsightsCard({
  nextPaymentDate = "2026-07-25",
  nextPaymentAmount = 22000,
}: RotatingInsightsCardProps) {
  const insights = useMemo(
    () => [
      {
        pill: "Grocery spend up 12%",
        title: "Household spending is trending higher this week.",
        body: "Keells and delivery orders are up compared to your 4-week average. CEYFI can suggest a tighter grocery cap.",
        cta: "Why is grocery spend up?",
      },
      {
        pill: dueLabel(nextPaymentDate),
        title: "Your next instalment is coming up.",
        body: `${formatLKR(nextPaymentAmount)} is scheduled for ${formatShortDate(nextPaymentDate)}. Paying early keeps your loan health score in the green zone.`,
        cta: "Show my loan payment options",
      },
      {
        pill: "On track to save LKR 8,400",
        title: "You can move money to savings safely this week.",
        body: "After bills and your loan instalment, CEYFI estimates LKR 8,400 is safe to tuck away.",
        cta: "Explain why I can save LKR 8,400",
      },
    ],
    [nextPaymentDate, nextPaymentAmount]
  );

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % insights.length);
        setVisible(true);
      }, 320);
    }, 5000);
    return () => clearInterval(interval);
  }, [insights.length, paused]);

  const insight = insights[index];

  return (
    <section
      className="insight-card-glow relative min-w-0 overflow-hidden rounded-[22px] p-[1px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-[21px] bg-ceyfi-sprout p-5 dark:bg-ceyfi-deep/40 sm:p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-ceyfi-green/10" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-ceyfi-green text-white">
              <CeyfiMark className="h-5 w-5" title="" aria-hidden />
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {insights.map((item, i) => (
                <button
                  key={item.pill}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setVisible(true);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-opacity duration-300",
                    i === index
                      ? "bg-ceyfi-green/15 text-ceyfi-green ring-1 ring-ceyfi-green/25"
                      : "bg-white/50 text-ceyfi-muted opacity-60 dark:bg-white/5 dark:text-white/40"
                  )}
                >
                  {item.pill}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "mt-5 will-change-[opacity,transform] transition-all duration-500",
              visible ? "insight-fade-in opacity-100" : "insight-fade-out opacity-0"
            )}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-green">
              AI insights
            </div>
            <h2 className="mt-2 font-heading text-xl font-semibold tracking-[-0.03em] text-ceyfi-ink dark:text-white">
              {insight.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ceyfi-muted dark:text-white/55">
              {insight.body}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/assistant?prompt=${encodeURIComponent(insight.cta)}`}
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-ceyfi-deep px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0a4424] dark:bg-ceyfi-green dark:hover:bg-ceyfi-green/90"
              >
                <Bot className="h-3.5 w-3.5" />
                Explain this
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center gap-2 rounded-xl border border-ceyfi-green/20 bg-white/60 px-3.5 py-2 text-xs font-semibold text-ceyfi-deep transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Open wallet
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
