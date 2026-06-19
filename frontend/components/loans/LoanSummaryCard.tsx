"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { ProgressCircle } from "@/components/charts/ProgressCircle";
import { Loan } from "@/types";
import { formatLKR } from "@/lib/utils";
import { HealthScoreBadge } from "./HealthScoreBadge";
import { LoanPaymentModal } from "./LoanPaymentModal";

interface LoanSummaryCardProps {
  loan: Loan;
  onPaymentSuccess?: () => void;
}

export function LoanSummaryCard({ loan, onPaymentSuccess }: LoanSummaryCardProps) {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const progressPct = Math.round((loan.payments_made / loan.total_payments) * 100);
  const nextDate = new Date(loan.next_payment_date);
  const daysUntil = Math.max(
    0,
    Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <>
      <Card className="card-glass shadow-brand-lg border-0">
        <CardContent className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
                Current loan
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-ceyfi-ink dark:text-white">
                {loan.type} &middot; {loan.purpose}
              </h2>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ceyfi-sprout px-3 py-1 text-xs font-semibold text-ceyfi-deep dark:bg-white/10 dark:text-white">
                <CalendarClock className="h-3.5 w-3.5 text-ceyfi-green" />
                {daysUntil} days until next payment
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProgressCircle value={progressPct} size={88} strokeWidth={8}>
                <span className="text-sm font-semibold text-ceyfi-ink dark:text-white">
                  {progressPct}%
                </span>
              </ProgressCircle>
              <HealthScoreBadge score={loan.health_score} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
            {[
              { label: "Outstanding", value: formatLKR(loan.outstanding_lkr) },
              { label: "Monthly Payment", value: formatLKR(loan.monthly_payment_lkr) },
              { label: "Interest Rate", value: `${loan.interest_rate_pct}%` },
              { label: "Original Amount", value: formatLKR(loan.disbursed_lkr) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-ceyfi-sprout/70 dark:bg-white/[0.06] p-4">
                <div className="text-xs text-muted-foreground dark:text-white/40">{label}</div>
                <div className="mt-1 text-xl font-semibold text-ceyfi-ink dark:text-white">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <Button
            className="w-full bg-ceyfi-green hover:bg-ceyfi-green/90 text-white font-semibold"
            disabled={loan.outstanding_lkr === 0}
            onClick={() => setPayModalOpen(true)}
          >
            {loan.outstanding_lkr === 0 ? "Loan fully repaid" : "Make Payment"}
          </Button>
        </CardContent>
      </Card>

      <LoanPaymentModal
        loan={loan}
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSuccess={onPaymentSuccess}
      />
    </>
  );
}
