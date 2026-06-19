import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Demo-only proxy for POST /mock/reset-demo.
 *
 * The admin key is read from DEMO_ADMIN_KEY on the server — never from a
 * NEXT_PUBLIC_* variable — so it is not shipped in the client bundle.
 *
 * There is no session check: the in-app demo reset button is meant for kiosk
 * / buildathon use. To disable reset in a deployment, omit DEMO_ADMIN_KEY
 * (returns 403). Local dev falls back to the shared demo key.
 */
const ADMIN_KEY =
  process.env.DEMO_ADMIN_KEY ??
  (process.env.NODE_ENV === "development" ? "ceyfi-demo-admin" : undefined);

export async function POST() {
  if (!ADMIN_KEY) {
    return NextResponse.json({ error: "Demo reset is disabled." }, { status: 403 });
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
