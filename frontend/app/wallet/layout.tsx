import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Family Wallet",
  description:
    "Manage diaspora remittances, FX conversion, bucket allocations, and family spending limits in one wallet view.",
  path: "/wallet",
});

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
