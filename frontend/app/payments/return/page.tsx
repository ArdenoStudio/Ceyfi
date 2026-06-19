"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { getPaymentStatus } from "@/lib/api";
import { Steps, type StepItem } from "@/components/daisyui-style";
import {
  parsePaymentReturnParams,
  paymentBackDestination,
  paymentDestination,
  type PaymentGateway,
} from "@/lib/payments/parse-return-params";

type PollState = "polling" | "success" | "failed";

function gatewayLabel(gateway?: PaymentGateway): string {
  if (gateway === "payhere") return "PayHere";
  if (gateway === "mpgs") return "Mastercard";
  return "the payment gateway";
}

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

const SUCCESS_COPY: Record<string, string> = {
  loan: "Loan payment recorded. Redirecting to your loan dashboard.",
  tax_jar_inbound: "Payment received. Tax Jar updating. Redirecting.",
  remittance: "Funding buckets. Redirecting to your wallet.",
  shop_sale: "Sale recorded. Redirecting.",
};

function ReturnShell({
  children,
  busy = false,
}: {
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-ceyfi-canvas px-4 dark:bg-ceyfi-deep"
      aria-busy={busy}
    >
      <div className="bg-ceyfi-paper dark:bg-white/5 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-5 border border-ceyfi-line dark:border-white/10">
        <Image
          src="/ceyfi-icon.svg"
          alt="CEYFI"
          width={40}
          height={40}
          className="mx-auto dark:brightness-0 dark:invert"
        />
        {children}
      </div>
    </div>
  );
}

function PaymentReturnPoller({
  orderId,
  gateway,
  initialPurpose,
  router,
}: {
  orderId: string;
  gateway?: PaymentGateway;
  initialPurpose?: string;
  router: { replace: (href: string) => void };
}) {
  const [state, setState] = useState<PollState>("polling");
  const [failReason, setFailReason] = useState("");
  const [purpose, setPurpose] = useState(initialPurpose ?? "");
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
          setTimeout(
            () => router.replace(paymentDestination(paidPurpose, data?.amount_lkr)),
            2000
          );
          return;
        }

        if (status === "FAILED" || status === "CANCELLED" || status === "VOIDED") {
          clearInterval(intervalRef.current!);
          setState("failed");
          setFailReason(`Payment ${status.toLowerCase()}.`);
          return;
        }
      } catch {
        // transient fetch error — keep polling
      }

      if (elapsedRef.current >= 30000) {
        clearInterval(intervalRef.current!);
        setState("failed");
        setFailReason(
          "Payment confirmation timed out. Please check your account."
        );
      }
    }

    intervalRef.current = setInterval(poll, 1500);
    poll();

    return () => clearInterval(intervalRef.current!);
  }, [orderId, router]);

  const steps = paymentSteps(state);
  const backDest = paymentBackDestination(purpose);

  return (
    <ReturnShell busy={state === "polling"}>
      <Steps steps={steps} className="px-1" />

      {state === "polling" && (
        <>
          <div
            className="mx-auto h-12 w-12 rounded-full border-4 border-ceyfi-deep border-t-transparent animate-spin"
            role="status"
            aria-label="Confirming payment"
          />
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
            Confirming payment&hellip;
          </h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your transaction with{" "}
            {gatewayLabel(gateway)}.
          </p>
        </>
      )}

      {state === "success" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-emerald-900/40">
            <svg
              className="h-7 w-7 text-green-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
            Payment successful
          </h1>
          <p className="text-sm text-muted-foreground">
            {SUCCESS_COPY[purpose] ?? "Redirecting\u2026"}
          </p>
        </>
      )}

      {state === "failed" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <svg
              className="h-7 w-7 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
            Payment failed
          </h1>
          <p className="text-sm text-muted-foreground">{failReason}</p>
          <button
            type="button"
            onClick={() => router.replace(backDest)}
            className="mt-2 w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
          >
            {purpose === "loan"
              ? "Back to loans"
              : purpose === "tax_jar_inbound"
                ? "Back to business"
                : "Back to wallet"}
          </button>
        </>
      )}
    </ReturnShell>
  );
}

