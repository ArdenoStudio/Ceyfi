"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { getAccountContext } from "@/lib/api";
import { cn, formatters } from "@/lib/utils";
import type { AccountContext } from "@/types";

const FALLBACK_TRANSACTIONS = [
  {
    id: "txn_s001",
    date: "2026-05-03",
    description: "Keells Supermarket · Nugegoda",
    amount_lkr: -4200,
    type: "debit" as const,
  },
  {
    id: "txn_s002",
    date: "2026-05-02",
    description: "Salary Credit · Hayleys Group",
    amount_lkr: 185000,
    type: "credit" as const,
  },
  {
    id: "txn_s003",
    date: "2026-05-01",
    description: "Dialog Axiata · Bill Payment",
    amount_lkr: -2800,
    type: "debit" as const,
  },
  {
    id: "txn_s004",
    date: "2026-04-30",
    description: "Seylan Personal Loan · Instalment",
    amount_lkr: -22000,
    type: "debit" as const,
  },
  {
    id: "txn_s005",
    date: "2026-04-28",
    description: "PickMe · Ride",
    amount_lkr: -680,
    type: "debit" as const,
  },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(FALLBACK_TRANSACTIONS);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAccountContext("SEY-USR-001")
      .then((data) => {
        if (cancelled) return;
        const context = data as AccountContext;
        if (context.recent_transactions?.length) {
          setTransactions(context.recent_transactions);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = transactions.filter((transaction) =>
    transaction.description.toLowerCase().includes(query.toLowerCase())
  );
  const income = transactions
    .filter((transaction) => transaction.type === "credit")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount_lkr), 0);
  const outflow = transactions
    .filter((transaction) => transaction.type === "debit")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount_lkr), 0);

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10">
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
          Transaction analytics
        </div>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.035em] text-ceyfi-ink sm:text-[2rem]">
          Follow every rupee.
        </h1>
        <p className="mt-2 text-sm text-ceyfi-muted">
          Search recent activity and see the direction of your cash flow.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Money in", value: income, tone: "positive" },
          { label: "Money out", value: outflow, tone: "negative" },
          {
            label: "Net movement",
            value: income - outflow,
            tone: income - outflow >= 0 ? "positive" : "negative",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] border border-ceyfi-line/75 bg-ceyfi-paper p-5"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ceyfi-muted">
              {item.label}
            </div>
            <div
              className={cn(
                "mt-4 font-heading text-2xl font-semibold tracking-[-0.035em]",
                item.tone === "positive" ? "text-emerald-700" : "text-ceyfi-ink"
              )}
            >
              {formatters.currency({
                number: item.value,
                maxFractionDigits: 0,
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[22px] border border-ceyfi-line/75 bg-ceyfi-paper p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-ceyfi-ink">
              Recent activity
            </h2>
            <p className="mt-1 text-xs text-ceyfi-muted">
              Latest account transactions from the connected backend.
            </p>
          </div>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-ceyfi-line bg-ceyfi-canvas px-3 focus-within:border-ceyfi-green/40 focus-within:ring-2 focus-within:ring-ceyfi-green/10">
            <Search className="h-4 w-4 text-ceyfi-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions"
              className="w-full bg-transparent text-xs text-ceyfi-ink outline-none placeholder:text-ceyfi-faint sm:w-48"
            />
          </label>
        </div>

        <div className="mt-5 divide-y divide-ceyfi-line/60">
          {filtered.map((transaction) => {
            const credit = transaction.type === "credit";
            const Icon = credit ? ArrowDownLeft : ArrowUpRight;
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-[14px]",
                    credit
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-stone-100 text-stone-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ceyfi-ink">
                    {transaction.description}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-ceyfi-faint">
                    {transaction.date}
                  </div>
                </div>
                <div
                  className={cn(
                    "font-mono text-xs font-semibold",
                    credit ? "text-emerald-700" : "text-ceyfi-ink"
                  )}
                >
                  {credit ? "+" : "−"}
                  {formatters.currency({
                    number: Math.abs(transaction.amount_lkr),
                    maxFractionDigits: 0,
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
