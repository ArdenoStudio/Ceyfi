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
    assert "https://ceyfi.app" in settings.cors_list
    assert all("cookie-cat21s" not in origin for origin in settings.cors_list)
    assert all("seylan-hub" not in origin for origin in settings.cors_list)


@pytest.mark.asyncio
async def test_cors_headers_on_auth_failure(client, monkeypatch):
    """Browsers mask 401s as CORS failures when error responses omit ACAO."""
    monkeypatch.setattr(settings, "demo_auth_required", True)
    origin = "https://frontend-taupe-three-96.vercel.app"
    resp = await client.get(
        "/mock/pl-summary/SEY-BIZ-001",
        headers={"Origin": origin},
    )
    assert resp.status_code == 401
    assert resp.headers.get("access-control-allow-origin") == origin


@pytest.mark.asyncio
async def test_trigger_spend_denies_cross_persona_wallet(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-BIZ-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/mock/trigger-spend",
        headers=headers,
        json={
            "account_id": "SEY-ACC-002",
            "merchant": "Test",
            "amount_lkr": 500,
            "bucket_id": "household",
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_tax_jar_trigger_denies_cross_user(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/mock/tax-jar/trigger",
        headers=headers,
        json={
            "user_id": "SEY-BIZ-001",
            "incoming_amount_lkr": 8200,
            "description": "Test",
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_wallet_transfer_denies_cross_persona(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-BIZ-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/wallet/transfer",
        headers=headers,
        json={
            "sender_account_id": "SEY-USR-001",
            "recipient_account_id": "SEY-ACC-002",
            "amount_lkr": 10000,
            "corridor": "GBPLKR",
            "allocation_rules": [
                {"bucket_id": "school", "pct": 50},
                {"bucket_id": "household", "pct": 50},
            ],
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_categorize_denies_cross_user(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/categorize-transactions",
        headers=headers,
        json={"user_id": "SEY-BIZ-001", "transaction_ids": ["biz_039"]},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_sandbox_transfer_accounts_hidden_without_live_bank(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    monkeypatch.setattr(settings, "use_seylan_real", False)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/api/wallet/sandbox-transfer-accounts", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["configured"] is False


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


@pytest.mark.asyncio
async def test_demo_loan_payment_denies_cross_user(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/loans/demo-payment",
        headers=headers,
        json={"user_id": "SEY-USR-003", "loan_id": "LN-001", "amount_lkr": 1000},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_loan_advisor_denies_cross_user(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/loans/advisor",
        headers=headers,
        json={"user_id": "SEY-USR-003"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cfo_brief_denies_non_sme(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get(
        "/api/business/cfo-brief?user_id=SEY-BIZ-001",
        headers=headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_decisions_execute_denies_cross_user(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/decisions/execute",
        headers=headers,
        json={"user_id": "SEY-BIZ-001", "decision_id": "anything"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_mcp_call_denies_cross_user(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/api/mcp/call",
        headers=headers,
        json={"name": "get_spending_summary", "arguments": {"user_id": "SEY-BIZ-001"}},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_payhere_checkout_ignores_client_notify_url_and_binds_owner(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_auth_required", True)
    monkeypatch.setattr(settings, "payhere_merchant_id", "1212345")
    monkeypatch.setattr(settings, "payhere_secret", "test-secret")
    monkeypatch.setattr(settings, "backend_base_url", "https://api.ceyfi.test")

    login = await client.post("/api/auth/login", json={"user_id": "SEY-USR-001"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    captured: dict = {}

    def fake_save(payment: dict):
        captured.update(payment)
        return payment

    monkeypatch.setattr("app.services.supabase_client.save_payment", fake_save)
    monkeypatch.setattr("payhere.supabase_client.save_payment", fake_save)

    resp = await client.post(
        "/api/payhere/checkout",
        headers=headers,
        json={
            "amount_lkr": 1500,
            "purpose": "remittance",
            "description": "Home transfer",
            "metadata": {
                "user_id": "SEY-BIZ-001",
                "account_id": "ATTACKER-WALLET",
                "buckets": [{"id": "household", "pct": 100}],
            },
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["params"]["notify_url"] == "https://api.ceyfi.test/api/payhere/notify"
    assert captured.get("metadata", {}).get("user_id") == "SEY-USR-001"
    assert captured.get("metadata", {}).get("account_id") == "SEY-ACC-002"


def test_bind_payment_metadata_strips_client_ownership():
    from app.routers.payments import bind_payment_metadata

    session = {
        "user_id": "SEY-USR-001",
        "wallet_account_id": "SEY-ACC-002",
        "persona": "diaspora",
    }
    meta = bind_payment_metadata(
        session,
        {
            "user_id": "SEY-BIZ-001",
            "account_id": "EVIL",
            "tax_account_id": "EVIL-TAX",
            "buckets": [{"id": "school", "pct": 100}],
            "fx_rate": 400,
        },
        "remittance",
    )
    assert meta["user_id"] == "SEY-USR-001"
    assert meta["account_id"] == "SEY-ACC-002"
    assert "tax_account_id" not in meta or meta.get("tax_account_id") != "EVIL-TAX"
    assert meta["buckets"] == [{"id": "school", "pct": 100}]
    assert meta["fx_rate"] == 400
