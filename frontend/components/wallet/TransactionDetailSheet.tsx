"use client";

import { MessageCircle, Flag, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatLKR, cn } from "@/lib/utils";
import { formatReceiptMessage, shareText } from "@/lib/share";
import { toast } from "sonner";
import type { Transaction } from "@/types";

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const tx = transaction;
  const isDebit = tx.type === "debit";
  const title = tx.merchant || tx.description || "Transaction";
  const reference =
    tx.transaction_id ||
    `TXN-${Math.abs(tx.amount_lkr).toString(36).toUpperCase()}`;

  async function handleShare() {
    const text = formatReceiptMessage({
      title,
      amountLkr: Math.abs(tx.amount_lkr),
      reference,
      detail: [tx.bucket_label, tx.category_en ?? tx.category]
        .filter(Boolean)
        .join(" · "),
      when: new Date(tx.timestamp).toLocaleString("en-LK"),
    });
    const result = await shareText({ title: `CEYFI — ${title}`, text });
    if (result === "copied") toast.success("Copied");
  }

  function handleDispute() {
    toast.success("Dispute opened", {
      description: `Case ${reference.slice(0, 12).toUpperCase()} — CEYFI will review within 1 business day.`,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[22px] border-border sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle className="font-heading">{title}</SheetTitle>
          <SheetDescription>
            {new Date(tx.timestamp).toLocaleString("en-LK", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-2xl",
                isDebit ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
              )}
            >
              {isDebit ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownLeft className="h-5 w-5" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums",
                  isDebit ? "text-rose-600" : "text-emerald-700"
                )}
              >
                {isDebit ? "−" : "+"}
                {formatLKR(Math.abs(tx.amount_lkr))}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tx.bucket_label ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {tx.bucket_label}
                  </Badge>
                ) : null}
                {(tx.category_en ?? tx.category) ? (
                  <Badge variant="outline" className="text-[10px]">
                    {tx.category_en ?? tx.category}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <dl className="space-y-2 rounded-xl border border-ceyfi-line/70 bg-ceyfi-canvas p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-mono text-xs font-semibold">{reference}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Paid via</dt>
              <dd>CEYFI wallet / bank transfer</dd>
            </div>
            {tx.description && tx.description !== title ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Note</dt>
                <dd className="text-right">{tx.description}</dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 bg-[#25D366] text-white hover:bg-[#1ebe57]"
              onClick={() => void handleShare()}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDispute}>
              <Flag className="mr-2 h-4 w-4" />
              Report issue
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
