"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypewriterSubtitleProps {
  prompts: string[];
  className?: string;
  typingSpeed?: number;
  pauseMs?: number;
}

export function TypewriterSubtitle({
  prompts,
  className,
  typingSpeed = 38,
  pauseMs = 2400,
}: TypewriterSubtitleProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = prompts[promptIndex] ?? "";
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < current.length) {
      timer = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayed.length === current.length) {
      timer = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && displayed.length > 0) {
      timer = setTimeout(() => {
        setDisplayed(displayed.slice(0, -1));
      }, typingSpeed / 2);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setPromptIndex((i) => (i + 1) % prompts.length);
    }

    return () => clearTimeout(timer);
  }, [displayed, isDeleting, promptIndex, prompts, pauseMs, typingSpeed]);

  return (
    <p className={cn("mt-3 max-w-sm text-sm text-muted-foreground dark:text-white/40", className)}>
      <span className="inline-block min-h-[1.25rem] will-change-transform">
        {displayed}
        <span className="typewriter-cursor ml-0.5 inline-block w-0.5 animate-pulse bg-ceyfi-green align-middle" aria-hidden>
          &nbsp;
        </span>
      </span>
    </p>
  );
}
