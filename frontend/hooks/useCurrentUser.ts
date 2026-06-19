"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { DemoPersona } from "@/lib/auth";

const PERSONA_DEFAULT_ROUTE: Record<DemoPersona["persona"], string> = {
  diaspora: "/wallet",
  borrower: "/loans",
  sme: "/business",
};

/** Loan fixture user — borrower persona maps here; diaspora may also have loans on own id. */
function resolveLoanUserId(user: DemoPersona | null): string {
  if (!user) return "SEY-USR-001";
  if (user.persona === "borrower") return "SEY-USR-003";
  return user.user_id;
}

export function useCurrentUser() {
  const { user, loading } = useAuth();

  const userId = user?.user_id ?? "SEY-USR-001";
  const walletAccountId = user?.wallet_account_id ?? "SEY-ACC-002";
  const loanUserId = resolveLoanUserId(user);
  const businessUserId = user?.persona === "sme" ? user.user_id : "SEY-BIZ-001";
  const defaultRoute = user ? PERSONA_DEFAULT_ROUTE[user.persona] : "/";

  return {
    user,
    userId,
    walletAccountId,
    loanUserId,
    businessUserId,
    defaultRoute,
    persona: user?.persona ?? "diaspora",
    loading,
    mounted: !loading,
  };
}
