import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";
const ADMIN_KEY = process.env.DEMO_ADMIN_KEY ?? "ceyfi-demo-admin";

export async function POST() {
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
