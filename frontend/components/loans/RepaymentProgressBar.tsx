"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-col justify-between gap-1 text-sm sm:flex-row">
          <span className="font-medium text-seylan-charcoal dark:text-white">
            Paid: {loan.payments_made} of {loan.total_payments} payments
          </span>
          <span className="text-muted-foreground dark:text-white/40">
            Remaining: {remaining}
          </span>
        </div>
        <Progress value={pct} className="h-3" />
        <div className="text-center text-sm font-semibold text-seylan-charcoal dark:text-white">
          {pct}% complete
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground dark:text-white/40 sm:flex-row sm:justify-between">
          <span>
            {formatLKR(principalRepaid)} repaid of {formatLKR(loan.disbursed_lkr)} disbursed (principal portion)
          </span>
          <span className="font-medium text-seylan-charcoal dark:text-white/70">
            {formatLKR(loan.outstanding_lkr)} outstanding (includes interest)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
