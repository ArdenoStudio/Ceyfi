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
import json
import logging
import wave
from functools import lru_cache
from typing import AsyncIterator

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


# ---------------------------------------------------------------------------
# Chat / LLM — lets the whole app (assistant, categorizer, business, loans)
# run on the single Gemini key. groq_client/claude_client prefer these.
# ---------------------------------------------------------------------------

def chat_available() -> bool:
    return bool(settings.gemini_api_key)


def _gen_config(max_tokens: int, temperature: float) -> dict:
    cfg = {"temperature": temperature, "maxOutputTokens": max_tokens}
    # Disable "thinking" on 2.5/3.x models — grounded Q&A doesn't need it and
    # the extra latency/tokens hurt a live demo.
    model = settings.gemini_chat_model
    if "2.5" in model or "3." in model:
        cfg["thinkingConfig"] = {"thinkingBudget": 0}
    return cfg


def _to_gemini_contents(messages: list[dict]) -> list[dict]:
    """Translate OpenAI-style chat messages to Gemini `contents`.

    Handles plain user/assistant turns plus the tool round-trip
    (assistant tool_calls -> functionCall, tool result -> functionResponse).
    The system prompt is passed separately via systemInstruction.
    """
    contents: list[dict] = []
    id_to_name: dict[str, str] = {}
    for m in messages:
        role = m.get("role")
        content = m.get("content")
        if role == "system":
            continue
        if role == "user":
            contents.append({"role": "user", "parts": [{"text": content or ""}]})
        elif role == "assistant":
            tool_calls = m.get("tool_calls")
            if tool_calls:
                parts: list[dict] = []
                if content:
                    parts.append({"text": content})
                for tc in tool_calls:
                    fn = tc.get("function", {})
                    name = fn.get("name", "")
                    try:
                        args = json.loads(fn.get("arguments") or "{}")
                    except (ValueError, TypeError):
                        args = {}
                    if tc.get("id"):
                        id_to_name[tc["id"]] = name
                    parts.append({"functionCall": {"name": name, "args": args}})
                contents.append({"role": "model", "parts": parts})
            else:
                contents.append({"role": "model", "parts": [{"text": content or ""}]})
        elif role == "tool":
            name = m.get("name") or id_to_name.get(m.get("tool_call_id", ""), "tool")
            try:
                response = json.loads(content) if isinstance(content, str) else content
            except (ValueError, TypeError):
                response = {"result": content}
            if not isinstance(response, dict):
                response = {"result": response}
            contents.append(
                {"role": "user", "parts": [{"functionResponse": {"name": name, "response": response}}]}
            )
    return contents


def _extract_text(data: dict) -> str:
    try:
        parts = data["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError, TypeError):
        return ""
    return "".join(p.get("text", "") for p in parts).strip()


_SCHEMA_KEYS = {"type", "description", "enum", "items", "properties", "required", "nullable", "format"}


def _clean_schema(schema):
    """Strip JSON-schema keys Gemini's function-declaration schema rejects."""
    if not isinstance(schema, dict):
        return schema
    out = {}
    for k, v in schema.items():
        if k not in _SCHEMA_KEYS:
            continue
        if k == "type" and isinstance(v, str):
            out[k] = v.upper()
        elif k == "properties" and isinstance(v, dict):
            out[k] = {pk: _clean_schema(pv) for pk, pv in v.items()}
        elif k == "items":
            out[k] = _clean_schema(v)
        else:
            out[k] = v
    return out


def _to_gemini_tools(openai_tools: list[dict]) -> list[dict]:
    decls = []
    for t in openai_tools:
        fn = t.get("function", t)
        decl = {"name": fn["name"]}
        if fn.get("description"):
            decl["description"] = fn["description"]
        if fn.get("parameters"):
            decl["parameters"] = _clean_schema(fn["parameters"])
        decls.append(decl)
    return [{"functionDeclarations": decls}]


class _Fn:
    def __init__(self, name: str, arguments: str):
        self.name = name
        self.arguments = arguments


class _ToolCall:
    def __init__(self, call_id: str, name: str, args: dict):
        self.id = call_id
        self.type = "function"
        self.function = _Fn(name, json.dumps(args))


class _Msg:
    """Duck-types the OpenAI chat message the chat router reads (.content, .tool_calls)."""

    def __init__(self, content: str | None, tool_calls: list):
        self.content = content
        self.tool_calls = tool_calls


async def complete(system_prompt: str, messages: list[dict],
                   max_tokens: int = 512, temperature: float = 0.3) -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": _to_gemini_contents(messages),
        "generationConfig": _gen_config(max_tokens, temperature),
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{_BASE}/models/{settings.gemini_chat_model}:generateContent",
            headers=_headers(), json=body,
        )
    resp.raise_for_status()
    return _extract_text(resp.json())


async def stream_chat(system_prompt: str, messages: list[dict],
                      max_tokens: int = 1024, temperature: float = 0.3) -> AsyncIterator[str]:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": _to_gemini_contents(messages),
        "generationConfig": _gen_config(max_tokens, temperature),
    }
    url = f"{_BASE}/models/{settings.gemini_chat_model}:streamGenerateContent?alt=sse"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream("POST", url, headers=_headers(), json=body) as resp:
            if resp.status_code != 200:
                detail = (await resp.aread())[:200]
                raise RuntimeError(f"Gemini stream {resp.status_code}: {detail!r}")
            async for line in resp.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                payload = line[len("data:"):].strip()
                if not payload or payload == "[DONE]":
                    continue
                try:
                    data = json.loads(payload)
                except ValueError:
                    continue
                try:
                    parts = data["candidates"][0]["content"]["parts"]
                except (KeyError, IndexError, TypeError):
                    continue
                for p in parts:
                    text = p.get("text")
                    if text:
                        yield text


async def complete_with_tools(system_prompt: str, messages: list[dict], tools: list[dict],
                              max_tokens: int = 512, temperature: float = 0.3) -> _Msg:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": _to_gemini_contents(messages),
        "tools": _to_gemini_tools(tools),
        "generationConfig": _gen_config(max_tokens, temperature),
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{_BASE}/models/{settings.gemini_chat_model}:generateContent",
            headers=_headers(), json=body,
        )
    resp.raise_for_status()
    parts = resp.json().get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text_parts, tool_calls = [], []
    for i, p in enumerate(parts):
        if "functionCall" in p:
            fc = p["functionCall"]
            tool_calls.append(_ToolCall(f"call_{i}", fc.get("name", ""), fc.get("args") or {}))
        elif "text" in p:
            text_parts.append(p["text"])
    return _Msg("".join(text_parts).strip() or None, tool_calls)
