/**
 * Production URL fallbacks — always prefer NEXT_PUBLIC_* / BACKEND_URL env vars in deploys.
 * Do not hardcode Cloud Run hostnames here.
 *
 * Default production backend is the monorepo FastAPI service mounted at `/_/backend`
 * (see root vercel.json experimentalServices). Relative URLs work in the browser
 * (same origin). Server-side proxies should call `absoluteBackendUrl()`.
 */
export const PRODUCTION_FRONTEND_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://ceyfi.app");

/** Same-origin FastAPI mount used by the Vercel monorepo deploy. */
export const VERCEL_BACKEND_PATH = "/_/backend";

/** Retired Cloud Run hostname — still present in some Vercel NEXT_PUBLIC_* envs. */
const RETIRED_CLOUD_RUN_HOST = "ceyfi-backend-98470559362.asia-southeast1.run.app";

function isUsableBackendUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (url.includes(RETIRED_CLOUD_RUN_HOST)) return false;
  return true;
}

export const PRODUCTION_BACKEND_URL =
  (isUsableBackendUrl(process.env.NEXT_PUBLIC_API_BASE)
    ? process.env.NEXT_PUBLIC_API_BASE
    : undefined) ??
  (isUsableBackendUrl(process.env.NEXT_PUBLIC_API_URL)
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined) ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : VERCEL_BACKEND_PATH);

/**
 * Absolute backend base for Node/server fetch (relative `/_/backend` is invalid there).
 * Prefer BACKEND_URL / NEXT_PUBLIC_* ; otherwise derive from VERCEL_URL.
 */
export function absoluteBackendUrl(): string {
  const candidates = [
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_API_URL,
  ];
  for (const candidate of candidates) {
    if (isUsableBackendUrl(candidate)) return candidate.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8000";
  }

  const vercelHost = process.env.VERCEL_URL;
  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//, "");
    return `https://${host}${VERCEL_BACKEND_PATH}`;
  }

  return PRODUCTION_BACKEND_URL.startsWith("http")
    ? PRODUCTION_BACKEND_URL
    : `https://ceyfi-app.vercel.app${VERCEL_BACKEND_PATH}`;
}
