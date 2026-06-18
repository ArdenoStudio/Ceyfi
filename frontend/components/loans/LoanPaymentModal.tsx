"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loan } from "@/types";
import { formatLKR } from "@/lib/utils";
import { createPaymentSession, postDemoLoanPayment } from "@/lib/api";
import { toast } from "sonner";
import { PaymentModeToggle } from "@/components/payments/PaymentModeToggle";
import { CircleCheck } from "lucide-react";

interface LoanPaymentModalProps {
  loan: Loan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amountLkr: number) => void;
}

export function LoanPaymentModal({ loan, isOpen, onClose, onSuccess }: LoanPaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<"card" | "demo">("card");
  const [amount, setAmount] = useState(loan.monthly_payment_lkr);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!amount || amount <= 0) return;
    setSubmitting(true);

    try {
      if (paymentMode === "card") {
        const session = await createPaymentSession({
          amount_lkr: amount,
          purpose: "loan",
          description: "Loan instalment -- " + loan.loan_id,
          metadata: {
            loan_id: loan.loan_id,
            user_id: loan.user_id,
            installment_number: loan.payments_made + 1,
          },
        });
        window.location.href = session.checkout_url;
        return;
      }

      // Demo mode — hit backend to update loan state + Supabase
      await postDemoLoanPayment({
        user_id: loan.user_id,
        loan_id: loan.loan_id,
        amount_lkr: amount,
      });
      toast.custom(() => (
        <div className="flex items-start gap-3 rounded-xl border border-[#E31821]/30 bg-[#0c0407] px-4 py-3.5 shadow-[0_8px_32px_rgba(227,24,33,0.25)] w-[356px]">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E31821]/15">
            <CircleCheck className="h-4 w-4 text-[#E31821]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Payment simulated</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/50">
              {formatLKR(amount)} · Loan {loan.loan_id} · Instalment {loan.payments_made + 1}
            </p>
          </div>
        </div>
      ), { duration: 5000 });
      onSuccess?.(amount);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isUnconfigured = msg.includes("[503]") || msg.includes("not enabled");
      toast.error(
        isUnconfigured
          ? "Card payments are not yet activated on this deployment."
          : "Could not create payment session. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make Loan Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <PaymentModeToggle value={paymentMode} onChange={setPaymentMode} />

          {/* Loan summary */}
          <div className="rounded-lg border border-seylan-border bg-seylan-mist/60 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan</span>
              <span className="font-mono font-medium text-seylan-charcoal">{loan.loan_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-semibold text-seylan-charcoal">{formatLKR(loan.outstanding_lkr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly instalment</span>
              <span className="font-semibold text-seylan-charcoal">{formatLKR(loan.monthly_payment_lkr)}</span>
            </div>
          </div>

          {/* Amount editor */}
          <div>
            <Label htmlFor="loan-amount">Payment amount (LKR)</Label>
            <Input
              id="loan-amount"
              type="number"
              min={1}
              step={500}
              value={Number.isFinite(amount) ? amount : ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setAmount(Number.isFinite(v) && v > 0 ? v : 0);
              }}
              className="mt-1"
            />
            {amount > loan.outstanding_lkr && (
              <p className="mt-1 text-xs text-amber-600">
                Amount exceeds outstanding balance of {formatLKR(loan.outstanding_lkr)}.
              </p>
            )}
          </div>

          {/* Footer note */}
          {paymentMode === "card" ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Mastercard test gateway. Approved test card:{" "}
              <span className="font-mono font-semibold text-seylan-charcoal">5123 4500 0000 0008</span>
              , expiry <span className="font-mono font-semibold text-seylan-charcoal">01/39</span>,
              CVV <span className="font-mono font-semibold text-seylan-charcoal">100</span>.
              Real cards are not accepted on this test gateway.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Simulates an instalment payment internally. No card or real transaction required.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-seylan-red hover:bg-seylan-red/90 text-white"
              disabled={submitting || !amount || amount <= 0}
              onClick={handleSubmit}
            >
              {submitting
                ? paymentMode === "card" ? "Redirecting…" : "Processing…"
                : paymentMode === "card"
                  ? `Pay ${formatLKR(amount)}`
                  : `Simulate ${formatLKR(amount)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
