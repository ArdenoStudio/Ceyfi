"use client";

import { ExternalLink } from "lucide-react";
import { SEYLAN_LINKS, EXTERNAL_LINK_REL } from "@/lib/seylan-external-links";

function OutLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={EXTERNAL_LINK_REL}
      className="inline-flex items-center gap-0.5 font-medium text-seylan-plum dark:text-[#E0AF49] underline-offset-4 hover:text-seylan-red hover:underline"
    >
      {label}
      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

const HANDOFF_PATHS = ["/wallet", "/payments", "/assistant"];

export function pathnameShowsSeylanHandoff(pathname: string): boolean {
  return HANDOFF_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function SeylanBankHandoffBanner() {
  return (
    <div
      className="border-t border-seylan-border dark:border-white/[0.06] bg-white/85 dark:bg-[rgba(12,4,7,0.92)] px-4 py-4 text-xs text-muted-foreground dark:text-white/35 shadow-[0_-12px_32px_-16px_rgba(36,19,22,0.08)] dark:shadow-[0_-1px_0_rgba(255,255,255,0.04)] backdrop-blur sm:px-6"
      aria-label="Official Seylan Bank channels when actions are beyond this demo"
    >
      <p className="mb-3 max-w-3xl leading-relaxed">
        Seylan Hub is a guided experience layer. Payments, mandates, beneficiary
        setup, QR collections, loan repayments, and full transaction history beyond
        this demo normally complete in Seylan&apos;s authorized channels—not through
        this site alone.
      </p>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-seylan-border/60 dark:border-white/[0.06] pt-3">
        <OutLink href={SEYLAN_LINKS.internetBankingPersonalLogin} label="Personal Internet Banking" />
        <span className="hidden text-seylan-border dark:text-white/10 sm:inline">|</span>
        <OutLink href={SEYLAN_LINKS.internetBankingCorporateLogin} label="Corporate Internet Banking" />
        <span className="hidden text-seylan-border dark:text-white/10 sm:inline">|</span>
        <OutLink href={SEYLAN_LINKS.mobileBankingAndroid} label="Mobile app (Android)" />
        <span className="hidden text-seylan-border dark:text-white/10 sm:inline">|</span>
        <OutLink href={SEYLAN_LINKS.mobileBankingIos} label="Mobile app (iOS)" />
        <span className="hidden text-seylan-border dark:text-white/10 sm:inline">|</span>
        <OutLink href={SEYLAN_LINKS.merchantPortalInfo} label="Merchant / payment acceptance" />
        <span className="hidden text-seylan-border dark:text-white/10 sm:inline">|</span>
        <OutLink href={SEYLAN_LINKS.branchLocator} label="Branch locator" />
      </nav>
      <p className="mt-3 text-[11px] leading-relaxed opacity-90">
        New to online banking?{" "}
        <a
          href={SEYLAN_LINKS.internetBankingSelfRegister}
          target="_blank"
          rel={EXTERNAL_LINK_REL}
          className="font-medium text-seylan-plum dark:text-[#E0AF49] underline-offset-4 hover:text-seylan-red hover:underline"
        >
          Self-register for Internet Banking
        </a>{" "}
        via Seylan&apos;s official form.
      </p>
    </div>
  );
}
