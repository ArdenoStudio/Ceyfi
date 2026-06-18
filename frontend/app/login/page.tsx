"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/api";
import type { DemoPersona } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function LoginPage() {
  const { login, user } = useAuth();
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) return;
    fetch(`${API_BASE}/api/auth/personas`, { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((data) => setPersonas(data.personas ?? []))
      .catch(() => {
        setPersonas([
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
        ]);
      });
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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle variant="standalone" />
      </div>
      <div className="w-full max-w-lg">
        <div className="text-center">
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
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
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
            {personas.map((p) => (
              <button
                key={p.user_id}
                type="button"
                disabled={loading !== null}
                onClick={() => handleLogin(p.user_id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border border-border p-4 text-left transition",
                  "hover:border-primary/40 hover:bg-ceyfi-surface disabled:opacity-60"
                )}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
                  <Image
                    src={p.avatar}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.tagline}</div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {personaLabels[p.persona]}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              </button>
            ))}
          </div>

          {error ? (
            <p className="mt-4 text-center text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/80">
          Demo data only · Not connected to live Internet Banking
        </p>
      </div>
    </div>
  );
}
