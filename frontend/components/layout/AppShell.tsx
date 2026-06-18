"use client";

import { Sidebar } from "./Sidebar";
import { AppTopbar } from "./AppTopbar";
import { MobileNav } from "./MobileNav";
import { DemoModeBadge } from "./DemoModeBadge";
import { SeylanBankHandoffBanner } from "@/components/seylan/SeylanBankHandoffBanner";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  /** MPGS injects iframes/modals on document.body — avoid sidebar stacking and fixed layout clashes. */
  const isPaymentGatewaySurface =
    pathname.startsWith("/payments/checkout") || pathname.startsWith("/payments/return");
  const showSeylanHandoff = ["/profile", "/wallet", "/loans", "/business"].some(
    (p) => pathname.startsWith(p),
  );

  if (isPaymentGatewaySurface) {
    return (
      <>
        <DemoModeBadge />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-ceyfi-canvas">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col pb-24 md:ml-[17.5rem] md:pb-0">
        <AppTopbar />
        <div className="flex-1">{children}</div>
        {showSeylanHandoff ? <SeylanBankHandoffBanner /> : null}
      </main>
      <MobileNav />
      <DemoModeBadge />
    </div>
  );
}
