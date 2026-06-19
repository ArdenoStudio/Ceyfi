"use client";

import { Sidebar } from "./Sidebar";
import { AppTopbar } from "./AppTopbar";
import { MobileNav } from "./MobileNav";
import { DemoModeBadge } from "./DemoModeBadge";
import { PageEnter } from "@/components/motion/PageEnter";
import { SeylanBankHandoffBanner } from "@/components/seylan/SeylanBankHandoffBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  /** MPGS injects iframes/modals on document.body — avoid sidebar stacking and fixed layout clashes. */
  const isPaymentGatewaySurface =
    pathname.startsWith("/payments/checkout") || pathname.startsWith("/payments/return");
  const isLoginPage = pathname.startsWith("/login");
  const showSeylanHandoff = ["/profile", "/wallet", "/loans", "/business"].some(
    (p) => pathname.startsWith(p),
  );

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isPaymentGatewaySurface) {
    return (
      <>
        <DemoModeBadge />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col pb-24 md:ml-[17.5rem] md:pb-0">
        <AppTopbar />
        <PageEnter key={pathname} className="flex-1">
          {children}
        </PageEnter>
        {showSeylanHandoff ? <SeylanBankHandoffBanner /> : null}
        <SiteFooter />
      </main>
      <MobileNav />
      <DemoModeBadge />
    </div>
  );
}
