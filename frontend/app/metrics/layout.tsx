import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Metrics",
  description:
    "Operational metrics and service health for the CEYFI demo environment.",
  path: "/metrics",
});

export default function MetricsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
