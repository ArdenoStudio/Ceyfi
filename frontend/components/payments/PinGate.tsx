"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lock, Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const DEMO_HINT = "1234";

interface PinGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function PinGate({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loading = false,
  onConfirm,
}: PinGateProps) {
  const { t, scriptClassName } = useLocale();
  const resolvedTitle = title ?? t.send.pinTitle;
  const resolvedDescription = description ?? t.send.pinDescription;
  const resolvedConfirm = confirmLabel ?? t.send.pinConfirm;
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputs.current[0]?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  const pin = digits.join("");
  const ready = pin.length === 4 && !loading;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setDigits(["", "", "", ""]);
      setError(null);
    }
    onOpenChange(next);
  }

  function setDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    setError(null);
    if (cleaned && index < 3) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && ready) void submit();
  }

  async function submit() {
    if (pin.length !== 4) {
      setError(t.common.enterPinDigits);
      return;
    }
    await onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-sm", scriptClassName)}>
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-ceyfi-sprout text-ceyfi-green">
            <Lock className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center font-heading">{resolvedTitle}</DialogTitle>
          <DialogDescription className="text-center">{resolvedDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              aria-label={`PIN digit ${i + 1}`}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className={cn(
                "h-12 w-11 rounded-xl border border-ceyfi-line bg-ceyfi-paper text-center font-mono text-lg font-semibold text-ceyfi-ink outline-none focus:border-ceyfi-green focus:ring-2 focus:ring-ceyfi-green/20",
                error && "border-rose-400"
              )}
            />
          ))}
        </div>

        {error ? (
          <p className="text-center text-xs font-medium text-rose-600">{error}</p>
        ) : (
          <p className="text-center text-[11px] text-ceyfi-faint">
            {t.common.demoPinTip}{" "}
            <span className="font-mono font-semibold">{DEMO_HINT}</span>
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t.common.cancel}
          </Button>
          <Button
            data-demo-target="pin-confirm"
            className="bg-ceyfi-green text-white hover:bg-ceyfi-deep"
            disabled={!ready}
            onClick={() => void submit()}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {resolvedConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
