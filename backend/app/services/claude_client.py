"""Assistant streaming wrapper.

Primary: OpenAI via app.services.openai_client
Fallback: Groq via app.services.groq_client
"""
import logging
from typing import AsyncIterator

from app.services import groq_client, openai_client

log = logging.getLogger(__name__)


async def stream_chat(
    system_prompt: str,
    messages: list[dict],
) -> AsyncIterator[tuple[str, str]]:
    """Yield (event_type, content) where event_type is always 'token'."""
    if openai_client.is_available():
        try:
            async for token in openai_client.stream_chat(
                system_prompt, messages, max_tokens=1024, temperature=0.3
            ):
                yield ("token", token)
            return
        except Exception as exc:
            log.warning("openai stream failed, falling back to groq: %s", exc)

    async for token in groq_client.stream_chat(
        system_prompt, messages, max_tokens=1024, temperature=0.3
    ):
        yield ("token", token)
