"""Remittance multi-step tracking for sender visibility."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_wallet_transfer_includes_tracking(client):
    resp = await client.post(
        "/api/wallet/transfer",
        json={
            "sender_account_id": "SEY-USR-001",
            "recipient_account_id": "SEY-ACC-002",
            "amount_lkr": 10000,
            "corridor": "GBPLKR",
            "allocation_rules": [
                {"bucket_id": "school", "pct": 40},
                {"bucket_id": "household", "pct": 40},
                {"bucket_id": "savings", "pct": 20},
            ],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    tracking = data["tracking"]
    assert tracking is not None
    assert tracking["transfer_id"] == data["transfer_id"]
    assert tracking["status"] == "COMPLETED"
    assert [s["id"] for s in tracking["steps"]] == [
        "initiated",
        "corridor",
        "clearing",
        "landed",
    ]
    assert all(s["state"] == "done" for s in tracking["steps"])


@pytest.mark.asyncio
async def test_remittance_demo_track(client):
    resp = await client.get("/api/wallet/remittance/demo/track")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert data["current_step"] == "landed"
    assert len(data["steps"]) == 4


@pytest.mark.asyncio
async def test_remittance_track_by_id_after_transfer(client):
    transfer = await client.post(
        "/api/wallet/transfer",
        json={
            "sender_account_id": "SEY-USR-001",
            "recipient_account_id": "SEY-ACC-002",
            "amount_lkr": 5000,
            "corridor": "USDLKR",
            "allocation_rules": [
                {"bucket_id": "school", "pct": 50},
                {"bucket_id": "household", "pct": 30},
                {"bucket_id": "savings", "pct": 20},
            ],
        },
    )
    transfer_id = transfer.json()["transfer_id"]
    resp = await client.get(f"/api/wallet/remittance/{transfer_id}/track")
    assert resp.status_code == 200
    assert resp.json()["transfer_id"] == transfer_id


@pytest.mark.asyncio
async def test_remittance_track_not_found(client):
    resp = await client.get("/api/wallet/remittance/TRF-MISSING/track")
    assert resp.status_code == 404
