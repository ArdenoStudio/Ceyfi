"""Tests for CEYFI Banking MCP v2."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.mcp.handlers import execute_tool, read_resource
from app.mcp.registry import TOOL_CATALOG


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_mcp_info():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/mcp")
    assert res.status_code == 200
    body = res.json()
    assert body["protocol"] == "ceyfi-banking-mcp-v2"
    assert body["tool_count"] >= 20


@pytest.mark.anyio
async def test_mcp_tools_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/mcp/tools")
    assert res.status_code == 200
    body = res.json()
    names = {t["name"] for t in body["tools"]}
    assert "get_cfo_brief" in names
    assert "list_receivables" in names
    assert "search_transactions" in names
    assert "summarize_debt" in names
    assert "list_personas" in names


@pytest.mark.anyio
async def test_mcp_resources():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/mcp/resources")
        assert res.status_code == 200
        assert len(res.json()["resources"]) >= 4

        res2 = await client.get("/api/mcp/resources/ceyfi/catalog/personas")
        assert res2.status_code == 200
        assert "personas" in res2.json()["contents"]


@pytest.mark.anyio
async def test_mcp_prompts():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/mcp/prompts")
        assert res.status_code == 200
        names = {p["name"] for p in res.json()["prompts"]}
        assert "cfo-morning-brief" in names

        res2 = await client.post(
            "/api/mcp/prompts/get",
            json={"name": "debt-payoff-plan", "arguments": {"user_id": "SEY-USR-003"}},
        )
        assert res2.status_code == 200
        assert len(res2.json()["messages"]) >= 1


@pytest.mark.anyio
async def test_receivables_trust_scores():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/business/receivables")
    assert res.status_code == 200
    rows = res.json()["receivables"]
    assert len(rows) >= 1
    assert "trust_score" in rows[0]


@pytest.mark.anyio
async def test_cfo_brief():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/business/cfo-brief?user_id=SEY-BIZ-001")
    assert res.status_code == 200
    body = res.json()
    assert "summary" in body
    assert body["runway_days"] >= 1


@pytest.mark.anyio
async def test_execute_decision_not_found():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/decisions/execute",
            json={"user_id": "SEY-BIZ-001", "decision_id": "missing"},
        )
    assert res.status_code == 404


@pytest.mark.anyio
async def test_tool_list_personas():
    raw = await execute_tool("list_personas", {})
    import json

    body = json.loads(raw)
    assert len(body["personas"]) == 3


@pytest.mark.anyio
async def test_tool_spending_summary():
    import json

    raw = await execute_tool("get_spending_summary", {"user_id": "SEY-USR-001"})
    body = json.loads(raw)
    assert "total_spend_lkr" in body
    assert "top_merchants" in body


@pytest.mark.anyio
async def test_tool_search_transactions():
    import json

    raw = await execute_tool(
        "search_transactions",
        {"user_id": "SEY-USR-001", "query": "dialog"},
    )
    body = json.loads(raw)
    assert body["count"] >= 1


@pytest.mark.anyio
async def test_resource_read():
    mime, body = read_resource("ceyfi://fx/rates")
    assert mime == "application/json"
    assert "rates" in body


@pytest.mark.anyio
async def test_catalog_has_risk_tiers():
    for tool in TOOL_CATALOG:
        assert "risk" in tool
        assert "category" in tool
