"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Inbox,
  Zap,
} from "lucide-react";
import { HeroColorPanels } from "@/components/blocks/HeroColorPanels";
import { PeriodBadge } from "@/components/charts/PeriodBadge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getFinancialSnapshot, executeDecision, type FinancialSnapshot } from "@/lib/api";
import { cn, formatters } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Decision = FinancialSnapshot["decisions"][0];

const CATEGORY_COLORS = {
  Grow: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  Protect: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  Move: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  Save: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

const URGENCY_DOT = {
  High: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

export default function DecisionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | Decision["category"]>("All");
  const [sort, setSort] = useState<"impact" | "urgency" | "confidence">("impact");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [executeTarget, setExecuteTarget] = useState<Decision | null>(null);
  const [executing, setExecuting] = useState(false);

  const loadDecisions = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getFinancialSnapshot(user.user_id)
      .then((s) => setDecisions(s.decisions))
      .catch(() => setError("Could not load financial recommendations."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDecisions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDecisions]);

  useEffect(() => {
    const onReset = () => loadDecisions();
    window.addEventListener("seylan:demo-reset", onReset);
    return () => window.removeEventListener("seylan:demo-reset", onReset);
  }, [loadDecisions]);

  const filtered = useMemo(() => {
    let list = filter === "All" ? decisions : decisions.filter((d) => d.category === filter);
    const urgencyOrder = { High: 0, Medium: 1, Low: 2 };
    list = [...list].sort((a, b) => {
      if (sort === "impact") return b.benefit_lkr - a.benefit_lkr;
      if (sort === "urgency") return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      return b.confidence - a.confidence;
    });
    return list;
  }, [decisions, filter, sort]);

  const totalBenefit = decisions.reduce((s, d) => s + d.benefit_lkr, 0);
  const highUrgency = decisions.filter((d) => d.urgency === "High").length;

  const handleExecute = async () => {
    if (!executeTarget || !user) return;
    setExecuting(true);
    try {
      const result = await executeDecision(user.user_id, executeTarget.id);
      setExecuteTarget(null);
      if (result.recovery_messages) {
        toast.success("Recovery message ready", {
          description: result.recovery_messages.en.slice(0, 120) + "…",
          action: {
            label: "Open business",
            onClick: () => router.push("/business"),
          },
        });
      } else {
        toast.success("Action confirmed", { description: result.message });
        if (result.redirect) router.push(result.redirect);
      }
    } catch {
      toast.error("Could not execute action");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10">
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error && decisions.length === 0 ? (
        <ErrorState message={error} onRetry={loadDecisions} />
      ) : (
        <>
      <HeroColorPanels
        variant="strip"
        eyebrow="Decision room"
        title="Ranked financial recommendations"
        description="Evidence-backed decisions with trade-offs and one-click execution."
        badges={[
          {
            label: "Potential benefit",
            value: formatters.currency({ number: totalBenefit, maxFractionDigits: 0 }),
            icon: Zap,
          },
          {
            label: "High urgency",
            value: `${highUrgency}`,
            icon: AlertTriangle,
          },
          {
            label: "Pending",
            value: `${decisions.length}`,
            icon: Inbox,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(["All", "Grow", "Protect", "Move", "Save"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-semibold",
                filter === c ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="ml-auto rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground"
        >
          <option value="impact">By Impact</option>
          <option value="urgency">By Urgency</option>
          <option value="confidence">By Confidence</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={decisions.length === 0 ? "No recommendations yet" : "No decisions match this filter"}
            description={
              decisions.length === 0
                ? "Connect live data or run the demo to see ranked financial actions."
                : "Try a different category or reset filters to see all recommendations."
            }
          />
        ) : (
        filtered.map((d) => {
          const isOpen = expanded === d.id;
          return (
            <article key={d.id} className="interactive-card rounded-xl border border-border/70 bg-card">
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={() => setExpanded(isOpen ? null : d.id)}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", URGENCY_DOT[d.urgency])} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={cn("text-[10px]", CATEGORY_COLORS[d.category])}>
                      {d.category}
                    </Badge>
                    <PeriodBadge value={d.confidence} positive label={`${d.confidence}%`} />
                  </div>
                  <h2 className="mt-2 font-heading text-base font-semibold text-foreground">{d.title}</h2>
                  <p className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {formatters.currency({ number: d.benefit_lkr, maxFractionDigits: 0 })}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground/70" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/70" />}
              </button>

              {isOpen && (
                <div className="border-t border-border/60 px-4 pb-4 pt-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-[10px] font-semibold uppercase text-muted-foreground">Evidence</h3>
                      <ul className="mt-2 space-y-1.5">
                        {d.evidence.map((e) => (
                          <li key={e} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-semibold uppercase text-muted-foreground">Trade-offs</h3>
                      <ul className="mt-2 space-y-1.5">
                        {d.tradeoffs.map((t) => (
                          <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{d.deadline}</span>
                    {d.reversible && (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Reversible</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/assistant?prompt=${encodeURIComponent(d.title)}`}
                      className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-primary hover:bg-muted"
                    >
                      Ask why →
                    </Link>
                    <Link href="/scenarios" className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-primary hover:bg-muted">
                      Simulate →
                    </Link>
                    <Button size="sm" className="bg-primary text-white" onClick={() => setExecuteTarget(d)}>
                      Execute
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })
        )}
      </div>

      <Dialog open={!!executeTarget} onOpenChange={(o) => !o && setExecuteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{executeTarget?.title}</p>
          <p className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{executeTarget?.benefit_label}</p>
          <p className="text-xs text-muted-foreground/70">{executeTarget?.risk_reduced}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteTarget(null)}>Cancel</Button>
            <Button className="bg-primary text-white" disabled={executing} onClick={handleExecute}>
              {executing ? "Processing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
