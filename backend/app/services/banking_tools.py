"""Banking tool registry — powers MCP HTTP bridge and chat tool extensions."""

from __future__ import annotations

from app.mcp.handlers import execute_banking_tool, execute_tool
from app.mcp.registry import PROMPT_CATALOG, RESOURCE_CATALOG, TOOL_CATALOG

__all__ = [
    "TOOL_CATALOG",
    "RESOURCE_CATALOG",
    "PROMPT_CATALOG",
    "execute_banking_tool",
    "execute_tool",
]
