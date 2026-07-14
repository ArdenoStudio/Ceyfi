"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { Bot } from "lucide-react";

interface AIAdvisorPanelProps {
  userId: string;
}

export function AIAdvisorPanel({ userId }: AIAdvisorPanelProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/loans/advisor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ user_id: userId }),
      signal: AbortSignal.timeout(20000),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load advisor");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setAdvice(data.advisor_text ?? data.advice ?? data.text ?? JSON.stringify(data));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdvice(
            "Unable to reach the loan advisor service. Check that the API is running and NEXT_PUBLIC_API_BASE is set."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <Card className="card-glass shadow-brand border-0">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ceyfi-green/10 dark:bg-ceyfi-green/20">
            <Bot className="h-4 w-4 text-ceyfi-green" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
            What this means
          </h3>
        </div>

        <svg
          viewBox="0 0 200 40"
          className="w-full h-10 mb-3"
          preserveAspectRatio="none"
          aria-label="Projected loan payoff curve showing declining balance over time"
          role="img"
        >
          <polyline
            points="0,35 10,33 20,30 40,28 60,25 80,22 100,20 120,17 140,14 160,10 180,7 200,5"
            fill="none"
            stroke="#059669"
            strokeWidth="2"
          />
          <polyline
            points="0,35 10,33 20,30 40,28 60,25 80,22 100,20 120,17 140,14 160,10 180,7 200,5"
            fill="url(#sparkGradient)"
            stroke="none"
          />
          <defs>
            <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <p className="text-sm text-muted-foreground dark:text-white/50 leading-7 whitespace-pre-wrap">
            {advice}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
