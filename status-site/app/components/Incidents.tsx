import { CheckCircle2, AlertCircle } from "lucide-react";
import type { IncidentSummary } from "@/lib/upptime";

function formatRel(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function cleanTitle(t: string): string {
  return t.replace(/^[^\w]+\s*/u, "").replace(/^(Resolved:\s*)/i, "");
}

export function Incidents({ incidents }: { incidents: IncidentSummary[] }) {
  if (incidents.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
        Recent incidents
      </h2>
      <ol className="space-y-2">
        {incidents.map((i) => {
          const resolved = i.state === "closed";
          return (
            <li key={i.number}>
              <a
                href={i.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 group"
              >
                <span className="shrink-0">
                  {resolved ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Resolved" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" aria-label="Ongoing" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {cleanTitle(i.title)}
                  </span>
                  <span className="block text-xs text-neutral-500 mt-0.5">
                    {resolved && i.closedAt
                      ? `Resolved ${formatRel(i.closedAt)}`
                      : `Started ${formatRel(i.createdAt)}`}
                  </span>
                </span>
                <span className="text-xs text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors font-mono">
                  #{i.number}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
