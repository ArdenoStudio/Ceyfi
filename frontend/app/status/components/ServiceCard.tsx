import { cn } from "@/lib/utils";
import { uptimeHealth, type SiteSummary } from "@/lib/upptime";
import { UptimeBar } from "./UptimeBar";

const DOT: Record<SiteSummary["status"], string> = {
  up: "bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.15)]",
  degraded: "bg-amber-500 shadow-[0_0_0_3px_rgb(245_158_11/0.15)]",
  down: "bg-red-500 shadow-[0_0_0_3px_rgb(239_68_68/0.15)] animate-pulse",
  unknown: "bg-neutral-400",
};

const LABEL: Record<SiteSummary["status"], string> = {
  up: "Operational",
  degraded: "Degraded",
  down: "Down",
  unknown: "Unknown",
};

const STATUS_TEXT: Record<SiteSummary["status"], string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  degraded: "text-amber-600 dark:text-amber-400",
  down: "text-red-600 dark:text-red-400",
  unknown: "text-neutral-500",
};

const TILE: Record<"ok" | "warn" | "bad", string> = {
  ok: "bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100",
  warn: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20",
  bad: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-1 ring-red-500/20",
};

function Stat({ label, value }: { label: string; value: string }) {
  const health = uptimeHealth(value);
  return (
    <div className={cn("rounded-lg py-2 text-center", TILE[health])}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-sm font-semibold font-mono tabular-nums">{value ?? "—"}</div>
    </div>
  );
}

export function ServiceCard({ site }: { site: SiteSummary }) {
  return (
    <article className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{site.name}</h3>
          <p className="text-xs text-neutral-500 mt-0.5 font-mono truncate">{site.url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            aria-hidden="true"
            className={cn("h-2.5 w-2.5 rounded-full", DOT[site.status])}
          />
          <span className={cn("text-sm font-medium", STATUS_TEXT[site.status])}>
            {LABEL[site.status]}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <UptimeBar site={site} />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
        <Stat label="24H" value={site.uptimeDay} />
        <Stat label="7D" value={site.uptimeWeek} />
        <Stat label="30D" value={site.uptimeMonth} />
        <Stat label="1Y" value={site.uptimeYear} />
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Response time (24h):{" "}
        <span className="font-mono tabular-nums">{site.timeDay}ms</span>
      </p>
    </article>
  );
}
