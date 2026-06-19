/**
 * Backend URL resolution (first match wins):
 *   NEXT_PUBLIC_API_URL  — ECS / custom production backend (see frontend/.env.production.example)
 *   NEXT_PUBLIC_API_BASE — legacy alias, local dev default in .env.example
 *   fallback             — Vercel backend in production builds, localhost:8000 in dev
 */
import { adminHeaders, authHeaders } from "@/lib/auth";

function jsonHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...extra,
  };
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production"
    ? "https://seylan-hub-backend.vercel.app"
    : "http://localhost:8000");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options?.headers as Record<string, string> | undefined),
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function getAccountContext(userId: string) {
  return request(`/mock/account-context/${userId}`);
}

interface RawWalletResponse {
  account_id: string;
  account_holder: string;
  linked_sender: string;
  total_balance_lkr: number;
  last_remittance?: Record<string, unknown>;
  buckets?: Record<string, unknown>[];
  recent_transactions?: Record<string, unknown>[];
  [key: string]: unknown;
}

export async function getFamilyWallet(accountId: string) {
  const raw = await request<RawWalletResponse>(`/mock/family-wallet/${accountId}`);
  return {
    ...raw,
    last_remittance: raw.last_remittance ? {
      ...raw.last_remittance,
      amount_gbp: (raw.last_remittance as Record<string, unknown>).sender_amount_gbp ?? (raw.last_remittance as Record<string, unknown>).amount_gbp,
      fx_rate: (raw.last_remittance as Record<string, unknown>).exchange_rate ?? (raw.last_remittance as Record<string, unknown>).fx_rate,
    } : undefined,
    buckets: (raw.buckets ?? []).map((b) => ({
      ...b,
      bucket_id: (b as Record<string, unknown>).bucket_id ?? (b as Record<string, unknown>).id,
      allocation_pct: (b as Record<string, unknown>).allocation_pct ?? (b as Record<string, unknown>).allocated_pct,
    })),
    recent_transactions: (raw.recent_transactions ?? []).map((t) => ({
      ...t,
      transaction_id: (t as Record<string, unknown>).transaction_id ?? (t as Record<string, unknown>).id,
      timestamp: (t as Record<string, unknown>).timestamp ?? (t as Record<string, unknown>).date,
      type: (t as Record<string, unknown>).type ?? ((t as Record<string, unknown>).amount_lkr as number) < 0 ? "debit" : "credit",
    })),
  };
}

export async function getLoans(userId: string) {
  const data = await request<Record<string, unknown>>(`/mock/loans/${userId}`);
  if (data && Array.isArray((data as Record<string, unknown>).loans)) {
    const loans = (data as Record<string, unknown>).loans as unknown[];
    return loans[0] ?? null;
  }
  if (Array.isArray(data)) {
    return (data as unknown[])[0] ?? null;
  }
  return data;
}

export async function getBusinessAccount(userId: string) {
  return request(`/mock/business-account/${userId}`);
}

export async function getPlSummary(userId: string) {
  return request(`/mock/pl-summary/${userId}`);
}

export interface FinancialSnapshot {
  user_id: string;
  name: string;
  persona: string;
  balance_lkr: number;
  savings_balance: number;
  current_balance: number;
  health_score: number;
  health_components: {
    name: string;
    score: number;
    insight: string;
    actions: string[];
  }[];
  anomalies: {
    id: string;
    title: string;
    description: string;
    date: string;
    resolved: boolean;
  }[];
  opportunities: {
    title: string;
    benefit: number;
    confidence: number;
    icon: string;
  }[];
  decisions: {
    id: string;
    title: string;
    category: "Grow" | "Protect" | "Move" | "Save";
    benefit_lkr: number;
    benefit_label: string;
    risk_reduced: string;
    confidence: number;
    evidence: string[];
    tradeoffs: string[];
    deadline: string;
    reversible: boolean;
    urgency: "High" | "Medium" | "Low";
  }[];
  forecast: { day: string; actual: number; predicted: number }[];
  scenario_base_balance: number;
  updated_at: string;
  data_source: "live" | "fixture";
}

