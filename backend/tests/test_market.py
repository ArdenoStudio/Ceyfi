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
    assert "Diaspora" in data.get("persona_blurb", "")
    assert any(row["symbol"] == "COMB.N0000" for row in data["watchlist"])
    comb = next(r for r in data["watchlist"] if r["symbol"] == "COMB.N0000")
    assert comb["alert_count"] >= 1
    assert comb["activity"] in ("quiet", "active", "noisy")
    assert comb["last_fire"]["id"] == "f-1"
    assert len(data["fires"]) >= 1
    assert data["fires"][0]["id"] == "f-1"


@pytest.mark.asyncio
async def test_market_watchlist_enriched(client):
    resp = await client.get("/api/market/watchlist")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "mock"
    assert len(data["items"]) >= 2
    assert all("activity" in row for row in data["items"])


@pytest.mark.asyncio
async def test_market_alerts_mock(client):
    resp = await client.get("/api/market/alerts")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "mock"
    assert any(a["id"] == "a-comb-above" for a in data["items"])


@pytest.mark.asyncio
async def test_market_fires_and_detail_depth(client):
    fires = await client.get("/api/market/fires")
    assert fires.status_code == 200
    items = fires.json()["items"]
    assert any(f["id"] == "f-1" for f in items)

    detail = await client.get("/api/market/fires/f-1")
    assert detail.status_code == 200
    body = detail.json()
    assert body["fire"]["symbol"] == "COMB.N0000"
    assert body["depth"]["status"] == "still_true"
    assert body["depth"]["threshold"] == 125.0
    assert body["depth"]["last_price"] == 128.5
    assert body["broker_cta"]["label"] == "Open my broker"
    assert "Phase 4" in body["broker_cta"]["hint"]
    assert "not financial advice" in body["nfa"].lower()


@pytest.mark.asyncio
async def test_market_disclosure_fire_includes_filings(client):
    detail = await client.get("/api/market/fires/f-2")
    assert detail.status_code == 200
    body = detail.json()
    assert body["fire"]["type"] == "disclosure"
    assert body["depth"]["status"] == "informational"
    assert len(body["disclosures"]) >= 1
    assert body["disclosures"][0]["brief_status"] == "ready"


@pytest.mark.asyncio
async def test_market_fire_not_found(client):
    resp = await client.get("/api/market/fires/does-not-exist")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_market_symbol_bars_and_path(client):
    bars = await client.get("/api/market/symbols/COMB.N0000/bars?limit=40")
    assert bars.status_code == 200
    body = bars.json()
    assert body["source"] == "mock"
    assert body["candle_ok"] is True
    assert body["count"] == 40
    assert body["bars"][0]["close"] is not None
    assert body["bars"][-1]["close"] == pytest.approx(128.5, rel=0.02)

    path = await client.get(
        "/api/market/symbols/COMB.N0000/path?fire_id=f-1&limit=40"
    )
    assert path.status_code == 200
    pdata = path.json()
    assert pdata["threshold"] == 125.0
    assert any(p.get("is_fire_day") for p in pdata["points"]) or pdata["fire_date"]


@pytest.mark.asyncio
async def test_market_symbol_disclosures(client):
    resp = await client.get("/api/market/symbols/CARS.N0000/disclosures")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "mock"
    assert any("Annual Report" in (d.get("title") or "") for d in data["items"])


@pytest.mark.asyncio
async def test_market_symbol_rejects_bad_ticker(client):
    resp = await client.get("/api/market/symbols/../etc/bars")
    assert resp.status_code in (400, 404, 422)


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

    async def boom(_paths):
        return {p: None for p in _paths}

    monkeypatch.setattr(market_router, "_chime_session_get", boom)
    resp = await client.get("/api/market/watchlist")
    assert resp.status_code == 200
    assert resp.json()["source"] == "mock"


@pytest.mark.asyncio
async def test_market_proxy_maps_chime_events_rules(client, monkeypatch):
    monkeypatch.setattr(market_router, "CHIME_API_BASE", "http://chime.test")

    async def fake_session(paths: list[str]):
        out = {p: None for p in paths}
        for p in paths:
            if "watchlist" in p:
                out[p] = {
                    "items": [
                        {
                            "symbol": "LIVE.N0000",
                            "name": "Live Co",
                            "price": 99.0,
                            "change_pct": 1.0,
                        }
                    ]
                }
            elif p.endswith("/alerts") or "/alerts?" in p:
                out[p] = {
                    "rules": [
                        {
                            "id": 7,
                            "symbol": "LIVE.N0000",
                            "type": "price_above",
                            "threshold": 90.0,
                            "active": True,
                        }
                    ]
                }
            elif "history" in p or "fires" in p:
                out[p] = {
                    "events": [
                        {
                            "id": 99,
                            "rule_id": 7,
                            "symbol": "LIVE.N0000",
                            "type": "price_above",
                            "fired_at": "2026-07-17T12:00:00Z",
                            "message_text": "Trigger: price crossed above 90\nPrice: 99.0",
                            "message_sent": True,
                            "delivery_status": "sent",
                        }
                    ]
                }
        return out

    monkeypatch.setattr(market_router, "_chime_session_get", fake_session)

    overview = await client.get("/api/market/overview")
    assert overview.status_code == 200
    data = overview.json()
    assert data["source"] == "chime"
    assert data["watchlist"][0]["symbol"] == "LIVE.N0000"
    assert data["fires"][0]["id"] == "99"
    assert data["watchlist"][0]["last_fire"]["id"] == "99"
