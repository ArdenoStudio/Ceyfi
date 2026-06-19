import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://ceyfi-backend-98470559362.asia-southeast1.run.app";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/metrics`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { agents: [], phoenixConnected: false, generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
