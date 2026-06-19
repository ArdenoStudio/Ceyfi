import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CEYFI - Clarity for every rupee",
    short_name: "CEYFI",
    description:
      "AI-powered financial clarity for Sri Lankan families, borrowers, and business owners.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F8F3",
    theme_color: "#059669",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/ceyfi-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
