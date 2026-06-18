"""Tests for backend API routes using FastAPI TestClient."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.asyncio
async def test_account_context_found(client):
    resp = await client.get("/mock/account-context/SEY-USR-001")
    assert resp.status_code == 200
    data = resp.json()
    assert "Nimal" in data.get("name", "")


@pytest.mark.asyncio
async def test_account_context_not_found(client):
    resp = await client.get("/mock/account-context/NONEXISTENT")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_family_wallet(client):
    resp = await client.get("/mock/family-wallet/SEY-ACC-002")
    assert resp.status_code == 200
    data = resp.json()
    assert "buckets" in data
    assert "Kumari" in data.get("account_holder", "")


@pytest.mark.asyncio
async def test_loans_on_track(client):
    resp = await client.get("/mock/loans/SEY-USR-001")
    assert resp.status_code == 200
    data = resp.json()
    loans = data.get("loans", [])
    assert len(loans) > 0
    assert loans[0]["health_score"] == "ON_TRACK"


@pytest.mark.asyncio
async def test_loans_at_risk(client):
    resp = await client.get("/mock/loans/SEY-USR-003")
    assert resp.status_code == 200
    data = resp.json()
    loans = data.get("loans", [])
    assert len(loans) > 0
    assert loans[0]["health_score"] == "AT_RISK"


@pytest.mark.asyncio
async def test_business_account(client):
    resp = await client.get("/mock/business-account/SEY-BIZ-001")
    assert resp.status_code == 200
    data = resp.json()
    assert "transactions" in data
    assert len(data["transactions"]) >= 40


@pytest.mark.asyncio
async def test_pl_summary(client):
    resp = await client.get("/mock/pl-summary/SEY-BIZ-001")
    assert resp.status_code == 200
    data = resp.json()
    assert "revenue_lkr" in data or "current_week" in data


@pytest.mark.asyncio
async def test_sandbox_transfer_accounts(client):
    resp = await client.get("/api/wallet/sandbox-transfer-accounts")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_account"] == "064000012548001"
    assert data["destination_account"] == "001213437904100"


@pytest.mark.asyncio
async def test_wallet_transfer_valid(client):
    resp = await client.post("/api/wallet/transfer", json={
        "sender_account_id": "SEY-USR-001",
        "recipient_account_id": "SEY-ACC-002",
        "amount_lkr": 10000,
        "corridor": "GBPLKR",
        "allocation_rules": [
            {"bucket_id": "school", "pct": 40},
            {"bucket_id": "household", "pct": 40},
            {"bucket_id": "savings", "pct": 20},
        ],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert len(data["buckets_credited"]) == 3
    total = sum(b["amount_lkr"] for b in data["buckets_credited"])
    assert abs(total - 10000) < 0.001


@pytest.mark.asyncio
async def test_wallet_transfer_bucket_parts_sum_to_total(client):
    """Regression: awkward LKR totals must fully credit across buckets (no penny drift)."""
    resp = await client.post("/api/wallet/transfer", json={
        "sender_account_id": "SEY-USR-001",
        "recipient_account_id": "SEY-ACC-002",
        "amount_lkr": 817,
        "corridor": "GBPLKR",
        "allocation_rules": [
            {"bucket_id": "school", "pct": 40},
            {"bucket_id": "household", "pct": 40},
            {"bucket_id": "savings", "pct": 20},
        ],
    })
    assert resp.status_code == 200
    data = resp.json()
    total = sum(b["amount_lkr"] for b in data["buckets_credited"])
    assert abs(total - 817) < 0.001


@pytest.mark.asyncio
async def test_wallet_transfer_invalid_pct(client):
    resp = await client.post("/api/wallet/transfer", json={
        "sender_account_id": "SEY-USR-001",
        "recipient_account_id": "SEY-ACC-002",
        "amount_lkr": 10000,
        "corridor": "GBPLKR",
        "allocation_rules": [
            {"bucket_id": "school", "pct": 40},
            {"bucket_id": "household", "pct": 40},
        ],
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_trigger_spend(client):
    resp = await client.post("/mock/trigger-spend", json={
        "account_id": "SEY-ACC-002",
        "merchant": "Test Store",
        "amount_lkr": 500,
        "bucket_id": "household",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "POSTED"


@pytest.mark.asyncio
async def test_tax_jar_trigger(client):
    resp = await client.post("/mock/tax-jar/trigger", json={
        "user_id": "SEY-BIZ-001",
        "incoming_amount_lkr": 8200,
        "description": "Test",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert data["new_tax_jar_balance_lkr"] == 15070 + 820


@pytest.mark.asyncio
async def test_categorize_transactions(client):
    resp = await client.post("/api/categorize-transactions", json={
        "user_id": "SEY-BIZ-001",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "categorized" in data
    assert len(data["categorized"]) >= 40
    first = data["categorized"][0]
    assert "category_en" in first
    assert "category_si" in first


@pytest.mark.asyncio
async def test_loan_health(client):
    resp = await client.get("/api/loans/SEY-USR-001/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["health_score"] == "ON_TRACK"
    assert "summary" in data


@pytest.mark.asyncio
async def test_wallet_rules_save_and_get(client):
    resp = await client.post("/api/wallet/rules", json={
        "sender_id": "SEY-USR-001",
        "buckets": [
            {"id": "school", "pct": 50},
            {"id": "household", "pct": 30},
            {"id": "savings", "pct": 20},
        ],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "saved"


@pytest.mark.asyncio
async def test_business_insight(client):
    resp = await client.get("/api/business/insight?user_id=SEY-BIZ-001")
    assert resp.status_code == 200
    data = resp.json()
    assert "insight_text" in data


@pytest.mark.asyncio
async def test_admin_seed(client):
    resp = await client.post("/mock/seed")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "seeded"


@pytest.mark.asyncio
async def test_request_id_header(client):
    resp = await client.get("/health")
    assert "x-request-id" in resp.headers
