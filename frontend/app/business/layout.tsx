import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Business",
  description:
    "SME cash flow, bookkeeping signals, and business finance clarity for Sri Lankan owners and operators.",
  path: "/business",
});

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
