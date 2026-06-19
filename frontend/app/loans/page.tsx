"use client";

import { useEffect, useState, useCallback } from "react";
import { getLoans } from "@/lib/api";
import { Loan } from "@/types";
import { toast } from "sonner";
import { LoanSummaryCard } from "@/components/loans/LoanSummaryCard";
import { RepaymentProgressBar } from "@/components/loans/RepaymentProgressBar";
import { PaymentCountdown } from "@/components/loans/PaymentCountdown";
import { AIAdvisorPanel } from "@/components/loans/AIAdvisorPanel";
import { RepaymentTimeline } from "@/components/loans/RepaymentTimeline";
import { LoanIntelligenceCharts } from "@/components/loans/LoanIntelligenceCharts";
import { InsightActionStrip } from "@/components/insights/InsightActionStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AlertTriangle, Bot, CalendarCheck, Gauge, WalletCards } from "lucide-react";

const ASSISTANT_PROMPT =
  "Show me repayment scenarios for my current loan: paying today, paying three days late, and making a partial payment.";

export default function LoansPage() {
  const { loanUserId } = useCurrentUser();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = loanUserId;

  useEffect(() => {
    // Show success toast when redirected back from MPGS payment
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("paid") === "1") {
        toast.success("Payment confirmed", {
          description: "Your loan payment has been processed. Instalment marked as paid.",
        });
        // Clean the query param from the URL without a reload
        const clean = window.location.pathname;
        window.history.replaceState({}, "", clean);
      }
    }
  }, []);

  const fetchLoan = useCallback(() => {
    let cancelled = false;
    getLoans(userId)
      .then((data) => {
        if (cancelled) return;
        const loans = data as Loan | Loan[];
        setLoan(Array.isArray(loans) ? loans[0] : loans);
      })
      .catch(() => { if (!cancelled) setLoan(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => { return fetchLoan(); }, [fetchLoan]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div data-module="loans" className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Loan health"
          title="Understand your repayment position at a glance"
          description="A calmer loan dashboard that explains what is due next, how much is complete, and which action keeps the account healthy."
        />
        <ErrorState
          title="No loan data available"
          message="We couldn't load your loan details. Check your connection or try again."
          onRetry={fetchLoan}
        />
      </div>
    );
  }

  const progressPct = Math.round((loan.payments_made / loan.total_payments) * 100);
  const nextDate = new Date(loan.next_payment_date);
  const daysUntil = Math.max(
    0,
    Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const riskCopy =
    loan.health_score === "ON_TRACK"
      ? "On track"
      : loan.health_score === "AT_RISK"
        ? "Watch closely"
        : "Needs action";

  return (
    <div data-module="loans" className="stagger mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Loan health"
        title="Understand your repayment position at a glance"
        description="A calmer loan dashboard that explains what is due next, how much is complete, and which action keeps the account healthy."
        
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <LoanSummaryCard loan={loan} onPaymentSuccess={fetchLoan} />
        <PaymentCountdown loan={loan} />
      </div>

      <InsightActionStrip
        eyebrow="Early payoff"
        title="Paying 6 months early could save meaningful interest"
        insights={[
          {
            label: "Interest saved",
            value: `LKR ${Math.round(loan.outstanding_lkr * 0.025).toLocaleString()}`,
            detail: "Estimated savings if you clear the loan 6 months ahead of schedule.",
            tone: "success",
            icon: Gauge,
          },
          {
            label: "Progress",
            value: `${progressPct}%`,
            detail: `${loan.payments_made} of ${loan.total_payments} instalments complete.`,
            tone: "info",
            icon: CalendarCheck,
          },
          {
            label: "Risk",
            value: riskCopy,
            detail: `Next payment LKR ${loan.monthly_payment_lkr.toLocaleString()} in ${daysUntil} days.`,
            tone: loan.health_score === "ON_TRACK" ? "success" : "alert",
            icon: AlertTriangle,
          },
        ]}
        actions={[
          {
            label: "Ask loan advisor",
            icon: Bot,
            href: `/assistant?prompt=${encodeURIComponent(ASSISTANT_PROMPT)}`,
          },
          { label: "Simulate payoff", icon: WalletCards, href: "/scenarios" },
        ]}
      />

      <InsightActionStrip
        eyebrow="Repayment signal"
        title="Your next safest move"
        insights={[
          {
            label: "Health",
            value: riskCopy,
            detail:
              loan.health_score === "ON_TRACK"
                ? "Payment pattern is healthy. Keep the next date protected."
                : "A payment reminder and partial plan can reduce stress now.",
            tone: loan.health_score === "ON_TRACK" ? "success" : "alert",
            icon: Gauge,
          },
          {
            label: "Due window",
            value: `${daysUntil} days`,
            detail: "Paying before the due date keeps the account from sliding into risk.",
            tone: daysUntil <= 3 ? "alert" : "info",
            icon: CalendarCheck,
          },
          {
            label: "Progress",
            value: `${progressPct}%`,
            detail: `${loan.payments_made} of ${loan.total_payments} repayments are already complete.`,
            tone: "neutral",
            icon: WalletCards,
          },
        ]}
        actions={[
          {
            label: "Ask scenario",
            icon: Bot,
            href: `/assistant?prompt=${encodeURIComponent(ASSISTANT_PROMPT)}`,
          },
          { label: "View timeline", icon: CalendarCheck, href: "#repayment-timeline" },
          { label: "Risk check", icon: AlertTriangle, href: "#loan-advisor" },
        ]}
      />

      <RepaymentProgressBar loan={loan} />
      <section id="loan-advisor" className="scroll-mt-6">
        <AIAdvisorPanel userId={userId} />
      </section>
      <section id="repayment-timeline" className="scroll-mt-6">
        <RepaymentTimeline schedule={loan.schedule} />
      </section>

      <section id="loan-intelligence" className="scroll-mt-6">
        <LoanIntelligenceCharts />
      </section>
    </div>
  );
}
