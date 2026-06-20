/**
 * Production URL fallbacks — always prefer NEXT_PUBLIC_* / BACKEND_URL env vars in deploys.
 * Frontend uses the public brand domain so builds succeed without Vercel env at compile time.
 */
export const PRODUCTION_FRONTEND_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://ceyfi.app");

export const PRODUCTION_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");
