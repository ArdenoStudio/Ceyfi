"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const DEFAULT_MPGS_HOST = "test-seylan.mtf.gateway.mastercard.com";

const MPGS_SESSION_STORAGE_PREFIX = "HostedCheckout";

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
    <div className="min-h-screen flex items-center justify-center bg-seylan-mist px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
        <h1 className="text-lg font-semibold text-seylan-charcoal">Checkout unavailable</h1>
        <p className="text-sm text-muted-foreground">
          Missing payment session. Please start again from the payment button in the app.
        </p>
        <Link
          href="/wallet"
          className="inline-block w-full rounded-lg bg-seylan-plum px-4 py-2 text-sm font-medium text-white hover:bg-seylan-red transition-colors"
        >
          Back to wallet
        </Link>
      </div>
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
              name: "Seylan Hub",
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
      <div className="min-h-screen flex items-center justify-center bg-seylan-mist px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <h1 className="text-lg font-semibold text-seylan-charcoal">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Link
            href="/wallet"
            className="inline-block w-full rounded-lg bg-seylan-plum px-4 py-2 text-sm font-medium text-white hover:bg-seylan-red transition-colors"
          >
            Back to wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-seylan-mist px-4 gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-seylan-plum border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground text-center">
        Opening secure Mastercard checkout&hellip;
      </p>
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? "";
  const merchantId = searchParams.get("merchant") ?? "";

  const mpgsHost =
    (process.env.NEXT_PUBLIC_MPGS_HOST ?? "").trim() || DEFAULT_MPGS_HOST;

  if (!sessionId) {
    return <MissingCheckoutParams />;
  }

  return (
    <HostedCheckoutLoader
      sessionId={sessionId}
      mpgsHost={mpgsHost}
      merchantId={merchantId}
    />
  );
}

export default function PaymentsCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-seylan-mist">
          <div className="h-10 w-10 rounded-full border-4 border-seylan-plum border-t-transparent animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
