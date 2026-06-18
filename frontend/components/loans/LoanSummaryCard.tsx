"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  return (
    <>
      <Card className="card-glass shadow-brand-lg border-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-seylan-red">
                Current loan
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-seylan-charcoal dark:text-white">
                {loan.type} &middot; {loan.purpose}
              </h2>
            </div>
            <HealthScoreBadge score={loan.health_score} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
            {[
              { label: "Outstanding", value: formatLKR(loan.outstanding_lkr) },
              { label: "Monthly Payment", value: formatLKR(loan.monthly_payment_lkr) },
              { label: "Interest Rate", value: `${loan.interest_rate_pct}%` },
              { label: "Original Amount", value: formatLKR(loan.disbursed_lkr) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-seylan-mist/70 dark:bg-white/[0.06] p-4">
                <div className="text-xs text-muted-foreground dark:text-white/40">{label}</div>
                <div className="mt-1 text-xl font-semibold text-seylan-charcoal dark:text-white">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <Button
            className="w-full bg-seylan-red hover:bg-seylan-red/90 text-white font-semibold"
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
