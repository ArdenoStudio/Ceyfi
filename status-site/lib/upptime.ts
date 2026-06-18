const OWNER = process.env.UPPTIME_OWNER ?? "ArdenoStudio";
const REPO = process.env.UPPTIME_REPO ?? "seylan-uptime-monitor";
const BRANCH = process.env.UPPTIME_BRANCH ?? "master";

const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;

export type SiteStatus = "up" | "down" | "degraded" | "unknown";

export interface SiteSummary {
  name: string;
  url: string;
  slug: string;
  status: SiteStatus;
  uptime: string;
  uptimeDay: string;
  uptimeWeek: string;
  uptimeMonth: string;
  uptimeYear: string;
  time: number;
  timeDay: number;
  timeWeek: number;
  timeMonth: number;
  timeYear: number;
  dailyMinutesDown?: Record<string, number>;
}

export interface SummaryFile {
  lastUpdate: string;
  sites: SiteSummary[];
}

export interface IncidentSummary {
  number: number;
  title: string;
  url: string;
  state: "open" | "closed";
  createdAt: string;
  closedAt: string | null;
}

function parseHistoryYaml(yaml: string): Record<string, number> {
  const daily: Record<string, number> = {};
  // Split on YAML list entries
  const entries = yaml.split(/\n(?=- )/);
  for (const entry of entries) {
    const typeMatch = entry.match(/\btype:\s*["']?(\w+)["']?/);
    const dateMatch = entry.match(/\bdate:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})[T\s]/);
    const durMatch = entry.match(/\bduration:\s*(\d+)/);
    if (!typeMatch || !dateMatch) continue;
    const type = typeMatch[1];
    const day = dateMatch[1];
    const dur = durMatch ? parseInt(durMatch[1], 10) : 0;
    if (type === "down" && dur > 0) {
      daily[day] = (daily[day] ?? 0) + dur;
    } else if (daily[day] === undefined) {
      daily[day] = 0;
    }
  }
  return daily;
}

async function getDailyMinutesDown(slug: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${RAW}/history/${slug}.yml`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return parseHistoryYaml(await res.text());
  } catch {
    return {};
  }
}

export async function getSummary(): Promise<SummaryFile | null> {
  try {
    const res = await fetch(`${RAW}/history/summary.json`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as SiteSummary[];
    if (!Array.isArray(raw)) return null;

    const sites = await Promise.all(
      raw.map(async (site) => ({
        ...site,
        dailyMinutesDown: await getDailyMinutesDown(site.slug),
      })),
    );

    return { lastUpdate: new Date().toISOString(), sites };
  } catch {
    return null;
  }
}

export async function getRecentIncidents(limit = 5): Promise<IncidentSummary[]> {
  try {
    const res = await fetch(
      `${API}/issues?state=all&per_page=${limit + 5}&sort=created&direction=desc`,
      {
        next: { revalidate: 120 },
        headers: { Accept: "application/vnd.github+json" },
      },
    );
    if (!res.ok) return [];
    const issues = (await res.json()) as Array<{
      number: number;
      title: string;
      html_url: string;
      state: "open" | "closed";
      created_at: string;
      closed_at: string | null;
      pull_request?: unknown;
    }>;
    return issues
      .filter((i) => !i.pull_request)
      .slice(0, limit)
      .map((i) => ({
        number: i.number,
        title: i.title,
        url: i.html_url,
        state: i.state,
        createdAt: i.created_at,
        closedAt: i.closed_at,
      }));
  } catch {
    return [];
  }
}

export function overallStatus(sites: SiteSummary[]): SiteStatus {
  if (sites.length === 0) return "unknown";
  if (sites.some((s) => s.status === "down")) return "down";
  if (sites.some((s) => s.status === "degraded")) return "degraded";
  if (sites.every((s) => s.status === "up")) return "up";
  return "unknown";
}

export function last90Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export type DayStatus = "ok" | "partial" | "down" | "nodata";

export function dayStatus(minutesDown: number | undefined): DayStatus {
  if (minutesDown === undefined) return "nodata";
  if (minutesDown === 0) return "ok";
  if (minutesDown < 15) return "partial";
  return "down";
}

export function uptimeHealth(uptimePct: string): "ok" | "warn" | "bad" {
  const n = parseFloat(uptimePct);
  if (isNaN(n)) return "ok";
  if (n >= 99.9) return "ok";
  if (n >= 95) return "warn";
  return "bad";
}
