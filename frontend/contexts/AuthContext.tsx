"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import {
  clearSession,
  getStoredSession,
  getStoredToken,
  storeSession,
  type DemoPersona,
} from "@/lib/auth";

interface AuthContextValue {
  user: DemoPersona | null;
  loading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

const E2E_USER: DemoPersona = {
  user_id: "SEY-USR-001",
  name: "Nimal Fernando",
  persona: "diaspora",
  tagline: "Diaspora parent · sends money home",
  wallet_account_id: "SEY-ACC-002",
  avatar: "/nimal-avatar.jpg",
  language_preference: "en",
};

const SKIP_AUTH_PERSONAS: Record<string, DemoPersona> = {
  "SEY-USR-001": E2E_USER,
  "SEY-USR-003": {
    user_id: "SEY-USR-003",
    name: "Sunil Bandara",
    persona: "borrower",
    tagline: "Business borrower · loan clarity",
    wallet_account_id: null,
    avatar: "/nimal-avatar.jpg",
    language_preference: "si",
  },
  "SEY-BIZ-001": {
    user_id: "SEY-BIZ-001",
    name: "Suresh Silva",
    persona: "sme",
    tagline: "SME owner · Silva Hardware",
    wallet_account_id: null,
    avatar: "/nimal-avatar.jpg",
    language_preference: "en",
  },
};

function personaDestination(persona: DemoPersona): string {
  if (persona.persona === "sme") return "/business";
  if (persona.persona === "borrower") return "/loans";
  return "/wallet";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoPersona | null>(() =>
    SKIP_AUTH ? E2E_USER : getStoredSession()
  );
  const [loading, setLoading] = useState(() => !SKIP_AUTH && !!getStoredToken());
  const router = useRouter();

  useEffect(() => {
    if (SKIP_AUTH) return;
    const token = getStoredToken();
    if (!token) return;

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUser(data.user as DemoPersona))
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (userId: string) => {
    if (SKIP_AUTH) {
      const persona = SKIP_AUTH_PERSONAS[userId] ?? E2E_USER;
      storeSession(persona, "skip-auth");
      setUser(persona);
      router.push(personaDestination(persona));
      return;
    }

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    storeSession(data.user, data.token);
    setUser(data.user);
    router.push(personaDestination(data.user as DemoPersona));
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
