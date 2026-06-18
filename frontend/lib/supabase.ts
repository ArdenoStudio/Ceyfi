import { createClient } from "@supabase/supabase-js";
import { Transaction } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function subscribeToTransactions(
  accountId: string,
  onInsert: (transaction: Transaction) => void,
  onStatusChange?: (connected: boolean) => void
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    onStatusChange?.(false);
    return () => {};
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const channel = supabase
    .channel(`transactions:${accountId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "transactions",
        filter: `account_id=eq.${accountId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const tx: Transaction = {
          transaction_id: (row.id as string) ?? (row.transaction_id as string),
          account_id: row.account_id as string,
          merchant: row.merchant as string,
          amount_lkr: row.amount_lkr as number,
          type: (row.type as "debit" | "credit") ?? "debit",
          timestamp: (row.timestamp as string) ?? (row.created_at as string),
          bucket_id: row.bucket_id as string | undefined,
          bucket_label: row.bucket_label as string | undefined,
        };
        onInsert(tx);
      }
    )
    .subscribe((status) => {
      onStatusChange?.(status === "SUBSCRIBED");
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
