"use client";

import { Shield } from "lucide-react";

export function DemoModeBadge() {
  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-800 shadow-sm md:bottom-4"
      role="status"
      aria-label="Demo environment"
    >
      <Shield className="h-3 w-3" aria-hidden />
      Demo environment
    </div>
  );
}