export async function getFinancialSnapshot(userId: string) {
  return request<FinancialSnapshot>(`/api/financial-snapshot/${userId}`);
}

export async function postWalletTransfer(payload: {
  sender_account_id: string;
  recipient_account_id: string;
  amount_lkr: number;
  corridor: string;
  allocation_rules: Record<string, number>;
}) {
  const normalised = {
    ...payload,
    allocation_rules: Object.entries(payload.allocation_rules).map(
      ([bucket_id, pct]) => ({ bucket_id, pct })
    ),
  };
  const body = JSON.stringify(normalised);
  const url =
    typeof window !== "undefined"
      ? "/api/wallet/transfer"
      : `${API_BASE}/api/wallet/transfer`;
  const res = await fetch(url, {
    method: "POST",
    headers: jsonHeaders(),
    body,
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function postDemoLoanPayment(payload: {
  user_id: string;
  loan_id: string;
  amount_lkr: number;
}) {
  return request<{ ok: boolean; outstanding_lkr: number; payments_made: number; health_score: string }>(
    "/api/loans/demo-payment",
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }
  );
}

export async function createPaymentSession(args: {
  amount_lkr: number;
  purpose: "remittance" | "loan" | "tax_jar_inbound" | "shop_sale";
  description: string;
  metadata: Record<string, unknown>;
}): Promise<{ order_id: string; session_id: string; checkout_url: string }> {
  const res = await fetch(`${API_BASE}/api/payments/session`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: string }).detail ?? "";
    throw new Error(`Failed to create payment session [${res.status}]${detail ? ": " + detail : ""}`);
  }
  return res.json();
}

export async function getPaymentStatus(orderId: string) {
  const res = await fetch(`${API_BASE}/api/payments/${orderId}`);
  if (!res.ok) throw new Error("Failed to fetch payment status");
  return res.json();
}

export async function getSandboxTransferAccounts() {
  const url =
    typeof window !== "undefined"
      ? "/api/wallet/sandbox-transfer-accounts"
      : `${API_BASE}/api/wallet/sandbox-transfer-accounts`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<{
    source_account: string;
    destination_account: string;
  }>;
}

export async function saveAllocationRules(
  senderId: string,
  allocations: Record<string, number>,
  accountId = "SEY-ACC-002"
) {
  return request(`/api/wallet/rules/${senderId}`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      account_id: accountId,
      allocation_rules: Object.entries(allocations).map(([bucket_id, pct]) => ({
        bucket_id,
        pct,
      })),
    }),
  });
}

export async function postChat(
  payload: {
    user_id: string;
    session_id: string;
    message: string;
    language: string;
    history: { role: string; content: string }[];
  },
  onToken: (token: string) => void,
  onError?: (message: string) => void,
  onPaymentAction?: (action: Record<string, unknown>) => void,
  onThinking?: (chunk: string) => void
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new ApiError(res.status, text);
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError?.(parsed.error);
              return;
            }
            if (parsed.done) return;
            if (parsed.thinking) onThinking?.(parsed.thinking);
            if (parsed.token) onToken(parsed.token);
            if (parsed.payment_action) onPaymentAction?.(parsed.payment_action);
          } catch {
            // skip malformed lines
          }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function postTts(payload: { text: string; language: string }) {
  return request<{ audio_base64: string; content_type: string }>("/api/tts", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function postStt(audioBlob: Blob) {
  const form = new FormData();
  form.append("audio", audioBlob, "speech.webm");
  const res = await fetch(`${API_BASE}/api/stt`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: string }).detail ?? "Speech transcription failed.";
    throw new Error(detail);
  }
  return res.json() as Promise<{ text: string }>;
}

interface CategorizedItem {
  id: string;
  category_en: string;
  category_si: string;
  subcategory: string;
  confidence: number;
}

export async function postCategorize(payload: { transaction_ids: string[] }): Promise<
  Record<string, { category_en: string; category_si: string; subcategory: string }>
