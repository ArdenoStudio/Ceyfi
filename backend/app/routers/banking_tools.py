"""MCP-compatible banking tools HTTP bridge + decision execution."""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.mcp.handlers import execute_tool, get_prompt, read_resource
from app.mcp.registry import PROMPT_CATALOG, RESOURCE_CATALOG, TOOL_CATALOG
from app.mcp.server import catalog_summary
from app.services import auth as auth_service
from app.services.auth import assert_user_access
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
    user_id: str = "SEY-BIZ-001"


class PromptRequest(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


def _assert_tool_user_access(session: dict[str, Any] | None, arguments: dict[str, Any]) -> None:
    """When a tool/prompt names a user_id, require the session to own it."""
    user_id = arguments.get("user_id")
    if user_id:
        assert_user_access(session, str(user_id))


def _require_sme_session(session: dict[str, Any] | None) -> None:
    """SME-only business intelligence endpoints."""
    if not settings.demo_auth_required:
        return
    if session is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    if session.get("persona") != "sme":
        raise HTTPException(status_code=403, detail="Access denied for this resource")


@router.get("/mcp")
async def mcp_info():
    """MCP server metadata and capability summary."""
    return catalog_summary()


@router.get("/mcp/tools")
async def list_mcp_tools():
    """List banking tools (MCP-compatible catalog)."""
    meta = catalog_summary()
    return {**meta, "tools": TOOL_CATALOG}


@router.get("/mcp/resources")
async def list_mcp_resources():
    """List MCP resources."""
    return {"resources": RESOURCE_CATALOG, **catalog_summary()}


@router.get("/mcp/resources/{uri:path}")
async def read_mcp_resource(uri: str, request: Request):
    """Read an MCP resource by URI path (e.g. catalog/personas or ceyfi://catalog/personas)."""
    if uri.startswith("ceyfi://"):
        full_uri = uri
    else:
        path = uri.removeprefix("ceyfi/").lstrip("/")
        full_uri = f"ceyfi://{path}"

    # Block cross-persona user context reads when auth is on.
    if "/user/" in full_uri:
        session = getattr(request.state, "session", None)
        # ceyfi://user/{user_id}/context
        parts = full_uri.removeprefix("ceyfi://").split("/")
        if len(parts) >= 2 and parts[0] == "user":
            assert_user_access(session, parts[1])

    try:
        mime, body = read_resource(full_uri)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        parsed = body
    return {"uri": full_uri, "mimeType": mime, "contents": parsed}


@router.get("/mcp/prompts")
async def list_mcp_prompts():
    """List MCP prompts."""
    return {"prompts": PROMPT_CATALOG, **catalog_summary()}


@router.post("/mcp/prompts/get")
async def get_mcp_prompt(req: PromptRequest, request: Request):
    """Resolve an MCP prompt to message list."""
    session = getattr(request.state, "session", None)
    _assert_tool_user_access(session, req.arguments)
    try:
        messages = await get_prompt(req.name, req.arguments)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"name": req.name, "messages": messages}


@router.post("/mcp/call")
async def call_mcp_tool(req: ToolCallRequest, request: Request):
    session = getattr(request.state, "session", None)
    _assert_tool_user_access(session, req.arguments)
    result = await execute_tool(req.name, req.arguments)
    try:
        parsed = json.loads(result)
    except json.JSONDecodeError:
        parsed = result
    return {"name": req.name, "result": parsed}


@router.get("/business/cfo-brief")
async def cfo_brief(request: Request, user_id: str = "SEY-BIZ-001"):
    session = getattr(request.state, "session", None)
    assert_user_access(session, user_id)
    _require_sme_session(session)
    return await business_intelligence.build_cfo_brief(user_id)


@router.get("/business/receivables")
async def receivables(request: Request):
    session = getattr(request.state, "session", None)
    _require_sme_session(session)
    return {
        "receivables": business_intelligence.list_receivables_with_trust(),
        "predictions": business_intelligence.predict_payment_dates("SEY-BIZ-001"),
    }


@router.post("/business/recovery-message")
async def recovery_message(req: RecoveryMessageRequest, request: Request):
    session = getattr(request.state, "session", None)
    assert_user_access(session, req.user_id)
    _require_sme_session(session)
    messages = await business_intelligence.generate_recovery_messages(
        client=req.client,
        invoice=req.invoice,
        amount=req.amount,
        overdue_days=req.overdue_days,
        tone=req.tone,
    )
    return {"messages": messages, "tone": req.tone}


@router.post("/decisions/execute")
async def execute_decision(req: ExecuteDecisionRequest, request: Request):
    """Map a ranked decision to a concrete demo action."""
    session = getattr(request.state, "session", None)
    assert_user_access(session, req.user_id)

    result = await execute_tool(
        "execute_decision",
        {"user_id": req.user_id, "decision_id": req.decision_id},
    )
    parsed = json.loads(result)
    if not parsed.get("ok"):
        raise HTTPException(status_code=404, detail=parsed.get("error", "Decision not found"))

    persona = auth_service.get_persona(req.user_id)
    persona_type = persona["persona"] if persona else "diaspora"
    log.info(
        "execute decision %s for %s -> %s",
        req.decision_id,
        req.user_id,
        parsed.get("redirect"),
    )
    if parsed.get("action_type") == "recovery":
        return parsed
    if persona_type == "sme" and parsed.get("redirect") == "/business":
        return parsed
    return parsed
