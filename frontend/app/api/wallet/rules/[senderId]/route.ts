import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ senderId: string }> }
) {
  const { senderId } = await params;
  try {
    const body = await req.text();
    const res = await fetch(`${BACKEND}/api/wallet/rules/${encodeURIComponent(senderId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach backend to save wallet rules." }, { status: 502 });
  }
}
