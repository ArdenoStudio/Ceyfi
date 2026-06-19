"use client";

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletRealtime } from "@/hooks/useWalletRealtime";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BucketGrid } from "@/components/wallet/BucketGrid";
import { AllocationEditor } from "@/components/wallet/AllocationEditor";
import { TransactionFeed } from "@/components/wallet/TransactionFeed";
import { LastRemittanceBanner } from "@/components/wallet/LastRemittanceBanner";
import { SendMoneyModal } from "@/components/wallet/SendMoneyModal";
import { fireSpendToast } from "@/components/wallet/SpendNotificationToast";
import { InsightActionStrip } from "@/components/insights/InsightActionStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types";
import { saveAllocationRules, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { GBP_LKR_RATE, type RemittanceCurrency } from "@/lib/remittance-fx";
import { formatLKR } from "@/lib/utils";
import { AlertBanner } from "@/components/hyperui";
import { ArrowRightLeft, Bot, PieChart, ShieldCheck, Send, TrendingUp } from "lucide-react";
import { WalletBalanceHeader } from "@/components/wallet/WalletBalanceHeader";
import { ErrorState } from "@/components/ErrorState";
import { WalletAnalyticsSections } from "@/components/wallet/WalletAnalyticsSections";
import { WalletBalanceHistory } from "@/components/wallet/WalletBalanceHistory";
import { NetworkErrorBanner } from "@/components/NetworkErrorBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const ASSISTANT_PROMPT =
  "Explain the latest family wallet activity and tell me whether any bucket needs attention before the next transfer.";

export default function WalletPage() {
  const { walletAccountId, userId, defaultRoute, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const { offline } = useNetworkStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const [allocationFromHash, setAllocationFromHash] = useState(false);
  const [remittanceOverride, setRemittanceOverride] = useState<{
    amount_lkr: number;
    date: string;
    amount_gbp: number;
    fx_rate: number;
    provider: string;
    currency_code?: string;
    corridor?: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && walletAccountId === null) {
      router.replace(defaultRoute);
    }
  }, [authLoading, walletAccountId, defaultRoute, router]);

  useEffect(() => {
    const sync = () => setAllocationFromHash(window.location.hash === "#allocation-editor");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setModalOpen(true);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const accountHolderRef = useRef("");
  const handleSpend = useCallback((tx: Transaction, newBalance: number) => {
    fireSpendToast(tx, newBalance, { accountHolder: accountHolderRef.current });
  }, []);

  const accountId = walletAccountId ?? "";
  const { wallet, transactions, buckets, loading, error, realtimeConnected, refetch } =
    useWalletRealtime({
      accountId,
      onSpend: handleSpend,
    });

  useLayoutEffect(() => {
    accountHolderRef.current = wallet?.account_holder ?? "";
  }, [wallet?.account_holder]);

  if (authLoading || walletAccountId === null) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-sm text-muted-foreground">
          {authLoading ? "Loading CEYFI…" : "Opening your dashboard…"}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        data-module="wallet"
        className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6 lg:p-8"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Loading wallet</span>
        <NetworkErrorBanner offline={offline} onRetry={() => void refetch()} />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div data-module="wallet" className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6 lg:p-8">
        <NetworkErrorBanner offline={offline} message={error} onRetry={() => void refetch()} />
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const allocations = Object.fromEntries(
    buckets.map((b) => [b.bucket_id, b.allocation_pct])
  );
  const mostUsedBucket = [...buckets].sort((a, b) => {
    const aPct =
      a.balance_lkr + a.spent_lkr > 0
        ? a.spent_lkr / (a.balance_lkr + a.spent_lkr)
        : 0;
    const bPct =
      b.balance_lkr + b.spent_lkr > 0
        ? b.spent_lkr / (b.balance_lkr + b.spent_lkr)
        : 0;
    return bPct - aPct;
  })[0];
  const latestSpend = transactions.find((tx) => tx.type === "debit");
  const bucketUtilPct = mostUsedBucket
    ? Math.round(
        (mostUsedBucket.spent_lkr /
          (mostUsedBucket.balance_lkr + mostUsedBucket.spent_lkr || 1)) *
          100
      )
    : 0;
  const showSpendAlert = bucketUtilPct >= 60 && mostUsedBucket != null;
  const showRemittanceAlert = remittanceOverride != null;

  return (
    <div data-module="wallet" className="stagger mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <NetworkErrorBanner offline={offline} message={error} onRetry={() => void refetch()} />
      <PageHeader
        eyebrow="Diaspora family wallet"
        title="Track money sent home with confidence"
        description="See the latest remittance, how the family is using each bucket, and adjust the next split before sending again."
        
        action={
          <Button onClick={() => setModalOpen(true)} className="interactive-press rounded-full shadow-brand">
            Send Money
          </Button>
        }
      />

      {wallet && (
        <>
          <WalletBalanceHeader
            totalBalance={wallet.total_balance_lkr}
            accountHolder={wallet.account_holder}
            isLive={realtimeConnected || !error}
          />
          <LastRemittanceBanner
          wallet={remittanceOverride
            ? { ...wallet, last_remittance: { ...wallet.last_remittance, ...remittanceOverride } }
            : wallet}
          onSendAgain={() => setModalOpen(true)}
        />

          {showRemittanceAlert ? (
            <AlertBanner
              tone="success"
              icon={Send}
              title="Remittance delivered to the family wallet"
              description={`${formatLKR(remittanceOverride.amount_lkr)} landed via ${remittanceOverride.provider}. Buckets were split using your saved allocation rules.`}
              actionLabel="Send again"
              onAction={() => setModalOpen(true)}
            />
          ) : showSpendAlert ? (
            <AlertBanner
              tone="warning"
              icon={TrendingUp}
              title={`${mostUsedBucket.label} is ${bucketUtilPct}% used this cycle`}
              description={
                latestSpend
                  ? `Latest spend at ${latestSpend.merchant}. Review the split before your next transfer.`
                  : "This bucket is moving faster than the others. Consider tuning your allocation."
              }
              actionLabel="Tune split"
              href="#allocation-editor"
            />
          ) : null}
        </>
      )}

      <InsightActionStrip
        eyebrow="Family money signal"
        title="What needs attention before the next transfer"
        insights={[
          {
            label: "Spend watch",
            value: mostUsedBucket
              ? `${Math.round(
                  (mostUsedBucket.spent_lkr /
                    (mostUsedBucket.balance_lkr + mostUsedBucket.spent_lkr ||
                      1)) *
                    100
                )}%`
              : "0%",
            detail: mostUsedBucket
              ? `${mostUsedBucket.label} is the fastest-moving bucket this cycle.`
              : "No bucket movement yet.",
            tone: "alert",
            icon: PieChart,
          },
          {
            label: "Latest activity",
            value: latestSpend ? latestSpend.merchant : "No spend",
            detail: latestSpend
              ? "Tap the Assistant to explain whether this looks usual."
              : "The wallet is quiet after the latest remittance.",
            tone: "info",
            icon: Bot,
          },
          {
            label: "Confidence",
            value: "Protected",
            detail: "Allocations are still separated for school, household, and savings.",
            tone: "success",
            icon: ShieldCheck,
          },
        ]}
        actions={[
          {
            label: "Send again",
            icon: ArrowRightLeft,
            onClick: () => setModalOpen(true),
          },
          {
            label: "Ask Assistant",
            icon: Bot,
            href: `/assistant?prompt=${encodeURIComponent(ASSISTANT_PROMPT)}&context=wallet&accountId=${encodeURIComponent(accountId)}`,
          },
          { label: "Tune split", icon: PieChart, href: "#allocation-editor" },
        ]}
      />

      <WalletBalanceHistory
        currentBalance={
          wallet?.total_balance_lkr ??
          buckets.reduce((sum, bucket) => sum + bucket.balance_lkr, 0)
        }
      />

      <BucketGrid buckets={buckets} />

      <section id="allocation-editor" className="scroll-mt-6">
        <AllocationEditor
          key={`${buckets.map((b) => `${b.bucket_id}:${b.allocation_pct}`).join("|")}|${allocationFromHash ? "open" : "closed"}`}
          buckets={buckets}
          defaultExpanded={allocationFromHash}
          onSave={async (newAllocations) => {
            try {
              await saveAllocationRules(
                userId,
                newAllocations,
                accountId
              );
              toast.success("Allocation rules saved for your next transfer.");
              await refetch(true);
            } catch (e) {
              const msg =
                e instanceof ApiError
                  ? `${e.status}: ${e.message}`
                  : e instanceof Error
                    ? e.message
                    : "Could not save allocation rules.";
              toast.error(msg);
            }
          }}
        />
      </section>

      <TransactionFeed transactions={transactions} />

      <WalletAnalyticsSections />

      <SendMoneyModal
        senderId={userId}
        recipientId={accountId}
        recipientAccountHolder={wallet?.account_holder ?? ""}
        allocations={allocations}
        onSuccess={(amountLkr?: number, amountGbp?: number, currency?: RemittanceCurrency) => {
          if (amountLkr != null && amountGbp != null) {
            setRemittanceOverride({
              amount_lkr: amountLkr,
              date: new Date().toISOString().slice(0, 10),
              amount_gbp: amountGbp,
              fx_rate: currency?.lkrRate ?? GBP_LKR_RATE,
              provider: "Tempo",
              currency_code: currency?.code ?? "GBP",
              corridor: currency ? `${currency.code} → LKR` : "GBP → LKR",
            });
          }
          void refetch(true);
        }}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
