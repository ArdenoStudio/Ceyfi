import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Transactions",
  description:
    "Review recent account activity, spending categories, and transaction history with CEYFI context.",
  path: "/transactions",
});

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
