"""Security, reliability, and validation edge-case tests."""

import hashlib

import pytest
from httpx import AsyncClient, ASGITransport

from app.config import settings
from app.main import app
from payhere import _notify_hash, _secret_hash


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_health_ready(client):
    resp = await client.get("/health/ready")
    assert resp.status_code in (200, 503)
    data = resp.json()
    assert data["status"] in ("ready", "not_ready")
    assert "checks" in data


@pytest.mark.asyncio
async def test_security_headers(client):
    resp = await client.get("/health")
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_request_body_too_large(client):
    resp = await client.post(
        "/api/auth/login",
        content=b"x" * (settings.max_request_body_bytes + 1),
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 413


@pytest.mark.asyncio
async def test_payhere_checkout_validation_negative_amount(client):
    resp = await client.post(
        "/api/payhere/checkout",
        json={
            "amount_lkr": -100,
            "purpose": "remittance",
            "description": "test",
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_payhere_checkout_validation_missing_fields(client):
    resp = await client.post("/api/payhere/checkout", json={"amount_lkr": 1000})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_chat_message_too_long(client):
    resp = await client.post(
        "/api/chat",
        json={
            "user_id": "SEY-USR-001",
            "session_id": "s1",
            "message": "x" * 5000,
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_wallet_transfer_zero_amount(client):
    resp = await client.post(
        "/api/wallet/transfer",
        json={
            "sender_account_id": "SEY-USR-001",
            "recipient_account_id": "SEY-ACC-002",
            "amount_lkr": 0,
            "corridor": "GBPLKR",
            "allocation_rules": [
                {"bucket_id": "school", "pct": 50},
                {"bucket_id": "household", "pct": 50},
            ],
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_payment_order_id_invalid_format(client):
    resp = await client.get("/api/payments/not-valid!")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_account_context_limit_validation(client):
    resp = await client.get("/mock/account-context/SEY-USR-001?limit=0")
    assert resp.status_code == 422

    resp = await client.get("/mock/account-context/SEY-USR-001?limit=101")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_payhere_notify_accepts_valid_hash(client, monkeypatch):
    monkeypatch.setattr(settings, "payhere_merchant_id", "1212345")
    monkeypatch.setattr(settings, "payhere_secret", "test-secret")
    monkeypatch.setattr(settings, "payhere_strict_notify_hash", True)

    merchant_id = "1212345"
    order_id = "PH-TEST-ORDER"
    amount = "1500.00"
    currency = "LKR"
    status_code = "2"
    md5sig = _notify_hash(merchant_id, order_id, amount, currency, status_code, "test-secret")

    resp = await client.post(
        "/api/payhere/notify",
        data={
            "merchant_id": merchant_id,
            "order_id": order_id,
            "payhere_amount": amount,
            "payhere_currency": currency,
            "status_code": status_code,
            "md5sig": md5sig,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["received"] is True


@pytest.mark.asyncio
async def test_payhere_notify_rejects_invalid_hash_when_strict(client, monkeypatch):
    monkeypatch.setattr(settings, "payhere_merchant_id", "1212345")
    monkeypatch.setattr(settings, "payhere_secret", "test-secret")
    monkeypatch.setattr(settings, "payhere_strict_notify_hash", True)

    resp = await client.post(
        "/api/payhere/notify",
        data={
            "merchant_id": "1212345",
            "order_id": "PH-TEST-BAD",
            "payhere_amount": "100.00",
            "payhere_currency": "LKR",
            "status_code": "2",
            "md5sig": "INVALIDHASH",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["received"] is True
    assert body.get("processed") is False
    assert body.get("reason") == "invalid_signature"


def test_notify_hash_formula():
    secret = "my-secret"
    expected_payload = "1212345" + "ORD-1" + "99.00" + "LKR" + "2" + _secret_hash(secret)
    expected = hashlib.md5(expected_payload.encode("utf-8")).hexdigest().upper()
    assert _notify_hash("1212345", "ORD-1", "99.00", "LKR", "2", secret) == expected


def test_default_cors_origins_only_include_live_frontends():
    assert "https://frontend-taupe-three-96.vercel.app" in settings.cors_list
    assert "https://frontend-cookie-cat21s-projects.vercel.app" in settings.cors_list
    assert "https://ceyfi.app" not in settings.cors_list
    assert all("seylan-hub" not in origin for origin in settings.cors_list)


@pytest.mark.asyncio
async def test_mock_routes_require_auth_when_enabled(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    resp = await client.get("/mock/account-context/SEY-USR-001")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_mock_routes_allow_persona_scoped_access(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    ok = await client.get("/mock/account-context/SEY-USR-001", headers=headers)
    assert ok.status_code == 200

    denied = await client.get("/mock/account-context/SEY-BIZ-001", headers=headers)
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_admin_endpoints_disabled_without_key(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_admin_key", "")
    resp = await client.post("/mock/seed")
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_health_deep_requires_admin_key(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    resp = await client.get("/health/deep")
    assert resp.status_code == 403

    resp = await client.get(
        "/health/deep",
        headers={"X-Demo-Admin-Key": "ceyfi-demo-admin"},
    )
    assert resp.status_code == 200
