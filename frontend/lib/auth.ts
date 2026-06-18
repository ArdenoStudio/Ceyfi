export interface DemoPersona {
  user_id: string;
  name: string;
  persona: "diaspora" | "borrower" | "sme";
  tagline: string;
  wallet_account_id: string | null;
  avatar: string;
  language_preference: "en" | "si" | "ta";
}

const SESSION_KEY = "ceyfi_demo_session";
const TOKEN_KEY = "ceyfi_demo_token";

export function getStoredSession(): DemoPersona | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoPersona) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeSession(persona: DemoPersona, token: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(persona));
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function adminHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_DEMO_ADMIN_KEY ?? "ceyfi-demo-admin";
  return { "X-Demo-Admin-Key": key };
}
