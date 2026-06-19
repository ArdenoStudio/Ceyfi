import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Financial Intelligence",
  description:
    "Explainable financial health scores, anomaly detection, forecast accuracy, and ranked money opportunities.",
  path: "/intelligence",
});

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
