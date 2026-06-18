"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { PlSummaryCard } from "@/components/business/PlSummaryCard";
import { ExpenseBreakdown } from "@/components/business/ExpenseBreakdown";
import { TaxJarPanel } from "@/components/business/TaxJarPanel";
import { CategorisedTransactionFeed } from "@/components/business/CategorisedTransactionFeed";
import { InsightActionStrip } from "@/components/insights/InsightActionStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlSummary, getBusinessAccount } from "@/lib/api";
import { PlSummary, Transaction } from "@/types";
import { Bot, PiggyBank, ReceiptText, TrendingUp } from "lucide-react";
import { BusinessAnalyticsSections } from "@/components/business/BusinessAnalyticsSections";
import { toast } from "sonner";

const BUSINESS_USER_ID = "SEY-BIZ-001";
const ASSISTANT_PROMPT =
  "Act as my SME bookkeeper. Review this week's revenue, expenses, tax jar readiness, and transactions that need category review.";

export default function BusinessPage() {
  const [extraTransactions, setExtraTransactions] = useState<Transaction[]>([]);
  const [pl, setPl] = useState<PlSummary | null>(null);
  const [taxJarBalance, setTaxJarBalance] = useState(15070);
  const [plLoading, setPlLoading] = useState(true);
  const paidToastFired = useRef(false);

  // Handle redirect back from MPGS payment
  useEffect(() => {
    if (paidToastFired.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      paidToastFired.current = true;
      const amount = parseFloat(params.get("amount") ?? "0");
      const taxSaved = amount > 0 ? Math.round(amount * 0.1) : 0;
      toast.success("Payment received", {
        description:
          taxSaved > 0
            ? `LKR ${amount.toLocaleString()} received — LKR ${taxSaved.toLocaleString()} auto-saved to Tax Jar.`
            : "Customer card payment confirmed.",
      });
      let bumpTimer: ReturnType<typeof setTimeout> | undefined;
      if (taxSaved > 0) {
        bumpTimer = setTimeout(() => {
          setTaxJarBalance((prev) => prev + taxSaved);
        }, 0);
      }
      window.history.replaceState({}, "", window.location.pathname);
      return () => {
        if (bumpTimer) clearTimeout(bumpTimer);
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getPlSummary(BUSINESS_USER_ID),
      getBusinessAccount(BUSINESS_USER_ID),
    ]).then((results) => {
      if (cancelled) return;
      const [plRes, bizRes] = results;
      if (plRes.status === "fulfilled") {
        setPl(plRes.value as PlSummary);
      } else {
        setPl(null);
      }
      if (bizRes.status === "fulfilled") {
        const raw = bizRes.value as { tax_jar_balance?: number };
        setTaxJarBalance(
          typeof raw.tax_jar_balance === "number" ? raw.tax_jar_balance : 15070
        );
      } else {
        setTaxJarBalance(15070);
      }
    }).finally(() => {
      if (!cancelled) setPlLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewTransaction = useCallback((tx: Transaction) => {
    setExtraTransactions((prev) => [tx, ...prev]);
  }, []);

  if (plLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const expenses = pl?.expenses_lkr ?? 0;
  const net = pl?.net_lkr ?? 0;
  const revenue = pl?.revenue_lkr ?? 0;
  const misc = pl?.expense_breakdown?.MISC ?? 0;

  const dailyExpenseRate = expenses > 0 ? expenses / 7 : 0;
  const cashRunwayDays = Math.max(
    1,
    dailyExpenseRate > 0 ? Math.round(net / dailyExpenseRate) : 1
  );
  const projectedTaxNeed = revenue > 0 ? Math.round(revenue * 0.45) : 0;
  const taxCoveragePct =
    projectedTaxNeed > 0
      ? Math.min(100, Math.round((taxJarBalance / projectedTaxNeed) * 100))
      : 0;
  const reviewCount = misc > 0 ? extraTransactions.length + 1 : extraTransactions.length;

  return (
    <div data-module="business" className="mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="SME bookkeeper"
        title="Silva Hardware & Electricals"
        description="A weekly finance cockpit for revenue, spending, tax savings, and AI-assisted transaction categories."
        meta={
          <span className="inline-flex rounded-full border border-ceyfi-line bg-ceyfi-canvas px-3 py-1 text-xs font-medium text-ceyfi-muted">
            Gampaha
          </span>
        }
      />

      <InsightActionStrip
        eyebrow="SME command center"
        title="Keep cash, categories, and tax moving together"
        insights={[
          {
            label: "Cash runway",
            value: `${cashRunwayDays} days`,
            detail: "Based on this week's net margin and average daily expenses.",
            tone: "success",
            icon: TrendingUp,
          },
          {
            label: "Tax jar",
            value: `${taxCoveragePct}%`,
            detail: "Coverage is estimated from current tax jar balance and weekly revenue.",
            tone: "info",
            icon: PiggyBank,
          },
          {
            label: "Needs review",
            value: `${reviewCount}`,
            detail: "Recent transactions should be checked before filing.",
            tone: "neutral",
            icon: ReceiptText,
          },
        ]}
        actions={[
          {
            label: "Ask bookkeeper",
            icon: Bot,
            href: `/assistant?prompt=${encodeURIComponent(ASSISTANT_PROMPT)}`,
          },
          { label: "Review tax jar", icon: PiggyBank, href: "#tax-jar" },
          { label: "Check categories", icon: ReceiptText, href: "#business-feed" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PlSummaryCard userId={BUSINESS_USER_ID} />
          <ExpenseBreakdown userId={BUSINESS_USER_ID} />
        </div>
        <div id="tax-jar" className="scroll-mt-6">
          <TaxJarPanel
            userId={BUSINESS_USER_ID}
            initialBalance={taxJarBalance}
            onNewTransaction={handleNewTransaction}
          />
        </div>
      </div>

      <section id="business-feed" className="scroll-mt-6">
        <CategorisedTransactionFeed
          userId={BUSINESS_USER_ID}
          extraTransactions={extraTransactions}
        />
      </section>

      <BusinessAnalyticsSections />
    </div>
  );
}
