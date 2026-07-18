/**
 * Local autopilot soak: login → Play auto demo → observe every caption/route/toast.
 * Run with: node scripts/run-auto-demo.mjs
 * Expects frontend :3000 and backend :8000 already up.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Prefer localhost (not 127.0.0.1) so browser Origin matches backend CORS allow-list.
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.DEMO_ARTIFACT_DIR || "/opt/cursor/artifacts/auto-demo-run";
mkdirSync(OUT, { recursive: true });

const EXPECTED_CAPTION_FRAGMENTS = [
  "financial future",
  "Pick a plan",
  "Household",
  "salary delay",
  "Market Appetite",
  "CSE watchlist",
  "Alert detail",
  "financial health",
  "personal loan",
  "Sunil",
  "tax jar",
  "Sinhala",
  "ranked recommendation",
  "Clean slate",
];

const REQUIRED_ROUTES = [
  "/",
  "/wallet",
  "/scenarios",
  "/market",
  "/market/alerts/f-1",
  "/intelligence",
  "/loans",
  "/business",
  "/decisions",
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const log = [];
  const push = (entry) => {
    const row = { t: new Date().toISOString(), ...entry };
    log.push(row);
    console.log(JSON.stringify(row));
  };

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Next/Turbopack HMR websocket noise in headless — ignore.
    if (text.includes("webpack-hmr") || text.includes("_next/webpack-hmr")) return;
    push({ type: "console-error", text: text.slice(0, 300) });
  });
  page.on("pageerror", (err) => push({ type: "pageerror", text: String(err).slice(0, 300) }));

  // ── Login as Nimal ──────────────────────────────────────────────────────────
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Nimal Fernando/i }).waitFor({ state: "visible", timeout: 20000 });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Nimal Fernando/i }).click({ force: true });
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  await page.waitForTimeout(1200);
  push({ type: "after-login", url: page.url() });
  await page.screenshot({ path: join(OUT, "01-after-login.png") });

  // ── Start autopilot ─────────────────────────────────────────────────────────
  const play = page.getByRole("button", { name: /Play auto demo|Start Ceyfi/i });
  await play.waitFor({ state: "visible", timeout: 20000 });
  await play.click();
  push({ type: "started", url: page.url() });

  await page.locator("text=Auto Demo").first().waitFor({ state: "visible", timeout: 15000 });

  const seenCaptions = [];
  const seenRoutes = new Set();
  let lastCaption = "";
  let lastUrl = "";
  const startedAt = Date.now();
  const MAX_MS = 4 * 60 * 1000;

  while (Date.now() - startedAt < MAX_MS) {
    const badgeVisible = await page
      .locator("span", { hasText: "Auto Demo" })
      .first()
      .isVisible()
      .catch(() => false);

    const url = page.url();
    if (url !== lastUrl) {
      lastUrl = url;
      const path = new URL(url).pathname;
      seenRoutes.add(path);
      push({ type: "route", url });
    }

    // Caption bar structure: Step N of M / caption / say
    const stepLabel = page.getByText(/^Step \d+ of \d+$/).first();
    let caption = null;
    if (await stepLabel.isVisible().catch(() => false)) {
      caption = await stepLabel
        .evaluate((el) => {
          const root = el.parentElement;
          if (!root) return null;
          const ps = [...root.querySelectorAll("p")];
          // p0 = Step N of M, p1 = caption, p2 = say
          return ps[1]?.textContent?.trim() || null;
        })
        .catch(() => null);
    }

    if (caption && caption !== lastCaption) {
      lastCaption = caption;
      seenCaptions.push(caption);
      push({ type: "caption", caption, url });
      const shot = String(seenCaptions.length).padStart(2, "0");
      await page.screenshot({ path: join(OUT, `step-${shot}.png`) });
    }

    if (await page.getByText("Demo action skipped").isVisible().catch(() => false)) {
      push({ type: "toast-error", text: "Demo action skipped", url, caption: lastCaption });
      // debounce so we don't spam
      await page.waitForTimeout(800);
    }

    if (!badgeVisible && seenCaptions.length > 0) {
      push({ type: "finished", url, captions: seenCaptions.length });
      break;
    }
    await page.waitForTimeout(350);
  }

  const complete = await page
    .getByText(/Full product tour complete|Autopilot demo complete/i)
    .isVisible()
    .catch(() => false);
  push({ type: "complete-toast", visible: complete });
  await page.screenshot({ path: join(OUT, "99-end.png") });

  const matched = EXPECTED_CAPTION_FRAGMENTS.map((frag) => ({
    frag,
    hit: seenCaptions.some((c) => c.toLowerCase().includes(frag.toLowerCase())),
  }));
  const missingCaptions = matched.filter((m) => !m.hit).map((m) => m.frag);
  const missingRoutes = REQUIRED_ROUTES.filter((r) => {
    if (r === "/") return ![...seenRoutes].includes("/");
    return ![...seenRoutes].some((p) => p === r || p.startsWith(`${r}/`));
  });

  const actionSkips = log.filter((e) => e.type === "toast-error").length;
  const pageErrors = log.filter((e) => e.type === "pageerror" || e.type === "console-error");

  const summary = {
    captionsSeen: seenCaptions,
    captionCount: seenCaptions.length,
    missingCaptions,
    routesSeen: [...seenRoutes],
    missingRoutes,
    actionSkips,
    pageErrorCount: pageErrors.length,
    pageErrors: pageErrors.slice(0, 25),
    completeToast: complete,
    elapsedMs: Date.now() - startedAt,
    ok:
      missingCaptions.length === 0 &&
      missingRoutes.length === 0 &&
      actionSkips === 0 &&
      seenCaptions.length >= 12,
  };

  writeFileSync(join(OUT, "summary.json"), JSON.stringify({ summary, log }, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Artifacts: ${OUT}`);

  await browser.close();
  process.exit(summary.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
