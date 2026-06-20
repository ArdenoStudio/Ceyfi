import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";
const DEMO_RESET_ENABLED = process.env.DEMO_RESET_ENABLED === "true";
const ADMIN_KEY = process.env.DEMO_ADMIN_KEY;

/**
 * Demo-only proxy for POST /mock/reset-demo.
 *
 * Disabled unless DEMO_RESET_ENABLED=true. Requires a valid demo session.
 * The admin key stays server-side in DEMO_ADMIN_KEY — never use NEXT_PUBLIC_*.
 */
export async function POST(request: Request) {
  if (!DEMO_RESET_ENABLED) {
    return NextResponse.json({ error: "Demo reset is disabled." }, { status: 403 });
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${BACKEND}/api/auth/me`, {
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
    return NextResponse.json({ error: "Demo reset is not configured." }, { status: 503 });
  }

  try {
    const res = await fetch(`${BACKEND}/mock/reset-demo`, {
      method: "POST",
      headers: { "X-Demo-Admin-Key": ADMIN_KEY },
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach backend for demo reset." }, { status: 502 });
  }
}
