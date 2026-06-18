import base64
import logging
from functools import lru_cache
from elevenlabs import ElevenLabs
from app.config import settings

log = logging.getLogger(__name__)

# eleven_turbo_v2_5 — Creator plan, low-latency, multilingual
_TTS_MODEL = "eleven_turbo_v2_5"
_TTS_MODEL_FALLBACK = "eleven_multilingual_v2"


@lru_cache(maxsize=64)
def _tts_cached(text: str, language: str) -> bytes:
    if not settings.elevenlabs_api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is not set")
    client = ElevenLabs(api_key=settings.elevenlabs_api_key)
    for model_id in [_TTS_MODEL, _TTS_MODEL_FALLBACK]:
        try:
            audio_iter = client.text_to_speech.convert(
                voice_id=settings.elevenlabs_voice_id,
                text=text,
                model_id=model_id,
            )
            audio = b"".join(audio_iter)
            log.info("TTS: generated %d bytes with %s", len(audio), model_id)
            return audio
        except Exception as exc:
            log.warning("TTS model %s failed: %s — trying fallback", model_id, exc)
            continue
    raise RuntimeError("All TTS models failed")


def text_to_speech(text: str, language: str = "en") -> bytes:
    return _tts_cached(text, language)


def text_to_speech_b64(text: str, language: str = "en") -> str:
    return base64.b64encode(text_to_speech(text, language)).decode("ascii")