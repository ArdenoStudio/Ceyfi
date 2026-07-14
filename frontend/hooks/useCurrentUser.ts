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
  // The backend only authorizes a session to read its own persona's resources
  // (see backend/tests/test_security.py::test_mock_routes_allow_persona_scoped_access),
  // so non-SME personas have no business account to preview — null, not a shared ID.
  const businessUserId = user?.persona === "sme" ? user.user_id : null;
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
