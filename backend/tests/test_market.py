"""Market module — mock CSE payloads + optional Chime proxy."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.routers import market as market_router


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_market_overview_mock(client):
    resp = await client.get("/api/market/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "mock"
    assert "not financial advice" in data["nfa"].lower()
    assert any(row["symbol"] == "COMB.N0000" for row in data["watchlist"])
    assert len(data["fires"]) >= 1
    assert data["fires"][0]["id"] == "f-1"


@pytest.mark.asyncio
async def test_market_watchlist_mock(client):
    resp = await client.get("/api/market/watchlist")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "mock"
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_market_alerts_mock(client):
    resp = await client.get("/api/market/alerts")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "mock"
    assert any(a["id"] == "a-comb-above" for a in data["items"])


@pytest.mark.asyncio
async def test_market_fires_and_detail(client):
    fires = await client.get("/api/market/fires")
    assert fires.status_code == 200
    items = fires.json()["items"]
    assert any(f["id"] == "f-1" for f in items)

    detail = await client.get("/api/market/fires/f-1")
    assert detail.status_code == 200
    body = detail.json()
    assert body["fire"]["symbol"] == "COMB.N0000"
    assert body["broker_cta"]["label"] == "Open my broker"
    assert "not place CSE orders" in body["broker_cta"]["hint"]
    assert "not financial advice" in body["nfa"].lower()


@pytest.mark.asyncio
async def test_market_fire_not_found(client):
    resp = await client.get("/api/market/fires/does-not-exist")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_market_requires_auth_when_enabled(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "demo_auth_required", True)
    resp = await client.get("/api/market/overview")
    assert resp.status_code == 401

    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    ok = await client.get(
        "/api/market/overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ok.status_code == 200
    assert ok.json()["source"] == "mock"


@pytest.mark.asyncio
async def test_market_proxy_falls_back_when_chime_down(client, monkeypatch):
    monkeypatch.setattr(market_router, "CHIME_API_BASE", "http://127.0.0.1:9")

    async def boom(_path: str):
        return None

    monkeypatch.setattr(market_router, "_chime_get", boom)
    resp = await client.get("/api/market/watchlist")
    assert resp.status_code == 200
    assert resp.json()["source"] == "mock"


@pytest.mark.asyncio
async def test_market_proxy_uses_chime_payload(client, monkeypatch):
    monkeypatch.setattr(market_router, "CHIME_API_BASE", "http://chime.test")

    async def fake_chime(path: str):
        if "watchlist" in path:
            return {
                "items": [
                    {
                        "symbol": "LIVE.N0000",
                        "name": "Live Co",
                        "price": 99.0,
                        "change_pct": 1.0,
                        "volume": 1,
                    }
                ]
            }
        if "alerts/history" in path or "alerts/fires" in path:
            return {
                "items": [
                    {
                        "id": "live-fire",
                        "symbol": "LIVE.N0000",
                        "type": "price_above",
                        "title": "Live fire",
                        "message": "Demo",
                        "price": 99.0,
                        "fired_at": "2026-07-17T12:00:00Z",
                    }
                ]
            }
        if path.endswith("/alerts") or path.rstrip("/").endswith("/alerts"):
            return {"items": [{"id": "live-a", "symbol": "LIVE.N0000", "type": "price_above"}]}
        return None

    monkeypatch.setattr(market_router, "_chime_get", fake_chime)

    overview = await client.get("/api/market/overview")
    assert overview.status_code == 200
    data = overview.json()
    assert data["source"] == "chime"
    assert data["watchlist"][0]["symbol"] == "LIVE.N0000"
    assert data["fires"][0]["id"] == "live-fire"

    watch = await client.get("/api/market/watchlist")
    assert watch.json()["source"] == "chime"
    assert watch.json()["items"][0]["symbol"] == "LIVE.N0000"
