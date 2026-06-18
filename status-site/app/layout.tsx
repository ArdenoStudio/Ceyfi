import type { Metadata } from "next";
import "./globals.css";
import { AiDock } from "@/components/ui/ai-dock";

export const metadata: Metadata = {
  title: "SeylanHub Status",
  description: "Real-time status and uptime for all SeylanHub services.",
  openGraph: {
    title: "SeylanHub Status",
    description: "Real-time status and uptime for all SeylanHub services.",
    siteName: "SeylanHub Status",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/seylan-bank-icon.png" />
      </head>
      <body>
        {children}
        <AiDock />
      </body>
    </html>
  );
}
