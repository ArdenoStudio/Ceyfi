"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LoanIcon,
  RemittanceIcon,
  TaxJarIcon,
  WalletBucketIcon,
} from "@/components/icons/CeyfiIconSet";
import { PeriodBadge } from "@/components/charts/PeriodBadge";
import {
  ProgressCircle,
} from "@/components/charts/OverviewCharts";
import type { ActionPlan } from "@/components/charts/CausalityPanel";
import { ChartSkeleton } from "@/components/lazy/LazySkeletons";
import { RotatingInsightsCard } from "@/components/insights/RotatingInsightsCard";
import { GradientText } from "@/components/motion/GradientText";
import { ShinyText } from "@/components/motion/ShinyText";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ParallaxTilt } from "@/components/ui/ParallaxTilt";
import { ChartCard } from "@/components/ui/ChartCard";
import { FeatureQuickLinksGrid } from "@/components/blocks/FeatureQuickLinksGrid";
import { KpiCard } from "@/components/ui/KpiCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAccountContext, getFamilyWallet, getLoans } from "@/lib/api";
import { buildSparkline, periodDelta } from "@/lib/chartUtils";
import {
  currentMonthLabel,
  daysUntil,
  dueLabel,
  formatShortDate,
  timeOfDayGreeting,
} from "@/lib/dates";
import { cn, formatters } from "@/lib/utils";
import { toast } from "sonner";
import type { AccountContext, Loan, WalletState } from "@/types";

const TimeRiver = dynamic(
  () =>
    import("@/components/charts/TimeRiver").then((m) => ({
      default: m.TimeRiver,
    })),
  {
    loading: () => <ChartSkeleton height={280} />,
    ssr: false,
  }
);

const CashflowChart = dynamic(
  () =>
    import("@/components/charts/OverviewCharts").then((m) => ({
      default: m.CashflowChart,
    })),
  {
    loading: () => <ChartSkeleton height={240} />,
    ssr: false,
  }
);

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
      date: "2026-07-03",
      description: "Keells Supermarket · Nugegoda",
      amount_lkr: -4200,
      type: "debit",
    },
    {
      id: "txn_s002",
      date: "2026-07-01",
      description: "Salary Credit · Hayleys Group",
      amount_lkr: 185000,
      type: "credit",
    },
    {
      id: "txn_s003",
      date: "2026-06-28",
      description: "Dialog Axiata · Bill Payment",
      amount_lkr: -2800,
      type: "debit",
    },
    {
      id: "txn_s004",
      date: "2026-06-25",
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
  { month: "Feb", Income: 185000, Expenses: 108000 },
  { month: "Mar", Income: 185000, Expenses: 87500 },
  { month: "Apr", Income: 207000, Expenses: 115000 },
  { month: "May", Income: 185000, Expenses: 98000 },
  { month: "Jun", Income: 185000, Expenses: 104000 },
  { month: "Jul", Income: 185000, Expenses: 99000 },
];

