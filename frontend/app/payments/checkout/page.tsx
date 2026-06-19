"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import Image from "next/image";
import { CreditCard, Wallet } from "lucide-react";
import { cn, formatLKR } from "@/lib/utils";
import { createPaymentSession } from "@/lib/api";
import { PayHereButton, type PaymentPurpose } from "@/components/payments/PayHereButton";

const DEFAULT_MPGS_HOST = "test-seylan.mtf.gateway.mastercard.com";
const MPGS_SESSION_STORAGE_PREFIX = "HostedCheckout";

type CheckoutGateway = "mpgs" | "payhere";

/** MPGS stores resume flags in sessionStorage; stale keys can stop a new checkout from opening. */
function clearMpgsHostedCheckoutBrowserState(): void {
  if (typeof window === "undefined") return;
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(MPGS_SESSION_STORAGE_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    /* storage unavailable */
  }
}

declare global {
  interface Window {
    Checkout?: {
      configure: (config: Record<string, unknown>) => void;
      showPaymentPage: () => void;
    };
    mpgsCheckoutErrorCallback?: (error: unknown) => void;
    mpgsCheckoutCancelCallback?: () => void;
  }
}

function MissingCheckoutParams() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ceyfi-canvas px-4 dark:bg-ceyfi-deep">
      <div className="bg-ceyfi-paper dark:bg-white/5 rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4 border border-ceyfi-line dark:border-white/10">
        <Image src="/ceyfi-logo.svg" alt="CEYFI" width={40} height={40} className="mx-auto dark:brightness-0 dark:invert" />
        <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">Checkout unavailable</h1>
        <p className="text-sm text-muted-foreground">
          Missing payment session. Please start again from the payment button in the app.
        </p>
        <Link
          href="/wallet"
          className="inline-block w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
        >
          Back to wallet
        </Link>
      </div>
    </div>
  );
}

function GatewayTabs({
  value,
  onChange,
}: {
  value: CheckoutGateway;
  onChange: (gateway: CheckoutGateway) => void;
}) {
  return (
    <div className="relative flex rounded-xl bg-muted p-1 w-full max-w-xs mx-auto">
      <motion.div
        className="absolute inset-y-1 rounded-lg bg-background shadow-sm ring-1 ring-border/60"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          width: "calc(50% - 4px)",
          left: value === "mpgs" ? 4 : "calc(50%)",
        }}
      />
      {(["mpgs", "payhere"] as const).map((gateway) => (
        <button
          key={gateway}
          type="button"
          onClick={() => onChange(gateway)}
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors duration-200",
            value === gateway ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {gateway === "mpgs" ? (
            <CreditCard className="h-3.5 w-3.5" />
          ) : (
            <Wallet className="h-3.5 w-3.5" />
          )}
          {gateway === "mpgs" ? "Mastercard (MPGS)" : "PayHere"}
        </button>
      ))}
    </div>
  );
}

function HostedCheckoutLoader({
  sessionId,
  mpgsHost,
  merchantId,
}: {
  sessionId: string;
  mpgsHost: string;
  merchantId: string;
}) {
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const scriptSrc = `https://${mpgsHost}/static/checkout/checkout.min.js`;

    clearMpgsHostedCheckoutBrowserState();
    window.mpgsCheckoutErrorCallback = (error: unknown) => {
      console.error(error);
      if (!cancelled) {
        const detail =
          typeof error === "object" && error !== null
            ? JSON.stringify(error)
            : String(error ?? "");
        setLoadError(
          detail
            ? `Payment gateway rejected checkout session: ${detail}`
            : "Payment gateway rejected the checkout session. Please start again."
        );
      }
    };
    window.mpgsCheckoutCancelCallback = () => {
      if (!cancelled) setLoadError("Payment was cancelled.");
    };

    function startHostedCheckout() {
      if (cancelled) return;
      const Checkout = window.Checkout;
      if (!Checkout) {
        setLoadError("Payment gateway did not load. Please try again.");
        return;
      }
      try {
        const config: Record<string, unknown> = {
          session: { id: sessionId },
          interaction: {
            merchant: {
              name: "CEYFI",
            },
          },
        };
        if (merchantId) {
          config.merchant = merchantId;
        }
        Checkout.configure(config);
        window.setTimeout(() => {
          if (cancelled) return;
          try {
            Checkout.showPaymentPage();
          } catch (e) {
            console.error(e);
            setLoadError("Could not open the payment page. Please try again.");
          }
        }, 120);
      } catch (e) {
        console.error(e);
        setLoadError("Could not start checkout. Please try again.");
      }
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.dataset.error = "mpgsCheckoutErrorCallback";
    script.dataset.cancel = "mpgsCheckoutCancelCallback";
    script.onload = () => startHostedCheckout();
    script.onerror = () => {
      if (!cancelled) {
        setLoadError("Failed to load payment gateway. Check your connection and try again.");
      }
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      delete window.mpgsCheckoutErrorCallback;
      delete window.mpgsCheckoutCancelCallback;
    };
  }, [sessionId, mpgsHost, merchantId]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ceyfi-canvas px-4 dark:bg-ceyfi-deep">
        <div className="bg-ceyfi-paper dark:bg-white/5 rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4 border border-ceyfi-line dark:border-white/10">
          <Image src="/ceyfi-logo.svg" alt="CEYFI" width={40} height={40} className="mx-auto dark:brightness-0 dark:invert" />
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Link
            href="/wallet"
            className="inline-block w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
          >
            Back to wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ceyfi-canvas px-4 gap-4 dark:bg-ceyfi-deep">
      <Image src="/ceyfi-logo.svg" alt="CEYFI" width={36} height={36} className="dark:brightness-0 dark:invert" />
      <div className="h-10 w-10 rounded-full border-4 border-ceyfi-deep border-t-transparent animate-spin dark:border-ceyfi-mint dark:border-t-transparent" />
      <p className="text-sm text-muted-foreground text-center">
        Opening secure Mastercard checkout&hellip;
      </p>
    </div>
  );
}

