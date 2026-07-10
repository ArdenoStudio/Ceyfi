/**
 * Production URL fallbacks — always prefer NEXT_PUBLIC_* / BACKEND_URL env vars in deploys.
 * Do not hardcode Cloud Run / Vercel project hostnames here (avoids baking infra into the bundle).
 * Frontend brand domain is used only as a last-resort metadata base for production builds.
 */
export const PRODUCTION_FRONTEND_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://ceyfi.app");

export const PRODUCTION_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");
