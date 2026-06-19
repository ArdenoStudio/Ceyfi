"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
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
  Receipt,
} from "lucide-react";

const USER_ID = "SEY-USR-001";

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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileData(USER_ID)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Could not load profile data.</p>
      </div>
    );
  }

  const totalBalance = profile.balance_lkr;
  const loan = profile.loans?.[0];
  const fd = profile.fixed_deposits?.[0];

  return (
    <div
      data-module="profile"
      className="dark relative min-h-full overflow-hidden"
      style={{ background: "#04241a" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-8%,rgba(5,150,105,0.15),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-[radial-gradient(ellipse_55%_35%_at_50%_110%,rgba(5,46,22,0.10),transparent)]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-ceyfi-green/25 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-white/10 sm:h-28 sm:w-28">
                <Image
                  src="/nimal-avatar.jpg"
                  alt={profile.account_holder}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-[#04241a] bg-emerald-400" />
            </div>
            {/* Info */}
            <div className="text-center sm:text-left">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-ceyfi-green">
                My account
              </p>
              <h1 className="font-heading text-2xl font-semibold text-white sm:text-4xl">
                {profile.account_holder}
              </h1>
              <p className="mt-1 text-sm text-white/45">
                {profile.accounts.join(" · ")}
              </p>
              <p className="mt-0.5 text-xs text-white/30">
                User ID: {profile.user_id}
              </p>
            </div>
          </div>
        </header>

        {/* Balance cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BalanceCard
            icon={Wallet}
            label="Total Balance"
            value={formatLKR(totalBalance)}
            accent
          />
          <BalanceCard
            icon={Landmark}
            label="Savings Account"
            value={formatLKR(profile.savings_balance)}
          />
          <BalanceCard
            icon={CreditCard}
            label="Current Account"
            value={formatLKR(profile.current_balance)}
          />
        </div>

        {/* Loan & FD row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loan && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </span>
                <h3 className="text-sm font-semibold text-white/70">
                  {loan.type}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Disbursed</span>
                  <span className="text-sm font-medium text-white">
                    {formatLKR(loan.disbursed_amount_lkr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Outstanding</span>
                  <span className="text-sm font-medium text-amber-400">
                    {formatLKR(loan.outstanding_lkr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Monthly EMI</span>
                  <span className="text-sm font-medium text-white">
                    {formatLKR(loan.monthly_installment_lkr)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-white/40 mb-1">
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
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                      style={{
                        width: `${((loan.disbursed_amount_lkr - loan.outstanding_lkr) / loan.disbursed_amount_lkr) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-white/40">
                  <Calendar className="h-3 w-3" />
                  <span>Next payment: {formatDate(loan.next_payment_date)}</span>
                </div>
              </div>
            </div>
          )}

          {fd && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Landmark className="h-4 w-4 text-emerald-400" />
                </span>
                <h3 className="text-sm font-semibold text-white/70">
                  Fixed Deposit
                </h3>
                <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Active
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Principal</span>
                  <span className="text-sm font-medium text-white">
                    {formatLKR(fd.amount_lkr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Interest Rate</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                    <Percent className="h-3 w-3" />
                    {fd.interest_rate_pct}% p.a.
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Term</span>
                  <span className="text-sm font-medium text-white">
                    {fd.term_months} months
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-white/40">
                  <Clock className="h-3 w-3" />
                  <span>Matures: {formatDate(fd.maturity_date)}</span>
                </div>
              </div>
            </div>
          )}

          {!loan && !fd && (
            <div className="col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center">
              <p className="text-sm text-white/40">
                No active loans or fixed deposits.
              </p>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <Receipt className="h-4 w-4 text-white/60" />
            </span>
            Recent Transactions
          </h3>
          <div className="divide-y divide-white/[0.06]">
            {profile.recent_transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      tx.type === "credit"
                        ? "bg-emerald-500/15"
                        : "bg-red-500/10"
                    }`}
                  >
                    {tx.type === "credit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-400" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      {tx.description}
                    </p>
                    <p className="text-xs text-white/40">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.type === "credit"
                      ? "text-emerald-400"
                      : "text-white/80"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}{" "}
                  {formatLKR(tx.amount_lkr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 backdrop-blur-sm ${
        accent
          ? "border-ceyfi-green/20 bg-ceyfi-green/[0.08]"
          : "border-white/[0.08] bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            accent ? "bg-ceyfi-green/20" : "bg-white/10"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              accent ? "text-ceyfi-green" : "text-white/60"
            }`}
          />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-white/50">
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-bold ${
          accent ? "text-white" : "text-white/90"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
