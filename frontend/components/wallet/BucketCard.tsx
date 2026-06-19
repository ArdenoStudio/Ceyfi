"use client";

import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Home, PiggyBank } from "lucide-react";
import { Bucket } from "@/types";
import { formatLKR } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  school: GraduationCap,
  household: Home,
  savings: PiggyBank,
};

const COLOUR_MAP: Record<
  string,
  { surface: string; icon: string; ring: string; bar: string; gradient: string; glow: string }
> = {
  school: {
    surface: "bg-blue-50 dark:bg-blue-900/25",
    icon: "text-blue-600 dark:text-blue-400",
    ring: "#3B82F6",
    bar: "from-blue-400 to-blue-600",
    gradient: "from-blue-50/60 to-transparent dark:from-blue-900/20 dark:to-transparent",
    glow: "rgba(59,130,246,0.15)",
  },
  household: {
    surface: "bg-emerald-50 dark:bg-emerald-900/25",
    icon: "text-emerald-600 dark:text-emerald-400",
    ring: "#10B981",
    bar: "from-emerald-400 to-emerald-600",
    gradient: "from-emerald-50/60 to-transparent dark:from-emerald-900/20 dark:to-transparent",
    glow: "rgba(16,185,129,0.15)",
  },
  savings: {
    surface: "bg-violet-50 dark:bg-violet-900/25",
    icon: "text-violet-600 dark:text-violet-400",
    ring: "#7C3AED",
    bar: "from-violet-400 to-violet-600",
    gradient: "from-violet-50/60 to-transparent dark:from-violet-900/20 dark:to-transparent",
    glow: "rgba(124,58,237,0.15)",
  },
};

const FALLBACK_COLOUR = {
  surface: "bg-slate-50 dark:bg-slate-800/30",
  icon: "text-slate-600 dark:text-slate-400",
  ring: "#64748B",
  bar: "from-slate-400 to-slate-600",
  gradient: "from-slate-50/60 to-transparent dark:from-slate-800/20 dark:to-transparent",
  glow: "rgba(100,116,139,0.12)",
};

function RingProgress({ pct, stroke }: { pct: number; stroke: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 48 48"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-ceyfi-line opacity-40"
      />
      <circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

interface BucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
}

export function BucketCard({ bucket, onClick }: BucketCardProps) {
  const Icon = ICON_MAP[bucket.icon] ?? PiggyBank;
  const colours = COLOUR_MAP[bucket.icon] ?? FALLBACK_COLOUR;
  const spentPct =
    bucket.balance_lkr + bucket.spent_lkr > 0
      ? (bucket.spent_lkr / (bucket.balance_lkr + bucket.spent_lkr)) * 100
      : 0;

  return (
    <Card
      className="group cursor-pointer card-glass shadow-brand border-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-brand-lg overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="relative p-5">
        {/* Subtle top gradient accent */}
        <div
          className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b pointer-events-none ${colours.gradient}`}
        />
        {/* Icon with ring progress */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative h-12 w-12 shrink-0">
            <RingProgress pct={spentPct} stroke={colours.ring} />
            <div
              className={`absolute inset-[6px] flex items-center justify-center rounded-full ${colours.surface}`}
            >
              <Icon className={`h-4 w-4 ${colours.icon}`} />
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-ceyfi-ink dark:text-white">
              {bucket.label}
            </span>
            <p className="text-[10px] text-muted-foreground dark:text-white/40 mt-0.5">
              {bucket.allocation_pct}% allocation
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <div className="font-heading text-2xl font-bold text-ceyfi-ink dark:text-white tabular-nums leading-none">
            {formatLKR(bucket.balance_lkr)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground dark:text-white/40">available balance</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-ceyfi-sprout dark:bg-white/[0.08]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colours.bar} transition-all duration-700`}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground dark:text-white/40">
            <span>{Math.round(spentPct)}% used this cycle</span>
            <span className="tabular-nums">{formatLKR(bucket.spent_lkr)} spent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
