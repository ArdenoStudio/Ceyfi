"use client";

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletRealtime } from "@/hooks/useWalletRealtime";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BucketGrid } from "@/components/wallet/BucketGrid";
import { AllocationEditor } from "@/components/wallet/AllocationEditor";
import { TransactionFeed } from "@/components/wallet/TransactionFeed";
import { LastRemittanceBanner } from "@/components/wallet/LastRemittanceBanner";
import { RemittanceTracker } from "@/components/wallet/RemittanceTracker";
import { SenderGuidanceCard } from "@/components/wallet/SenderGuidanceCard";
import { SendMoneyModal } from "@/components/wallet/SendMoneyModal";
import { fireSpendToast } from "@/components/wallet/SpendNotificationToast";
import { InsightActionStrip } from "@/components/insights/InsightActionStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RemittanceTracking, Transaction } from "@/types";
import {
  saveAllocationRules,
  ApiError,
  postTriggerSpend,
  getDemoRemittanceTrack,
} from "@/lib/api";
import { toast } from "sonner";
import { GBP_LKR_RATE, type RemittanceCurrency } from "@/lib/remittance-fx";
import { formatLKR, cn } from "@/lib/utils";
import { AlertBanner } from "@/components/hyperui";
import { ArrowRightLeft, Bot, PieChart, ShieldCheck, Send, TrendingUp, ShoppingCart } from "lucide-react";
import { WalletBalanceHeader } from "@/components/wallet/WalletBalanceHeader";
import { ErrorState } from "@/components/ErrorState";
import { WalletAnalyticsSections } from "@/components/wallet/WalletAnalyticsSections";
import { WalletBalanceHistory } from "@/components/wallet/WalletBalanceHistory";
import { NetworkErrorBanner } from "@/components/NetworkErrorBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLocale } from "@/contexts/LocaleContext";

const ASSISTANT_PROMPT =
  "Explain the latest family wallet activity and tell me whether any bucket needs attention before the next transfer.";

