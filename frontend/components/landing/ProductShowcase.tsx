"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Wallet, Cpu, CreditCard, Shop,
  User, ArrowRight, CheckCircle, Flash, Microphone, ShieldCheck,
  GraduationCap, Home, Bank, Building,
} from "iconoir-react";

// ─── Nav ──────────────────────────────────────────────────────────────────────
type Tab = "profile" | "wallet" | "ai" | "loans" | "business";

const NAV: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile",  label: "Profile",   icon: User      },
  { id: "wallet",   label: "Wallet",    icon: Wallet    },
  { id: "ai",       label: "Seylan AI", icon: Cpu       },
  { id: "loans",    label: "Loans",     icon: CreditCard },
  { id: "business", label: "Business",  icon: Shop      },
];

// ─── Panel: Profile ───────────────────────────────────────────────────────────
function ProfilePanel() {
  return (
    <div className="p-4 space-y-2.5">
      {/* User card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-seylan-red to-seylan-plum flex items-center justify-center text-white font-bold text-sm shrink-0">
          NF
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">Nimal Fernando</div>
          <div className="text-[10px] text-white/45 mt-0.5">0640-0001254-001</div>
        </div>
        <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 shrink-0">
          Active
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Account Type", value: "Current" },
          { label: "Branch",       value: "Colombo 3" },
          { label: "Linked Family",value: "Kumari Perera" },
          { label: "Member Since", value: "2019" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
            <div className="text-[9px] text-white/35">{s.label}</div>
            <div className="text-xs font-semibold text-white mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Balance */}
      <div className="rounded-2xl border border-seylan-red/25 bg-seylan-red/[0.08] p-3 flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-seylan-red">Total Balance</div>
          <div className="text-xl font-bold text-white mt-0.5">LKR 245,000</div>
        </div>
        <ShieldCheck className="h-8 w-8 text-seylan-red/40" />
      </div>
    </div>
  );
}

