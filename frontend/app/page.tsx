"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bot,
  CalendarClock,
  CreditCard,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  AllocationBar,
  CashflowChart,
  PortfolioChart,
  ProgressCircle,
  type PortfolioPoint,
} from "@/components/charts/OverviewCharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { KpiCard } from "@/components/ui/KpiCard";
import {
  getAccountContext,
  getFamilyWallet,
  getLoans,
} from "@/lib/api";
import { cn, formatters } from "@/lib/utils";
import type { AccountContext, Loan, WalletState } from "@/types";

const FALLBACK_CONTEXT: AccountContext = {
  user_id: "SEY-USR-001",
  name: "Nimal Fernando",
  account_holder: "Nimal Fernando",
  accounts: ["SEY-SAV-001", "SEY-CUR-001"],
  balance_lkr: 245000,
  savings_balance: 125400,
  current_balance: 34200,
  language_preference: "en",
  recent_transactions: [
    {
      id: "txn_s001",
      date: "2026-05-03",
      description: "Keells Supermarket · Nugegoda",
      amount_lkr: -4200,
      type: "debit",
    },
    {
      id: "txn_s002",
      date: "2026-05-02",
      description: "Salary Credit · Hayleys Group",
      amount_lkr: 185000,
      type: "credit",
    },
    {
      id: "txn_s003",
      date: "2026-05-01",
      description: "Dialog Axiata · Bill Payment",
      amount_lkr: -2800,
      type: "debit",
    },
    {
      id: "txn_s004",
      date: "2026-04-30",
      description: "Personal Loan · Instalment",
      amount_lkr: -22000,
      type: "debit",
    },
  ],
};

const FALLBACK_WALLET: Pick<WalletState, "buckets" | "total_balance_lkr"> = {
  total_balance_lkr: 245000,
  buckets: [
    {
      bucket_id: "school",
      label: "School Fees",
      allocation_pct: 40,
      balance_lkr: 98000,
      spent_lkr: 0,
      icon: "school",
      colour: "#2563eb",
    },
    {
      bucket_id: "household",
      label: "Household",
      allocation_pct: 40,
      balance_lkr: 71500,
      spent_lkr: 26500,
      icon: "household",
      colour: "#059669",
    },
    {
      bucket_id: "savings",
      label: "Savings",
      allocation_pct: 20,
      balance_lkr: 49000,
      spent_lkr: 0,
      icon: "savings",
      colour: "#d97706",
    },
  ],
};

const CASHFLOW = [
  { month: "Jan", Income: 185000, Expenses: 92000 },
  { month: "Feb", Income: 185000, Expenses: 108000 },
  { month: "Mar", Income: 185000, Expenses: 87500 },
  { month: "Apr", Income: 207000, Expenses: 115000 },
  { month: "May", Income: 185000, Expenses: 98000 },
  { month: "Jun", Income: 185000, Expenses: 104000 },
];

function buildBalanceHistory(balance: number, savings: number): PortfolioPoint[] {
  const pulses = [
    -12000, -7000, -10500, -4500, -9000, -2000, -5500, 1000, -3500, 2500,
    -1500, 4000, 1000, 6500, 3000, 8500, 4500, 12000, 8000, 14500, 9500,
    17000, 12500, 19500, 15500, 22000, 18000, 24500, 21000, 27000,
  ];
  const start = new Date(Date.UTC(2026, 4, 20));

  return pulses.map((pulse, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      date: date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      Balance: Math.max(0, balance - 27000 + pulse),
      Savings: Math.max(0, savings - 12000 + Math.round(index * 420)),
    };
  });
}

