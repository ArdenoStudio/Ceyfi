"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/api";

export type PaymentPurpose = "remittance" | "loan" | "tax_jar_inbound" | "shop_sale";

export interface PayHereButtonProps {
  amountLkr: number;
  purpose: PaymentPurpose;
  description: string;
  items?: string;
  metadata?: Record<string, unknown>;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface PayHereCheckoutResponse {
  order_id: string;
  checkout_url: string;
  params: Record<string, string>;
}

export function PayHereButton({
  amountLkr,
  purpose,
  description,
  items,
  metadata = {},
  className,
  disabled = false,
  children,
}: PayHereButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    if (!amountLkr || amountLkr <= 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payhere/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_lkr: amountLkr,
          purpose,
          description,
          items: items ?? description,
          metadata,
          notify_url: `${API_BASE.replace(/\/$/, "")}/api/payhere/notify`,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
        const detail = body.detail ?? body.error ?? "";
        throw new Error(
          detail
            ? `PayHere checkout failed: ${detail}`
            : `PayHere checkout failed [${res.status}]`
        );
      }

      const data = (await res.json()) as PayHereCheckoutResponse;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.checkout_url;
      form.style.display = "none";

      for (const [key, value] of Object.entries(data.params)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start PayHere checkout.";
      const isUnconfigured = msg.includes("[503]") || msg.includes("not configured");
      setError(
        isUnconfigured
          ? "PayHere is not yet activated on this deployment."
          : msg
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className={className}
        disabled={disabled || loading || !amountLkr || amountLkr <= 0}
        onClick={handlePay}
      >
        {loading ? "Redirecting to PayHere…" : children ?? "Pay with PayHere"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
