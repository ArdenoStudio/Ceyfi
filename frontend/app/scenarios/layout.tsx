import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Scenarios",
  description:
    "Simulate loan payoffs, spending changes, and financial what-if plans before you commit.",
  path: "/scenarios",
});

export default function ScenariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
