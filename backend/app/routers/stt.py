import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services import groq_client
from app.config import settings

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["stt"])


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    if not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="Speech transcription unavailable.")
    try:
        data = await audio.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty audio payload.")
        text = await groq_client.transcribe_audio_bytes(data, filename=audio.filename or "speech.webm")
        return {"text": text}
    except HTTPException:
        raise
    except Exception as exc:
        log.error("stt failed: %s", exc)
        raise HTTPException(status_code=502, detail="Speech transcription failed.")
