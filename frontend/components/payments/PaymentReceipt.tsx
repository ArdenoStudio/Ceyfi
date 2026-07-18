"use client";

import { CheckCircle2, MessageCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLKR } from "@/lib/utils";
import { formatReceiptMessage, shareText } from "@/lib/share";
import { toast } from "sonner";

export interface PaymentReceiptProps {
  title: string;
  amountLkr: number;
  reference: string;
  detail?: string;
  when?: string;
  onDone?: () => void;
  doneLabel?: string;
}

export function PaymentReceipt({
  title,
  amountLkr,
  reference,
  detail,
  when,
  onDone,
  doneLabel = "Done",
}: PaymentReceiptProps) {
  const message = formatReceiptMessage({
    title,
    amountLkr,
    reference,
    detail,
    when,
  });

  async function handleShare() {
    const result = await shareText({
      title: `CEYFI — ${title}`,
      text: message,
    });
    if (result === "copied") toast.success("Receipt copied");
    else if (result === "whatsapp" || result === "shared") {
      toast.success("Opening share…");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Receipt copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="space-y-5 text-left">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-green">
            Receipt
          </p>
          <h2 className="font-heading text-lg font-semibold text-ceyfi-ink">
            {title}
          </h2>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-ceyfi-ink">
            {formatLKR(amountLkr)}
          </p>
        </div>
      </div>

      <dl className="space-y-2 rounded-xl border border-ceyfi-line/70 bg-ceyfi-canvas p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ceyfi-muted">Reference</dt>
          <dd className="font-mono text-xs font-semibold text-ceyfi-ink">
            {reference}
          </dd>
        </div>
        {detail ? (
          <div className="flex justify-between gap-3">
            <dt className="text-ceyfi-muted">Detail</dt>
            <dd className="text-right text-ceyfi-ink">{detail}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-ceyfi-muted">Time</dt>
          <dd className="text-ceyfi-ink">
            {when ?? new Date().toLocaleString("en-LK")}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 bg-[#25D366] text-white hover:bg-[#1ebe57]"
          onClick={() => void handleShare()}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Share on WhatsApp
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => void handleCopy()}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
      </div>

      {onDone ? (
        <Button
          data-demo-target="payment-receipt-done"
          variant="ghost"
          className="w-full"
          onClick={onDone}
        >
          {doneLabel}
        </Button>
      ) : null}
    </div>
  );
}
