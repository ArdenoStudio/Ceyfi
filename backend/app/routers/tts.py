import asyncio
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.schemas import TtsRequest, TtsResponse
from app.services import elevenlabs_client, gemini_client
from app.config import settings

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["tts"])


@router.post("/tts")
async def tts(req: TtsRequest):
    duration_ms = max(500, len(req.text) * 60)

    # Prefer Gemini (rotates its model chain internally); fall back to ElevenLabs
    # on any failure so a Gemini outage can't take voice down mid-demo.
    if gemini_client.tts_available():
        try:
            audio = await asyncio.to_thread(
                gemini_client.text_to_speech_b64, req.text, req.language
            )
            return TtsResponse(audio_base64=audio, content_type="audio/wav", duration_ms=duration_ms)
        except Exception as exc:
            log.warning("Gemini TTS failed (%s); falling back to ElevenLabs", exc)

    try:
        audio = await asyncio.to_thread(
            elevenlabs_client.text_to_speech_b64, req.text, req.language
        )
        return TtsResponse(audio_base64=audio, content_type="audio/mpeg", duration_ms=duration_ms)
    except RuntimeError as exc:
        log.warning("TTS not configured: %s", exc)
        return JSONResponse(status_code=503,
                            content={"error": "TTS service unavailable", "detail": str(exc)})
    except Exception as exc:
        log.error("TTS error (voice_id=%s): %s", settings.elevenlabs_voice_id, exc, exc_info=True)
        return JSONResponse(status_code=503,
                            content={"error": "TTS service unavailable", "detail": str(exc)})