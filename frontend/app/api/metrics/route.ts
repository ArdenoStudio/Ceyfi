import { NextResponse } from "next/server";
import { PRODUCTION_BACKEND_URL } from "@/lib/urls";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  PRODUCTION_BACKEND_URL ??
  "http://localhost:8000";

const ADMIN_KEY = process.env.DEMO_ADMIN_KEY;

/**
 * Metrics proxy — requires a valid demo session, then uses the server-side
 * DEMO_ADMIN_KEY to call the protected backend endpoint.
 * Never expose DEMO_ADMIN_KEY to the browser.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(5000),
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Could not verify session." }, { status: 502 });
  }

  if (!ADMIN_KEY) {
    return NextResponse.json(
      { agents: [], phoenixConnected: false, generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/metrics`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { "X-Demo-Admin-Key": ADMIN_KEY },
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { agents: [], phoenixConnected: false, generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
