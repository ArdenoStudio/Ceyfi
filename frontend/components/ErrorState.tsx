"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "We couldn't load this right now",
  message = "Check the demo mode and API connection, then try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-ceyfi-line">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
        <h2 className="mb-1 text-lg font-semibold text-ceyfi-ink">
          {title}
        </h2>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
