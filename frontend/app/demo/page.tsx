"use client";

import { useCallback, useEffect, useState } from "react";
import { useDemoAutopilot } from "@/components/demo/DemoAutopilot";
import {
  CheckCircle2,
  Play,
  RefreshCw,
  Sparkles,
  WalletCards,
  Zap,
  Timer,
  Keyboard,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ActivityFeedBlock,
  type ActivityFeedItem,
} from "@/components/blocks/ActivityFeedBlock";
import { DashboardMetricGrid } from "@/components/blocks/DashboardMetricCard";
import {
  postDemoReset,
  postTaxJarTrigger,
  postTriggerSpend,
  prewarmDemoData,
} from "@/lib/api";
import { cn, formatLKR } from "@/lib/utils";
import { FaqSection } from "@/components/blocks/FaqSection";

type Action = "spend" | "tax" | "reset" | "prewarm";

type DemoStep = {
  step: number;
  label: string;
  path?: string;
  action?: "spend" | "tax" | "reset" | "persona";
  hint: string;
  seconds: number;
  persona?: string;
};

const DEMO_SCRIPT: DemoStep[] = [
  {
    step: 1,
    label: "Time River",
    path: "/",
    hint: "Inspect next risk → select a plan",
    seconds: 9,
  },
  {
    step: 2,
    label: "Wallet spend",
    path: "/wallet",
    action: "spend",
    hint: "Household −LKR 12,400",
    seconds: 7,
    persona: "Nimal Fernando",
  },
  {
    step: 3,
    label: "Scenarios",
    path: "/scenarios",
    hint: "Toggle salary-delay shock",
    seconds: 6,
  },
  {
    step: 4,
    label: "Market",
    path: "/market → /market/alerts/f-1",
    hint: "Chime fires + cash context + broker CTA",
    seconds: 10,
  },
  {
    step: 5,
    label: "Intelligence",
    path: "/intelligence",
    hint: "Explainable health score",
    seconds: 5,
  },
  {
    step: 6,
    label: "Loans · Nimal",
    path: "/loans",
    hint: "Personal loan next due",
    seconds: 5,
  },
  {
    step: 7,
    label: "Loans · Sunil",
    path: "/loans",
    action: "persona",
    hint: "AT RISK borrower lens",
    seconds: 8,
    persona: "Sunil Bandara",
  },
  {
    step: 8,
    label: "Tax jar",
    path: "/business",
    action: "tax",
    hint: "LKR 8,200 in → LKR 820 saved",
    seconds: 9,
    persona: "Suresh Silva",
  },
  {
    step: 9,
    label: "Assistant",
    path: "/assistant",
    hint: "Sinhala prompt with live context",
    seconds: 9,
    persona: "Nimal Fernando",
  },
  {
    step: 10,
    label: "Decisions",
    path: "/decisions?plan=d1",
    hint: "Execute ranked recommendation",
    seconds: 6,
  },
  {
    step: 11,
    label: "Reset",
    action: "reset",
    hint: "Clean slate + restore Nimal",
    seconds: 4,
  },
];

