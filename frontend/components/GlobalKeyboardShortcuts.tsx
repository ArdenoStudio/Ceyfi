"use client";

import { useEffect, useState } from "react";
import { HelpPanel, useGlobalKeyboardShortcuts } from "@/components/HelpPanel";

/** Mounts global ? / Esc handlers and the shortcuts help sheet. */
export function GlobalKeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);
  const handleKeyDown = useGlobalKeyboardShortcuts({ helpOpen, setHelpOpen });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />;
}
