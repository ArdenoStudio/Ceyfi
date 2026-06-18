"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { postStt } from "@/lib/api";

interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  supported: boolean;
  start: (lang?: string) => void;
  stop: () => void;
}

const FATAL_MIC_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

/** Errors that should not tear down a press‑and‑hold session; the engine ends and we reconnect. */
const NON_FATAL_SESSION_ERRORS = new Set(["no-speech", "aborted", "network"]);
const MAX_NETWORK_RETRIES = 3;

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      (
        (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition ??
        (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
      ) !== undefined ||
      (typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia)
  );

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionFinalRef = useRef("");
  const sessionActiveRef = useRef(false);
  const langRef = useRef("en-US");
  const restartTimerRef = useRef<number | null>(null);
  const restartAttemptsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sttFallbackActiveRef = useRef(false);

  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
      : null;

  const stop = useCallback(() => {
    sessionActiveRef.current = false;
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const r = recognitionRef.current;
    if (r) {
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      try {
        r.stop();
      } catch {
        try {
          r.abort();
        } catch {
          /* ignore */
        }
      }
      recognitionRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    audioChunksRef.current = [];
    sttFallbackActiveRef.current = false;
    setIsListening(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const clearRestartTimerOnly = () => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  /** Created each render — handlers always read fresh refs/setters. Do not stash in deps. */
  function beginRecognition(lang: string, resetAccumulator: boolean): void {
    if (!SpeechRecognitionCtor) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    langRef.current = lang;

    if (resetAccumulator) {
      sessionFinalRef.current = "";
      setTranscript("");
      restartAttemptsRef.current = 0;
    }

    const prev = recognitionRef.current;
    if (prev) {
      prev.onresult = null;
      prev.onerror = null;
      prev.onend = null;
      try {
        prev.abort();
      } catch {
        try {
          prev.stop();
        } catch {
          /* ignore */
        }
      }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalPart = sessionFinalRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalPart += result[0]?.transcript ?? "";
        } else {
          interim += result[0]?.transcript ?? "";
        }
      }
      sessionFinalRef.current = finalPart;
      setTranscript(finalPart + interim);
      setError(null);
      restartAttemptsRef.current = 0;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;

      if (FATAL_MIC_ERRORS.has(event.error)) {
        sessionActiveRef.current = false;
        clearRestartTimerOnly();
        setError(event.error);
        setIsListening(false);
        recognitionRef.current = null;
        return;
      }

      if (event.error === "network") {
        restartAttemptsRef.current += 1;
        if (restartAttemptsRef.current > MAX_NETWORK_RETRIES) {
          sessionActiveRef.current = false;
          clearRestartTimerOnly();
          setError("network");
          setIsListening(false);
          recognitionRef.current = null;
          if (!sttFallbackActiveRef.current) {
            void beginSttFallback();
          }
          return;
        }
      }

      if (!NON_FATAL_SESSION_ERRORS.has(event.error)) {
        setError(event.error);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!sessionActiveRef.current) {
        setIsListening(false);
        return;
      }
      clearRestartTimerOnly();
      const retryDelayMs = Math.min(1500, 250 * (restartAttemptsRef.current + 1));
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        if (!sessionActiveRef.current || !SpeechRecognitionCtor) return;
        beginRecognition(langRef.current, false);
      }, retryDelayMs);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      if (sessionActiveRef.current && SpeechRecognitionCtor) {
        clearRestartTimerOnly();
        restartAttemptsRef.current += 1;
        const retryDelayMs = Math.min(1500, 250 * (restartAttemptsRef.current + 1));
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          if (!sessionActiveRef.current) return;
          beginRecognition(langRef.current, false);
        }, retryDelayMs);
      } else {
        setIsListening(false);
      }
    }
  }

  async function beginSttFallback(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("network");
      return;
    }
    sttFallbackActiveRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setIsListening(true);
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (blob.size > 0) {
            const res = await postStt(blob);
            if (res.text) {
              setTranscript(res.text);
              setError(null);
            } else {
              setError("network");
            }
          }
        } catch {
          setError("network");
        } finally {
          if (mediaStreamRef.current) {
            for (const track of mediaStreamRef.current.getTracks()) track.stop();
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
          sttFallbackActiveRef.current = false;
          setIsListening(false);
        }
      };
      recorder.start();
    } catch {
      sttFallbackActiveRef.current = false;
      setError("network");
      setIsListening(false);
    }
  }

  function start(lang = "en-US"): void {
    if (sttFallbackActiveRef.current) return;
    if (!SpeechRecognitionCtor) {
      void beginSttFallback();
      return;
    }
    clearRestartTimerOnly();
    sessionActiveRef.current = true;
    setError(null);
    restartAttemptsRef.current = 0;
    beginRecognition(lang, true);
  }

  return { isListening, transcript, error, supported, start, stop };
}
