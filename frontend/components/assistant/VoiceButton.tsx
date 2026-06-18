"use client";

import { useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/useVoice";
import { Language } from "@/types";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  language: Language;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const MIC_ERROR_LABELS: Record<string, string> = {
  "not-allowed": "Allow mic in browser",
  "service-not-allowed": "Allow mic in browser",
  "audio-capture": "No microphone found",
  "network": "Speech service unreachable — retry on Chrome/Edge HTTPS",
};

export function VoiceButton({ language, onTranscript, disabled }: VoiceButtonProps) {
  const { isListening, transcript, error, supported, start, stop } = useVoice();

  useEffect(() => {
    if (transcript) onTranscript(transcript);
  }, [transcript, onTranscript]);

  if (!supported) return null;

  const lang = language === "si" ? "si-LK" : "en-US";
  const errorLabel = error ? (MIC_ERROR_LABELS[error] ?? "Mic error — click to retry") : null;

  function handleClick() {
    if (isListening) {
      stop();
    } else {
      start(lang);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant={isListening ? "destructive" : "outline"}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative select-none touch-none",
          isListening && "ring-2 ring-red-500/50"
        )}
        title={
          errorLabel
            ? errorLabel
            : isListening
            ? "Listening… click to stop"
            : "Click to speak"
        }
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-ping" />
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {isListening && (
        <span className="text-xs text-red-400 animate-pulse select-none">
          Listening…
        </span>
      )}

      {errorLabel && !isListening && (
        <span className="text-xs text-red-400 select-none cursor-pointer" onClick={handleClick} title="Click to try again">
          {errorLabel}
        </span>
      )}
    </div>
  );
}
