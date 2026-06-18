import { last90Days, dayStatus, type SiteSummary, type DayStatus } from "@/lib/upptime";
import { cn } from "@/lib/utils";

const TILE: Record<DayStatus, string> = {
  ok: "bg-emerald-500/80 hover:bg-emerald-400",
  partial: "bg-amber-500/80 hover:bg-amber-400",
  down: "bg-red-500/80 hover:bg-red-400",
  nodata: "bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700",
};

const LABEL: Record<DayStatus, string> = {
  ok: "operational",
  partial: "partial outage",
  down: "outage",
  nodata: "no data",
};

export function UptimeBar({ site }: { site: SiteSummary }) {
  const days = last90Days();
  const downMap = site.dailyMinutesDown ?? {};

  return (
    <div className="space-y-1.5" aria-label={`90-day uptime for ${site.name}`}>
      <div className="flex gap-[2px] h-8" role="img">
        {days.map((day) => {
          const minutes = downMap[day];
          const s = dayStatus(minutes);
          const tooltip =
            s === "nodata"
              ? `${day} — no data`
              : `${day} — ${LABEL[s]}${minutes ? ` (${minutes} min down)` : ""}`;
          return (
            <span
              key={day}
              title={tooltip}
              aria-label={tooltip}
              className={cn(
                "flex-1 rounded-[2px] transition-colors duration-150 cursor-default",
                TILE[s],
              )}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-neutral-500 tabular-nums">
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