function DemoStepIndicator({
  steps,
  activeStep,
  completedThrough,
}: {
  steps: DemoStep[];
  activeStep: number | null;
  completedThrough: number;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {steps.map((item) => {
        const done = item.step <= completedThrough;
        const active = activeStep === item.step;

        return (
          <li key={item.step} className="relative flex flex-col">
            <div
              className={cn(
                "flex flex-col items-center rounded-xl border px-3 py-4 text-center transition-colors",
                active
                  ? "border-ceyfi-green bg-ceyfi-sprout/60 shadow-sm"
                  : done
                    ? "border-ceyfi-green/40 bg-ceyfi-surface/80"
                    : "border-border bg-background/60"
              )}
            >
              <span
                className={cn(
                  "mb-2 flex size-10 items-center justify-center rounded-full text-sm font-bold",
                  done
                    ? "bg-ceyfi-green text-white"
                    : active
                      ? "bg-ceyfi-green/15 text-ceyfi-green ring-2 ring-ceyfi-green/30"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {done && !active ? (
                  <CheckCircle2 className="size-5" aria-hidden />
                ) : (
                  item.step
                )}
              </span>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {item.path ? (
                  <code className="rounded bg-muted px-1 py-0.5">{item.path}</code>
                ) : (
                  "API action"
                )}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ceyfi-green">
                ~{item.seconds}s
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function DemoControlPage() {
  const [running, setRunning] = useState<Action | null>(null);
  // Delegate the full walkthrough to the layout-level autopilot so it survives
  // navigation and shows the animated cursor + caption chrome. This page's
  // "Start" button and `S` shortcut both drive that single engine.
  const {
    start: runScript,
    isRunning: scriptRunning,
    stepIndex,
    totalSteps,
  } = useDemoAutopilot();
  // Autopilot has finer-grained steps than the presenter summary cards;
  // map progress onto the summary list by proportion.
  const activeStep = scriptRunning
    ? Math.min(
        DEMO_SCRIPT.length,
        Math.max(1, Math.round(((stepIndex + 1) / totalSteps) * DEMO_SCRIPT.length)),
      )
    : null;
  const completedThrough = scriptRunning
    ? Math.max(0, (activeStep ?? 1) - 1)
    : 0;

  async function runAction(action: Action, task: () => Promise<unknown>) {
    setRunning(action);
    try {
      await task();
      toast.success("Demo action complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demo action failed");
    } finally {
      setRunning(null);
    }
  }

  const triggerSpend = useCallback(
    () =>
      postTriggerSpend({
        account_id: "SEY-ACC-002",
        amount_lkr: 12400,
        merchant: "Softlogic Glomark",
        bucket_id: "household",
      }),
    []
  );

  useEffect(() => {
    const shortcuts: Record<string, () => void> = {
      "1": () => runAction("spend", triggerSpend),
      "2": () => runAction("tax", () =>
        postTaxJarTrigger({
          user_id: "SEY-BIZ-001",
          incoming_amount_lkr: 8200,
          description: "Cash Sale - Electrical Fittings",
        })
      ),
      "3": () => runAction("reset", postDemoReset),
      "4": () => runAction("prewarm", prewarmDemoData),
      s: () => !scriptRunning && runScript(),
    };

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const fn = shortcuts[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runScript, scriptRunning, triggerSpend]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ceyfi-ink dark:text-white">Demo Controls</h1>
        <p className="text-sm text-muted-foreground">
          Presenter panel for the full CEYFI product tour. Shortcuts: 1 spend · 2 tax · 3 reset · 4 prewarm · S script
        </p>
      </div>

      <DashboardMetricGrid
        columns={4}
        items={[
          {
            label: "Full product tour",
            metric: "~2 min",
            subLabel: `${totalSteps}-step autopilot`,
            description: "Overview → wallet → scenarios → market → intelligence → loans ×2 → tax jar → assistant → decisions → reset",
            icon: Timer,
            accent: "ceyfi",
          },
          {
            label: "Quick actions",
            metric: "4",
            subLabel: "Keyboard shortcuts",
            description: "Press 1–4 for spend, tax, reset, and prewarm triggers",
            icon: Keyboard,
            accent: "neutral",
          },
          {
            label: "Wallet spend",
            metric: formatLKR(12400),
            subLabel: "Household bucket",
            description: "Softlogic Glomark — press 1 to trigger live spend",
            icon: WalletCards,
            accent: "ceyfi",
          },
          {
            label: "Tax jar",
            metric: formatLKR(820),
            subLabel: "Auto-saved",
            description: `From incoming ${formatLKR(8200)} sale — press 2`,
            icon: Zap,
            accent: "amber",
          },
        ]}
      />

      <Card className="border-ceyfi-line/70">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ceyfi-green">
                Full product tour
              </p>
              <h2 className="font-heading text-lg font-semibold text-ceyfi-ink">
                Step-by-step click path
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Autopilot starts as <strong>Nimal Fernando</strong>, switches to{" "}
                <strong>Sunil</strong> and <strong>Suresh</strong> mid-run, then restores Nimal.
                The floating <strong>Play auto demo</strong> button runs the same script.
              </p>
            </div>
            {scriptRunning ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-ceyfi-sprout px-3 py-1 text-xs font-semibold text-ceyfi-green">
                <span className="size-2 animate-pulse rounded-full bg-ceyfi-green" />
                Autopilot step {stepIndex + 1}/{totalSteps}
              </span>
            ) : null}
          </div>
          <DemoStepIndicator
            steps={DEMO_SCRIPT}
            activeStep={activeStep}
            completedThrough={completedThrough}
          />
        </CardContent>
      </Card>

      <ActivityFeedBlock
        eyebrow="Demo timeline"
        title="Script narration"
        footerLabel=""
        items={DEMO_SCRIPT.map(
          (step): ActivityFeedItem => ({
            id: String(step.step),
            icon: <Play className="size-4 text-ceyfi-green" />,
            title: step.label,
            subtitle: step.hint,
            amount: `Step ${step.step}`,
            amountTone: "neutral",
            date: step.path ?? step.action ?? "Action",
          })
        )}
      />

      <Card className="border-ceyfi-green/30 bg-ceyfi-surface">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5 text-ceyfi-green" />
            <div>
              <h2 className="font-semibold text-ceyfi-ink">Run full product tour</h2>
              <p className="text-sm text-ceyfi-muted">
                Automated {totalSteps}-step narrative across all three personas with live mock side-effects
              </p>
            </div>
          </div>
          <Button
            onClick={runScript}
            disabled={scriptRunning || running !== null}
            className="w-full bg-ceyfi-green text-white"
          >
            {scriptRunning ? "Running script…" : "Start full product tour (S)"}
            {!scriptRunning ? <ArrowRight className="ml-2 size-4" /> : null}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Also available as the floating &ldquo;Play auto demo&rdquo; control on every page.
            Legacy shortcut label: 90-second script.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-ceyfi-line">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <WalletCards className="h-5 w-5 text-ceyfi-green" />
              <div>
                <h2 className="font-semibold text-ceyfi-ink dark:text-white">Wallet spend trigger</h2>
                <p className="text-sm text-muted-foreground">
                  Softlogic Glomark spend drops Household by {formatLKR(12400)}. Press <kbd className="rounded bg-muted px-1">1</kbd>
                </p>
              </div>
            </div>
            <Button
              onClick={() => runAction("spend", triggerSpend)}
              disabled={running !== null}
              className="w-full"
            >
              {running === "spend" ? "Triggering..." : "Trigger wallet spend"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-ceyfi-line">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="font-semibold text-ceyfi-ink dark:text-white">Tax jar trigger</h2>
                <p className="text-sm text-muted-foreground">
                  Incoming {formatLKR(8200)} auto-saves {formatLKR(820)}. Press <kbd className="rounded bg-muted px-1">2</kbd>
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                runAction("tax", () =>
                  postTaxJarTrigger({
                    user_id: "SEY-BIZ-001",
                    incoming_amount_lkr: 8200,
                    description: "Cash Sale - Electrical Fittings",
                  })
                )
              }
              disabled={running !== null}
              className="w-full"
            >
              {running === "tax" ? "Triggering..." : "Trigger tax jar"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-ceyfi-line">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-ceyfi-green" />
              <div>
                <h2 className="font-semibold text-ceyfi-ink dark:text-white">Reset demo state</h2>
                <p className="text-sm text-muted-foreground">
                  Protected admin endpoint. Press <kbd className="rounded bg-muted px-1">3</kbd>
                </p>
              </div>
            </div>
            <Button
              onClick={() => runAction("reset", postDemoReset)}
              disabled={running !== null}
              variant="outline"
              className="w-full"
            >
              {running === "reset" ? "Resetting..." : "Reset demo"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-ceyfi-line">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="font-semibold text-ceyfi-ink dark:text-white">Prewarm demo data</h2>
                <p className="text-sm text-muted-foreground">
                  Loads wallet, loans, business paths. Press <kbd className="rounded bg-muted px-1">4</kbd>
                </p>
              </div>
            </div>
            <Button
              onClick={() => runAction("prewarm", prewarmDemoData)}
              disabled={running !== null}
              variant="outline"
              className="w-full"
            >
              {running === "prewarm" ? "Prewarming..." : "Prewarm data"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <FaqSection
        eyebrow="Presenter help"
        heading="Demo FAQ"
        description="Talking points for the CEYFI full product tour (and the classic 90-second script path)."
      />
    </div>
  );
}
