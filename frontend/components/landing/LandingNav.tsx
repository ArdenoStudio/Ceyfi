"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Xmark, Wallet, Cpu, CreditCard, Shop, NavArrowDown, OpenNewWindow } from "iconoir-react";
import { APP_URL } from "@/lib/config";

const MODULES = [
  {
    href: `${APP_URL}/wallet`,
    icon: Wallet,
    label: "Family Wallet",
    description: "Remittance buckets for expat families",
    color: "#E31821",
    bg: "bg-red-50",
  },
  {
    href: `${APP_URL}/assistant`,
    icon: Cpu,
    label: "AI Assistant",
    description: "Bilingual chat — English & Sinhala",
    color: "#8B5CF6",
    bg: "bg-purple-50",
  },
  {
    href: `${APP_URL}/loans`,
    icon: CreditCard,
    label: "Loan Dashboard",
    description: "Repayment health & AI advisor",
    color: "#3B82F6",
    bg: "bg-blue-50",
  },
  {
    href: `${APP_URL}/business`,
    icon: Shop,
    label: "Business Bookkeeper",
    description: "P&L and tax jar for Mudalali owners",
    color: "#10B981",
    bg: "bg-emerald-50",
  },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);

  return (
    <>
      {/* ── Floating pill nav ───────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-5">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between px-4 py-2.5 rounded-full w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-seylan-border/60 shadow-brand"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/seylan-bank-icon.png"
              alt="Seylan"
              width={28}
              height={28}
              className="h-7 w-auto"
              priority
            />
            <span className="font-heading text-[15px] font-semibold tracking-tight text-seylan-charcoal">
              Seylan Hub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {/* Modules dropdown */}
            <div className="relative">
              <button
                onClick={() => setModulesOpen((v) => !v)}
                onBlur={() => setTimeout(() => setModulesOpen(false), 150)}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-seylan-charcoal/65 hover:text-seylan-charcoal hover:bg-seylan-border/50 transition-colors"
              >
                Modules
                <NavArrowDown
                  className={`h-3 w-3 transition-transform duration-200 ${modulesOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {modulesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-seylan-border bg-white shadow-brand-lg p-2"
                  >
                    {MODULES.map((mod) => (
                      <a
                        key={mod.href}
                        href={mod.href}
                        className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-seylan-mist transition-colors group"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${mod.bg}`}>
                          <mod.icon className="h-4 w-4" style={{ color: mod.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-seylan-charcoal group-hover:text-seylan-red transition-colors">
                            {mod.label}
                          </p>
                          <p className="text-xs text-muted-foreground leading-snug">{mod.description}</p>
                        </div>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="#about"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-seylan-charcoal/65 hover:text-seylan-charcoal hover:bg-seylan-border/50 transition-colors"
            >
              About
            </a>
            <a
              href={`${APP_URL}/status`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-seylan-charcoal/65 hover:text-seylan-charcoal hover:bg-seylan-border/50 transition-colors"
            >
              Status
              <OpenNewWindow className="h-3 w-3 opacity-50" />
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <a
              href={`${APP_URL}/wallet`}
              className="inline-flex items-center gap-1.5 rounded-full bg-seylan-charcoal px-4 py-2 text-sm font-semibold text-white hover:bg-seylan-charcoal/85 transition-all duration-150 group"
            >
              Open Hub
              <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex md:hidden items-center justify-center rounded-full p-2 text-seylan-charcoal/70 hover:bg-seylan-border/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <Xmark className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </motion.div>
      </div>

      {/* ── Mobile full-screen menu ─────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-[60] pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-seylan-border/50 transition-colors"
              onClick={() => setMobileOpen(false)}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Xmark className="h-5 w-5 text-seylan-charcoal" />
            </motion.button>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pb-2">
              Modules
            </p>
            <div className="flex flex-col gap-1">
              {MODULES.map((mod, i) => (
                <motion.a
                  key={mod.href}
                  href={mod.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.06 + 0.05 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-seylan-mist transition-colors"
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${mod.bg}`}>
                    <mod.icon className="h-3.5 w-3.5" style={{ color: mod.color }} />
                  </div>
                  <span className="text-sm font-medium text-seylan-charcoal">{mod.label}</span>
                </motion.a>
              ))}
            </div>

            <div className="pt-4 border-t border-seylan-border mt-4 flex flex-col gap-2">
              <a
                href="#about"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-seylan-charcoal/70 px-2 py-2"
              >
                About
              </a>
              <a
                href={`${APP_URL}/status`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-seylan-charcoal/70 px-2 py-2"
              >
                Status <OpenNewWindow className="h-3 w-3 opacity-50" />
              </a>
              <motion.a
                href={`${APP_URL}/wallet`}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ delay: 0.3 }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-seylan-charcoal px-4 py-3 text-sm font-semibold text-white"
              >
                Open Hub →
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
