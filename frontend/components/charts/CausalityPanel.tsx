"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn, formatters } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/chartUtils";

export interface CausalityEvent {
  cause: string;
  probability: number;
  impact: number;
}

export interface ActionPlan {
  id: string;
  title: string;
  benefit: number;
  risk: "Low" | "Medium" | "High";
  reversible: boolean;
  effort: string;
}

interface CausalityPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  projectedBalance: number;
  events: CausalityEvent[];
  actionPlans: ActionPlan[];
  onPlanSelect?: (plan: ActionPlan) => void;
}

const riskStyles = {
  Low: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-rose-50 text-rose-700",
} as const;

export function CausalityPanel({
  open,
  onOpenChange,
  date,
  projectedBalance,
  events,
  actionPlans,
  onPlanSelect,
}: CausalityPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-ceyfi-line bg-ceyfi-paper sm:max-w-md"
      >
        <SheetHeader className="border-b border-ceyfi-line/60 pb-4">
          <SheetTitle className="font-heading text-lg font-semibold tracking-[-0.03em] text-ceyfi-ink">
            Why does the balance dip here?
          </SheetTitle>
          <SheetDescription className="text-sm text-ceyfi-muted">
            <span className="font-medium text-ceyfi-ink">{date}</span>
            {" · "}
            Projected{" "}
            <span className="font-mono font-semibold text-ceyfi-ink">
              {formatters.currency({
                number: projectedBalance,
                maxFractionDigits: 0,
              })}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-5">
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ceyfi-muted">
              Cause chain
            </h3>
            <div className="mt-3 space-y-3">
              {events.map((event) => (
                <div
                  key={event.cause}
                  className="rounded-xl border border-ceyfi-line/70 bg-ceyfi-canvas p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ceyfi-ink">
                      {event.cause}
                    </p>
                    <span className="shrink-0 font-mono text-xs font-semibold text-rose-700">
                      −
                      {formatters.currency({
                        number: event.impact,
                        maxFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ceyfi-line/60">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${event.probability}%`,
                          backgroundColor: CHART_COLORS.green,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-ceyfi-muted">
                      {event.probability}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ceyfi-muted">
              Action plans
            </h3>
            <div className="mt-3 space-y-3">
              {actionPlans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-xl border border-ceyfi-line/70 bg-white p-4"
                >
                  <p className="font-heading text-sm font-semibold text-ceyfi-ink">
                    {plan.title}
                  </p>
                  <p className="mt-2 font-mono text-sm font-bold text-emerald-700">
                    +
                    {formatters.currency({
                      number: plan.benefit,
                      maxFractionDigits: 0,
                    })}{" "}
                    protected
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px]", riskStyles[plan.risk])}
                    >
                      {plan.risk} risk
                    </Badge>
                    {plan.reversible ? (
                      <Badge
                        variant="outline"
                        className="border-ceyfi-line text-[10px] text-ceyfi-muted"
                      >
                        Reversible
                      </Badge>
                    ) : null}
                    <span className="text-[10px] text-ceyfi-faint">
                      {plan.effort}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="mt-4 w-full bg-ceyfi-green text-white hover:bg-ceyfi-deep"
                    onClick={() => onPlanSelect?.(plan)}
                  >
                    Select this plan
                  </Button>
                </article>
              ))}
            </div>
          </section>
        </div>

        <SheetFooter className="border-t border-ceyfi-line/60">
          <Link
            href="/scenarios"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ceyfi-green hover:text-ceyfi-deep"
          >
            Simulate this scenario
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function buildCausalityForPoint(
  date: string,
  balance: number
): { events: CausalityEvent[]; actionPlans: ActionPlan[] } {
  const day = new Date(date).getDate();
  const isEmiWindow = day >= 23 && day <= 27;
  const isSchoolFees = day >= 3 && day <= 7;

  const events: CausalityEvent[] = isEmiWindow
    ? [
        {
          cause: "Personal loan EMI due",
          probability: 98,
          impact: 22000,
        },
        {
          cause: "Household spend before payday",
          probability: 72,
          impact: 8500,
        },
        {
          cause: "Dialog bill auto-debit",
          probability: 65,
          impact: 2800,
        },
      ]
    : isSchoolFees
      ? [
          {
            cause: "School fees payment",
            probability: 95,
            impact: 15000,
          },
          {
            cause: "Keells weekly grocery run",
            probability: 80,
            impact: 4200,
          },
        ]
      : [
          {
            cause: "Higher-than-usual household spend",
            probability: 68,
            impact: 6200,
          },
          {
            cause: "CEB electricity bill",
            probability: 55,
            impact: 4200,
          },
          {
            cause: "No salary credit yet this cycle",
            probability: 42,
            impact: Math.max(0, 185000 - balance),
          },
        ];

  const actionPlans: ActionPlan[] = [
    {
      id: "move-savings",
      title: `Move LKR ${Math.min(22000, Math.round(balance * 0.1)).toLocaleString()} from savings bucket`,
      benefit: Math.min(22000, Math.round(balance * 0.1)),
      risk: "Low",
      reversible: true,
      effort: "2 minutes",
    },
    {
      id: "delay-subscription",
      title: "Pause Netflix and defer non-essential subscriptions",
      benefit: 1750,
      risk: "Low",
      reversible: true,
      effort: "5 minutes",
    },
    {
      id: "emi-reschedule",
      title: "Request EMI date shift by 5 days",
      benefit: 22000,
      risk: "Medium",
      reversible: false,
      effort: "1 business day",
    },
  ];

  return { events, actionPlans };
}
