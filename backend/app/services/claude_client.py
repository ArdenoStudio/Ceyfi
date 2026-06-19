"""Assistant streaming wrapper — routes all inference through Groq."""
import logging
from typing import AsyncIterator

from app.services import groq_client

log = logging.getLogger(__name__)


async def stream_chat(
    system_prompt: str,
    messages: list[dict],
) -> AsyncIterator[tuple[str, str]]:
    """Yield (event_type, content) where event_type is always 'token'."""
    async for token in groq_client.stream_chat(
        system_prompt, messages, max_tokens=1024, temperature=0.3
    ):
        yield ("token", token)
