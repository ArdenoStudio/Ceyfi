"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play, RefreshCw, Sparkles, WalletCards, Zap, Timer, Keyboard } from "lucide-react";
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
import { formatLKR } from "@/lib/utils";
import { FaqSection } from "@/components/blocks/FaqSection";

type Action = "spend" | "tax" | "reset" | "prewarm";

const DEMO_SCRIPT = [
  { step: 1, label: "Overview", path: "/", hint: "TimeRiver — financial future, not just balance" },
  { step: 2, label: "Wallet spend", action: "spend" as const, hint: "Diaspora bucket drains → causality explains spend" },
  { step: 3, label: "Assistant", path: "/assistant", hint: "Ask in Sinhala or English with live context" },
  { step: 4, label: "Decisions", path: "/decisions", hint: "One ranked action card with evidence" },
  { step: 5, label: "Reset", action: "reset" as const, hint: "Clean slate for next audience" },
];

export default function DemoControlPage() {
  const router = useRouter();
  const [running, setRunning] = useState<Action | null>(null);
  const [scriptRunning, setScriptRunning] = useState(false);

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
        bucket_id: "bucket_household",
      }),
    []
  );

  const runScript = useCallback(async () => {
    setScriptRunning(true);
    try {
      for (const item of DEMO_SCRIPT) {
        toast.info(`Step ${item.step}: ${item.label}`, { description: item.hint });
        if (item.path) {
          router.push(item.path);
          await new Promise((r) => setTimeout(r, 2000));
        } else if (item.action === "spend") {
          await triggerSpend();
          await new Promise((r) => setTimeout(r, 1500));
        } else if (item.action === "reset") {
          await postDemoReset();
        }
      }
      toast.success("90-second demo script complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Script failed");
    } finally {
      setScriptRunning(false);
    }
  }, [router, triggerSpend]);

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
        <h1 className="text-xl font-bold text-seylan-charcoal">Demo Controls</h1>
        <p className="text-sm text-muted-foreground">
          Presenter panel for the 90-second CEYFI walkthrough. Shortcuts: 1 spend · 2 tax · 3 reset · 4 prewarm · S script
        </p>
      </div>

      <DashboardMetricGrid
        columns={4}
        items={[
          {
            label: "Demo script",
            metric: "90s",
            subLabel: "5-step narrative",
            description: "Overview → spend → assistant → decisions → reset",
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
            accent: "seylan",
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

      <ActivityFeedBlock
        eyebrow="Demo timeline"
        title="Script steps"
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
              <h2 className="font-semibold text-ceyfi-ink">Run demo script</h2>
              <p className="text-sm text-ceyfi-muted">
                Automated 5-step narrative: Overview → spend → assistant → decisions → reset
              </p>
            </div>
          </div>
          <Button
            onClick={runScript}
            disabled={scriptRunning || running !== null}
            className="w-full bg-ceyfi-green text-white"
          >
            {scriptRunning ? "Running script…" : "Start 90-second script (S)"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-seylan-border">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <WalletCards className="h-5 w-5 text-seylan-red" />
              <div>
                <h2 className="font-semibold text-seylan-charcoal">Wallet spend trigger</h2>
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

        <Card className="border-seylan-border">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="font-semibold text-seylan-charcoal">Tax jar trigger</h2>
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

        <Card className="border-seylan-border">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-seylan-red" />
              <div>
                <h2 className="font-semibold text-seylan-charcoal">Reset demo state</h2>
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

        <Card className="border-seylan-border">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="font-semibold text-seylan-charcoal">Prewarm demo data</h2>
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
        description="Talking points for the 90-second CEYFI walkthrough."
      />
    </div>
  );
}
