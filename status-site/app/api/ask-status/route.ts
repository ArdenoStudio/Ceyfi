import { NextRequest, NextResponse } from "next/server";

const AGENT_URL =
  process.env.STATUS_AGENT_URL ?? "https://seylan-status-agent.fly.dev";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const res = await fetch(`${AGENT_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Agent unavailable" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Could not reach the status agent. Please try again." },
      { status: 503 },
    );
  }
}
