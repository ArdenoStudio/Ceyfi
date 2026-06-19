"use client";

import { ChatMessage } from "@/types";

interface AssistantStatusAnnouncerProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

/**
 * Screen-reader announcements for assistant thinking / streaming states.
 */
export function AssistantStatusAnnouncer({
  messages,
  isStreaming,
}: AssistantStatusAnnouncerProps) {
  const lastMsg = messages[messages.length - 1];
  const isThinking =
    isStreaming &&
    lastMsg?.role === "assistant" &&
    !lastMsg?.content?.trim();

  let status = "";
  if (isThinking) {
    status = "CEYFI AI is thinking";
  } else if (isStreaming && lastMsg?.role === "assistant") {
    status = "CEYFI AI is responding";
  }

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {status}
    </div>
  );
}