function GatewayCheckoutPanel({
  amountLkr,
  purpose,
  description,
  defaultGateway,
}: {
  amountLkr: number;
  purpose: PaymentPurpose;
  description: string;
  defaultGateway: CheckoutGateway;
}) {
  const [gateway, setGateway] = useState<CheckoutGateway>(defaultGateway);
  const [mpgsLoading, setMpgsLoading] = useState(false);
  const [mpgsError, setMpgsError] = useState("");

  async function startMpgsCheckout() {
    setMpgsLoading(true);
    setMpgsError("");
    try {
      const session = await createPaymentSession({
        amount_lkr: amountLkr,
        purpose,
        description,
        metadata: {},
      });
      window.location.href = session.checkout_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isUnconfigured = msg.includes("[503]") || msg.includes("not enabled");
      setMpgsError(
        isUnconfigured
          ? "MPGS card payments are not yet activated on this deployment."
          : "Could not create MPGS session. Please try again."
      );
      setMpgsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ceyfi-canvas px-4 dark:bg-ceyfi-deep">
      <div className="bg-ceyfi-paper dark:bg-white/5 rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6 border border-ceyfi-line dark:border-white/10">
        <div className="text-center space-y-2">
          <Image src="/ceyfi-logo.svg" alt="CEYFI" width={40} height={40} className="mx-auto dark:brightness-0 dark:invert" />
          <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">Choose payment method</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xl font-bold text-ceyfi-deep">{formatLKR(amountLkr)}</p>
        </div>

        <GatewayTabs value={gateway} onChange={setGateway} />

        {gateway === "mpgs" ? (
          <div className="space-y-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Mastercard test gateway. Approved test card:{" "}
              <span className="font-mono font-semibold text-ceyfi-ink">5123 4500 0000 0008</span>
              , expiry <span className="font-mono font-semibold text-ceyfi-ink">01/39</span>,
              CVV <span className="font-mono font-semibold text-ceyfi-ink">100</span>.
            </p>
            {mpgsError ? <p className="text-xs text-red-600">{mpgsError}</p> : null}
            <button
              type="button"
              disabled={mpgsLoading}
              onClick={startMpgsCheckout}
              className="w-full rounded-lg bg-ceyfi-deep px-4 py-2.5 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors disabled:opacity-60"
            >
              {mpgsLoading ? "Starting MPGS checkout…" : "Pay with Mastercard"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              PayHere sandbox — use test cards or mobile wallets registered with your PayHere
              merchant account.
            </p>
            <PayHereButton
              amountLkr={amountLkr}
              purpose={purpose}
              description={description}
              className="w-full bg-ceyfi-green hover:bg-ceyfi-green/90 text-white py-2.5"
            >
              Pay with PayHere
            </PayHereButton>
          </div>
        )}

        <Link
          href="/wallet"
          className="block text-center text-sm text-muted-foreground hover:text-ceyfi-ink"
        >
          Cancel and return to wallet
        </Link>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? "";
  const merchantId = searchParams.get("merchant") ?? "";
  const cancelled = searchParams.get("cancelled") === "1";
  const amountParam = searchParams.get("amount");
  const purposeParam = searchParams.get("purpose") as PaymentPurpose | null;
  const descriptionParam = searchParams.get("description") ?? "CEYFI payment";
  const gatewayParam = searchParams.get("gateway") as CheckoutGateway | null;

  const mpgsHost =
    (process.env.NEXT_PUBLIC_MPGS_HOST ?? "").trim() || DEFAULT_MPGS_HOST;

  const amountLkr = amountParam ? parseFloat(amountParam) : 0;
  const hasGatewayCheckout =
    Number.isFinite(amountLkr) &&
    amountLkr > 0 &&
    purposeParam &&
    ["remittance", "loan", "tax_jar_inbound", "shop_sale"].includes(purposeParam);

  if (cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ceyfi-sprout px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <h1 className="text-lg font-semibold text-ceyfi-ink">Payment cancelled</h1>
          <p className="text-sm text-muted-foreground">
            You cancelled the PayHere checkout. No charge was made.
          </p>
          <Link
            href="/wallet"
            className="inline-block w-full rounded-lg bg-ceyfi-deep px-4 py-2 text-sm font-medium text-white hover:bg-ceyfi-green transition-colors"
          >
            Back to wallet
          </Link>
        </div>
      </div>
    );
  }

  if (sessionId) {
    return (
      <HostedCheckoutLoader
        sessionId={sessionId}
        mpgsHost={mpgsHost}
        merchantId={merchantId}
      />
    );
  }

  if (hasGatewayCheckout) {
    return (
      <GatewayCheckoutPanel
        amountLkr={amountLkr}
        purpose={purposeParam}
        description={descriptionParam}
        defaultGateway={gatewayParam === "payhere" ? "payhere" : "mpgs"}
      />
    );
  }

  return <MissingCheckoutParams />;
}

export default function PaymentsCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ceyfi-sprout">
          <div className="h-10 w-10 rounded-full border-4 border-ceyfi-deep border-t-transparent animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
