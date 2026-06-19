import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "CEYFI Assistant",
  description:
    "Bilingual AI financial guidance for Sri Lankan accounts — ask about loans, wallet buckets, spending, and safe-to-move balances.",
  path: "/assistant",
});

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
