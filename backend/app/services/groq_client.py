import logging
from typing import AsyncIterator
from groq import AsyncGroq, RateLimitError
from app.config import settings

log = logging.getLogger(__name__)
_client: AsyncGroq | None = None

# Primary model + ordered fallback chain
_PRIMARY_MODEL = "llama-3.3-70b-versatile"
_FALLBACK_MODELS = ["llama-3.1-8b-instant", "gemma2-9b-it"]


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


async def _try_models_stream(msgs: list[dict], max_tokens: int, temperature: float) -> AsyncIterator[str]:
    """Try primary model then fallbacks for streaming, yielding tokens.

    Any failure (not just rate limits — a single model outage, a deprecated
    model, a transient network error) falls through to the next model in the
    chain instead of failing the whole request, since a partial stream can't
    be "retried" from where it stopped.
    """
    last_exc: Exception | None = None
    for model in [_PRIMARY_MODEL] + _FALLBACK_MODELS:
        started = False
        try:
            stream = await _get_client().chat.completions.create(
                model=model,
                messages=msgs,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            )
            if model != _PRIMARY_MODEL:
                log.info("groq: using fallback model %s", model)
            async for chunk in stream:
                started = True
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
            return  # success — stop trying
        except RateLimitError as exc:
            last_exc = exc
            log.warning("groq: rate limit on %s, trying next model", model)
            continue
        except Exception as exc:
            last_exc = exc
            if started:
                # Already streamed partial content to the client — surfacing
                # a second, different model's output now would be incoherent.
                log.error("groq: error on %s after partial stream: %s", model, exc)
                raise
            log.error("groq: error on %s, trying next model: %s", model, exc)
            continue
    raise RuntimeError(f"All Groq models failed: {last_exc}")


async def stream_chat(system_prompt: str, messages: list[dict],
                      max_tokens: int = 512, temperature: float = 0.3) -> AsyncIterator[str]:
    from app.services import openai_client
    if openai_client.is_available():
        try:
            async for token in openai_client.stream_chat(system_prompt, messages, max_tokens, temperature):
                yield token
            return
        except Exception as exc:
            log.warning("openai: stream_chat failed (%s), falling back to Groq", exc)

    msgs = [{"role": "system", "content": system_prompt}] + messages
    async for token in _try_models_stream(msgs, max_tokens, temperature):
        yield token


async def complete(system_prompt: str, messages: list[dict],
                   max_tokens: int = 512, temperature: float = 0.3) -> str:
    from app.services import openai_client
    if openai_client.is_available():
        try:
            return await openai_client.complete(system_prompt, messages, max_tokens, temperature)
        except Exception as exc:
            log.warning("openai: complete failed (%s), falling back to Groq", exc)

    msgs = [{"role": "system", "content": system_prompt}] + messages
    for model in [_PRIMARY_MODEL] + _FALLBACK_MODELS:
        try:
            resp = await _get_client().chat.completions.create(
                model=model,
                messages=msgs,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=False,
            )
            if not resp.choices:
                return ""
            if model != _PRIMARY_MODEL:
                log.info("groq: complete used fallback model %s", model)
            return resp.choices[0].message.content or ""
        except RateLimitError:
            log.warning("groq: rate limit on %s for complete(), trying fallback", model)
            continue
    return "I'm temporarily unavailable due to high demand. Please try again in a moment."


async def stream_chat_model(
    model: str, system_prompt: str, messages: list[dict],
    max_tokens: int = 2048, temperature: float = 0.6,
) -> AsyncIterator[str]:
    """Stream from an explicitly specified Groq model."""
    msgs = [{"role": "system", "content": system_prompt}] + messages
    stream = await _get_client().chat.completions.create(
        model=model, messages=msgs, max_tokens=max_tokens,
        temperature=temperature, stream=True,
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def complete_with_tools(system_prompt: str, messages: list[dict],
                               tools: list[dict], max_tokens: int = 512,
                               temperature: float = 0.3):
    """Non-streaming completion with tool calling support. Returns the full response message."""
    from app.services import openai_client
    if openai_client.is_available():
        try:
            return await openai_client.complete_with_tools(
                system_prompt, messages, tools, max_tokens, temperature
            )
        except Exception as exc:
            log.warning("openai: complete_with_tools failed (%s), falling back to Groq", exc)

    msgs = [{"role": "system", "content": system_prompt}] + messages
    for model in [_PRIMARY_MODEL] + _FALLBACK_MODELS:
        try:
            resp = await _get_client().chat.completions.create(
                model=model,
                messages=msgs,
                tools=tools,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=False,
            )
            if not resp.choices:
                raise RuntimeError("Groq returned no choices")
            return resp.choices[0].message
        except RateLimitError:
            log.warning("groq: rate limit on %s for complete_with_tools(), trying fallback", model)
            continue
    raise RuntimeError("All Groq models are rate-limited for tool calls.")
