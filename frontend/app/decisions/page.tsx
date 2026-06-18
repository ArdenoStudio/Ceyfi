"use client";

import { useMemo, useState } from "react";
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
import { cn, formatters } from "@/lib/utils";
import { toast } from "sonner";

interface Decision {
  id: string;
  title: string;
  category: "Grow" | "Protect" | "Move" | "Save";
  benefitLkr: number;
  benefitLabel: string;
  riskReduced: string;
  confidence: number;
  evidence: string[];
  tradeoffs: string[];
  deadline: string;
  reversible: boolean;
  urgency: "High" | "Medium" | "Low";
}

const DECISIONS: Decision[] = [
  {
    id: "d1",
    title: "Move LKR 18,000 to savings this week",
    category: "Save",
    benefitLkr: 18000,
    benefitLabel: "LKR 18,000 moved to savings",
    riskReduced: "Reduces shortfall probability by 34%",
    confidence: 87,
    evidence: ["Salary cleared yesterday", "No bills due for 9 days"],
    tradeoffs: ["Reduces everyday account to LKR 26,000"],
    deadline: "Act within 3 days",
    reversible: true,
    urgency: "High",
  },
  {
    id: "d2",
    title: "Optimize EMI payment date to the 28th",
    category: "Protect",
    benefitLkr: 2200,
    benefitLabel: "LKR 2,200 late-fee risk avoided",
    riskReduced: "Aligns EMI with salary cycle",
    confidence: 79,
    evidence: ["Salary arrives on the 1st", "Current EMI on 25th creates a 4-day gap"],
    tradeoffs: ["Requires bank request", "One-time processing fee may apply"],
    deadline: "Act within 7 days",
    reversible: false,
    urgency: "Medium",
  },
  {
    id: "d3",
    title: "Time remittance for best GBP rate",
    category: "Grow",
    benefitLkr: 3200,
    benefitLabel: "LKR 3,200 extra on next transfer",
    riskReduced: "FX timing improves yield by 0.8%",
    confidence: 76,
    evidence: ["GBP/LKR at 30-day high tomorrow", "Last transfer was 12 days ago"],
    tradeoffs: ["Family may wait 1 extra day for funds"],
    deadline: "Act within 1 day",
    reversible: false,
    urgency: "High",
  },
  {
    id: "d4",
    title: "Cancel Netflix and unused subscriptions",
    category: "Save",
    benefitLkr: 1750,
    benefitLabel: "LKR 1,750/month saved",
    riskReduced: "Cuts discretionary spend by 2.1%",
    confidence: 92,
    evidence: ["No usage in 45 days", "Duplicate streaming on Dialog TV"],
    tradeoffs: ["Family entertainment plan needs alternative"],
    deadline: "Act within 14 days",
    reversible: true,
    urgency: "Low",
  },
  {
    id: "d5",
    title: "Refinance personal loan at lower rate",
    category: "Grow",
    benefitLkr: 42000,
    benefitLabel: "LKR 42,000 interest saved over term",
    riskReduced: "Reduces debt service ratio to 10.8%",
    confidence: 68,
    evidence: ["Current rate 14%", "Seylan promotional rate 11.5% available"],
    tradeoffs: ["Processing fee LKR 5,000", "Credit check required"],
    deadline: "Act within 30 days",
    reversible: false,
    urgency: "Medium",
  },
  {
    id: "d6",
    title: "Top up emergency fund by LKR 25,000",
    category: "Protect",
    benefitLkr: 25000,
    benefitLabel: "Emergency fund reaches 2.8 months",
    riskReduced: "Liquidity score improves to 78/100",
    confidence: 84,
    evidence: ["Current buffer covers 2.1 months", "CEB bill spike expected"],
    tradeoffs: ["Less available for discretionary spend"],
    deadline: "Act within 5 days",
    reversible: true,
    urgency: "High",
  },
  {
    id: "d7",
    title: "Send payment reminder to Negombo Builders",
    category: "Move",
    benefitLkr: 128000,
    benefitLabel: "LKR 128,000 receivable collected",
    riskReduced: "Reduces 60+ day overdue exposure",
    confidence: 71,
    evidence: ["Invoice 34 days overdue", "Client paid on time last quarter"],
    tradeoffs: ["May strain client relationship"],
    deadline: "Act within 2 days",
    reversible: true,
    urgency: "High",
  },
  {
    id: "d8",
    title: "Convert AED remittance at today's peak rate",
    category: "Grow",
    benefitLkr: 1800,
    benefitLabel: "LKR 1,800 better than weekly average",
    riskReduced: "Captures 0.4% FX improvement",
    confidence: 74,
    evidence: ["AED/LKR up 0.6% this week", "Brother's school fees due in 5 days"],
    tradeoffs: ["Transfer fee LKR 250 applies"],
    deadline: "Act today",
    reversible: false,
    urgency: "Medium",
  },
];

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
  const [filter, setFilter] = useState<"All" | Decision["category"]>("All");
  const [sort, setSort] = useState<"impact" | "urgency" | "confidence">("impact");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [executeTarget, setExecuteTarget] = useState<Decision | null>(null);
  const [executing, setExecuting] = useState(false);

  const filtered = useMemo(() => {
    let list = filter === "All" ? DECISIONS : DECISIONS.filter((d) => d.category === filter);
    const urgencyOrder = { High: 0, Medium: 1, Low: 2 };
    list = [...list].sort((a, b) => {
      if (sort === "impact") return b.benefitLkr - a.benefitLkr;
      if (sort === "urgency") return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      return b.confidence - a.confidence;
    });
    return list;
  }, [filter, sort]);

  const totalBenefit = DECISIONS.reduce((s, d) => s + d.benefitLkr, 0);
  const highUrgency = DECISIONS.filter((d) => d.urgency === "High").length;

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setExecuteTarget(null);
      toast.success("Action confirmed", { description: executeTarget?.benefitLabel });
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
          { label: "Pending decisions", value: `${DECISIONS.length}` },
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
                    {formatters.currency({ number: d.benefitLkr, maxFractionDigits: 0 })}
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
          <p className="font-mono font-semibold text-emerald-700">{executeTarget?.benefitLabel}</p>
          <p className="text-xs text-ceyfi-faint">{executeTarget?.riskReduced}</p>
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