// ─── Panel: Wallet ────────────────────────────────────────────────────────────
function WalletPanel() {
  const buckets = [
    { icon: GraduationCap, label: "School Fees", balance: "98,000", pct: 0,  ring: "#3B82F6", bar: "from-blue-400 to-blue-600"    },
    { icon: Home,          label: "Household",   balance: "71,500", pct: 27, ring: "#10B981", bar: "from-emerald-400 to-emerald-600" },
    { icon: Bank,          label: "Savings",     balance: "49,000", pct: 0,  ring: "#7C3AED", bar: "from-violet-400 to-violet-600"  },
  ];

  return (
    <div className="p-4 space-y-2.5">
      {/* Remittance banner */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] overflow-hidden">
        <div className="h-[3px] w-full bg-gradient-to-r from-seylan-red via-seylan-gold to-seylan-red/30" />
        <div className="p-3">
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-seylan-red mb-1">Last remittance</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tabular-nums">LKR 244,980</span>
            <ArrowRight className="h-3 w-3 text-white/25 shrink-0" />
            <span className="text-sm text-white/45 tabular-nums">GBP 600</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-white/35">
            <Building className="h-3 w-3 shrink-0" />
            Tempo · May 1, 2026 · rate 408.30
          </div>
        </div>
      </div>

      {/* Bucket cards */}
      <div className="grid grid-cols-3 gap-2">
        {buckets.map((b) => {
          const r = 13, circ = 2 * Math.PI * r;
          const offset = circ - (b.pct / 100) * circ;
          return (
            <div key={b.label} className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5">
              {/* Ring icon */}
              <div className="relative h-8 w-8 mb-2">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 34 34" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                  <circle cx="17" cy="17" r={r} fill="none" stroke={b.ring} strokeWidth="2.5"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-[5px] rounded-full bg-white/[0.06] flex items-center justify-center">
                  <b.icon className="h-3 w-3 text-white/60" />
                </div>
              </div>
              <div className="text-[8px] text-white/35 leading-tight truncate">{b.label}</div>
              <div className="text-[11px] font-bold text-white mt-0.5 tabular-nums">Rs. {b.balance}</div>
              <div className="mt-1.5 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${b.bar}`} style={{ width: `${b.pct || 2}%` }} />
              </div>
              <div className="text-[8px] text-white/25 mt-0.5">{b.pct}% used</div>
            </div>
          );
        })}
      </div>

      {/* Latest transaction */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-white/35">Latest spend · Household</div>
          <div className="text-xs font-semibold text-white mt-0.5">Keells Supermarket - Rajagiriya</div>
        </div>
        <div className="text-xs font-bold text-seylan-red shrink-0 ml-2">−Rs. 8,500</div>
      </div>
    </div>
  );
}

// ─── Panel: Seylan AI ─────────────────────────────────────────────────────────
function AIPanel() {
  return (
    <div className="p-4 space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.07]">
        <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
          <Cpu className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <span className="text-xs font-semibold text-white/70">Seylan AI Assistant</span>
        <span className="ml-auto text-[9px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full font-semibold shrink-0">
          Groq · llama-3.3
        </span>
      </div>

      {/* Chat messages */}
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-seylan-red px-3 py-2 text-xs text-white">
            What is my balance?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white">
            <p className="font-medium">ඔබේ ශේෂය රු. 245,000 ක් වේ</p>
            <p className="text-white/45 mt-0.5 text-[10px]">Your balance is LKR 245,000</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-seylan-red px-3 py-2 text-xs text-white">
            ණය ගෙවීම කවදාද?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white">
            Next due in <span className="font-semibold text-white">15 days</span> — LKR 22,000
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
        <span className="flex-1 text-[10px] text-white/25">Ask in English or Sinhala…</span>
        <Microphone className="h-3.5 w-3.5 text-purple-400 shrink-0" />
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/25">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
        0.3s avg · Voice via ElevenLabs TTS
      </div>
    </div>
  );
}

// ─── Panel: Loans ─────────────────────────────────────────────────────────────
function LoansPanel() {
  const r = 26, circ = 2 * Math.PI * r, offset = circ - (0.67 * circ);
  return (
    <div className="p-4 space-y-2.5">
      {/* Loan summary card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-seylan-red">Current Loan</div>
            <div className="text-sm font-semibold text-white mt-0.5">Personal · Home Renovation</div>
          </div>
          <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 shrink-0">
            ON TRACK
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Outstanding",  value: "Rs. 480,000"   },
            { label: "Monthly EMI",  value: "Rs. 22,000"    },
            { label: "Interest Rate",value: "14.5% p.a."    },
            { label: "Original Loan",value: "Rs. 1,200,000" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-2">
              <div className="text-[9px] text-white/35">{s.label}</div>
              <div className="text-xs font-semibold text-white mt-0.5 tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Repayment progress */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5.5" />
            <circle cx="34" cy="34" r={r} fill="none" stroke="#3B82F6" strokeWidth="5.5"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              transform="rotate(-90 34 34)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <div className="text-sm font-bold text-white leading-none">24/36</div>
              <div className="text-[8px] text-white/35 mt-0.5">paid</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-[10px] text-white/35">Repayment progress</div>
          <div className="text-sm font-bold text-blue-400">67% complete</div>
          <div className="text-[10px] text-white/35">Next: June 1, 2026</div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle className="h-3 w-3" /> 0 missed payments
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Business ─────────────────────────────────────────────────────────
function BusinessPanel() {
  const pts = [22, 28.5, 25, 31, 34.0];
  const min = Math.min(...pts), range = Math.max(...pts) - min || 1;
  const W = 76, H = 22, pad = 2;
  const coords = pts.map((v, i) => {
    const x = pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="p-4 space-y-2.5">
      {/* P&L header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-seylan-red">Profit & Loss</div>
            <div className="text-sm font-semibold text-white mt-0.5">Silva Hardware & Electricals</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] text-white/40">
            May 5–10
          </div>
        </div>

        {/* Revenue / Expenses / Net */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-2">
            <div className="text-[9px] text-white/35">Revenue</div>
            <div className="text-xs font-semibold text-white mt-0.5 tabular-nums">Rs. 47,200</div>
          </div>
          <div className="rounded-xl border border-red-500/10 bg-red-900/20 p-2">
            <div className="text-[9px] text-white/35">Expenses</div>
            <div className="text-xs font-semibold text-red-400 mt-0.5 tabular-nums">Rs. 31,160</div>
          </div>
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-900/20 p-2">
            <div className="text-[9px] text-white/35">Net</div>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5 tabular-nums">Rs. 16,040</div>
          </div>
        </div>

        {/* Margin + sparkline */}
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white">34%</span>
          <span className="text-xs text-emerald-400 pb-1">↑ 5.5pp margin</span>
          <svg width={W} height={H} className="ml-auto overflow-visible shrink-0">
            <polyline points={coords} fill="none" stroke="#E31821" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Tax jar */}
      <div className="rounded-xl border border-seylan-gold/25 bg-seylan-gold/[0.08] p-3 flex items-center justify-between">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-seylan-gold">Tax Jar · 10% rule</div>
          <div className="text-base font-bold text-white mt-0.5 tabular-nums">Rs. 15,070</div>
        </div>
        <Flash className="h-5 w-5 text-seylan-gold/50" />
      </div>

      {/* Expense tags */}
      <div className="flex flex-wrap gap-1.5">
        {["Suppliers 72%", "Transport 13%", "Utilities 7%", "Other 8%"].map((t) => (
          <span key={t} className="text-[9px] font-medium rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-white/40">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Panels map ───────────────────────────────────────────────────────────────
const PANELS: Record<Tab, () => React.ReactElement> = {
  profile:  ProfilePanel,
  wallet:   WalletPanel,
  ai:       AIPanel,
  loans:    LoansPanel,
  business: BusinessPanel,
};

// ─── Toast copy per tab ───────────────────────────────────────────────────────
const TOASTS: Record<Tab, string> = {
  profile:  "SEY-USR-001 · verified",
  wallet:   "LKR 244,980 received ✓",
  ai:       "Response in 0.3s · Groq",
  loans:    "On track · 15 days to June 1",
  business: "Tax jar — Rs. 15,070 saved",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ProductShowcase() {
  const [active, setActive] = useState<Tab>("wallet");
  const Panel = PANELS[active];

  return (
    <section className="relative max-w-5xl mx-auto px-6 pb-24">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-seylan-red/10 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-1/4 h-56 w-56 rounded-full bg-seylan-plum/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-seylan-gold/10 blur-3xl" />

      {/* App window — 16:9 */}
      <div
        className="relative rounded-2xl border border-white/[0.08] shadow-[0_32px_80px_rgba(114,28,36,0.18)] overflow-hidden aspect-video"
        style={{ background: "#0c0407" }}
      >
        {/* Inner red glow */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 40% at 50% -5%, rgba(227,24,33,0.18), transparent)"
        }} />
        {/* Dot grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.018]" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div className="relative flex h-full">

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside
            className="w-48 shrink-0 flex flex-col border-r border-white/[0.07]"
            style={{ background: "linear-gradient(180deg,#721c24 0%,#4f1219 100%)" }}
          >
            {/* Logo */}
            <div className="border-b border-white/10 p-3">
              <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 shadow-sm">
                <Image
                  src="/seylan-bank-logo.png"
                  alt="Seylan Bank"
                  width={88}
                  height={34}
                  className="h-6 w-auto"
                />
                <span className="rounded-full bg-seylan-red/10 px-1.5 py-0.5 text-[10px] font-bold text-seylan-red leading-none">
                  Hub
                </span>
              </div>
            </div>

            {/* User card */}
            <div className="border-b border-white/10 p-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-seylan-red to-seylan-plum flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  NF
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate">Nimal Fernando</div>
                  <div className="text-[9px] text-white/45 truncate">0640-0001254-001</div>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-0.5 px-2 py-3">
              {NAV.map((item) => {
                const isActive = item.id === active;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={[
                      "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-all text-left cursor-pointer",
                      isActive
                        ? "bg-white text-seylan-plum shadow-md"
                        : "text-white/55 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <span className={[
                      "flex h-6 w-6 items-center justify-center rounded-lg shrink-0 transition-colors",
                      isActive ? "bg-seylan-red text-white" : "bg-white/10 text-white/60",
                    ].join(" ")}>
                      <item.icon className="h-3 w-3" />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Status */}
            <div className="border-t border-white/10 px-3 py-3">
              <div className="flex items-center gap-1.5 text-[9px] text-white/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                All systems operational
              </div>
            </div>
          </aside>

          {/* ── Content area ─────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Content panel */}
            <div className="flex-1 overflow-y-auto">
              <Panel />
            </div>

            {/* Bottom status bar */}
            <div className="border-t border-white/[0.06] px-4 py-2 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                {TOASTS[active]}
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[9px] text-white/20">
                <Flash className="h-3 w-3 text-seylan-gold/60 shrink-0" />
                Demo mode · Groq 0.3s
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
