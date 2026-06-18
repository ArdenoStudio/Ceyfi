"use client";

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import { useWalletRealtime } from "@/hooks/useWalletRealtime";
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
import { type RemittanceCurrency } from "@/lib/remittance-fx";
import { ArrowRightLeft, Bot, PieChart, ShieldCheck } from "lucide-react";

const FAMILY_ACCOUNT_ID = "SEY-ACC-002";
const WALLET_SENDER_ID = "SEY-USR-001";
const ASSISTANT_PROMPT =
  "Explain the latest family wallet activity and tell me whether any bucket needs attention before the next transfer.";

export default function WalletPage() {
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
    const sync = () => setAllocationFromHash(window.location.hash === "#allocation-editor");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const accountHolderRef = useRef("");
  const handleSpend = useCallback((tx: Transaction, newBalance: number) => {
    fireSpendToast(tx, newBalance, { accountHolder: accountHolderRef.current });
  }, []);

  const { wallet, transactions, buckets, loading, refetch } =
    useWalletRealtime({
      accountId: FAMILY_ACCOUNT_ID,
      onSpend: handleSpend,
    });

  useLayoutEffect(() => {
    accountHolderRef.current = wallet?.account_holder ?? "";
  }, [wallet?.account_holder]);

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

  return (
    <div
      data-module="wallet"
      className="dark relative min-h-full overflow-hidden"
      style={{ background: "#0c0407" }}
    >
      {/* Ambient glow layers — mirrors the assistant page */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-8%,rgba(227,24,33,0.15),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-[radial-gradient(ellipse_55%_35%_at_50%_110%,rgba(114,28,36,0.10),transparent)]" />
      </div>
      {/* Subtle dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Actual page content */}
      <div className="relative z-10 space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Diaspora family wallet"
        title="Track money sent home with confidence"
        description="See the latest remittance, how the family is using each bucket, and adjust the next split before sending again."
        
        action={
          <Button onClick={() => setModalOpen(true)} className="rounded-full">
            Send Money
          </Button>
        }
      />

      {wallet && (
        <LastRemittanceBanner
          wallet={remittanceOverride
            ? { ...wallet, last_remittance: { ...wallet.last_remittance, ...remittanceOverride } }
            : wallet}
          onSendAgain={() => setModalOpen(true)}
        />
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
            href: `/assistant?prompt=${encodeURIComponent(ASSISTANT_PROMPT)}&context=wallet&accountId=${encodeURIComponent(FAMILY_ACCOUNT_ID)}`,
          },
          { label: "Tune split", icon: PieChart, href: "#allocation-editor" },
        ]}
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
                WALLET_SENDER_ID,
                newAllocations,
                FAMILY_ACCOUNT_ID
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

      <SendMoneyModal
        senderId={WALLET_SENDER_ID}
        recipientId={FAMILY_ACCOUNT_ID}
        recipientAccountHolder={wallet?.account_holder ?? ""}
        allocations={allocations}
        onSuccess={(amountLkr?: number, amountGbp?: number, currency?: RemittanceCurrency) => {
          if (amountLkr != null && amountGbp != null) {
            setRemittanceOverride({
              amount_lkr: amountLkr,
              date: new Date().toISOString().slice(0, 10),
              amount_gbp: amountGbp,
              fx_rate: currency?.lkrRate ?? 408.3,
              provider: "Seylan Hub",
              currency_code: currency?.code ?? "GBP",
              corridor: currency ? `${currency.code} → LKR` : "GBP → LKR",
            });
          }
          void refetch(true);
        }}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
      </div>{/* /z-10 content */}
    </div>
  );
}
