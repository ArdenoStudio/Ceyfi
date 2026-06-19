"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { DemoPersona } from "@/lib/auth";

const PERSONA_DEFAULT_ROUTE: Record<DemoPersona["persona"], string> = {
  diaspora: "/wallet",
  borrower: "/loans",
  sme: "/business",
};

export function useCurrentUser() {
  const { user, loading } = useAuth();

  const userId = user?.user_id ?? "SEY-USR-001";
  const walletAccountId = user?.wallet_account_id ?? null;
  const loanUserId = user?.user_id ?? "SEY-USR-001";
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
