import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Decisions",
  description:
    "Prioritized financial decisions with confidence scores, trade-offs, and recommended next actions.",
  path: "/decisions",
});

export default function DecisionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
