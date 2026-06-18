import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Noto_Sans_Sinhala, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const headingFont = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
    icon: "/seylan-bank-icon.png",
    apple: "/seylan-bank-icon.png",
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
      suppressHydrationWarning
      className={`${headingFont.variable} ${bodyFont.variable} ${geistMono.variable} ${notoSansSinhala.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ceyfi-canvas text-ceyfi-ink dark:bg-ceyfi-deep dark:text-white">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <AuthGuard>
                <AppShell>{children}</AppShell>
              </AuthGuard>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
