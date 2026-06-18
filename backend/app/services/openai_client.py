import logging
from typing import AsyncIterator
from io import BytesIO
from openai import AsyncOpenAI, RateLimitError, APIError
from app.config import settings

log = logging.getLogger(__name__)
_client: AsyncOpenAI | None = None

_PRIMARY_MODEL = "gpt-4o-mini"
_STT_MODEL = "gpt-4o-mini-transcribe"


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


def is_available() -> bool:
    return bool(settings.openai_api_key)


async def stream_chat(
    system_prompt: str,
    messages: list[dict],
    max_tokens: int = 512,
    temperature: float = 0.3,
) -> AsyncIterator[str]:
    msgs = [{"role": "system", "content": system_prompt}] + messages
    stream = await _get_client().chat.completions.create(
        model=_PRIMARY_MODEL,
        messages=msgs,
        max_tokens=max_tokens,
        temperature=temperature,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def complete(
    system_prompt: str,
    messages: list[dict],
    max_tokens: int = 512,
    temperature: float = 0.3,
) -> str:
    msgs = [{"role": "system", "content": system_prompt}] + messages
    resp = await _get_client().chat.completions.create(
        model=_PRIMARY_MODEL,
        messages=msgs,
        max_tokens=max_tokens,
        temperature=temperature,
        stream=False,
    )
    if not resp.choices:
        return ""
    return resp.choices[0].message.content or ""


async def complete_with_tools(
    system_prompt: str,
    messages: list[dict],
    tools: list[dict],
    max_tokens: int = 512,
    temperature: float = 0.3,
):
    """Non-streaming completion with tool calling. Returns the response message object."""
    msgs = [{"role": "system", "content": system_prompt}] + messages
    resp = await _get_client().chat.completions.create(
        model=_PRIMARY_MODEL,
        messages=msgs,
        tools=tools,
        max_tokens=max_tokens,
        temperature=temperature,
        stream=False,
    )
    if not resp.choices:
        raise RuntimeError("OpenAI returned no choices")
    return resp.choices[0].message


async def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "speech.webm") -> str:
    bio = BytesIO(audio_bytes)
    bio.name = filename
    resp = await _get_client().audio.transcriptions.create(
        model=_STT_MODEL,
        file=bio,
    )
    text = getattr(resp, "text", "") or ""
    return text.strip()
