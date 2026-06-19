"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = ["/login", "/payments/checkout", "/payments/return"];
const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (SKIP_AUTH) return;
    if (!loading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [loading, user, isPublic, router]);

  if (SKIP_AUTH) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ceyfi-canvas">
        <div className="text-sm text-ceyfi-muted">Loading CEYFI…</div>
      </div>
    );
  }

  if (!user && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ceyfi-canvas">
        <div className="text-sm text-ceyfi-muted">Loading CEYFI…</div>
      </div>
    );
  }

  return <>{children}</>;
}
