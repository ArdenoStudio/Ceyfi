"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StatusError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/30">
        <AlertTriangle className="mx-auto mb-3 size-8 text-red-600 dark:text-red-400" />
        <h1 className="text-lg font-semibold text-ceyfi-ink dark:text-white">
          Status page unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load Upptime monitoring data. This is usually a
          temporary network issue.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Retry</Button>
          <Link href="/">
            <Button variant="outline">Back to CEYFI</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