function relativeDate(date: string) {
  return new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function TransactionIcon({
  type,
  description,
}: {
  type: "credit" | "debit";
  description: string;
}) {
  const Icon =
    type === "credit"
      ? Banknote
      : description.toLowerCase().includes("loan")
        ? CreditCard
        : ReceiptText;

  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-[14px]",
        type === "credit"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-stone-100 text-stone-600"
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export default function OverviewPage() {
  const [context, setContext] = useState<AccountContext>(FALLBACK_CONTEXT);
  const [wallet, setWallet] =
    useState<Pick<WalletState, "buckets" | "total_balance_lkr">>(
      FALLBACK_WALLET
    );
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getAccountContext("SEY-USR-001"),
      getFamilyWallet("SEY-ACC-002"),
      getLoans("SEY-USR-001"),
    ]).then(([contextResult, walletResult, loanResult]) => {
      if (cancelled) return;
      if (contextResult.status === "fulfilled") {
        setContext(contextResult.value as AccountContext);
        setIsLive(true);
      }
      if (walletResult.status === "fulfilled") {
        setWallet(walletResult.value as WalletState);
      }
      if (loanResult.status === "fulfilled") {
        setLoan(loanResult.value as Loan);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const balance = context.balance_lkr ?? 245000;
  const savings = context.savings_balance ?? 125400;
  const current = context.current_balance ?? Math.max(0, balance - savings);
  const firstName = (context.name ?? context.account_holder ?? "Nimal").split(
    " "
  )[0];
  const portfolioData = useMemo(
    () => buildBalanceHistory(balance, savings),
    [balance, savings]
  );
  const bucketItems = wallet.buckets.map((bucket, index) => ({
    label: bucket.label,
    value: bucket.allocation_pct,
    color: ["#2563eb", "#059669", "#d97706", "#7c3aed"][index % 4],
  }));
  const loanHealth =
    loan?.health_score === "ON_TRACK"
      ? 82
      : loan?.health_score === "AT_RISK"
        ? 58
        : loan?.health_score === "CRITICAL"
          ? 34
          : 78;
  const spentThisMonth = CASHFLOW.at(-1)?.Expenses ?? 104000;
  const transactions =
    context.recent_transactions ?? FALLBACK_CONTEXT.recent_transactions ?? [];

  return (
    <div className="mx-auto w-full max-w-[1540px] space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8 xl:p-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
              Financial overview
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
                isLive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isLive ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
              {isLive ? "Backend connected" : "Demo snapshot"}
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.035em] text-ceyfi-ink sm:text-[2rem]">
            Good morning, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-ceyfi-muted">
            Here&apos;s what moved, what&apos;s protected, and what needs your
            attention.
          </p>
        </div>
        <Link
          href="/assistant"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-ceyfi-deep px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0a4424] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceyfi-green/30"
        >
          <Sparkles className="h-4 w-4 text-ceyfi-mint" />
          Ask CEYFI
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-[26px] bg-ceyfi-deep p-5 text-white sm:p-7 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.20),transparent_30rem)]" />
        <div className="absolute -right-12 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute -right-3 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1.9fr] lg:items-end">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Total financial position
            </div>
            <div className="mt-3 font-heading text-4xl font-semibold tracking-[-0.055em] tabular-nums sm:text-5xl">
              {formatters.currency({
                number: balance,
                maxFractionDigits: 0,
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="h-4 w-4 text-ceyfi-mint" />
              Accounts synced · Last checked moments ago
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Everyday",
                value: current,
                note: "Available now",
                icon: Wallet,
              },
              {
                label: "Savings",
                value: savings,
                note: "Protected reserve",
                icon: Landmark,
              },
              {
                label: "Family wallet",
                value: wallet.total_balance_lkr,
                note: "Allocated at home",
                icon: ShieldCheck,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] border border-white/8 bg-white/[0.055] p-4 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/42">
                    {item.label}
                  </span>
                  <item.icon className="h-4 w-4 text-ceyfi-mint" />
                </div>
                <div className="mt-4 font-heading text-xl font-semibold tracking-[-0.03em] tabular-nums">
                  {formatters.currency({
                    number: item.value,
                    maxFractionDigits: 0,
                  })}
                </div>
                <div className="mt-1 text-[10px] text-white/36">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total balance"
          value={formatters.currency({
            number: balance,
            maxFractionDigits: 0,
          })}
          change="+2.4% this month"
          changeType="positive"
          subtitle="Current and savings"
          icon={<Wallet className="h-4.5 w-4.5" />}
        />
        <KpiCard
          title="Savings"
          value={formatters.currency({
            number: savings,
            maxFractionDigits: 0,
          })}
          change="+LKR 12,400"
          changeType="positive"
          subtitle="Added this month"
          icon={<Landmark className="h-4.5 w-4.5" />}
        />
        <KpiCard
          title="Loan health"
          value={`${loanHealth}/100`}
          change={loanHealth >= 75 ? "Good standing" : "Needs attention"}
          changeType={loanHealth >= 75 ? "positive" : "negative"}
          subtitle="Across active facilities"
          icon={<ShieldCheck className="h-4.5 w-4.5" />}
        />
        <KpiCard
          title="Spent in June"
          value={formatters.currency({
            number: spentThisMonth,
            maxFractionDigits: 0,
          })}
          change="+6% vs May"
          changeType="negative"
          subtitle="Bills and daily spending"
          icon={<ReceiptText className="h-4.5 w-4.5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Portfolio balance"
          subtitle="Current balance and protected savings · last 30 days"
          className="xl:col-span-2"
          action={
            <span className="rounded-full bg-ceyfi-sprout px-2.5 py-1 font-mono text-[10px] text-ceyfi-green">
              +11.2%
            </span>
          }
        >
          <PortfolioChart data={portfolioData} />
        </ChartCard>

        <ChartCard
          title="Loan health"
          subtitle="Repayment strength across active loans"
        >
          <div className="flex flex-col items-center py-1">
            <ProgressCircle value={loanHealth}>
              <div className="text-center">
                <div className="font-heading text-3xl font-semibold tracking-[-0.04em] text-ceyfi-ink">
                  {loanHealth}
                </div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ceyfi-faint">
                  out of 100
                </div>
              </div>
            </ProgressCircle>
            <div className="mt-5 w-full space-y-3">
              <div className="flex items-center justify-between border-b border-ceyfi-line/60 pb-3 text-xs">
                <span className="text-ceyfi-muted">Personal loan</span>
                <span className="font-mono font-semibold text-emerald-700">
                  On track
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ceyfi-muted">Next payment</span>
                <span className="font-mono font-semibold text-ceyfi-ink">
                  LKR 22,000
                </span>
              </div>
            </div>
            <Link
              href="/loans"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ceyfi-green hover:text-ceyfi-deep"
            >
              View repayment plan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <ChartCard
          title="Income and spending"
          subtitle="Monthly cash flow in LKR"
        >
          <CashflowChart data={CASHFLOW} />
        </ChartCard>

        <ChartCard
          title="Rupee flow"
          subtitle="How the family wallet is allocated right now"
        >
          <AllocationBar items={bucketItems} />
          <div className="mt-6 space-y-2">
            {wallet.buckets.map((bucket) => (
              <div
                key={bucket.bucket_id}
                className="flex items-center justify-between rounded-xl bg-ceyfi-canvas px-3 py-2.5 text-xs"
              >
                <span className="text-ceyfi-muted">{bucket.label}</span>
                <span className="font-mono font-semibold text-ceyfi-ink">
                  {formatters.currency({
                    number: bucket.balance_lkr,
                    maxFractionDigits: 0,
                  })}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/wallet"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ceyfi-green hover:text-ceyfi-deep"
          >
            Adjust allocations
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <ChartCard
          title="Recent movement"
          subtitle="The latest account activity CEYFI can explain"
          action={
            <Link
              href="/transactions"
              className="text-[11px] font-semibold text-ceyfi-green hover:text-ceyfi-deep"
            >
              View all
            </Link>
          }
        >
          <div className="divide-y divide-ceyfi-line/60">
            {transactions.slice(0, 4).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <TransactionIcon
                  type={transaction.type}
                  description={transaction.description}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ceyfi-ink">
                    {transaction.description}
                  </div>
                  <div className="mt-1 text-[10px] text-ceyfi-faint">
                    {relativeDate(transaction.date)}
                  </div>
                </div>
                <div
                  className={cn(
                    "font-mono text-xs font-semibold tabular-nums",
                    transaction.type === "credit"
                      ? "text-emerald-700"
                      : "text-ceyfi-ink"
                  )}
                >
                  {transaction.type === "credit" ? "+" : "−"}
                  {formatters.currency({
                    number: Math.abs(transaction.amount_lkr),
                    maxFractionDigits: 0,
                  })}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <section className="relative min-w-0 overflow-hidden rounded-[22px] border border-ceyfi-green/15 bg-ceyfi-sprout p-5 sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-ceyfi-green/10" />
          <div className="relative">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-ceyfi-green text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-green">
              CEYFI signal
            </div>
            <h2 className="mt-2 font-heading text-xl font-semibold tracking-[-0.03em] text-ceyfi-ink">
              You can move LKR 18,000 to savings safely this week.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ceyfi-muted">
              Your next loan instalment and normal household spend remain
              covered after the transfer.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/assistant?prompt=Explain%20why%20I%20can%20move%20LKR%2018%2C000%20to%20savings"
                className="inline-flex items-center gap-2 rounded-xl bg-ceyfi-deep px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0a4424]"
              >
                Explain this
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center gap-2 rounded-xl border border-ceyfi-green/20 bg-white/60 px-3.5 py-2 text-xs font-semibold text-ceyfi-deep transition hover:bg-white"
              >
                Open wallet
              </Link>
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/loans",
            icon: CalendarClock,
            title: "Next loan payment",
            detail: "LKR 22,000 · due May 25",
          },
          {
            href: "/wallet",
            icon: ShieldCheck,
            title: "Family wallet",
            detail: "3 buckets · all within limits",
          },
          {
            href: "/assistant",
            icon: Bot,
            title: "Ask in English or Sinhala",
            detail: "Account-aware financial guidance",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group flex items-center gap-3 rounded-[18px] border border-ceyfi-line/70 bg-ceyfi-paper p-4 transition hover:border-ceyfi-green/20"
          >
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-ceyfi-canvas text-ceyfi-green transition group-hover:bg-ceyfi-sprout">
              <item.icon className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-ceyfi-ink">
                {item.title}
              </span>
              <span className="mt-1 block truncate text-[10px] text-ceyfi-faint">
                {item.detail}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-ceyfi-faint transition group-hover:translate-x-0.5 group-hover:text-ceyfi-green" />
          </Link>
        ))}
      </section>
    </div>
  );
}
