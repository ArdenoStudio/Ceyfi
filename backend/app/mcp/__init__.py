"""CEYFI Banking MCP — tools, resources, and prompts for agents."""

from app.mcp.handlers import execute_tool
from app.mcp.registry import PROMPT_CATALOG, RESOURCE_CATALOG, TOOL_CATALOG

__all__ = [
    "TOOL_CATALOG",
    "RESOURCE_CATALOG",
    "PROMPT_CATALOG",
    "execute_tool",
]
