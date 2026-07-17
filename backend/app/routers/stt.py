import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.services import gemini_client, openai_client

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["stt"])


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    if not gemini_client.stt_available() and not openai_client.is_available():
        raise HTTPException(status_code=503, detail="Speech transcription unavailable.")
    try:
        data = await audio.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty audio payload.")
        if len(data) > settings.max_stt_upload_bytes:
            raise HTTPException(status_code=413, detail="Audio file too large.")
        filename = audio.filename or "speech.webm"

        # Prefer Gemini (one key, rotates its model chain, stronger Sinhala/Tamil).
        if gemini_client.stt_available():
            try:
                text = await gemini_client.transcribe_audio_bytes(data, filename=filename)
                return {"text": text}
            except Exception as exc:
                log.warning("Gemini STT failed (%s); falling back to OpenAI", exc)

        if openai_client.is_available():
            text = await openai_client.transcribe_audio_bytes(data, filename=filename)
            return {"text": text}

        raise HTTPException(status_code=503, detail="Speech transcription unavailable.")
    except HTTPException:
        raise
    except Exception as exc:
        log.error("stt failed: %s", exc)
        raise HTTPException(status_code=502, detail="Speech transcription failed.")
