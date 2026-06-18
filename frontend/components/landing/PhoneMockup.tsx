"use client";

import Image from "next/image";
import { IPhoneMockup } from "@/components/ui/iphone-mockup";
import {
  Wallet, Cpu, CreditCard, Shop, Home,
  ArrowRight, CheckCircle, Building,
  GraduationCap, Bank,
} from "iconoir-react";

// ─── Mobile screen content ───────────────────────────────────────────────────
function SeylanHubMobileScreen() {
  const buckets = [
    { icon: GraduationCap, label: "School Fees", amount: "98,000", pct: 0,  color: "#3B82F6" },
    { icon: Home,          label: "Household",   amount: "71,500", pct: 27, color: "#10B981" },
    { icon: Bank,          label: "Savings",     amount: "49,000", pct: 0,  color: "#7C3AED" },
  ];

  const navItems = [
    { icon: Home,      label: "Home"   },
    { icon: Wallet,    label: "Wallet", active: true },
    { icon: Cpu,       label: "AI"     },
    { icon: CreditCard,label: "Loans"  },
    { icon: Shop,      label: "Biz"    },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "#0c0407", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1 shrink-0">
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>9:41</span>
        <div className="flex items-center gap-1">
          {/* Signal bars */}
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <rect x="0"  y="6" width="3" height="4" rx="0.8" fill="rgba(255,255,255,0.85)" />
            <rect x="4"  y="4" width="3" height="6" rx="0.8" fill="rgba(255,255,255,0.85)" />
            <rect x="8"  y="2" width="3" height="8" rx="0.8" fill="rgba(255,255,255,0.85)" />
            <rect x="12" y="0" width="3" height="10" rx="0.8" fill="rgba(255,255,255,0.85)" />
          </svg>
          {/* Wifi */}
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M7 8.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="rgba(255,255,255,0.85)" />
            <path d="M3.5 6C4.7 4.8 6.3 4 8 4s3.3.8 4.5 2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M1 3.5C2.9 1.4 5.3 0 8 0s5.1 1.4 7 3.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
          {/* Battery */}
          <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
            <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="rgba(255,255,255,0.5)" />
            <rect x="2"   y="2"   width="13" height="7"  rx="1.5" fill="rgba(255,255,255,0.85)" />
            <path d="M19.5 3.5v4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-1.5 rounded-xl bg-white px-2 py-1 shadow-sm">
          <Image src="/seylan-bank-logo.png" alt="Seylan Bank" width={64} height={20} style={{ height: 16, width: "auto" }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: "#E31821", background: "rgba(227,24,33,0.1)", borderRadius: 99, padding: "1px 5px" }}>Hub</span>
        </div>
        <div style={{ height: 30, width: 30, borderRadius: "50%", background: "linear-gradient(135deg,#E31821,#721C24)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>NF</span>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2" style={{ scrollbarWidth: "none" }}>

        {/* Greeting + balance */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#721c24 0%,#4f1219 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg,#E31821,#D9A441,rgba(227,24,33,0.3))" }} />
          <div style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Good morning</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 8 }}>Nimal Fernando</p>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E31821", marginBottom: 2 }}>Total Balance</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-0.02em", lineHeight: 1 }}>LKR 245,000</p>
          </div>
        </div>

        {/* Remittance received */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 12px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E31821", marginBottom: 4 }}>Last Remittance</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>LKR 244,980</span>
            <ArrowRight style={{ height: 12, width: 12, color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>GBP 600</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Building style={{ height: 10, width: 10, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Tempo · May 1, 2026 · rate 408.30</span>
          </div>
        </div>

        {/* Budget buckets */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Budget Buckets</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {buckets.map((b) => {
              const r = 13, circ = 2 * Math.PI * r;
              const offset = circ - (b.pct / 100) * circ;
              return (
                <div key={b.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 8px" }}>
                  <div style={{ position: "relative", height: 30, width: 30, marginBottom: 6 }}>
                    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 34 34">
                      <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                      <circle cx="17" cy="17" r={r} fill="none" stroke={b.color} strokeWidth="2.5"
                        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: "absolute", inset: 5, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <b.icon style={{ height: 10, width: 10, color: "rgba(255,255,255,0.6)" }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", lineHeight: 1.2, marginBottom: 2 }}>{b.label}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "white" }}>Rs. {b.amount}</p>
                  <div style={{ marginTop: 4, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: b.color, width: `${b.pct || 2}%` }} />
                  </div>
                  <p style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{b.pct}% used</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest transaction */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Latest · Household</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Keells Supermarket</p>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#E31821", flexShrink: 0, marginLeft: 8 }}>−Rs. 8,500</p>
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingBottom: 4 }}>
          <CheckCircle style={{ height: 10, width: 10, color: "#10B981", flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>LKR 244,980 received · All systems operational</span>
        </div>
      </div>

      {/* ── Bottom nav ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,4,7,0.95)", backdropFilter: "blur(12px)", padding: "8px 4px 4px", display: "flex", justifyContent: "space-around", flexShrink: 0 }}>
        {navItems.map((item) => (
          <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 10, background: item.active ? "rgba(227,24,33,0.12)" : "transparent" }}>
            <item.icon style={{ height: 16, width: 16, color: item.active ? "#E31821" : "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 8, fontWeight: item.active ? 700 : 500, color: item.active ? "#E31821" : "rgba(255,255,255,0.3)" }}>{item.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
export function PhoneMockup() {
  // iPhone 15 Pro natural size: 417 × 876 (with bezel). At scale 0.62 → ~258 × 543px layout space.
  const SCALE = 0.62;
  const PHONE_W = 393 + 12 * 2; // 417
  const PHONE_H = 852 + 12 * 2; // 876

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-seylan-red/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/3 h-64 w-64 rounded-full bg-seylan-plum/[0.06] blur-3xl" />

      <div className="relative max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-seylan-red/70 mb-3">Mobile Experience</p>
          <h2 className="text-3xl md:text-4xl font-bold text-seylan-charcoal tracking-tight">
            Your bank. In your pocket.
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto">
            SeylanHub is designed mobile-first — every feature works beautifully on your phone.
          </p>
        </div>

        {/* Phone + callouts layout */}
        <div className="flex items-center justify-center gap-12 flex-wrap">

          {/* Left callouts */}
          <div className="hidden md:flex flex-col gap-5 w-52">
            {[
              { color: "#3B82F6", title: "Smart Buckets",   desc: "Allocate funds across Education, Household & Savings automatically." },
              { color: "#10B981", title: "Live Remittance", desc: "Track every transfer with live exchange rates from Tempo & Western Union." },
              { color: "#E31821", title: "LKR Balance",     desc: "Real-time balance synced directly with your Seylan Bank account." },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
                <div>
                  <p className="text-sm font-semibold text-seylan-charcoal">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Phone mockup */}
          <div
            className="relative shrink-0"
            style={{ width: PHONE_W * SCALE, height: PHONE_H * SCALE }}
          >
            {/* Glow behind phone */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[40px] blur-2xl"
              style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(227,24,33,0.22), transparent 70%)", transform: "scale(1.1)" }}
            />
            <IPhoneMockup
              model="15-pro"
              color="space-black"
              scale={SCALE}
              screenBg="#0c0407"
              shadow="0 32px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)"
              safeArea={true}
              showHomeIndicator={true}
              innerShadow={true}
            >
              <SeylanHubMobileScreen />
            </IPhoneMockup>
          </div>

          {/* Right callouts */}
          <div className="hidden md:flex flex-col gap-5 w-52">
            {[
              { color: "#7C3AED", title: "Bilingual AI",     desc: "Ask questions in English or Sinhala — get instant account-aware answers." },
              { color: "#D9A441", title: "Loan Health",      desc: "Monitor repayments and get AI advisor tips tailored to your loan profile." },
              { color: "#10B981", title: "SME Bookkeeping",  desc: "Auto-categorised weekly P&L and tax jar for small business owners." },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
                <div>
                  <p className="text-sm font-semibold text-seylan-charcoal">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
