"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { PersonaAvatar } from "@/components/ui/PersonaAvatar";
import {
  ActivityFeedBlock,
  type ActivityFeedItem,
} from "@/components/blocks/ActivityFeedBlock";
import {
  DashboardMetricGrid,
} from "@/components/blocks/DashboardMetricCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getProfileData } from "@/lib/api";
import {
  Wallet,
  CreditCard,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Calendar,
  Percent,
  Clock,
} from "lucide-react";

function formatLKR(amount: number) {
  return `LKR ${Math.abs(amount).toLocaleString("en-LK")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ProfileData = Awaited<ReturnType<typeof getProfileData>>;

export default function ProfilePage() {
  const router = useRouter();
  const { userId, user } = useCurrentUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(() => {
    setLoading(true);
    setError(null);
    getProfileData(userId)
      .then(setProfile)
      .catch(() => setError("Could not load profile data."))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div data-module="profile" className="flex min-h-[60vh] items-center justify-center p-6">
        <ErrorState message={error ?? "Could not load profile data."} onRetry={loadProfile} />
      </div>
    );
  }

  const totalBalance = profile.balance_lkr;
  const loan = profile.loans?.[0];
  const fd = profile.fixed_deposits?.[0];

  return (
    <div
      data-module="profile"
      className="relative min-h-full overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-8%,rgba(227,24,33,0.15),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-[radial-gradient(ellipse_55%_35%_at_50%_110%,rgba(114,28,36,0.10),transparent)]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 stagger space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-border bg-card/90 p-6 shadow-brand-lg backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-white/[0.05] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-seylan-red/25 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <PersonaAvatar
                name={profile.account_holder}
                persona={user?.persona}
                size="lg"
              />
              <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-background bg-emerald-400 dark:border-[#0c0407]" />
            </div>
            {/* Info */}
            <div className="text-center sm:text-left">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-seylan-red">
                My account
              </p>
              <h1 className="font-heading text-2xl font-semibold text-foreground dark:text-white sm:text-4xl">
                {profile.account_holder}
              </h1>
              <p className="mt-1 text-sm text-foreground dark:text-white/45">
                {profile.accounts.join(" · ")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/80 dark:text-white/30">
                User ID: {profile.user_id}
              </p>
            </div>
          </div>
        </header>

        {/* Balance cards */}
        <DashboardMetricGrid
          items={[
            {
              label: "Total Balance",
              metric: formatLKR(totalBalance),
              subLabel: "Combined account value",
              icon: Wallet,
              accent: "seylan",
            },
            {
              label: "Savings Account",
              metric: formatLKR(profile.savings_balance),
              subLabel: "Primary savings",
              icon: Landmark,
              accent: "ceyfi",
            },
            {
              label: "Current Account",
              metric: formatLKR(profile.current_balance),
              subLabel: "Everyday spending",
              icon: CreditCard,
              accent: "neutral",
            },
          ]}
        />

        {/* Loan & FD row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loan && (
            <div className="rounded-2xl border-border bg-card/80 dark:border-white/[0.08] dark:bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </span>
                <h3 className="text-sm font-semibold text-foreground dark:text-white/70">
                  {loan.type}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground dark:text-white/50">Disbursed</span>
                  <span className="text-sm font-medium text-foreground dark:text-white">
                    {formatLKR(loan.disbursed_amount_lkr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground dark:text-white/50">Outstanding</span>
                  <span className="text-sm font-medium text-amber-400">
                    {formatLKR(loan.outstanding_lkr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground dark:text-white/50">Monthly EMI</span>
                  <span className="text-sm font-medium text-foreground dark:text-white">
                    {formatLKR(loan.monthly_installment_lkr)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground dark:text-white/40 mb-1">
                    <span>Repaid</span>
                    <span>
                      {Math.round(
                        ((loan.disbursed_amount_lkr - loan.outstanding_lkr) /
                          loan.disbursed_amount_lkr) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                      style={{
                        width: `${((loan.disbursed_amount_lkr - loan.outstanding_lkr) / loan.disbursed_amount_lkr) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground dark:text-white/40">
                  <Calendar className="h-3 w-3" />
                  <span>Next payment: {formatDate(loan.next_payment_date)}</span>
                </div>
              </div>
            </div>
          )}

          {fd && (
            <div className="rounded-2xl border-border bg-card/80 dark:border-white/[0.08] dark:bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Landmark className="h-4 w-4 text-emerald-400" />
                </span>
                <h3 className="text-sm font-semibold text-foreground dark:text-white/70">
                  Fixed Deposit
                </h3>
                <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Active
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground dark:text-white/50">Principal</span>
                  <span className="text-sm font-medium text-foreground dark:text-white">
                    {formatLKR(fd.amount_lkr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground dark:text-white/50">Interest Rate</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                    <Percent className="h-3 w-3" />
                    {fd.interest_rate_pct}% p.a.
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground dark:text-white/50">Term</span>
                  <span className="text-sm font-medium text-foreground dark:text-white">
                    {fd.term_months} months
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground dark:text-white/40">
                  <Clock className="h-3 w-3" />
                  <span>Matures: {formatDate(fd.maturity_date)}</span>
                </div>
              </div>
            </div>
          )}

          {!loan && !fd && (
            <div className="col-span-2 rounded-2xl border-border bg-card/80 dark:border-white/[0.08] dark:bg-white/[0.04] p-8 text-center">
              <p className="text-sm text-muted-foreground dark:text-white/40">
                No active loans or fixed deposits.
              </p>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <ActivityFeedBlock
          items={profile.recent_transactions.map((tx) => toActivityFeedItem(tx))}
          onFooterClick={() => router.push("/transactions")}
        />
      </div>
    </div>
  );
}

function toActivityFeedItem(tx: ProfileData["recent_transactions"][number]): ActivityFeedItem {
  const txDate = new Date(tx.date);
  return {
    id: tx.id,
    icon:
      tx.type === "credit" ? (
        <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
      ) : (
        <ArrowUpRight className="h-4 w-4 text-red-400" />
      ),
    title: tx.description,
    subtitle: formatDate(tx.date),
    amount: `${tx.type === "credit" ? "+" : "-"} ${formatLKR(tx.amount_lkr)}`,
    amountTone: tx.type === "credit" ? "credit" : "debit",
    date: formatDate(tx.date),
    time: txDate.toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    transactionId: tx.id,
    paymentMethod: "Seylan Bank",
  };
}