export default function WalletPage() {
  const { walletAccountId, userId, defaultRoute, persona, loading: authLoading } = useCurrentUser();
  const { t, tf, scriptClassName } = useLocale();
  const router = useRouter();
  const { offline } = useNetworkStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const [spendSimulating, setSpendSimulating] = useState(false);
  const [allocationFromHash, setAllocationFromHash] = useState(false);
  const [tracking, setTracking] = useState<RemittanceTracking | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    getDemoRemittanceTrack()
      .then((track) => {
        if (!cancelled) setTracking(track);
      })
      .catch(() => {
        /* demo track is optional when backend is down */
      });
    return () => {
      cancelled = true;
    };
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
        <p className={cn("text-sm text-muted-foreground", scriptClassName)}>
          {authLoading ? t.common.loading : t.common.openingDashboard}
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
        <span className="sr-only">{t.wallet.loadingWallet}</span>
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

  const walletCopy =
    persona === "diaspora"
      ? {
          eyebrow: t.wallet.diasporaEyebrow,
          title: t.wallet.diasporaTitle,
          description: t.wallet.diasporaDescription,
        }
      : {
          eyebrow: t.wallet.familyEyebrow,
          title: t.wallet.familyTitle,
          description: t.wallet.familyDescription,
        };

  return (
    <div
      data-module="wallet"
      className={cn(
        "stagger mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8",
        scriptClassName
      )}
    >
      <NetworkErrorBanner offline={offline} message={error} onRetry={() => void refetch()} />
      <PageHeader
        eyebrow={walletCopy.eyebrow}
        title={walletCopy.title}
        description={walletCopy.description}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              data-demo-target="wallet-spend"
              variant="outline"
              disabled={spendSimulating}
              onClick={async () => {
                setSpendSimulating(true);
                try {
                  await postTriggerSpend({
                    account_id: accountId,
                    amount_lkr: 12400,
                    merchant: "Softlogic Glomark",
                    bucket_id: "household",
                  });
                  toast.success(t.wallet.spendSimulated, {
                    description: "Softlogic Glomark · LKR 12,400 from Household",
                  });
                  await refetch(true);
                } catch {
                  toast.error(t.wallet.spendSimFailed);
                } finally {
                  setSpendSimulating(false);
                }
              }}
              className="interactive-press rounded-full"
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {spendSimulating ? t.wallet.simulating : t.wallet.simulateSpend}
            </Button>
            <Button
              data-demo-target="wallet-send-money"
              onClick={() => setModalOpen(true)}
              className="interactive-press rounded-full shadow-brand"
            >
              {t.common.sendMoney}
            </Button>
          </div>
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
            wallet={
              remittanceOverride
                ? { ...wallet, last_remittance: { ...wallet.last_remittance, ...remittanceOverride } }
                : wallet
            }
            onSendAgain={() => setModalOpen(true)}
          />

          {tracking ? <RemittanceTracker tracking={tracking} /> : null}

          <SenderGuidanceCard
            buckets={buckets}
            accountId={accountId}
            onTuneSplit={() => {
              window.location.hash = "allocation-editor";
            }}
          />

          {showRemittanceAlert ? (
            <AlertBanner
              tone="success"
              icon={Send}
              title={t.wallet.remittanceDeliveredTitle}
              description={tf(t.wallet.remittanceDeliveredDesc, {
                amount: formatLKR(remittanceOverride.amount_lkr),
                provider: remittanceOverride.provider,
              })}
              actionLabel={t.common.sendAgain}
              onAction={() => setModalOpen(true)}
            />
          ) : showSpendAlert ? (
            <AlertBanner
              tone="warning"
              icon={TrendingUp}
              title={tf(t.wallet.bucketUsedTitle, {
                label: mostUsedBucket.label,
                pct: bucketUtilPct,
              })}
              description={
                latestSpend
                  ? tf(t.wallet.bucketUsedDescSpend, { merchant: latestSpend.merchant })
                  : t.wallet.bucketUsedDescGeneric
              }
              actionLabel={t.common.tuneSplit}
              href="#allocation-editor"
            />
          ) : null}
        </>
      )}

      <InsightActionStrip
        eyebrow={t.wallet.signalEyebrow}
        title={t.wallet.signalTitle}
        insights={[
          {
            label: t.wallet.spendWatch,
            value: mostUsedBucket
              ? `${Math.round(
                  (mostUsedBucket.spent_lkr /
                    (mostUsedBucket.balance_lkr + mostUsedBucket.spent_lkr ||
                      1)) *
                    100
                )}%`
              : "0%",
            detail: mostUsedBucket
              ? tf(t.wallet.fastestBucket, { label: mostUsedBucket.label })
              : t.wallet.noBucketMovement,
            tone: "alert",
            icon: PieChart,
          },
          {
            label: t.wallet.latestActivity,
            value: latestSpend ? latestSpend.merchant : t.wallet.noSpend,
            detail: latestSpend ? t.wallet.askIfUsual : t.wallet.walletQuiet,
            tone: "info",
            icon: Bot,
          },
          {
            label: t.wallet.confidence,
            value: t.wallet.protected,
            detail: t.wallet.allocationsSeparated,
            tone: "success",
            icon: ShieldCheck,
          },
        ]}
        actions={[
          {
            label: t.common.sendAgain,
            icon: ArrowRightLeft,
            onClick: () => setModalOpen(true),
          },
          {
            label: t.common.askAssistant,
            icon: Bot,
            href: `/assistant?prompt=${encodeURIComponent(ASSISTANT_PROMPT)}&context=wallet&accountId=${encodeURIComponent(accountId)}`,
          },
          { label: t.common.tuneSplit, icon: PieChart, href: "#allocation-editor" },
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
              await saveAllocationRules(userId, newAllocations, accountId);
              toast.success(t.wallet.allocationSaved);
              await refetch(true);
            } catch (e) {
              const msg =
                e instanceof ApiError
                  ? `${e.status}: ${e.message}`
                  : e instanceof Error
                    ? e.message
                    : t.wallet.allocationSaveFailed;
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
        onSuccess={(
          amountLkr?: number,
          amountGbp?: number,
          currency?: RemittanceCurrency,
          nextTracking?: RemittanceTracking | null
        ) => {
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
          if (nextTracking) setTracking(nextTracking);
          void refetch(true);
        }}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
