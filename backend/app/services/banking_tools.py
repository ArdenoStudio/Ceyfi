"""Banking tool registry — powers MCP HTTP bridge and chat tool extensions."""

from __future__ import annotations

import json
from typing import Any, Awaitable, Callable

from app.services import business_intelligence, chat_tools
from app.services.financial_snapshot import build_financial_snapshot

ToolHandler = Callable[..., Awaitable[str] | str]

TOOL_CATALOG: list[dict[str, Any]] = [
    {
        "name": "get_account_balance",
        "description": "Get savings, current, or loan outstanding balance for a demo user.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "account_type": {
                    "type": "string",
                    "enum": ["savings", "current", "loan_outstanding"],
                },
            },
            "required": ["user_id", "account_type"],
        },
    },
    {
        "name": "get_financial_snapshot",
        "description": "Unified health score, anomalies, decisions, and forecast.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "persona": {"type": "string", "enum": ["diaspora", "borrower", "sme"]},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_recent_transactions",
        "description": "Recent transactions for a user account.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "count": {"type": "integer", "default": 5},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_cfo_brief",
        "description": "Daily SME CFO briefing with prioritized actions.",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "list_receivables",
        "description": "Outstanding receivables with trust scores.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "generate_recovery_message",
        "description": "AI collection messages in English, Sinhala, and Tamil.",
        "parameters": {
            "type": "object",
            "properties": {
                "client": {"type": "string"},
                "invoice": {"type": "string"},
                "amount": {"type": "number"},
                "overdue_days": {"type": "integer"},
                "tone": {"type": "string", "enum": ["friendly", "formal", "urgent"]},
            },
            "required": ["client", "invoice", "amount", "overdue_days"],
        },
    },
    {
        "name": "predict_payment_dates",
        "description": "Forecast when overdue invoices will be paid.",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
]


async def execute_banking_tool(name: str, arguments: dict[str, Any]) -> str:
    if name == "get_account_balance":
        return chat_tools.execute_tool(
            "check_balance",
            {
                "user_id": arguments["user_id"],
                "account_type": arguments["account_type"],
            },
        )
    if name == "get_recent_transactions":
        return chat_tools.execute_tool(
            "get_recent_transactions",
            {
                "user_id": arguments["user_id"],
                "count": arguments.get("count", 5),
            },
        )
    if name == "get_financial_snapshot":
        persona = arguments.get("persona", "diaspora")
        snap = await build_financial_snapshot(arguments["user_id"], persona)
        return json.dumps(snap)
    if name == "get_cfo_brief":
        brief = await business_intelligence.build_cfo_brief(arguments["user_id"])
        return json.dumps(brief)
    if name == "list_receivables":
        return json.dumps(business_intelligence.list_receivables_with_trust())
    if name == "generate_recovery_message":
        msgs = await business_intelligence.generate_recovery_messages(
            client=arguments["client"],
            invoice=arguments["invoice"],
            amount=float(arguments["amount"]),
            overdue_days=int(arguments["overdue_days"]),
            tone=arguments.get("tone", "friendly"),
        )
        return json.dumps(msgs)
    if name == "predict_payment_dates":
        return json.dumps(business_intelligence.predict_payment_dates(arguments["user_id"]))
    return json.dumps({"error": f"Unknown tool: {name}"})
