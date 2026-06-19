"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatLKR } from "@/lib/utils";
import { createPaymentSession, postTaxJarTrigger } from "@/lib/api";
import { toast } from "sonner";
import { Transaction } from "@/types";
import { PaymentModeToggle } from "@/components/payments/PaymentModeToggle";
import { CreditCard, Loader2, CircleCheck } from "lucide-react";
import {
  CategoryBar,
  CEYFI_COLORS,
  Metric,
} from "@/components/charts/TremorStyle";

interface TaxJarPanelProps {
  userId: string;
  initialBalance: number;
  projectedTaxNeed?: number;
  coveragePct?: number;
  onNewTransaction?: (tx: Transaction) => void;
}

export function TaxJarPanel({
  userId,
  initialBalance,
  projectedTaxNeed = 0,
  coveragePct = 0,
  onNewTransaction,
}: TaxJarPanelProps) {
  const [displayBalance, setDisplayBalance] = useState(initialBalance);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardAmount, setCardAmount] = useState(8200);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"card" | "demo">("card");
  const animRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (displayBalance === initialBalance) return;
    const diff = initialBalance - displayBalance;
    const steps = 30;
    const increment = diff / steps;
    let current = displayBalance;
    let step = 0;

    animRef.current = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayBalance(initialBalance);
        clearInterval(animRef.current);
      } else {
        setDisplayBalance(Math.round(current));
      }
    }, 800 / steps);

    return () => clearInterval(animRef.current);
  }, [initialBalance, displayBalance]);

  async function handlePayment() {
    if (!cardAmount || cardAmount <= 0) return;
    setSubmitting(true);
    try {
      if (paymentMode === "card") {
        const session = await createPaymentSession({
          amount_lkr: cardAmount,
          purpose: "tax_jar_inbound",
          description: "Customer payment — Silva Hardware",
          metadata: { user_id: userId, tax_rate_pct: 10 },
        });
        window.location.href = session.checkout_url;
        return;
      }

      // Demo mode — hit mock endpoint to simulate inbound payment
      const taxSaved = Math.round(cardAmount * 0.1);
      await postTaxJarTrigger({
        user_id: userId,
        incoming_amount_lkr: cardAmount,
        description: "Customer payment — Silva Hardware (demo)",
      });
      onNewTransaction?.({
        transaction_id: `biz_demo_tax_${Date.now()}`,
        type: "credit",
        amount_lkr: cardAmount,
        description: `Card payment — Silva Hardware`,
        merchant: "Silva Hardware & Electricals",
        timestamp: new Date().toISOString(),
        account_id: "SEY-BIZ-001",
      } as Transaction);
      toast.custom(() => (
        <div className="flex items-start gap-3 rounded-xl border border-[#059669]/30 bg-[#04241a] px-4 py-3.5 shadow-[0_8px_32px_rgba(5,150,105,0.25)] w-[356px]">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669]/15">
            <CircleCheck className="h-4 w-4 text-[#059669]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Payment simulated</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/50">
              {formatLKR(cardAmount)} received · {formatLKR(taxSaved)} saved to Tax Jar
            </p>
          </div>
        </div>
      ), { duration: 5000 });
      setCardModalOpen(false);
    } catch {
      toast.error("Could not process payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <Card className="border-ceyfi-line dark:border-[#34D399]/20 bg-[linear-gradient(135deg,#f7fdfa_0%,#dcf3e6_100%)] dark:bg-[linear-gradient(135deg,#0b1a10_0%,#06120a_100%)] shadow-lg shadow-ceyfi-mint/10">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
              Auto-save rule
            </p>
            <h3 className="font-heading text-xl font-semibold text-ceyfi-ink dark:text-white">
              Tax Jar
            </h3>
          </div>
          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
            ACTIVE
          </span>
        </div>

        <Metric
          label="Tax jar balance"
          value={formatLKR(displayBalance)}
          deltaType={coveragePct >= 60 ? "moderateIncrease" : coveragePct >= 30 ? "unchanged" : "moderateDecrease"}
          deltaLabel={
            projectedTaxNeed > 0
              ? `${coveragePct}% of projected need`
              : "10% auto-save active"
          }
          isIncreasePositive
          className="mb-3"
          valueClassName="text-3xl sm:text-4xl"
        />

        <div className="text-xs text-muted-foreground dark:text-white/40 mb-4">
          Rule: 10% of every incoming payment
        </div>

        {projectedTaxNeed > 0 ? (
          <CategoryBar
            values={[displayBalance, Math.max(0, projectedTaxNeed - displayBalance)]}
            colors={[CEYFI_COLORS.green, CEYFI_COLORS.muted]}
            labels={["Saved", "Remaining need"]}
            marker={{
              value: displayBalance,
              tooltip: `${coveragePct}% coverage · ${formatLKR(displayBalance)} saved`,
              showAnimation: true,
            }}
            valueFormatter={(value) => formatLKR(value)}
            showLabels={false}
            className="mb-4"
          />
        ) : (
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-white dark:bg-white/10">
            <div
              className="h-full rounded-full bg-ceyfi-mint transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.max(0, coveragePct))}%` }}
            />
          </div>
        )}

        <Button
          className="w-full rounded-full bg-ceyfi-green hover:bg-ceyfi-green/90 text-white font-semibold"
          onClick={() => { setPaymentMode("card"); setCardModalOpen(true); }}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Accept Card Payment
        </Button>
      </CardContent>
    </Card>

    <Dialog open={cardModalOpen} onOpenChange={(o) => { if (!o) setCardModalOpen(false); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept Card Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <PaymentModeToggle
            value={paymentMode}
            onChange={setPaymentMode}
            cardLabel="Pay with Card"
            demoLabel="Demo Mode"
            size="sm"
          />

          <div className="rounded-lg bg-ceyfi-sprout/60 border border-ceyfi-line p-3 text-sm">
            <p className="font-medium text-ceyfi-ink">Silva Hardware &amp; Electricals</p>
            <p className="text-xs text-muted-foreground mt-0.5">10% auto-saved to Tax Jar on receipt</p>
          </div>
          <div>
            <Label htmlFor="card-amount">Amount (LKR)</Label>
            <Input
              id="card-amount"
              type="number"
              min={1}
              step={100}
              value={Number.isFinite(cardAmount) ? cardAmount : ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setCardAmount(Number.isFinite(v) && v > 0 ? v : 0);
              }}
              className="mt-1"
            />
            {cardAmount > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tax Jar will receive:{" "}
                <span className="font-semibold text-ceyfi-ink">
                  {formatLKR(Math.round(cardAmount * 0.1))}
                </span>
              </p>
            )}
          </div>
          {paymentMode === "card" && (
            <p className="text-[11px] text-muted-foreground">
              Approved MPGS test card:{" "}
              <span className="font-mono font-semibold text-ceyfi-ink">5123 4500 0000 0008</span>
              , expiry <span className="font-mono font-semibold text-ceyfi-ink">01/39</span>,
              CVV <span className="font-mono font-semibold text-ceyfi-ink">100</span>.
              Real cards are not accepted on this test gateway.
            </p>
          )}
          {paymentMode === "demo" && (
            <p className="text-[11px] text-muted-foreground">
              Simulates an inbound card payment instantly — no card required. Tax Jar balance updates in real time.
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCardModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-ceyfi-green hover:bg-ceyfi-green/90 text-white"
              disabled={submitting || !cardAmount || cardAmount <= 0}
              onClick={handlePayment}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting
                ? (paymentMode === "card" ? "Redirecting..." : "Simulating...")
                : paymentMode === "card"
                ? `Charge ${formatLKR(cardAmount)}`
                : `Simulate ${formatLKR(cardAmount)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
