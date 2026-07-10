"use client";

import { Transaction } from "@/types";
import { formatLKR } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const BUCKET_DOT: Record<string, string> = {
  school: "bg-blue-500",
  household: "bg-emerald-500",
  savings: "bg-violet-500",
};

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const isDebit = transaction.type === "debit";
  const bucketKey = (transaction.bucket_label ?? "").toLowerCase();
  const dotColour = BUCKET_DOT[bucketKey] ?? "bg-slate-400";

  const className =
    "group flex w-full items-center gap-3 py-3 border-b border-ceyfi-line/60 last:border-0 transition-colors hover:bg-ceyfi-sprout/50 dark:border-white/[0.06] dark:hover:bg-white/[0.04] -mx-1 px-1 rounded-xl text-left";

  const body = (
    <>
      {/* Direction icon */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isDebit ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        {isDebit ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ceyfi-ink dark:text-white truncate">
          {transaction.merchant}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColour}`} />
          <span className="text-[10px] text-muted-foreground dark:text-white/40 truncate">
            {transaction.bucket_label} &middot;{" "}
            {new Date(transaction.timestamp).toLocaleDateString("en-LK", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div
        className={`text-sm font-bold tabular-nums shrink-0 ${
          isDebit ? "text-red-600" : "text-emerald-600"
        }`}
      >
        {isDebit ? "−" : "+"}
        {formatLKR(transaction.amount_lkr)}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
