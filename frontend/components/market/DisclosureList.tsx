import { FileText } from "lucide-react";

import type { MarketDisclosure } from "@/lib/chime-market";

export function DisclosureList({
  items,
  emptyLabel = "No recent filings mirrored from Chime.",
}: {
  items: MarketDisclosure[];
  emptyLabel?: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((d) => {
        const href = d.pdf_url || d.url || undefined;
        const ready = d.brief_status === "ready" && d.brief;
        return (
          <li
            key={String(d.id ?? d.title)}
            className="rounded-xl border border-ceyfi-line/70 px-3 py-2.5 dark:border-white/10"
          >
            <div className="flex items-start gap-2">
              <FileText
                className="mt-0.5 size-4 shrink-0 text-ceyfi-green"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {d.title ?? "Filing"}
                    </a>
                  ) : (
                    (d.title ?? "Filing")
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {[d.category, d.published_at?.slice(0, 10)]
                    .filter(Boolean)
                    .join(" · ")}
                  {d.pdf_url ? " · PDF" : ""}
                </p>
                {ready ? (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/85">
                    {d.brief}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Brief {d.brief_status ?? "unavailable"} — open the filing
                    for source text.
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
