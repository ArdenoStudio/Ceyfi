"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressCircle } from "@/components/charts/ProgressCircle";
import { Loan } from "@/types";
import { formatLKR } from "@/lib/utils";

interface RepaymentProgressBarProps {
  loan: Loan;
}

export function RepaymentProgressBar({ loan }: RepaymentProgressBarProps) {
  const pct = Math.round((loan.payments_made / loan.total_payments) * 100);
  const remaining = loan.total_payments - loan.payments_made;
  const principalRepaid = Math.max(0, loan.disbursed_lkr - loan.outstanding_lkr);

  return (
    <Card className="card-glass shadow-brand border-0">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <ProgressCircle value={pct} size={112} strokeWidth={10}>
            <div className="text-center">
              <div className="text-2xl font-semibold text-ceyfi-ink dark:text-white">{pct}%</div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ceyfi-faint">
                repaid
              </div>
            </div>
          </ProgressCircle>
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex flex-col justify-between gap-1 sm:flex-row">
              <span className="font-medium text-ceyfi-ink dark:text-white">
                Paid: {loan.payments_made} of {loan.total_payments} payments
              </span>
              <span className="text-muted-foreground dark:text-white/40">
                Remaining: {remaining}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ceyfi-sprout dark:bg-white/[0.08]">
              <div
                className="progress-bar-animate h-full rounded-full bg-gradient-to-r from-ceyfi-green to-ceyfi-mint"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground dark:text-white/40 sm:flex-row sm:justify-between">
          <span>
            {formatLKR(principalRepaid)} repaid of {formatLKR(loan.disbursed_lkr)} disbursed (principal portion)
          </span>
          <span className="font-medium text-ceyfi-ink dark:text-white/70">
            {formatLKR(loan.outstanding_lkr)} outstanding (includes interest)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
