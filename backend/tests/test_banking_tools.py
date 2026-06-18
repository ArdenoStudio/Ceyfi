"""Tests for banking tools and SME intelligence endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_mcp_tools_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/mcp/tools")
    assert res.status_code == 200
    body = res.json()
    assert body["protocol"] == "ceyfi-banking-mcp-v1"
    names = {t["name"] for t in body["tools"]}
    assert "get_cfo_brief" in names
    assert "list_receivables" in names


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
