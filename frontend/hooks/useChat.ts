"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage, Language, PaymentAction } from "@/types";
import { postChat } from "@/lib/api";

export function useChat(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const sessionIdRef = useRef(crypto.randomUUID());
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const send = useCallback(
    async (content: string) => {
      // Detect Sinhala script in the outgoing message so the "Speak in Sinhala"
      // chip (and any typed Sinhala) flips the UI and forces a Sinhala reply,
      // without waiting on the async setLanguage state update.
      const reqLang: Language = /[඀-෿]/.test(content) ? "si" : language;
      if (reqLang !== language) setLanguage(reqLang);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        language: reqLang,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      const aiMsgId = crypto.randomUUID();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        language: reqLang,
      };
      setMessages((prev) => [...prev, aiMsg]);

      const history = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        await postChat(
          {
            user_id: userId,
            session_id: sessionIdRef.current,
            message: content,
            language: reqLang,
            history,
          },
          (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, content: m.content + token } : m
              )
            );
          },
          (errorMessage) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, content: `Sorry, something went wrong: ${errorMessage}` }
                  : m
              )
            );
          },
          (paymentAction) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, payment_action: paymentAction as unknown as PaymentAction }
                  : m
              )
            );
          },
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, thinking: (m.thinking ?? "") + chunk }
                  : m
              )
            );
          }
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content:
                    "I'm having trouble connecting right now. Try again in a moment.",
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [userId, language]
  );

  return { messages, isStreaming, language, setLanguage, send };
}