> {
  const raw = await request<{ categorized: CategorizedItem[] }>("/api/categorize-transactions", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const map: Record<string, { category_en: string; category_si: string; subcategory: string }> = {};
  for (const item of raw.categorized ?? []) {
    map[item.id] = {
      category_en: item.category_en,
      category_si: item.category_si,
      subcategory: item.subcategory,
    };
  }
  return map;
}

export async function getProfileData(userId: string) {
  return request<{
    user_id: string;
    name: string;
    account_holder: string;
    accounts: string[];
    balance_lkr: number;
    language_preference: string;
    savings_balance: number;
    current_balance: number;
    recent_transactions: {
      id: string;
      date: string;
      description: string;
      amount_lkr: number;
      type: "credit" | "debit";
    }[];
    loans: {
      id: string;
      type: string;
      disbursed_amount_lkr: number;
      outstanding_lkr: number;
      monthly_installment_lkr: number;
      next_payment_date: string;
      next_payment_amount_lkr: number;
    }[];
    fixed_deposits: {
      id: string;
      amount_lkr: number;
      maturity_date: string;
      interest_rate_pct: number;
      term_months: number;
    }[];
  }>(`/mock/account-context/${userId}`);
}

export async function prewarmDemoData() {
  await Promise.all([
    getFamilyWallet("SEY-ACC-002"),
    getLoans("SEY-USR-001"),
    getLoans("SEY-USR-003"),
    getBusinessAccount("SEY-BIZ-001"),
    getPlSummary("SEY-BIZ-001"),
    postCategorize({ transaction_ids: [] }).catch(() => null),
  ]);
}

export async function postDemoReset() {
  const result = await request("/mock/reset-demo", {
    method: "POST",
    headers: adminHeaders(),
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("seylan:demo-reset"));
  }
  return result;
}

export function postTaxJarRule(payload: {
  user_id: string;
  rule: string;
  percentage: number;
}) {
  return request("/api/tax-jar/rule", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function postTaxJarTrigger(payload: {
  user_id: string;
  incoming_amount_lkr: number;
  description: string;
}): Promise<{ new_balance: number; tax_saved: number }> {
  const raw = await request<{
    new_tax_jar_balance_lkr?: number;
    new_balance?: number;
    tax_transfer_amount_lkr?: number;
  }>("/mock/tax-jar/trigger", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return {
    new_balance: raw.new_tax_jar_balance_lkr ?? raw.new_balance ?? 0,
    tax_saved: raw.tax_transfer_amount_lkr ?? Math.round(payload.incoming_amount_lkr * 0.1),
  };
}

export function postTriggerSpend(payload: {
  account_id: string;
  amount_lkr: number;
  merchant: string;
  bucket_id: string;
}) {
  return request("/mock/trigger-spend", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export interface CfoBrief {
  user_id: string;
  date: string;
  summary: string;
  bullets: string[];
  actions: { priority: number; title: string; benefit_lkr: number; href: string }[];
  runway_days: number;
  overdue_receivables_lkr: number;
  tax_jar_balance: number;
}

export interface ReceivableRow {
  client: string;
  invoice: string;
  amount: number;
  due: string;
  overdue: number;
  status: string;
  trust_score: number;
}

export async function getCfoBrief(userId: string) {
  return request<CfoBrief>(`/api/business/cfo-brief?user_id=${encodeURIComponent(userId)}`);
}

export async function getReceivables() {
  return request<{ receivables: ReceivableRow[]; predictions: Record<string, unknown>[] }>(
    "/api/business/receivables"
  );
}

export async function postRecoveryMessage(payload: {
  client: string;
  invoice: string;
  amount: number;
  overdue_days: number;
  tone?: string;
}) {
  return request<{ messages: { en: string; si: string; ta: string }; tone: string }>(
    "/api/business/recovery-message",
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }
  );
}

export async function executeDecision(userId: string, decisionId: string) {
  return request<{
    ok: boolean;
    action_type: string;
    redirect: string;
    message: string;
    recovery_messages?: { en: string; si: string; ta: string };
    client?: string;
  }>("/api/decisions/execute", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ user_id: userId, decision_id: decisionId }),
  });
}

export async function listMcpTools() {
  return request<{ tools: { name: string; description: string }[]; protocol: string }>(
    "/api/mcp/tools"
  );
}
