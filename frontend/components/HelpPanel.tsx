"use client";

import { Keyboard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SHORTCUTS = [
  { keys: "?", description: "Open this keyboard shortcuts panel" },
  { keys: "Esc", description: "Close open dialogs, sheets, and this panel" },
  { keys: "N", description: "Open Send Money modal (wallet page)" },
] as const;

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Keyboard className="size-4 text-ceyfi-green" aria-hidden />
            Keyboard shortcuts
          </SheetTitle>
          <SheetDescription>
            Global shortcuts work outside text fields. Press Esc to dismiss.
          </SheetDescription>
        </SheetHeader>

        <ul className="space-y-3 px-4 pb-6">
          {SHORTCUTS.map((item) => (
            <li
              key={item.keys}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <span className="text-sm text-foreground dark:text-white/80">
                {item.description}
              </span>
              <kbd className="shrink-0 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs font-semibold text-ceyfi-ink dark:border-white/15 dark:bg-white/10 dark:text-white">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

/** Close the topmost open dialog or sheet overlay. Returns true if something was closed. */
export function closeTopOverlay(): boolean {
  const selectors = [
    '[data-slot="dialog-close"]',
    '[data-slot="sheet-close"]',
  ];

  for (const selector of selectors) {
    const buttons = [...document.querySelectorAll(selector)];
    for (let i = buttons.length - 1; i >= 0; i--) {
      const button = buttons[i];
      if (button instanceof HTMLElement && button.offsetParent !== null) {
        button.click();
        return true;
      }
    }
  }

  return false;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useGlobalKeyboardShortcuts(options: {
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}) {
  const { helpOpen, setHelpOpen } = options;

  return function handleGlobalKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }
      if (closeTopOverlay()) {
        e.preventDefault();
      }
      return;
    }

    if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setHelpOpen(!helpOpen);
    }
  };
}