function ImmediateReturn({
  outcome,
  gateway,
  purpose = "",
  message,
  router,
}: {
  outcome: "success" | "failed" | "cancelled";
  gateway?: PaymentGateway;
  purpose?: string;
  message?: string;
  router: { replace: (href: string) => void };
}) {
  useEffect(() => {
    if (outcome !== "success") return;
    const timer = window.setTimeout(() => {
      router.replace(paymentDestination(purpose));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [outcome, purpose, router]);

  const steps: StepItem[] =
    outcome === "success"
      ? paymentSteps("success")
      : outcome === "cancelled"
        ? [
            { label: "Checkout", status: "complete", tone: "success" },
            { label: "Verify payment", status: "error", tone: "warning" },
            { label: "Complete", status: "error", tone: "neutral" },
          ]
        : paymentSteps("failed");

  const backDest = paymentBackDestination(purpose);

  return (
    <ReturnShell busy={outcome === "success"}>
      <Steps steps={steps} className="px-1" />

      {outcome === "success" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-emerald-900/40">
            <svg
              className="h-7 w-7 text-green-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
            Payment successful
          </h1>
          <p className="text-sm text-muted-foreground">
            {gateway
              ? `${gatewayLabel(gateway)} confirmed your payment. `
              : ""}
            {SUCCESS_COPY[purpose] ?? "Redirecting\u2026"}
          </p>
        </>
      )}

      {outcome === "cancelled" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <svg
              className="h-7 w-7 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
            Payment cancelled
          </h1>
          <p className="text-sm text-muted-foreground">
            {message ?? "No charge was made."}
          </p>
          <button
            type="button"
            onClick={() => router.replace(backDest)}
            className="mt-2 w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
          >
            Back to wallet
          </button>
        </>
      )}

      {outcome === "failed" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <svg
              className="h-7 w-7 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
            Payment failed
          </h1>
          <p className="text-sm text-muted-foreground">
            {message ?? "The payment could not be completed."}
          </p>
          <button
            type="button"
            onClick={() => router.replace(backDest)}
            className="mt-2 w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
          >
            {purpose === "loan"
              ? "Back to loans"
              : purpose === "tax_jar_inbound"
                ? "Back to business"
                : "Back to wallet"}
          </button>
        </>
      )}
    </ReturnShell>
  );
}

function InvalidReturn({
  message,
  router,
}: {
  message: string;
  router: { replace: (href: string) => void };
}) {
  return (
    <ReturnShell>
      <Steps
        steps={[
          { label: "Checkout", status: "complete", tone: "success" },
          { label: "Verify payment", status: "error", tone: "error" },
          { label: "Complete", status: "error", tone: "error" },
        ]}
        className="px-1"
      />
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <svg
          className="h-7 w-7 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
        Payment failed
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={() => router.replace("/wallet")}
        className="mt-2 w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
      >
        Back to wallet
      </button>
    </ReturnShell>
  );
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const parsed = parsePaymentReturnParams(searchParams);

  if (parsed.kind === "poll") {
    return (
      <PaymentReturnPoller
        orderId={parsed.orderId}
        gateway={parsed.gateway}
        initialPurpose={parsed.purpose}
        router={router}
      />
    );
  }

  if (parsed.kind === "immediate") {
    return (
      <ImmediateReturn
        outcome={parsed.outcome}
        gateway={parsed.gateway}
        purpose={parsed.purpose}
        message={parsed.message}
        router={router}
      />
    );
  }

  return <InvalidReturn message={parsed.message} router={router} />;
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <ReturnShell busy>
          <div
            className="mx-auto h-10 w-10 rounded-full border-4 border-ceyfi-deep border-t-transparent animate-spin"
            role="status"
            aria-label="Loading payment status"
          />
        </ReturnShell>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
