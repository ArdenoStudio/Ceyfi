import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFF8F1",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 16,
            backgroundColor: "#E31821",
            marginBottom: 24,
            boxShadow: "0 14px 30px rgba(114, 28, 36, 0.18)",
          }}
        >
          <span style={{ color: "#FFFFFF", fontSize: 40, fontWeight: 700 }}>
            S
          </span>
        </div>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#721C24",
            margin: 0,
            marginBottom: 12,
          }}
        >
          Seylan Hub
        </h1>
        <p
          style={{
            fontSize: 22,
            color: "#83545A",
            margin: 0,
            maxWidth: 600,
            textAlign: "center",
          }}
        >
          AI banking for Sri Lanka — diaspora wallets, voice assistant, loan
          health & bookkeeping for SMEs
        </p>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 32,
            fontSize: 14,
            color: "#E31821",
          }}
        >
          <span>Next.js 16</span>
          <span style={{ color: "#E0AF49" }}>•</span>
          <span>Groq AI</span>
          <span style={{ color: "#E0AF49" }}>•</span>
          <span>Supabase Realtime</span>
          <span style={{ color: "#E0AF49" }}>•</span>
          <span>Cursor Buildathon 2026</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
