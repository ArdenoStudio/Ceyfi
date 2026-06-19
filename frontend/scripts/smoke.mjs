import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "app/page.tsx",
  "app/transactions/page.tsx",
  "app/wallet/page.tsx",
  "app/assistant/page.tsx",
  "app/loans/page.tsx",
  "app/business/page.tsx",
  "app/intelligence/page.tsx",
  "app/scenarios/page.tsx",
  "app/decisions/page.tsx",
  "app/demo/page.tsx",
  "app/login/page.tsx",
  "contexts/AuthContext.tsx",
  "lib/auth.ts",
  ".env.example",
  "lib/chartUtils.ts",
  "components/charts/TimeRiver.tsx",
  "components/charts/CeyfiTooltip.tsx",
  "components/charts/ScenarioFanChart.tsx",
  "public/seylan-logo.svg",
  "public/seylan-logo-white.svg",
  "components/layout/DemoModeBadge.tsx",
  "components/assistant/AudioPlayer.tsx",
  "components/seylan/SeylanBankHandoffBanner.tsx",
  "lib/seylan-external-links.ts",
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
  ["components/layout/Sidebar.tsx", "Powered by Seylan Bank"],
  ["hooks/useWalletRealtime.ts", "subscribeToTransactions"],
  ["app/wallet/page.tsx", "Track money sent home"],
  ["components/layout/AppShell.tsx", "showSeylanHandoff"],
  ["components/assistant/MessageBubble.tsx", "<AudioPlayer"],
  ["app/login/page.tsx", "Choose a persona"],
  ["components/layout/DemoModeBadge.tsx", "Demo environment"],
  ["app/demo/page.tsx", "Trigger wallet spend"],
  ["app/demo/page.tsx", "90-second script"],
  ["public/manifest.json", "/seylan-logo.svg"],
  ["lib/seylan-external-links.ts", "seylanbank.lk"],
  ["components/seylan/SeylanBankHandoffBanner.tsx", "Personal Internet Banking"],
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

console.log("Smoke check passed: demo-critical frontend files are present.");
