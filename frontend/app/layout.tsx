import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_Sinhala } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

// Cal Sans — display / heading face, self-hosted. It is a single-weight display
// font; declaring the 400–700 range maps every heading weight to the one file
// so the browser never synthesizes faux-bold.
const displayFont = localFont({
  src: "./fonts/CalSans.woff2",
  variable: "--font-cal-sans",
  weight: "400 700",
  display: "swap",
});

// SF Pro is the main (body) font. Apple's font is proprietary and cannot be
// legally self-hosted, so it is wired as a system-font stack in globals.css
// (`--font-sans`): it renders genuine SF Pro on Apple devices and falls back to
// Segoe UI / Roboto elsewhere.

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansSinhala = Noto_Sans_Sinhala({
  variable: "--font-noto-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ceyfi.app"
  ),
  title: "CEYFI — Clarity for every rupee",
  description:
    "AI-powered financial clarity for Sri Lankan families, borrowers, and business owners.",
  manifest: "/manifest.json",
  icons: {
    icon: "/ceyfi-icon.svg",
    apple: "/ceyfi-icon.svg",
  },
  openGraph: {
    title: "CEYFI — Clarity for every rupee",
    description:
      "One calm view of your money, loans, remittances, and business cash flow.",
    siteName: "CEYFI",
    images: ["/api/og"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CEYFI — Clarity for every rupee",
    description:
      "One calm view of your money, loans, remittances, and business cash flow.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${geistMono.variable} ${notoSansSinhala.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ErrorBoundary>
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
