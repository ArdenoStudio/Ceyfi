import { getSummary, getRecentIncidents, overallStatus, REPO_URL } from "@/lib/upptime";
import { APP_URL } from "@/lib/config";
import { StatusBanner } from "./components/StatusBanner";
import { ServiceCard } from "./components/ServiceCard";
import { Incidents } from "./components/Incidents";
import { AskAgent } from "./components/AskAgent";

export const revalidate = 60;

export default async function StatusPage() {
  const [summary, incidents] = await Promise.all([
    getSummary(),
    getRecentIncidents(5),
  ]);
  const sites = summary?.sites ?? [];
  const status = overallStatus(sites);
  const lastUpdate = summary
    ? new Date(summary.lastUpdate).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12 sm:py-16">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-blue-600 grid place-items-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="font-semibold tracking-tight">CEYFI Status</span>
          </div>
          <a
            href={APP_URL}
            className="text-sm text-neutral-500 hover:text-blue-600 transition-colors"
          >
            {new URL(APP_URL).host} →
          </a>
        </header>

        {/* Status banner */}
        <StatusBanner status={status} sites={sites} />

        {/* Services */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
              Services
            </h2>
            {lastUpdate && (
              <span className="text-xs text-neutral-500">Updated {lastUpdate}</span>
            )}
          </div>

          {sites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-sm text-neutral-500">
              No monitoring data yet. Once the Upptime workflow runs for the first time,
              services will appear here.
            </div>
          ) : (
            <div className="stagger space-y-3">
              {sites.map((site) => (
                <ServiceCard key={site.slug} site={site} />
              ))}
            </div>
          )}
        </section>

        {/* Incidents */}
        <Incidents incidents={incidents} />

        {/* AI Chat */}
        <AskAgent />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-3">
          <span>Powered by Upptime · Checked every 5 minutes</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            Raw data on GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
