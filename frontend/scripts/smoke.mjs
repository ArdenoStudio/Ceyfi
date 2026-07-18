import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "app/page.tsx",
  "app/transactions/page.tsx",
  "app/wallet/page.tsx",
  "app/market/page.tsx",
  "app/market/watchlist/page.tsx",
  "app/market/alerts/page.tsx",
  "app/market/alerts/[id]/page.tsx",
  "app/market/symbol/[symbol]/page.tsx",
  "lib/chime-market.ts",
  "components/market/CashContextCard.tsx",
  "components/market/NfaStrip.tsx",
  "components/market/PathToAlertChart.tsx",
  "components/market/CandleStickChart.tsx",
  "components/market/DisclosureList.tsx",
  "components/market/ActivityBadge.tsx",
  "components/market/Sparkline.tsx",
  "components/market/FocusFireCard.tsx",
  "app/assistant/page.tsx",
  "app/loans/page.tsx",
  "app/business/page.tsx",
  "app/intelligence/page.tsx",
  "app/scenarios/page.tsx",
  "app/decisions/page.tsx",
  "app/demo/page.tsx",
  "app/login/page.tsx",
  "app/metrics/page.tsx",
  "app/profile/page.tsx",
  "app/payments/checkout/page.tsx",
  "app/payments/return/page.tsx",
  "contexts/AuthContext.tsx",
  "lib/auth.ts",
  ".env.example",
  "lib/chartUtils.ts",
  "components/charts/TimeRiver.tsx",
  "components/charts/CeyfiTooltip.tsx",
  "components/charts/ScenarioFanChart.tsx",
  "public/ceyfi-logo.svg",
  "public/ceyfi-icon.svg",
  "app/favicon.ico",
  "app/icon.svg",
  "app/apple-icon.png",
  "components/layout/DemoModeBadge.tsx",
  "components/demo/DemoAutopilot.tsx",
  "components/assistant/AudioPlayer.tsx",
  "components/layout/SiteFooter.tsx",
  "components/payments/PayHereButton.tsx",
];

const requiredSnippets = [
  ["app/page.tsx", "Financial timeline"],
  ["app/page.tsx", "TimeRiver"],
  ["app/transactions/page.tsx", "Follow every rupee"],
  ["app/intelligence/page.tsx", "Financial intelligence"],
  ["app/scenarios/page.tsx", "Scenario laboratory"],
  ["app/decisions/page.tsx", "Decision room"],
  ["components/layout/Sidebar.tsx", "Intelligence"],
  ["components/layout/MobileNav.tsx", "More pages"],
  ["lib/chartUtils.ts", "CHART_COLORS"],
  ["components/charts/TimeRiver.tsx", "CausalityPanel"],
  ["components/layout/Sidebar.tsx", "Financial clarity workspace"],
  ["hooks/useWalletRealtime.ts", "subscribeToTransactions"],
  ["app/wallet/page.tsx", "Track money sent home"],
  ["components/layout/Sidebar.tsx", 'href: "/market"'],
  ["app/market/page.tsx", "CSE watch & alerts"],
  ["app/market/page.tsx", "FocusFireCard"],
  ["app/market/page.tsx", "Sparkline"],
  ["components/market/FocusFireCard.tsx", "Focus fire"],
  ["app/market/alerts/[id]/page.tsx", "Open my broker"],
  ["app/market/alerts/[id]/page.tsx", "aria-disabled"],
  ["app/market/alerts/[id]/page.tsx", "PathToAlertChart"],
  ["app/market/symbol/[symbol]/page.tsx", "Filings"],
  ["lib/chime-market.ts", "/api/market/overview"],
  ["lib/chime-market.ts", "/api/market/symbols/"],
  ["components/market/NfaStrip.tsx", "not financial advice"],
  ["components/market/CashContextCard.tsx", "cashSharePct"],
  ["components/market/CandleStickChart.tsx", "candlestick"],
  ["components/assistant/MessageBubble.tsx", "<AudioPlayer"],
  ["app/login/page.tsx", "Choose a persona"],
  ["components/layout/DemoModeBadge.tsx", "Demo environment"],
  ["app/demo/page.tsx", "Trigger wallet spend"],
  ["app/demo/page.tsx", "90-second script"],
  ["app/demo/page.tsx", "full product tour"],
  ["components/demo/DemoAutopilot.tsx", "data-demo-target"],
  ["components/demo/DemoAutopilot.tsx", "switchPersona"],
  ["app/manifest.ts", "/favicon.ico"],
  ["components/payments/PayHereButton.tsx", "Pay with PayHere"],
  ["components/layout/SiteFooter.tsx", "CEYFI"],
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

for (const [file, snippet] of requiredSnippets) {
  const content = readFileSync(join(root, file), "utf8");
  if (!content.includes(snippet)) {
    missing.push(`${file} missing snippet: ${snippet}`);
  }
}

if (missing.length > 0) {
  console.error("Smoke check failed:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("Smoke check passed: production-critical frontend files are present.");
