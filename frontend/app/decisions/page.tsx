"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { PeriodBadge } from "@/components/charts/PeriodBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getFinancialSnapshot, type FinancialSnapshot } from "@/lib/api";
import { cn, formatters } from "@/lib/utils";
import { toast } from "sonner";

type Decision = FinancialSnapshot["decisions"][0];

const CATEGORY_COLORS = {
  Grow: "bg-emerald-50 text-emerald-700",
  Protect: "bg-blue-50 text-blue-700",
  Move: "bg-violet-50 text-violet-700",
  Save: "bg-amber-50 text-amber-700",
};

const URGENCY_DOT = {
  High: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

export default function DecisionsPage() {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filter, setFilter] = useState<"All" | Decision["category"]>("All");
  const [sort, setSort] = useState<"impact" | "urgency" | "confidence">("impact");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [executeTarget, setExecuteTarget] = useState<Decision | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFinancialSnapshot(user.user_id)
      .then((s) => setDecisions(s.decisions))
      .catch(() => setDecisions([]));
  }, [user]);

  useEffect(() => {
    const onReset = () => {
      if (user) getFinancialSnapshot(user.user_id).then((s) => setDecisions(s.decisions)).catch(() => null);
    };
    window.addEventListener("seylan:demo-reset", onReset);
    return () => window.removeEventListener("seylan:demo-reset", onReset);
  }, [user]);

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

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setExecuteTarget(null);
      toast.success("Action confirmed", { description: executeTarget?.benefit_label });
    }, 1500);
  };

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10">
      <header>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
          <Zap className="h-3.5 w-3.5" />
          Decision room
        </div>
        <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.035em] text-ceyfi-ink">
          Ranked financial recommendations
        </h1>
        <p className="mt-2 text-sm text-ceyfi-muted">
          Evidence-backed decisions with trade-offs and one-click execution.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total potential benefit", value: formatters.currency({ number: totalBenefit, maxFractionDigits: 0 }) },
          { label: "High urgency", value: `${highUrgency}` },
          { label: "Pending decisions", value: `${decisions.length}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ceyfi-line/70 bg-ceyfi-paper p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ceyfi-muted">{s.label}</div>
            <div className="mt-2 font-heading text-xl font-semibold text-ceyfi-ink">{s.value}</div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(["All", "Grow", "Protect", "Move", "Save"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-semibold",
                filter === c ? "bg-ceyfi-green text-white" : "bg-ceyfi-canvas text-ceyfi-muted"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="ml-auto rounded-lg border border-ceyfi-line bg-ceyfi-paper px-3 py-1.5 text-[11px] font-medium text-ceyfi-ink"
        >
          <option value="impact">By Impact</option>
          <option value="urgency">By Urgency</option>
          <option value="confidence">By Confidence</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((d) => {
          const isOpen = expanded === d.id;
          return (
            <article key={d.id} className="rounded-xl border border-ceyfi-line/70 bg-ceyfi-paper">
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
                  <h2 className="mt-2 font-heading text-base font-semibold text-ceyfi-ink">{d.title}</h2>
                  <p className="mt-1 font-mono text-lg font-bold text-emerald-700">
                    {formatters.currency({ number: d.benefit_lkr, maxFractionDigits: 0 })}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-ceyfi-faint" /> : <ChevronDown className="h-4 w-4 text-ceyfi-faint" />}
              </button>

              {isOpen && (
                <div className="border-t border-ceyfi-line/60 px-4 pb-4 pt-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-[10px] font-semibold uppercase text-ceyfi-muted">Evidence</h3>
                      <ul className="mt-2 space-y-1.5">
                        {d.evidence.map((e) => (
                          <li key={e} className="flex items-start gap-2 text-xs text-ceyfi-muted">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-semibold uppercase text-ceyfi-muted">Trade-offs</h3>
                      <ul className="mt-2 space-y-1.5">
                        {d.tradeoffs.map((t) => (
                          <li key={t} className="flex items-start gap-2 text-xs text-ceyfi-muted">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-ceyfi-canvas px-2.5 py-1 text-[10px] font-semibold text-ceyfi-muted">{d.deadline}</span>
                    {d.reversible && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Reversible</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/assistant?prompt=${encodeURIComponent(d.title)}`}
                      className="rounded-lg border border-ceyfi-line px-3 py-2 text-[11px] font-semibold text-ceyfi-green hover:bg-ceyfi-canvas"
                    >
                      Ask why →
                    </Link>
                    <Link href="/scenarios" className="rounded-lg border border-ceyfi-line px-3 py-2 text-[11px] font-semibold text-ceyfi-green hover:bg-ceyfi-canvas">
                      Simulate →
                    </Link>
                    <Button size="sm" className="bg-ceyfi-green text-white" onClick={() => setExecuteTarget(d)}>
                      Execute
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Dialog open={!!executeTarget} onOpenChange={(o) => !o && setExecuteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ceyfi-muted">{executeTarget?.title}</p>
          <p className="font-mono font-semibold text-emerald-700">{executeTarget?.benefit_label}</p>
          <p className="text-xs text-ceyfi-faint">{executeTarget?.risk_reduced}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteTarget(null)}>Cancel</Button>
            <Button className="bg-ceyfi-green text-white" disabled={executing} onClick={handleExecute}>
              {executing ? "Processing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
