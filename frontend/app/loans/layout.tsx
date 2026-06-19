import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Loans",
  description:
    "Track loan health, repayment progress, upcoming instalments, and AI-powered payoff scenarios for Sri Lankan borrowers.",
  path: "/loans",
});

export default function LoansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
