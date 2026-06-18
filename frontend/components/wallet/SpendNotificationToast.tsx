import { toast } from "sonner";
import { Transaction } from "@/types";
import { formatLKR } from "@/lib/utils";
import { Bell } from "lucide-react";
import { createElement } from "react";

export function fireSpendToast(
  transaction: Transaction,
  newBucketBalance?: number,
  opts?: { accountHolder?: string }
) {
  const bucketPart = transaction.bucket_label ? ` · ${transaction.bucket_label}` : "";
  const description = newBucketBalance !== undefined
    ? `New ${transaction.bucket_label ?? "bucket"} balance: ${formatLKR(newBucketBalance)}`
    : undefined;

  const who = opts?.accountHolder?.trim() || transaction.account_id;

  toast(
    `${who} just spent ${formatLKR(transaction.amount_lkr)} — ${transaction.merchant}${bucketPart}`,
    { description, icon: createElement(Bell, { className: "h-4 w-4 text-seylan-red" }) }
  );
}
