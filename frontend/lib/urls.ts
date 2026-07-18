/**
 * Production URL fallbacks — always prefer NEXT_PUBLIC_* / BACKEND_URL env vars in deploys.
 * Do not hardcode Cloud Run hostnames here.
 *
 * Default production backend is the monorepo FastAPI service mounted at `/_/backend`
 * (see root vercel.json services). Relative URLs work in the browser
 * (same origin). Server-side proxies should call `absoluteBackendUrl()`.
 */
export const PRODUCTION_FRONTEND_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://ceyfi.app");

/** Same-origin FastAPI mount used by the Vercel monorepo deploy. */
export const VERCEL_BACKEND_PATH = "/_/backend";

/** Public production hostname for the Ceyfi Vercel project. */
const PUBLIC_VERCEL_HOST = "ceyfi-app.vercel.app";

/** Retired Cloud Run hostname — still present in some Vercel NEXT_PUBLIC_* envs. */
const RETIRED_CLOUD_RUN_HOST = "ceyfi-backend-98470559362.asia-southeast1.run.app";

function isUsableBackendUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (url.includes(RETIRED_CLOUD_RUN_HOST)) return false;
  return true;
}

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Deployment-specific *.vercel.app hosts (e.g. ceyfi-48jpey7ct-….vercel.app)
 * often have Vercel Deployment Protection / SSO. Server-side proxies that call
 * those hosts get 401 Protected deployment even when the public production
 * host serves `/_/backend` anonymously.
 */
function isProtectedVercelDeploymentUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (!host.endsWith(".vercel.app")) return false;
    if (host === PUBLIC_VERCEL_HOST) return false;
    // Production alias / custom project domains are fine; hashed deploy URLs are not.
    return true;
  } catch {
    return false;
  }
}

export const PRODUCTION_BACKEND_URL =
  (isUsableBackendUrl(process.env.NEXT_PUBLIC_API_BASE)
    ? process.env.NEXT_PUBLIC_API_BASE
    : undefined) ??
  (isUsableBackendUrl(process.env.NEXT_PUBLIC_API_URL)
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined) ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : VERCEL_BACKEND_PATH);

function publicProductionHost(): string {
  const raw =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    PUBLIC_VERCEL_HOST;
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Absolute backend base for Node/server fetch (relative `/_/backend` is invalid there).
 * Prefer BACKEND_URL / NEXT_PUBLIC_* ; never prefer deployment-specific VERCEL_URL
 * hosts that are SSO-protected.
 */
export function absoluteBackendUrl(): string {
  const candidates = [
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_API_URL,
  ];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!isUsableBackendUrl(candidate)) continue;
    const cleaned = candidate.replace(/\/$/, "");
    if (!isAbsoluteHttpUrl(cleaned)) continue;
    // Explicit BACKEND_URL wins even on a deploy host (operator override).
    const isExplicitBackend = i === 0;
    if (isExplicitBackend || !isProtectedVercelDeploymentUrl(cleaned)) {
      return cleaned;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8000";
  }

  return `https://${publicProductionHost()}${VERCEL_BACKEND_PATH}`;
}
