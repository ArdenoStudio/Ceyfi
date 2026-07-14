import { NextResponse } from "next/server";
import { absoluteBackendUrl } from "@/lib/urls";

const BACKEND = absoluteBackendUrl();
const TIMEOUT = 5000;
/** Demo user IDs that exist in backend fixtures and Supabase seeds */
const DEMO_SENDER_ID = "SEY-USR-001";
const DEMO_ACCOUNT_ID = "SEY-ACC-002";

interface ServiceResult {
  key: string;
  label: string;
  description: string;
  status: "up" | "degraded" | "down";
  latency: number | null;
  httpStatus: number | null;
}

async function probe(
  key: string,
  label: string,
  description: string,
  url: string
): Promise<ServiceResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      cache: "no-store",
    });
    const latency = Date.now() - t0;
    return {
      key,
      label,
      description,
      status: res.ok ? "up" : "degraded",
      latency,
      httpStatus: res.status,
    };
  } catch {
    return {
      key,
      label,
      description,
      status: "down",
      latency: Date.now() - t0,
      httpStatus: null,
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    probe("api", "Core API", "FastAPI backend health", `${BACKEND}/health`),
    probe(
      "wallet",
      "Wallet Service",
      "Family wallet & transfer engine",
      `${BACKEND}/api/wallet/rules/${DEMO_SENDER_ID}?account_id=${DEMO_ACCOUNT_ID}`
    ),
    probe(
      "loans",
      "Loans Service",
      "Loan health scoring & advisor",
      `${BACKEND}/api/loans/${DEMO_SENDER_ID}/health`
    ),
    probe(
      "account_context",
      "Account context",
      "Fixture account-context for demo user",
      `${BACKEND}/mock/account-context/${DEMO_SENDER_ID}`
    ),
  ]);

  const allUp = checks.every((c) => c.status === "up");
  const anyDown = checks.some((c) => c.status === "down");
  const overall: "operational" | "degraded" | "outage" = allUp
    ? "operational"
    : anyDown
    ? "outage"
    : "degraded";

  return NextResponse.json(
    { overall, services: checks, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
