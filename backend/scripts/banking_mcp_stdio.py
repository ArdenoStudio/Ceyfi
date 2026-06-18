#!/usr/bin/env python3
"""CEYFI Banking MCP — stdio entrypoint for Cursor and other MCP clients."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.mcp.server import mcp  # noqa: E402


def main() -> None:
    asyncio.run(mcp.run_stdio_async())


if __name__ == "__main__":
    main()
