"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { Loan } from "@/types";
import { formatLKR } from "@/lib/utils";

interface PaymentCountdownProps {
  loan: Loan;
}

export function PaymentCountdown({ loan }: PaymentCountdownProps) {
  const nextDate = new Date(loan.next_payment_date);
  const now = new Date();
  const diffMs = nextDate.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return (
    <Card className="border-ceyfi-line bg-[linear-gradient(135deg,#064e3b_0%,#03130c_100%)] text-white shadow-lg shadow-ceyfi-deep/20">
      <CardContent className="p-5">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <CalendarClock className="h-5 w-5 text-ceyfi-green" />
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          Next payment
        </div>
        <div className="mt-1 text-3xl font-semibold">
          {formatLKR(loan.monthly_payment_lkr)}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-ceyfi-deep">
          <span className="relative flex h-2 w-2 will-change-transform">
            <span className="live-pulse-ring absolute inline-flex h-full w-full rounded-full bg-ceyfi-green" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ceyfi-green" />
          </span>
          due in {daysUntil} days
        </div>
        <div className="mt-3 text-xs text-white/60">
          {nextDate.toLocaleDateString("en-LK", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </CardContent>
    </Card>
  );
}
