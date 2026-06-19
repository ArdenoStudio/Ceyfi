"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/api";
import type { DemoPersona } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PersonaAvatar } from "@/components/ui/PersonaAvatar";

const FALLBACK_PERSONAS: DemoPersona[] = [
  {
    user_id: "SEY-USR-001",
    name: "Nimal Fernando",
    persona: "diaspora",
    tagline: "Diaspora parent · sends money home",
    wallet_account_id: "SEY-ACC-002",
    avatar: "/nimal-avatar.jpg",
    language_preference: "en",
  },
  {
    user_id: "SEY-USR-003",
    name: "Sunil Bandara",
    persona: "borrower",
    tagline: "Business borrower · loan clarity",
    wallet_account_id: null,
    avatar: "/nimal-avatar.jpg",
    language_preference: "si",
  },
  {
    user_id: "SEY-BIZ-001",
    name: "Suresh Silva",
    persona: "sme",
    tagline: "SME owner · Silva Hardware",
    wallet_account_id: null,
    avatar: "/nimal-avatar.jpg",
    language_preference: "en",
  },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = true;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (user) return;
    fetch(`${API_BASE}/api/auth/personas`, { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((data) => setPersonas(data.personas ?? FALLBACK_PERSONAS))
      .catch(() => setPersonas(FALLBACK_PERSONAS));
  }, [user]);

  async function handleLogin(userId: string) {
    setLoading(userId);
    setError(null);
    try {
      await login(userId);
    } catch {
      setError("Could not sign in. Check that the backend is running.");
    } finally {
      setLoading(null);
    }
  }

  const personaLabels = {
    diaspora: "Diaspora wallet",
    borrower: "Loan dashboard",
    sme: "Business bookkeeper",
  } as const;

  const motionOn = ready && !reduceMotion;
  const list = personas.length > 0 ? personas : FALLBACK_PERSONAS;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 outline-none"
    >
      <div className="ambient-login pointer-events-none absolute inset-0" aria-hidden />

      <motion.div
        className="absolute right-4 top-4 z-20"
        initial={motionOn ? { opacity: 0, y: -8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <ThemeToggle variant="standalone" />
      </motion.div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          className="text-center"
          initial={motionOn ? { opacity: 0, y: 14 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-brand-lg">
            C
          </span>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
            CEYFI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Clarity for every rupee</p>
          <p className="mt-3 text-xs text-muted-foreground/80">
            Powered by{" "}
            <span className="font-semibold text-seylan-red">Seylan Bank</span>
          </p>
        </motion.div>

        <motion.div
          className="mt-8 rounded-[1.35rem] border border-border/80 bg-card/90 p-6 shadow-brand-lg backdrop-blur-sm"
          initial={motionOn ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Shield className="h-3.5 w-3.5" />
            Demo environment
          </div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Choose a persona
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three Sri Lankan banking journeys — diaspora, borrower, and SME.
          </p>

          <div className="mt-5 space-y-3">
            {list.map((p, index) => {
              const isLoading = loading === p.user_id;
              const isDisabled = loading !== null;

              return (
                <motion.button
                  key={p.user_id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleLogin(p.user_id)}
                  initial={motionOn ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    motionOn
                      ? {
                          delay: 0.14 + index * 0.07,
                          duration: 0.42,
                          ease: [0.22, 1, 0.36, 1],
                        }
                      : { duration: 0 }
                  }
                  whileHover={motionOn && !isDisabled ? { y: -2 } : undefined}
                  whileTap={motionOn && !isDisabled ? { scale: 0.985 } : undefined}
                  className={cn(
                    "group interactive-card flex w-full items-center gap-4 rounded-xl border border-border/80 bg-background/60 p-4 text-left",
                    "hover:border-primary/35 hover:bg-ceyfi-surface/80 hover:shadow-brand",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isLoading && "border-primary/40 ring-2 ring-primary/15",
                  )}
                >
                  <PersonaAvatar name={p.name} persona={p.persona} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.tagline}</div>
                    <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {personaLabels[p.persona]}
                    </div>
                  </div>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {error ? (
            <motion.p
              className="mt-4 text-center text-sm text-destructive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          ) : null}
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/80">
          Demo data only · Not connected to live Internet Banking
        </p>
      </div>
    </main>
  );
}
