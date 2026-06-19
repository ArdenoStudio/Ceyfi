"use client";

import { useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postTts } from "@/lib/api";
import { Language } from "@/types";

interface AudioPlayerProps {
  text: string;
  language: Language;
}

function audioUrlFromBase64(audioBase64: string, contentType: string) {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return URL.createObjectURL(new Blob([bytes], { type: contentType }));
}

export function AudioPlayer({ text, language }: AudioPlayerProps) {
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(true);

  async function handlePlay() {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const audio = await postTts({ text, language });
      const url = audioUrlFromBase64(audio.audio_base64, audio.content_type);
      const element = new Audio(url);
      element.onended = () => URL.revokeObjectURL(url);
      element.onerror = () => URL.revokeObjectURL(url);
      await element.play();
    } catch {
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }

  if (!available) {
    return (
      <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <VolumeX className="h-3.5 w-3.5" />
        Voice unavailable
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={handlePlay}
      disabled={loading || !text.trim()}
      className="mt-2 gap-1 px-0 text-xs text-muted-foreground hover:text-ceyfi-green"
      aria-label="Play assistant response"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      Play
    </Button>
  );
}
