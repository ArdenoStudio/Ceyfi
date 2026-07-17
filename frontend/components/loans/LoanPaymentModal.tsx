"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loan } from "@/types";
import { formatLKR, cn } from "@/lib/utils";
import { createPaymentSession, postDemoLoanPayment } from "@/lib/api";
import { toast } from "sonner";
import { PaymentModeToggle } from "@/components/payments/PaymentModeToggle";
import { PayHereButton } from "@/components/payments/PayHereButton";
import { CircleCheck, CreditCard, Wallet } from "lucide-react";
import { motion } from "motion/react";

interface LoanPaymentModalProps {
  loan: Loan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amountLkr: number) => void;
}

type CardGateway = "mpgs" | "payhere";

function CardGatewayTabs({
  value,
  onChange,
}: {
  value: CardGateway;
  onChange: (gateway: CardGateway) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Card payment gateway"
      className="relative flex rounded-lg bg-muted/80 p-1"
    >
      <motion.div
        className="absolute inset-y-1 rounded-md bg-background shadow-sm ring-1 ring-border/60"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          width: "calc(50% - 4px)",
          left: value === "mpgs" ? 4 : "calc(50%)",
        }}
      />
      {(["mpgs", "payhere"] as const).map((gateway) => (
        <button
          key={gateway}
          type="button"
          onClick={() => onChange(gateway)}
          aria-pressed={value === gateway}
          className={cn(
            "relative z-10 flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            value === gateway ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {gateway === "mpgs" ? (
            <CreditCard className="h-3 w-3" />
          ) : (
            <Wallet className="h-3 w-3" />
          )}
          {gateway === "mpgs" ? "Mastercard" : "PayHere"}
        </button>
      ))}
    </div>
  );
}

export function LoanPaymentModal({ loan, isOpen, onClose, onSuccess }: LoanPaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<"card" | "demo">("demo");
  const [cardGateway, setCardGateway] = useState<CardGateway>("mpgs");
  const [amount, setAmount] = useState(loan.monthly_payment_lkr);
  const [submitting, setSubmitting] = useState(false);

  const paymentMetadata = {
    loan_id: loan.loan_id,
    user_id: loan.user_id,
    installment_number: loan.payments_made + 1,
  };

  async function handleMpgsSubmit() {
    if (!amount || amount <= 0) return;
    setSubmitting(true);

    try {
      const session = await createPaymentSession({
        amount_lkr: amount,
        purpose: "loan",
        description: "Loan instalment -- " + loan.loan_id,
        metadata: paymentMetadata,
      });
      window.location.href = session.checkout_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isUnconfigured = msg.includes("[503]") || msg.includes("not enabled");
      toast.error(
        isUnconfigured
          ? "Card payments are not yet activated on this deployment."
          : "Could not create payment session. Please try again."
      );
      setSubmitting(false);
    }
  }

  async function handleDemoSubmit() {
    if (!amount || amount <= 0) return;
    setSubmitting(true);

    try {
      await postDemoLoanPayment({
        user_id: loan.user_id,
        loan_id: loan.loan_id,
        amount_lkr: amount,
      });
      toast.custom(() => (
        <div className="flex items-start gap-3 rounded-xl border border-[#059669]/30 bg-[#04241a] px-4 py-3.5 shadow-[0_8px_32px_rgba(5,150,105,0.25)] w-[356px]">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669]/15">
            <CircleCheck className="h-4 w-4 text-[#059669]" />
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
    } catch {
      toast.error("Could not simulate payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      modal="trap-focus"
    >
      <DialogContent aria-modal="true">
        <DialogHeader>
          <DialogTitle>Make Loan Payment</DialogTitle>
          <DialogDescription>
            Pay an instalment on loan {loan.loan_id} using card or demo simulation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <PaymentModeToggle value={paymentMode} onChange={setPaymentMode} />

          {paymentMode === "card" ? (
            <CardGatewayTabs value={cardGateway} onChange={setCardGateway} />
          ) : null}

          {/* Loan summary */}
          <div className="rounded-lg border border-ceyfi-line bg-ceyfi-sprout/60 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan</span>
              <span className="font-mono font-medium text-ceyfi-ink">{loan.loan_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-semibold text-ceyfi-ink">{formatLKR(loan.outstanding_lkr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly instalment</span>
              <span className="font-semibold text-ceyfi-ink">{formatLKR(loan.monthly_payment_lkr)}</span>
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
            cardGateway === "mpgs" ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Mastercard test gateway. Approved test card:{" "}
                <span className="font-mono font-semibold text-ceyfi-ink">5123 4500 0000 0008</span>
                , expiry <span className="font-mono font-semibold text-ceyfi-ink">01/39</span>,
                CVV <span className="font-mono font-semibold text-ceyfi-ink">100</span>.
                Real cards are not accepted on this test gateway.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                PayHere sandbox — you will be redirected to PayHere to complete payment securely.
              </p>
            )
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
            {paymentMode === "demo" ? (
              <Button
                className="flex-1 bg-ceyfi-green hover:bg-ceyfi-green/90 text-white"
                disabled={submitting || !amount || amount <= 0}
                onClick={handleDemoSubmit}
              >
                {submitting ? "Processing…" : `Simulate ${formatLKR(amount)}`}
              </Button>
            ) : cardGateway === "payhere" ? (
              <PayHereButton
                amountLkr={amount}
                purpose="loan"
                description={"Loan instalment -- " + loan.loan_id}
                metadata={paymentMetadata}
                disabled={submitting || !amount || amount <= 0}
                className="flex-1 bg-ceyfi-green hover:bg-ceyfi-green/90 text-white"
              >
                Pay {formatLKR(amount)}
              </PayHereButton>
            ) : (
              <Button
                className="flex-1 bg-ceyfi-green hover:bg-ceyfi-green/90 text-white"
                disabled={submitting || !amount || amount <= 0}
                onClick={handleMpgsSubmit}
              >
                {submitting ? "Redirecting…" : `Pay ${formatLKR(amount)}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
