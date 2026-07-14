import { NextResponse } from "next/server";
import { absoluteBackendUrl } from "@/lib/urls";

const BACKEND = absoluteBackendUrl();

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const headers: Record<string, string> = {};
  if (auth) {
    headers.Authorization = auth;
  }

  try {
    const res = await fetch(`${BACKEND}/api/wallet/sandbox-transfer-accounts`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach backend for sandbox account numbers." },
      { status: 502 },
    );
  }
}
