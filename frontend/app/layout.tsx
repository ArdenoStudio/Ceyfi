import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_Sinhala, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { DemoAutopilotProvider } from "@/components/demo/DemoAutopilot";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

// Sora for headings — Cal Sans (brand refresh) had uneven glyph sidebearings
// that made titles look letter-spaced across Market/Wallet/Loans/etc.
const headingFont = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const bodyFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const notoSansSinhala = Noto_Sans_Sinhala({
  variable: "--font-noto-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "CEYFI",
    "Sri Lanka finance",
    "personal finance",
    "loan health",
    "family wallet",
    "diaspora remittance",
    "SME bookkeeping",
    "AI financial assistant",
    "financial intelligence",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description:
      "One calm view of your money, loans, remittances, and business cash flow.",
    siteName: SITE_NAME,
    locale: "en_LK",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description:
      "One calm view of your money, loans, remittances, and business cash flow.",
    images: [OG_IMAGE],
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
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <JsonLd />
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <DemoAutopilotProvider>
                <AuthGuard>
                  <AppShell>{children}</AppShell>
                </AuthGuard>
              </DemoAutopilotProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Toaster />
        {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === "true" ? (
          <Analytics />
        ) : null}
      </body>
    </html>
  );
}
