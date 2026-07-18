"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLKR } from "@/lib/utils";
import {
  createPaymentSession,
  getSandboxTransferAccounts,
  postWalletTransfer,
} from "@/lib/api";
import {
  GBP_LKR_RATE,
  toLkr,
  REMITTANCE_CURRENCIES,
  type RemittanceCurrency,
} from "@/lib/remittance-fx";
// LKR_CURRENCY exported for CurrencyExchangeCard use
import { toast } from "sonner";
import { PaymentModeToggle } from "@/components/payments/PaymentModeToggle";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  CreditCard,
  RefreshCw,
  Send,
} from "lucide-react";
import { VerificationCard } from "@/components/ui/verification-card";
import { CurrencyExchangeCard } from "@/components/wallet/CurrencyExchangeCard";
import { PinGate } from "@/components/payments/PinGate";
import { PaymentReceipt } from "@/components/payments/PaymentReceipt";

interface SendMoneyModalProps {
  senderId: string;
  recipientId: string;
  recipientAccountHolder: string;
  allocations: Record<string, number>;
  onSuccess: (amountLkr?: number, amountGbp?: number, currency?: RemittanceCurrency) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUCKET_COLORS: Record<string, string> = {
  school: "#E0AF49",
  household: "#E31821",
  savings: "#10B981",
};

function getBucketColor(id: string): string {
  const key = id.toLowerCase().replace(/_/g, "");
  for (const [k, v] of Object.entries(BUCKET_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "#8B5CF6";
}

const DEFAULT_CURRENCY = REMITTANCE_CURRENCIES[0]; // GBP

export function SendMoneyModal({
  senderId,
  recipientId,
  recipientAccountHolder,
  allocations,
  onSuccess,
  open,
  onOpenChange,
}: SendMoneyModalProps) {
  const [paymentMode, setPaymentMode] = useState<"card" | "demo">("demo");
  const [amount, setAmount] = useState(600);
  const [currency, setCurrency] = useState<RemittanceCurrency>(DEFAULT_CURRENCY);
  const [showFxCalc, setShowFxCalc] = useState(false);
  const [sending, setSending] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [receipt, setReceipt] = useState<{
    amountLkr: number;
    reference: string;
    detail: string;
  } | null>(null);
  const [sandboxRouting, setSandboxRouting] = useState<{
    source_account: string;
    destination_account: string;
  } | null>(null);
  const [sandboxRoutingLoaded, setSandboxRoutingLoaded] = useState(false);

  const amountLkr = toLkr(amount, currency);
  // For API compatibility: always pass GBP equivalent
  const amountGbpEquiv = Math.round((amountLkr / GBP_LKR_RATE) * 100) / 100;
  const isValid = Number.isFinite(amount) && amount > 0;

  function handleDialogOpenChange(next: boolean) {
    if (!next) {
      setSandboxRouting(null);
      setSandboxRoutingLoaded(false);
      setPinOpen(false);
      setReceipt(null);
    }
    onOpenChange(next);
  }

  function requestSend() {
    if (!isValid || sending) return;
    setPinOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getSandboxTransferAccounts()
      .then((data) => {
        if (cancelled) return;
        if (data.source_account && data.destination_account) {
          setSandboxRouting({
            source_account: data.source_account,
            destination_account: data.destination_account,
          });
        } else {
          setSandboxRouting(null);
        }
      })
      .catch(() => { if (!cancelled) setSandboxRouting(null); })
      .finally(() => { if (!cancelled) setSandboxRoutingLoaded(true); });
    return () => { cancelled = true; };
  }, [open]);

  const hubRecipientLine = recipientAccountHolder.trim()
    ? `${recipientAccountHolder.trim()} · ${recipientId}`
    : recipientId;

  function buildSuccessToastDescription(): string {
    const lines: string[] = [`Hub wallet: ${hubRecipientLine}`];
    if (sandboxRouting?.source_account && sandboxRouting?.destination_account) {
      lines.push(`Sandbox: ${sandboxRouting.source_account} → ${sandboxRouting.destination_account}`);
    }
    return lines.join("\n");
  }

  async function handleSubmit() {
    setSending(true);
    try {
      if (paymentMode === "card") {
        const bucketAllocations = Object.entries(allocations).map(
          ([id, pct]) => ({ id, label: id.replace(/_/g, " "), pct })
        );
        const session = await createPaymentSession({
          amount_lkr: amountLkr,
          purpose: "remittance",
          description: `Remittance to ${recipientAccountHolder.trim() || recipientId}`,
          metadata: {
            account_id: "SEY-ACC-002",
            buckets: bucketAllocations,
            sender_amount_gbp: amountGbpEquiv,
            fx_rate: currency.lkrRate,
          },
        });
        setPinOpen(false);
        // eslint-disable-next-line react-hooks/immutability -- external MPGS redirect
        window.location.href = session.checkout_url;
        return;
      }
      const transfer = await postWalletTransfer({
        sender_account_id: senderId,
        recipient_account_id: recipientId,
        amount_lkr: amountLkr,
        corridor: `${currency.code}->LKR`,
        allocation_rules: allocations,
      }) as { transfer_id?: string; status?: string; note?: string };
      if (transfer?.status === "FAILED") {
        setPinOpen(false);
        toast.error(transfer.note || "Transfer failed. Please try again.");
        return;
      }
      const reference =
        transfer?.transfer_id ||
        `TRF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      setPinOpen(false);
      setReceipt({
        amountLkr: amountLkr,
        reference,
        detail: buildSuccessToastDescription(),
      });
      toast.custom(() => (
        <div className="flex items-start gap-3 rounded-xl border border-[#E31821]/30 bg-[#0c0407] px-4 py-3.5 shadow-[0_8px_32px_rgba(227,24,33,0.25)] w-[356px]">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E31821]/15">
            <CircleCheck className="h-4 w-4 text-[#E31821]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">
              Sent {formatLKR(amountLkr)}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/50">
              {buildSuccessToastDescription()}
            </p>
          </div>
        </div>
      ), { duration: 4000 });
      onSuccess(amountLkr, amount, currency);
    } catch (err) {
      setPinOpen(false);
      const msg = err instanceof Error ? err.message : "";
      const isUnconfigured = msg.includes("[503]") || msg.includes("not enabled");
      toast.error(
        paymentMode === "card"
          ? isUnconfigured
            ? "Card payments are not yet activated. Use Demo Mode to test."
            : "Could not create payment session. Please try again."
          : "Transfer failed. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
    <Dialog open={open && !receipt} onOpenChange={handleDialogOpenChange} modal="trap-focus">
      <DialogContent
        className="max-w-sm overflow-hidden border border-border bg-popover p-0 shadow-2xl"
        showCloseButton={false}
        aria-modal="true"
      >
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#E31821] via-[#E0AF49] to-[#E31821]" />

        <div className="relative flex flex-col gap-0">
          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#E31821]">
                  CEYFI
                </p>
                <DialogTitle className="font-heading text-lg font-semibold text-foreground">
                  Send to Sri Lanka
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Send remittance to your CEYFI family wallet with card or demo transfer.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => handleDialogOpenChange(false)}
                className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                aria-label="Close send money dialog"
              >
                ×
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-3 px-5 pb-5">
            <PaymentModeToggle value={paymentMode} onChange={setPaymentMode} />

            {/* Recipient card */}
            <VerificationCard
              backgroundImage="https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon.png"
              label="CEYFI · Family wallet"
              idNumber={recipientId}
              name={recipientAccountHolder.trim() || "Family Wallet"}
              validThru={`${currency.code}→LKR`}
            />

            {/* Sandbox routing */}
            {sandboxRoutingLoaded && sandboxRouting && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 font-mono text-[11px] text-muted-foreground">
                <span className="truncate">{sandboxRouting.source_account}</span>
                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate">{sandboxRouting.destination_account}</span>
              </div>
            )}

            {/* Amount input */}
            <div className="relative">
              <Label htmlFor="send-amount" className="sr-only">
                Amount in {currency.code}
              </Label>
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center gap-1.5">
                <Image src={currency.flag} alt={currency.code} width={20} height={20} className="rounded-full object-cover" />
                <span className="text-xs font-semibold text-muted-foreground">{currency.code}</span>
              </div>
              <Input
                id="send-amount"
                type="number"
                step="0.01"
                min={0.01}
                value={Number.isFinite(amount) ? amount : 0}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setAmount(Number.isFinite(v) && v >= 0 ? v : 0);
                }}
                className="border-border bg-background pl-16 text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus-visible:border-[#E31821]/40 focus-visible:ring-[#E31821]/10"
              />
              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                <span className="text-xs font-medium text-muted-foreground">{currency.symbol}</span>
              </div>
            </div>

            {/* FX calculator toggle */}
            <button
              type="button"
              onClick={() => setShowFxCalc(true)}
              aria-label="Open FX calculator"
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-gray-300 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <RefreshCw className="h-3 w-3" />
              FX calculator
            </button>

            {/* LKR conversion */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-muted p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Recipient gets
                  </p>
                  <p className="font-heading text-2xl font-bold tracking-tight text-[#E31821]">
                    {formatLKR(amountLkr)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Rate</p>
                  <p className="font-mono text-xs font-semibold text-muted-foreground">
                    1 {currency.code} = {currency.lkrRate} LKR
                  </p>
                </div>
              </div>
            </div>

            {/* Allocation */}
            <div className="rounded-xl border border-border bg-card p-3.5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Allocation
              </p>
              <div className="space-y-2.5">
                {Object.entries(allocations).map(([id, pct]) => {
                  const color = getBucketColor(id);
                  return (
                    <div key={id}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium capitalize text-muted-foreground">
                          {id.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footnote */}
            <AnimatePresence mode="wait">
              <motion.p
                key={paymentMode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] leading-relaxed text-muted-foreground"
              >
                {paymentMode === "card" ? (
                  <>
                    Test card:{" "}
                    <span className="font-mono font-semibold text-gray-600">5123 4500 0000 0008</span>
                    {" "}· exp{" "}
                    <span className="font-mono font-semibold text-gray-600">01/39</span>
                    {" "}· CVV{" "}
                    <span className="font-mono font-semibold text-gray-600">100</span>
                    . Real cards not accepted.
                  </>
                ) : (
                  <>Simulates transfer internally. Live payouts require a configured banking provider.</>
                )}
              </motion.p>
            </AnimatePresence>

            {/* CTA */}
            <button
              type="button"
              data-demo-target="send-money-submit"
              disabled={sending || !isValid}
              onClick={requestSend}
              className="group relative w-full overflow-hidden rounded-xl bg-[#E31821] py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(227,24,33,0.3)] transition-all hover:bg-[#c41219] hover:shadow-[0_6px_24px_rgba(227,24,33,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <span className="relative flex items-center justify-center gap-2">
                {sending ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {paymentMode === "card" ? "Redirecting…" : "Sending…"}
                  </>
                ) : (
                  <>
                    {paymentMode === "card" ? <CreditCard className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                    {paymentMode === "card"
                      ? `Pay ${formatLKR(amountLkr)} by Card`
                      : `Send ${formatLKR(amountLkr)}`}
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>

      {/* FX calculator — separate popup */}
      <Dialog open={showFxCalc} onOpenChange={setShowFxCalc} modal="trap-focus">
        <DialogContent
          className="max-w-lg border border-gray-100 p-0 shadow-2xl [background:#ffffff]"
          showCloseButton={false}
          aria-modal="true"
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#E31821] via-[#E0AF49] to-[#E31821]" />
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#E31821]">CEYFI</p>
                <p className="mt-0.5 text-xl font-semibold text-foreground">FX Calculator</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFxCalc(false)}
                aria-label="Close FX calculator"
                className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-muted-foreground hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                ×
              </button>
            </div>
            <CurrencyExchangeCard
              initialFromCurrency={currency}
              onExchange={({ from, amount: a }) => {
                setCurrency(from);
                setAmount(a);
                setShowFxCalc(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>

    <PinGate
      key={`${open}-${pinOpen}`}
      open={pinOpen}
      onOpenChange={setPinOpen}
      title="Confirm remittance"
      description={`Enter your PIN to send ${formatLKR(amountLkr)} to the family wallet.`}
      confirmLabel={paymentMode === "card" ? "Continue to card" : "Send money"}
      loading={sending}
      onConfirm={handleSubmit}
    />

    <Dialog
      open={!!receipt}
      onOpenChange={(next) => {
        if (!next) {
          setReceipt(null);
          handleDialogOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-w-sm">
        {receipt ? (
          <PaymentReceipt
            title="Remittance sent"
            amountLkr={receipt.amountLkr}
            reference={receipt.reference}
            detail={receipt.detail}
            onDone={() => {
              setReceipt(null);
              handleDialogOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
