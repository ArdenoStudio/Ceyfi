"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCfoBrief, type CfoBrief } from "@/lib/api";
import { ChartCard } from "@/components/ui/ChartCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatters } from "@/lib/utils";

export function CfoBriefPanel({ userId }: { userId: string }) {
  const [brief, setBrief] = useState<CfoBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCfoBrief(userId)
      .then((b) => {
        if (!cancelled) setBrief(b);
      })
      .catch(() => {
        if (!cancelled) setBrief(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }
  if (!brief) return null;

  return (
    <ChartCard
      title="Daily CFO brief"
      subtitle={`${brief.date} · AI-generated from live books`}
      action={
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ceyfi-green">
          <Sparkles className="h-3 w-3" />
          Groq
        </span>
      }
    >
      <p className="text-sm leading-relaxed text-ceyfi-ink">{brief.summary}</p>
      <ul className="mt-4 space-y-2">
        {brief.bullets.map((b) => (
          <li key={b} className="flex gap-2 text-xs text-ceyfi-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ceyfi-green" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-5 border-t border-ceyfi-line/60 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ceyfi-muted">
          Top actions today
        </p>
        <ol className="mt-2 space-y-2">
          {brief.actions.map((a) => (
            <li key={a.priority}>
              <Link
                href={a.href}
                className="flex items-center justify-between rounded-lg border border-ceyfi-line/60 bg-ceyfi-canvas px-3 py-2 text-xs font-medium text-ceyfi-ink transition hover:border-ceyfi-green/40"
              >
                <span>
                  {a.priority}. {a.title}
                </span>
                {a.benefit_lkr > 0 && (
                  <span className="font-mono text-emerald-700">
                    {formatters.currency({ number: a.benefit_lkr, maxFractionDigits: 0 })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </ChartCard>
  );
}
