"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  postDemoReset,
  postTaxJarTrigger,
  postTriggerSpend,
  prewarmDemoData,
} from "@/lib/api";
import { formatLKR } from "@/lib/utils";

type Action = "spend" | "tax" | "reset" | "prewarm";

export default function DemoControlPage() {
  const [running, setRunning] = useState<Action | null>(null);

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-seylan-charcoal">
          Demo Controls
        </h1>
        <p className="text-sm text-muted-foreground">
          Trigger the moments used in the two-minute judging walkthrough.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-seylan-border">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <WalletCards className="h-5 w-5 text-seylan-red" />
              <div>
                <h2 className="font-semibold text-seylan-charcoal">
                  Wallet spend trigger
                </h2>
                <p className="text-sm text-muted-foreground">
                  Softlogic Glomark spend drops Household by{" "}
                  {formatLKR(12400)}.
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                runAction("spend", () =>
                  postTriggerSpend({
                    account_id: "SEY-ACC-002",
                    amount_lkr: 12400,
                    merchant: "Softlogic Glomark",
                    bucket_id: "bucket_household",
                  })
                )
              }
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
                <h2 className="font-semibold text-seylan-charcoal">
                  Tax jar trigger
                </h2>
                <p className="text-sm text-muted-foreground">
                  Incoming {formatLKR(8200)} auto-saves {formatLKR(820)}.
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
                <h2 className="font-semibold text-seylan-charcoal">
                  Reset demo state
                </h2>
                <p className="text-sm text-muted-foreground">
                  Calls the backend reset endpoint and refreshes open wallet views.
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
                <h2 className="font-semibold text-seylan-charcoal">
                  Prewarm demo data
                </h2>
                <p className="text-sm text-muted-foreground">
                  Loads wallet, loans, business, and categorisation paths.
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
    </div>
  );
}
