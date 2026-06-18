"""MCP-compatible banking tools HTTP bridge + decision execution."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import auth as auth_service
from app.services import banking_tools
from app.services import business_intelligence

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["banking-tools"])


class ToolCallRequest(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class ExecuteDecisionRequest(BaseModel):
    user_id: str
    decision_id: str


class RecoveryMessageRequest(BaseModel):
    client: str
    invoice: str
    amount: float
    overdue_days: int
    tone: str = "friendly"


@router.get("/mcp/tools")
async def list_mcp_tools():
    """List banking tools (MCP-compatible catalog for Cursor / agents)."""
    return {"tools": banking_tools.TOOL_CATALOG, "protocol": "ceyfi-banking-mcp-v1"}


@router.post("/mcp/call")
async def call_mcp_tool(req: ToolCallRequest):
    result = await banking_tools.execute_banking_tool(req.name, req.arguments)
    try:
        import json

        parsed = json.loads(result)
    except json.JSONDecodeError:
        parsed = result
    return {"name": req.name, "result": parsed}


@router.get("/business/cfo-brief")
async def cfo_brief(user_id: str = "SEY-BIZ-001"):
    return await business_intelligence.build_cfo_brief(user_id)


@router.get("/business/receivables")
async def receivables():
    return {
        "receivables": business_intelligence.list_receivables_with_trust(),
        "predictions": business_intelligence.predict_payment_dates("SEY-BIZ-001"),
    }


@router.post("/business/recovery-message")
async def recovery_message(req: RecoveryMessageRequest):
    messages = await business_intelligence.generate_recovery_messages(
        client=req.client,
        invoice=req.invoice,
        amount=req.amount,
        overdue_days=req.overdue_days,
        tone=req.tone,
    )
    return {"messages": messages, "tone": req.tone}


@router.post("/decisions/execute")
async def execute_decision(req: ExecuteDecisionRequest):
    """Map a ranked decision to a concrete demo action."""
    persona = auth_service.get_persona(req.user_id)
    persona_type = persona["persona"] if persona else "diaspora"

    from app.services.financial_snapshot import build_financial_snapshot

    snap = await build_financial_snapshot(req.user_id, persona_type)
    decision = next((d for d in snap.get("decisions", []) if d["id"] == req.decision_id), None)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    action_type = "redirect"
    redirect = "/assistant"
    message = decision["benefit_label"]

    if req.decision_id == "d7" or "reminder" in decision["title"].lower():
        action_type = "recovery"
        redirect = "/business"
        receivables = business_intelligence.list_receivables_with_trust()
        worst = max(receivables, key=lambda r: r["overdue"], default=receivables[0])
        msgs = await business_intelligence.generate_recovery_messages(
            client=worst["client"],
            invoice=worst["invoice"],
            amount=float(worst["amount"]),
            overdue_days=int(worst["overdue"]),
        )
        return {
            "ok": True,
            "action_type": action_type,
            "redirect": redirect,
            "message": message,
            "recovery_messages": msgs,
            "client": worst["client"],
        }

    if decision["category"] == "Save":
        redirect = "/wallet"
    elif decision["category"] == "Protect" and persona_type == "borrower":
        redirect = "/loans"
    elif persona_type == "sme":
        redirect = "/business"

    log.info("execute decision %s for %s -> %s", req.decision_id, req.user_id, redirect)
    return {
        "ok": True,
        "action_type": action_type,
        "redirect": redirect,
        "message": message,
        "decision": decision,
    }
