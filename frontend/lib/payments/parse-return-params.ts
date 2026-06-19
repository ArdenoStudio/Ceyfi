export type PaymentGateway = "mpgs" | "payhere";

export type PaymentReturnMode =
  | {
      kind: "poll";
      orderId: string;
      gateway?: PaymentGateway;
      purpose?: string;
    }
  | {
      kind: "immediate";
      outcome: "success" | "failed" | "cancelled";
      gateway?: PaymentGateway;
      purpose?: string;
      message?: string;
    }
  | {
      kind: "invalid";
      message: string;
    };

const SUCCESS_STATUSES = new Set([
  "success",
  "captured",
  "approved",
  "completed",
  "2",
]);

const FAILED_STATUSES = new Set([
  "failed",
  "error",
  "declined",
  "voided",
  "rejected",
  "-2",
  "-3",
]);

const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "cancel", "-1"]);

function normalizeGateway(value: string | null): PaymentGateway | undefined {
  const gateway = value?.toLowerCase();
  if (gateway === "mpgs" || gateway === "mastercard") return "mpgs";
  if (gateway === "payhere") return "payhere";
  return undefined;
}

function normalizeStatus(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

/** Parse `/payments/return` query params for MPGS, PayHere, and demo/e2e combinations. */
export function parsePaymentReturnParams(
  searchParams: URLSearchParams
): PaymentReturnMode {
  const orderId =
    searchParams.get("order_id") ??
    searchParams.get("orderId") ??
    searchParams.get("order") ??
    "";
  const gateway = normalizeGateway(searchParams.get("gateway"));
  const purpose = searchParams.get("purpose") ?? undefined;
  const status = normalizeStatus(searchParams.get("status"));
  const statusCode = normalizeStatus(searchParams.get("status_code"));
  const paymentStatus = normalizeStatus(searchParams.get("payment_status"));
  const cancelledFlag =
    searchParams.get("cancelled") === "1" ||
    searchParams.get("cancelled") === "true";
  const resultIndicator = searchParams.get("resultIndicator");
  const resolvedStatus = status || statusCode || paymentStatus;

  if (
    cancelledFlag ||
    CANCELLED_STATUSES.has(resolvedStatus)
  ) {
    return {
      kind: "immediate",
      outcome: "cancelled",
      gateway,
      purpose,
      message: "Payment was cancelled. No charge was made.",
    };
  }

  if (!orderId && resolvedStatus) {
    if (SUCCESS_STATUSES.has(resolvedStatus)) {
      return {
        kind: "immediate",
        outcome: "success",
        gateway: gateway ?? "payhere",
        purpose,
      };
    }
    if (FAILED_STATUSES.has(resolvedStatus)) {
      return {
        kind: "immediate",
        outcome: "failed",
        gateway,
        purpose,
        message: `Payment ${resolvedStatus}.`,
      };
    }
  }

  if (orderId) {
    const inferredGateway: PaymentGateway | undefined =
      gateway ??
      (orderId.startsWith("PH-")
        ? "payhere"
        : orderId.startsWith("SH-")
          ? "mpgs"
          : undefined);

    if (resolvedStatus && FAILED_STATUSES.has(resolvedStatus)) {
      return {
        kind: "immediate",
        outcome: "failed",
        gateway: inferredGateway,
        purpose,
        message: `Payment ${resolvedStatus}.`,
      };
    }

    if (resolvedStatus && SUCCESS_STATUSES.has(resolvedStatus)) {
      return {
        kind: "poll",
        orderId,
        gateway: inferredGateway,
        purpose,
      };
    }

    if (resultIndicator && !resolvedStatus) {
      return {
        kind: "poll",
        orderId,
        gateway: inferredGateway ?? "mpgs",
        purpose,
      };
    }

    return {
      kind: "poll",
      orderId,
      gateway: inferredGateway,
      purpose,
    };
  }

  if (searchParams.get("session")) {
    return {
      kind: "invalid",
      message:
        "Checkout session received without an order ID. Check your wallet or loan dashboard for updates.",
    };
  }

  return {
    kind: "invalid",
    message: "No order ID in URL.",
  };
}

export function paymentDestination(
  purpose: string,
  amountLkr?: number
): string {
  if (purpose === "loan") return "/loans?paid=1";
  if (purpose === "tax_jar_inbound") {
    const amt = amountLkr ?? 0;
    return `/business?paid=1&amount=${amt}`;
  }
  return "/wallet";
}

export function paymentBackDestination(purpose: string): string {
  if (purpose === "loan") return "/loans";
  if (purpose === "tax_jar_inbound") return "/business";
  return "/wallet";
}
