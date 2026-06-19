import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { SiteStatus, SiteSummary } from "@/lib/upptime";
import { Alert, type AlertTone } from "@/components/daisyui-style";

const TONE_MAP: Record<SiteStatus, AlertTone> = {
  up: "success",
  degraded: "warning",
  down: "error",
  unknown: "neutral",
};

const ICONS = {
  up: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
  unknown: HelpCircle,
} as const;

function bannerCopy(status: SiteStatus, affected: SiteSummary[]): { title: string; sub: string } {
  const names = affected.map((s) => s.name).join(", ");
  switch (status) {
    case "up":
      return {
        title: "All systems operational",
        sub: "Every CEYFI endpoint is responding normally.",
      };
    case "degraded":
      return {
        title: affected.length === 1 ? `${names} is degraded` : "Partial degradation",
        sub: affected.length > 0
          ? `${names} ${affected.length > 1 ? "are" : "is"} responding slower than expected.`
          : "One or more services are slower than expected.",
      };
    case "down":
      return {
        title: affected.length === 1 ? `${names} is down` : `${affected.length} services are down`,
        sub: affected.length > 0
          ? `Affected: ${names}. We're investigating.`
          : "We're investigating an outage on one or more services.",
      };
    case "unknown":
      return {
        title: "Status unknown",
        sub: "We couldn't reach our monitoring data.",
      };
  }
}

export function StatusBanner({ status, sites }: { status: SiteStatus; sites: SiteSummary[] }) {
  const affected = sites.filter((s) => s.status === "down" || s.status === "degraded");
  const copy = bannerCopy(status, affected);
  const Icon = ICONS[status];

  return (
    <Alert
      role="status"
      tone={TONE_MAP[status]}
      variant="soft"
      title={copy.title}
      description={copy.sub}
      icon={Icon}
    />
  );
}
