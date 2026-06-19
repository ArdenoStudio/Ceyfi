"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { getPaymentStatus } from "@/lib/api";
import { Steps, type StepItem } from "@/components/daisyui-style";

type PollState = "polling" | "success" | "failed";

function paymentSteps(state: PollState): StepItem[] {
  if (state === "polling") {
    return [
      { label: "Checkout", status: "complete", tone: "success" },
      { label: "Verify payment", status: "active", tone: "primary" },
      { label: "Complete", status: "pending", tone: "neutral" },
    ];
  }
  if (state === "success") {
    return [
      { label: "Checkout", status: "complete", tone: "success" },
      { label: "Verify payment", status: "complete", tone: "success" },
      { label: "Complete", status: "complete", tone: "success" },
    ];
  }
  return [
    { label: "Checkout", status: "complete", tone: "success" },
    { label: "Verify payment", status: "error", tone: "error" },
    { label: "Complete", status: "error", tone: "error" },
  ];
}

function PaymentReturnPoller({
  orderId,
  router,
}: {
  orderId: string;
  router: { replace: (href: string) => void };
}) {
  const [state, setState] = useState<PollState>("polling");
  const [failReason, setFailReason] = useState("");
  const [purpose, setPurpose] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    async function poll() {
      elapsedRef.current += 1500;
      try {
        const data = await getPaymentStatus(orderId);
        const status: string = data?.status ?? "UNKNOWN";
        const paidPurpose: string = data?.purpose ?? "";
        if (paidPurpose) setPurpose(paidPurpose);

        if (status === "CAPTURED") {
          clearInterval(intervalRef.current!);
          setState("success");

          let destination = "/wallet";
          if (paidPurpose === "loan") {
            destination = "/loans?paid=1";
          } else if (paidPurpose === "tax_jar_inbound") {
            const amt = data?.amount_lkr ?? 0;
            destination = "/business?paid=1&amount=" + amt;
          }
          setTimeout(() => router.replace(destination), 2000);
          return;
        }

        if (status === "FAILED" || status === "CANCELLED" || status === "VOIDED") {
          clearInterval(intervalRef.current!);
          setState("failed");
          setFailReason("Payment " + status.toLowerCase() + ".");
          return;
        }
      } catch {
        // transient fetch error -- keep polling
      }

      if (elapsedRef.current >= 30000) {
        clearInterval(intervalRef.current!);
        setState("failed");
        setFailReason("Payment confirmation timed out. Please check your account.");
      }
    }

    intervalRef.current = setInterval(poll, 1500);
    poll();

    return () => clearInterval(intervalRef.current!);
  }, [orderId, router]);

  const successCopy: Record<string, string> = {
    loan: "Loan payment recorded. Redirecting to your loan dashboard.",
    tax_jar_inbound: "Payment received. Tax Jar updating. Redirecting.",
    remittance: "Funding buckets. Redirecting to your wallet.",
    shop_sale: "Sale recorded. Redirecting.",
  };

  const steps = paymentSteps(state);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ceyfi-canvas px-4 dark:bg-ceyfi-deep">
      <div className="bg-ceyfi-paper dark:bg-white/5 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-5 border border-ceyfi-line dark:border-white/10">
        <Image src="/ceyfi-logo.svg" alt="CEYFI" width={40} height={40} className="mx-auto dark:brightness-0 dark:invert" />

        <Steps steps={steps} className="px-1" />

        {state === "polling" && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-ceyfi-deep border-t-transparent animate-spin" />
            <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">Confirming payment&hellip;</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your transaction with Mastercard.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-emerald-900/40">
              <svg className="h-7 w-7 text-green-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">Payment successful</h1>
            <p className="text-sm text-muted-foreground">
              {successCopy[purpose] ?? "Redirecting\u2026"}
            </p>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">Payment failed</h1>
            <p className="text-sm text-muted-foreground">{failReason}</p>
            <button
              onClick={() => {
                const dest = purpose === "loan" ? "/loans" : purpose === "tax_jar_inbound" ? "/business" : "/wallet";
                router.replace(dest);
              }}
              className="mt-2 w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
            >
              {purpose === "loan" ? "Back to loans" : purpose === "tax_jar_inbound" ? "Back to business" : "Back to wallet"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id") ?? "";

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ceyfi-canvas px-4 dark:bg-ceyfi-deep">
        <div className="bg-ceyfi-paper dark:bg-white/5 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-5 border border-ceyfi-line dark:border-white/10">
          <Image src="/ceyfi-logo.svg" alt="CEYFI" width={40} height={40} className="mx-auto dark:brightness-0 dark:invert" />
          <Steps
            steps={[
              { label: "Checkout", status: "complete", tone: "success" },
              { label: "Verify payment", status: "error", tone: "error" },
              { label: "Complete", status: "error", tone: "error" },
            ]}
            className="px-1"
          />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">Payment failed</h1>
          <p className="text-sm text-muted-foreground">No order ID in URL.</p>
          <button
            type="button"
            onClick={() => router.replace("/wallet")}
            className="mt-2 w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
          >
            Back to wallet
          </button>
        </div>
      </div>
    );
  }

  return <PaymentReturnPoller orderId={orderId} router={router} />;
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ceyfi-sprout">
          <div className="h-10 w-10 rounded-full border-4 border-ceyfi-deep border-t-transparent animate-spin" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
