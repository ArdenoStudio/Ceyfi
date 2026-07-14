import { NextResponse } from "next/server";
import { absoluteBackendUrl } from "@/lib/urls";

const BACKEND = absoluteBackendUrl();

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const auth = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (auth) {
      headers.Authorization = auth;
    }

    const res = await fetch(`${BACKEND}/api/wallet/transfer`, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach backend for transfer." }, { status: 502 });
  }
}
