"""Gemini voice services — text-to-speech and speech-to-text via the
Generative Language REST API.

One Gemini key powers both directions:
  * TTS  — gemini-2.5-flash-preview-tts returns raw PCM (audio/L16;rate=24000),
           which we wrap in a WAV header so browsers can play it directly.
  * STT  — a normal multimodal model (gemini-2.5-flash) transcribes inline audio.

Called from the /api/tts and /api/stt routers, which prefer Gemini when a key
is configured and fall back to ElevenLabs / OpenAI Whisper on any failure.
No extra SDK — httpx is already a dependency.
"""

import base64
import io
import logging
import wave
from functools import lru_cache

import httpx

from app.config import settings

log = logging.getLogger(__name__)

_BASE = "https://generativelanguage.googleapis.com/v1beta"
_TIMEOUT = httpx.Timeout(30.0, connect=10.0)

# Extension -> MIME for the inline audio blob the browser uploads (MediaRecorder
# emits webm by default). Gemini needs an explicit mimeType on inlineData.
_MIME_BY_EXT = {
    "webm": "audio/webm",
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "mpeg": "audio/mpeg",
    "ogg": "audio/ogg",
    "m4a": "audio/mp4",
    "mp4": "audio/mp4",
    "flac": "audio/flac",
}


def tts_available() -> bool:
    return bool(settings.gemini_api_key)


def stt_available() -> bool:
    return bool(settings.gemini_api_key)


def _headers() -> dict[str, str]:
    return {"x-goog-api-key": settings.gemini_api_key, "Content-Type": "application/json"}


def _guess_mime(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return _MIME_BY_EXT.get(ext, "audio/webm")


def _sample_rate(mime: str, default: int = 24000) -> int:
    """Pull the sample rate out of 'audio/L16;codec=pcm;rate=24000'."""
    for part in mime.split(";"):
        part = part.strip()
        if part.startswith("rate="):
            try:
                return int(part.split("=", 1)[1])
            except ValueError:
                break
    return default


def _pcm_to_wav(pcm: bytes, rate: int) -> bytes:
    """Wrap signed 16-bit little-endian mono PCM in a WAV container."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)  # 16-bit
        wav.setframerate(rate)
        wav.writeframes(pcm)
    return buf.getvalue()


@lru_cache(maxsize=64)
def _tts_cached(text: str, voice: str, model: str) -> bytes:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}
            },
        },
    }
    with httpx.Client(timeout=_TIMEOUT) as client:
        resp = client.post(
            f"{_BASE}/models/{model}:generateContent", headers=_headers(), json=body
        )
    resp.raise_for_status()
    inline = resp.json()["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm = base64.b64decode(inline["data"])
    wav = _pcm_to_wav(pcm, _sample_rate(inline.get("mimeType", "")))
    log.info("Gemini TTS: %d bytes WAV via %s/%s", len(wav), model, voice)
    return wav


def text_to_speech(text: str, language: str = "en") -> bytes:
    # Gemini auto-detects language from the text itself; `language` is accepted
    # for signature parity with elevenlabs_client and future voice steering.
    return _tts_cached(text, settings.gemini_tts_voice, settings.gemini_tts_model)


def text_to_speech_b64(text: str, language: str = "en") -> str:
    return base64.b64encode(text_to_speech(text, language)).decode("ascii")


async def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "speech.webm") -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "Transcribe this audio to plain text. The speaker may use "
                            "English, Sinhala, or Tamil. Return only the transcription, "
                            "with no extra words, labels, or commentary."
                        )
                    },
                    {
                        "inlineData": {
                            "mimeType": _guess_mime(filename),
                            "data": base64.b64encode(audio_bytes).decode("ascii"),
                        }
                    },
                ]
            }
        ],
        "generationConfig": {"temperature": 0.0},
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{_BASE}/models/{settings.gemini_stt_model}:generateContent",
            headers=_headers(),
            json=body,
        )
    resp.raise_for_status()
    parts = (
        resp.json().get("candidates", [{}])[0].get("content", {}).get("parts", [])
    )
    return "".join(p.get("text", "") for p in parts).strip()
