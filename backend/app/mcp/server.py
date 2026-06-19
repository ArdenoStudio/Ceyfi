"""CEYFI Banking MCP server — FastMCP (stdio / SSE) with tools, resources, prompts."""

from __future__ import annotations

import json
from typing import Any

try:
    from mcp.server.fastmcp import FastMCP
    _MCP_AVAILABLE = True
except ImportError:
    import logging as _logging
    _logging.getLogger(__name__).warning("mcp package unavailable — MCP stdio server disabled")
    _MCP_AVAILABLE = False

    class _Stub:
        """No-op stand-in when the mcp package is not installed."""
        def resource(self, *_a, **_kw):
            return lambda f: f
        def prompt(self, *_a, **_kw):
            return lambda f: f
        def add_tool(self, *_a, **_kw):
            pass
        def run(self, *_a, **_kw):
            raise RuntimeError("mcp package is not installed")

    FastMCP = _Stub  # type: ignore[assignment,misc]

from app.mcp.handlers import execute_tool, get_prompt, read_resource
from app.mcp.registry import PROMPT_CATALOG, RESOURCE_CATALOG, TOOL_CATALOG

INSTRUCTIONS = """CEYFI Banking MCP — Sri Lankan fintech twin for diaspora, borrowers, and SMEs.
Use list_personas to discover demo users. Prefer read-only tools before financial_action tools.
SME tools (get_cfo_brief, list_receivables) power FlowPilot-style intelligence.
Resources: ceyfi://catalog/personas, ceyfi://user/{user_id}/context, ceyfi://business/receivables."""

mcp = FastMCP(
    "ceyfi-banking",
    instructions=INSTRUCTIONS,
    json_response=True,
) if _MCP_AVAILABLE else FastMCP()


def _make_tool_handler(tool_name: str, tool_desc: str):
    async def handler(arguments: dict[str, Any] | None = None) -> str:
        return await execute_tool(tool_name, arguments or {})

    handler.__name__ = tool_name
    handler.__doc__ = tool_desc
    return handler


def _register_tools() -> None:
    for spec in TOOL_CATALOG:
        tool_name = spec["name"]
        tool_desc = spec["description"]
        mcp.add_tool(
            _make_tool_handler(tool_name, tool_desc),
            name=tool_name,
            description=tool_desc,
        )


@mcp.resource("ceyfi://catalog/personas")
def resource_personas() -> str:
    mime, body = read_resource("ceyfi://catalog/personas")
    return body


@mcp.resource("ceyfi://catalog/tools")
def resource_tools() -> str:
    mime, body = read_resource("ceyfi://catalog/tools")
    return body


@mcp.resource("ceyfi://business/receivables")
def resource_receivables() -> str:
    mime, body = read_resource("ceyfi://business/receivables")
    return body


@mcp.resource("ceyfi://fx/rates")
def resource_fx_rates() -> str:
    mime, body = read_resource("ceyfi://fx/rates")
    return body


@mcp.resource("ceyfi://user/{user_id}/context")
def resource_user_context(user_id: str) -> str:
    mime, body = read_resource(f"ceyfi://user/{user_id}/context")
    return body


@mcp.resource("ceyfi://wallet/{wallet_id}")
def resource_wallet(wallet_id: str) -> str:
    mime, body = read_resource(f"ceyfi://wallet/{wallet_id}")
    return body


@mcp.prompt()
async def cfo_morning_brief(user_id: str = "SEY-BIZ-001") -> str:
    """Generate an SME CFO morning briefing from live CEYFI data."""
    messages = await get_prompt("cfo-morning-brief", {"user_id": user_id})
    return messages[0]["content"]


@mcp.prompt()
async def recovery_collection(
    client: str,
    invoice: str,
    amount: float,
    overdue_days: int,
    tone: str = "friendly",
) -> str:
    """Draft trilingual payment recovery messages for an overdue invoice."""
    messages = await get_prompt(
        "recovery-collection",
        {
            "client": client,
            "invoice": invoice,
            "amount": amount,
            "overdue_days": overdue_days,
            "tone": tone,
        },
    )
    return messages[0]["content"]


@mcp.prompt()
async def loan_health_review(user_id: str) -> str:
    """Analyze loan health and recommend next steps for a borrower."""
    messages = await get_prompt("loan-health-review", {"user_id": user_id})
    return messages[0]["content"]


@mcp.prompt()
async def diaspora_remittance_timing(user_id: str = "SEY-USR-001") -> str:
    """Advise on remittance timing using FX and family wallet context."""
    messages = await get_prompt("diaspora-remittance-timing", {"user_id": user_id})
    return messages[0]["content"]


@mcp.prompt()
async def anomaly_fraud_review(user_id: str) -> str:
    """Review flagged anomalies and suggest protective actions."""
    messages = await get_prompt("anomaly-fraud-review", {"user_id": user_id})
    return messages[0]["content"]


@mcp.prompt()
async def debt_payoff_plan(user_id: str, strategy: str = "avalanche") -> str:
    """Compare avalanche vs snowball payoff strategies."""
    messages = await get_prompt(
        "debt-payoff-plan",
        {"user_id": user_id, "strategy": strategy},
    )
    return messages[0]["content"]


_register_tools()


def catalog_summary() -> dict[str, Any]:
    """HTTP bridge metadata."""
    return {
        "protocol": "ceyfi-banking-mcp-v2",
        "server": "ceyfi-banking",
        "version": "2.0.0",
        "tool_count": len(TOOL_CATALOG),
        "resource_count": len(RESOURCE_CATALOG),
        "prompt_count": len(PROMPT_CATALOG),
        "categories": sorted({t["category"] for t in TOOL_CATALOG}),
    }