function badgeForDue(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return "Overdue";
  if (d <= 7) return "Due soon";
  return "Upcoming";
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
  const { userId, walletAccountId, loanUserId, user } = useCurrentUser();
  const router = useRouter();
  const [context, setContext] = useState<AccountContext>(FALLBACK_CONTEXT);
  const [wallet, setWallet] =
    useState<Pick<WalletState, "buckets" | "total_balance_lkr">>(
      FALLBACK_WALLET
    );
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [riverBoost, setRiverBoost] = useState(0);
  const greeting = timeOfDayGreeting();
  const monthLabel = currentMonthLabel();

  const handlePlanSelect = useCallback(
    (plan: ActionPlan) => {
      setRiverBoost((prev) => prev + plan.benefit);
      toast.success("Plan selected", {
        description: `${plan.title} — Time River updated. Review in Decisions.`,
        action: {
          label: "Open Decisions",
          onClick: () =>
            router.push(`/decisions?plan=${encodeURIComponent(plan.id)}`),
        },
      });
      window.dispatchEvent(
        new CustomEvent("ceyfi:plan-selected", { detail: plan })
      );
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getAccountContext(userId),
      walletAccountId ? getFamilyWallet(walletAccountId) : Promise.reject(),
      getLoans(loanUserId),
    ]).then(([contextResult, walletResult, loanResult]) => {
      if (cancelled) return;
      if (contextResult.status === "fulfilled") {
        setContext(contextResult.value as AccountContext);
        setIsLive(true);
        setSyncedAt(new Date());
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
  }, [userId, walletAccountId, loanUserId]);

  const savings = context.savings_balance ?? 125400;
  const current = context.current_balance ?? 34200;
  const familyWallet = wallet.total_balance_lkr ?? 245000;
  // Everyday + savings = personal accounts; family wallet is separate remittance pool.
  const personalTotal = savings + current;
  const firstName = (
    user?.name ??
    context.name ??
    context.account_holder ??
    "there"
  ).split(" ")[0];
  const loanDueAmount = loan?.monthly_payment_lkr ?? 22000;
  const loanDueDate = loan?.next_payment_date ?? "2026-07-25";
  // Everyday-account commitments only (school fees come from family wallet buckets).
  const committed = loanDueAmount + 2800; // EMI + Dialog
  const safeToMove = Math.max(0, current - committed - 5000); // keep a small buffer
  const balance30dAgo = Math.round(personalTotal / 1.024);
  const balanceDelta = periodDelta(personalTotal, balance30dAgo);

  const loanHealth =
    loan?.health_score === "ON_TRACK"
      ? 82
      : loan?.health_score === "AT_RISK"
        ? 58
        : loan?.health_score === "CRITICAL"
          ? 34
          : 78;
  const spentThisMonth = CASHFLOW.at(-1)?.Expenses ?? 99000;
  const transactions =
    context.recent_transactions ?? FALLBACK_CONTEXT.recent_transactions ?? [];
  const syncedLabel = syncedAt
    ? `Synced ${syncedAt.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}`
    : "Demo snapshot · offline fallback";

  const safeToSpendChips = useMemo(
    () => [
      {
        label: "Available now",
        value: current,
        color: "text-emerald-700",
      },
      {
        label: "Protected",
        value: savings,
        color: "text-blue-700",
      },
      {
        label: "Committed",
        value: committed,
        color: "text-amber-700",
      },
      {
        label: "Safe to move",
        value: safeToMove,
        color: "text-ceyfi-green",
      },
    ],
    [current, savings, committed, safeToMove]
  );

  return (
    <div className="stagger mx-auto w-full max-w-[1540px] space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8 xl:p-10">
      {/* Section 1: Page header + safe-to-spend strip */}
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
            <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.035em] text-ceyfi-ink">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 text-sm text-ceyfi-muted">
              Here&apos;s what moved, what&apos;s protected, and what needs your
              attention.
            </p>
          </div>
          <Link
            href="/assistant"
            className="btn-shimmer inline-flex w-fit items-center gap-2 rounded-xl bg-ceyfi-deep px-4 py-2.5 text-xs font-semibold transition hover:bg-[#0a4424] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceyfi-green/30 will-change-transform"
          >
            <Sparkles className="h-4 w-4 text-ceyfi-mint" />
            <ShinyText
              text="Ask CEYFI"
              color="rgba(255,255,255,0.85)"
              shineColor="#34D399"
              speed={2.4}
              className="font-semibold"
            />
            <ArrowRight className="h-3.5 w-3.5 text-white/80" />
          </Link>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
          {safeToSpendChips.map((chip) => (
            <div
              key={chip.label}
              className="min-w-[140px] shrink-0 rounded-xl border border-ceyfi-line/70 bg-ceyfi-paper px-3.5 py-2.5 sm:min-w-0"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ceyfi-faint">
                {chip.label}
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-sm font-semibold tabular-nums",
                  chip.color
                )}
              >
                {formatters.currency({
                  number: chip.value,
                  maxFractionDigits: 0,
                })}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Dark hero banner */}
      <ParallaxTilt className="relative overflow-hidden rounded-[26px]">
        <SpotlightCard
          className="rounded-[26px] border border-white/8"
          spotlightColor="rgba(52, 211, 153, 0.28)"
        >
        <section className="relative overflow-hidden rounded-[26px] bg-ceyfi-deep p-5 text-white sm:p-7 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.20),transparent_30rem)]" />
        <div className="absolute -right-12 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute -right-3 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1.9fr] lg:items-end">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Personal accounts
            </div>
            <GradientText
              className="mt-1 font-heading text-[10px] font-semibold uppercase tracking-[0.18em]"
              colors={["#34D399", "#059669", "#F4F8F3"]}
              animationSpeed={6}
            >
              Everyday + savings
            </GradientText>
            <div className="mt-3 font-heading text-4xl font-semibold tracking-[-0.055em] tabular-nums sm:text-5xl">
              {formatters.currency({
                number: personalTotal,
                maxFractionDigits: 0,
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="h-4 w-4 text-ceyfi-mint" />
              {syncedLabel}
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
                value: familyWallet,
                note: "Separate remittance pool",
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
        </SpotlightCard>
      </ParallaxTilt>

      {/* Section 2: Time River hero */}
      <ChartCard
        title="Financial timeline"
        subtitle="90-day history · today · 90-day forecast"
        className="min-h-[300px]"
        action={
          <PeriodBadge
            value={balanceDelta.pct}
            positive={balanceDelta.positive}
            label={balanceDelta.label}
          />
        }
      >
        <TimeRiver
          dangerThreshold={20000}
          height={280}
          balanceBoost={riverBoost}
          baseBalance={personalTotal}
          onPlanSelect={handlePlanSelect}
        />
      </ChartCard>

      {/* Section 3: KPI grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Personal total"
          value={formatters.currency({
            number: personalTotal,
            maxFractionDigits: 0,
          })}
          change={balanceDelta.label}
          changeType={balanceDelta.positive ? "positive" : "negative"}
          subtitle="Everyday + savings"
          icon={<WalletBucketIcon />}
          sparkline={buildSparkline(personalTotal / 1000)}
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
          icon={<TaxJarIcon />}
          sparkline={buildSparkline(savings / 1000)}
        />
        <KpiCard
          title="Loan health"
          value={`${loanHealth}/100`}
          change={loanHealth >= 75 ? "Good standing" : "Needs attention"}
          changeType={loanHealth >= 75 ? "positive" : "negative"}
          subtitle="Across active facilities"
          icon={<LoanIcon />}
          sparkline={buildSparkline(loanHealth)}
        />
        <KpiCard
          title={`Spent in ${monthLabel}`}
          value={formatters.currency({
            number: spentThisMonth,
            maxFractionDigits: 0,
          })}
          change="-5% vs last month"
          changeType="positive"
          subtitle="Bills and daily spending"
          icon={<RemittanceIcon />}
          sparkline={buildSparkline(spentThisMonth / 10000)}
        />
      </section>

      {/* Section 4: Income/spending + loan health */}
      <section className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Income and spending"
          subtitle="Monthly cash flow in LKR"
          className="xl:col-span-2 min-h-[320px]"
        >
          <CashflowChart data={CASHFLOW} />
        </ChartCard>

        <ChartCard
          title="Loan health"
          subtitle="Repayment strength across active loans"
          className="min-h-[320px]"
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
                <span
                  className={cn(
                    "font-mono font-semibold",
                    loanHealth >= 75 ? "text-emerald-700" : "text-amber-700"
                  )}
                >
                  {loan?.health_score === "AT_RISK"
                    ? "At risk"
                    : loan?.health_score === "CRITICAL"
                      ? "Critical"
                      : "On track"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ceyfi-muted">Next payment</span>
                <span className="font-mono font-semibold text-ceyfi-ink">
                  {formatters.currency({
                    number: loanDueAmount,
                    maxFractionDigits: 0,
                  })}
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

      {/* Section 5: Recent transactions + AI signal */}
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

        <RotatingInsightsCard
          nextPaymentDate={loanDueDate}
          nextPaymentAmount={loanDueAmount}
        />
      </section>

      {/* Section 6: Quick links */}
      <FeatureQuickLinksGrid
        eyebrow="Quick actions"
        heading="Jump to what matters"
        links={[
          {
            href: "/loans",
            icon: CalendarClock,
            title: "Next loan payment",
            description: `${formatters.currency({ number: loanDueAmount, maxFractionDigits: 0 })} · ${dueLabel(loanDueDate)} (${formatShortDate(loanDueDate)})`,
            badge: badgeForDue(loanDueDate),
          },
          {
            href: "/wallet",
            icon: ShieldCheck,
            title: "Family wallet",
            description: "3 buckets · all within limits",
          },
          {
            href: "/assistant",
            icon: Bot,
            title: "Ask CEYFI",
            description: "Account-aware financial guidance",
          },
        ]}
      />
    </div>
  );
}
