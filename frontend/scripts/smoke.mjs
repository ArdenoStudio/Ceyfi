import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "app/page.tsx",
  "app/transactions/page.tsx",
  "app/wallet/page.tsx",
  "app/market/page.tsx",
  "app/market/appetite/page.tsx",
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
  "components/market/CandleSpark.tsx",
  "components/market/FocusFireCard.tsx",
  "components/market/AppetiteMeter.tsx",
  "components/market/AppetiteStrip.tsx",
  "lib/daily-bars.ts",
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
  "contexts/LocaleContext.tsx",
  "lib/i18n/messages/en.ts",
  "lib/i18n/messages/si.ts",
  "lib/i18n/messages/ta.ts",
  "components/wallet/RemittanceTracker.tsx",
  "components/wallet/SenderGuidanceCard.tsx",
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
  ["lib/i18n/messages/en.ts", "Intelligence"],
  ["lib/i18n/messages/en.ts", "More pages"],
  ["lib/chartUtils.ts", "CHART_COLORS"],
  ["components/charts/TimeRiver.tsx", "CausalityPanel"],
  ["lib/i18n/messages/en.ts", "Financial clarity workspace"],
  ["hooks/useWalletRealtime.ts", "subscribeToTransactions"],
  ["lib/i18n/messages/en.ts", "Track money sent home"],
  ["components/layout/Sidebar.tsx", 'href: "/market"'],
  ["components/wallet/RemittanceTracker.tsx", "remittance-tracker"],
  ["components/wallet/SenderGuidanceCard.tsx", "sender-guidance"],
  ["contexts/LocaleContext.tsx", "LocaleProvider"],
  ["lib/i18n/messages/si.ts", "පසුම්බිය"],
  ["lib/i18n/messages/ta.ts", "பணப்பை"],
  ["app/market/page.tsx", "CSE watch & alerts"],
  ["app/market/page.tsx", "FocusFireCard"],
  ["app/market/page.tsx", "CandleSpark"],
  ["app/market/page.tsx", "AppetiteStrip"],
  ["app/market/appetite/page.tsx", "CSE market appetite"],
  ["components/market/FocusFireCard.tsx", "Focus fire"],
  ["components/market/FocusFireCard.tsx", "CandleSpark"],
  ["components/market/CandleSpark.tsx", "candlestick"],
  ["components/market/AppetiteMeter.tsx", "role=\"meter\""],
  ["components/market/AppetiteStrip.tsx", "Market Appetite"],
  ["components/market/AppetiteStrip.tsx", "market-appetite"],
  ["lib/daily-bars.ts", "aggregateBarsForDisplay"],
  ["app/market/alerts/[id]/page.tsx", "Open my broker"],
  ["app/market/alerts/[id]/page.tsx", "aria-disabled"],
  ["app/market/alerts/[id]/page.tsx", "PathToAlertChart"],
  ["app/market/symbol/[symbol]/page.tsx", "Filings"],
  ["lib/chime-market.ts", "/api/market/overview"],
  ["lib/chime-market.ts", "/api/market/appetite"],
  ["lib/chime-market.ts", "/api/market/symbols/"],
  ["components/market/NfaStrip.tsx", "not financial advice"],
  ["components/market/CashContextCard.tsx", "cashSharePct"],
  ["components/market/CandleStickChart.tsx", "Candles from"],
  ["components/assistant/MessageBubble.tsx", "<AudioPlayer"],
  ["app/login/page.tsx", "Choose a persona"],
  ["components/layout/DemoModeBadge.tsx", "Demo environment"],
  ["app/demo/page.tsx", "Trigger wallet spend"],
  ["app/demo/page.tsx", "90-second script"],
  ["app/demo/page.tsx", "full product tour"],
  ["components/demo/DemoAutopilot.tsx", "data-demo-target"],
  ["components/demo/DemoAutopilot.tsx", "switchPersona"],
  ["components/demo/DemoAutopilot.tsx", "market-appetite"],
  ["components/demo/DemoAutopilot.tsx", "Market Appetite"],
  ["app/manifest.ts", "/favicon.ico"],
  ["components/payments/PayHereButton.tsx", "Pay with PayHere"],
  ["components/layout/SiteFooter.tsx", "CEYFI"],
  ["lib/urls.ts", "absoluteBackendUrl"],
  ["lib/urls.ts", "isProtectedVercelDeploymentUrl"],
  ["lib/urls.ts", "VERCEL_PROJECT_PRODUCTION_URL"],
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
