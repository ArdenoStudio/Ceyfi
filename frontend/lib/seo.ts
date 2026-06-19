import type { Metadata } from "next";
import { PRODUCTION_FRONTEND_URL } from "@/lib/urls";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  PRODUCTION_FRONTEND_URL;

export const SITE_NAME = "CEYFI";
export const DEFAULT_TITLE = "CEYFI — Clarity for every rupee";
export const DEFAULT_DESCRIPTION =
  "AI-powered financial clarity for Sri Lankan families, borrowers, and business owners.";

export const OG_IMAGE = "/api/og";

const sharedOpenGraph = {
  siteName: SITE_NAME,
  locale: "en_LK",
  type: "website" as const,
  images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
};

const sharedTwitter = {
  card: "summary_large_image" as const,
  images: [OG_IMAGE],
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  const canonical = path === "/" ? SITE_URL : `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      ...sharedOpenGraph,
      title,
      description,
      url: canonical,
    },
    twitter: {
      ...sharedTwitter,
      title,
      description,
    },
  };
}

export const CEYFI_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/ceyfi-icon.svg`,
      description: DEFAULT_DESCRIPTION,
      areaServed: {
        "@type": "Country",
        name: "Sri Lanka",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: DEFAULT_DESCRIPTION,
      inLanguage: ["en", "si"],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "LKR",
      },
      provider: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
};
