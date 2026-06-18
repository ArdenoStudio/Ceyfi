"""
HOW TO WIRE seylan_client.py INTO EACH ROUTER
==============================================
Drop these snippets into the relevant routers in backend/routers/.
Each router has a USE_SEYLAN_REAL guard so the feature flag works cleanly.

Env vars for Railway:
  USE_SEYLAN_REAL=true
  SEYLAN_API_BASE=http://34.21.206.87:3000
  SEYLAN_API_KEY=5be33036-59e9-4224-969f-41a1657bd1b7
  SEYLAN_SOURCE_ACCOUNT=064000012548001
"""

# =============================================================================
# backend/routers/mock.py  →  /mock/family-wallet/{accountId}
# =============================================================================

from fastapi import APIRouter
from backend.services import seylan_client
from backend.services.seylan_client import USE_SEYLAN_REAL
import json, pathlib

router = APIRouter()


@router.get("/mock/family-wallet/{account_id}")
async def get_family_wallet(account_id: str):
    if USE_SEYLAN_REAL:
        balance = await seylan_client.get_account_balance(account_id)
        txn_data = await seylan_client.get_account_transactions(account_id, n=20)
        return {
            "account_id": account_id,
            "account_holder": balance["account_holder"],
            "balance_lkr": balance["balance_lkr"],
            "recent_transactions": txn_data["transactions"],
        }
    # fall back to fixture
    fixture = pathlib.Path("backend/fixtures/family_wallet.json")
    return json.loads(fixture.read_text())


# =============================================================================
# backend/routers/wallet.py  →  POST /api/wallet/transfer
# =============================================================================

from pydantic import BaseModel


class TransferRequest(BaseModel):
    source_account: str
    destination_account: str
    destination_bank_code: str | None = None   # None = same-bank (internal)
    amount_lkr: float
    reference: str = "SEY-HUB"


@router.post("/api/wallet/transfer")
async def wallet_transfer(req: TransferRequest):
    if USE_SEYLAN_REAL:
        if req.destination_bank_code:
            # Cross-bank → CEFTS
            result = await seylan_client.cefts_transfer(
                amount=req.amount_lkr,
                destination_account=req.destination_account,
                destination_bank_code=req.destination_bank_code,
                reference=req.reference,
                source_account=req.source_account,
            )
        else:
            # Same-bank → Internal Transfer
            result = await seylan_client.internal_transfer(
                amount=req.amount_lkr,
                destination_account=req.destination_account,
                reference=req.reference,
                source_account=req.source_account,
            )
        return result
    # mock
    return {
        "success": True,
        "transaction_reference": "MOCK-TXN-001",
        "amount_lkr": req.amount_lkr,
    }


# =============================================================================
# backend/routers/business.py  →  /mock/business-account/{userId}
# =============================================================================

@router.get("/mock/business-account/{user_id}")
async def get_business_account(user_id: str):
    # Map user_id → account number (use demo mapping or Supabase lookup)
    account_map = {
        "SEY-BIZ-001": "064000012548001",  # Suresh Silva — update with real biz account
    }
    account_number = account_map.get(user_id, seylan_client.DEFAULT_SOURCE_ACCOUNT)

    if USE_SEYLAN_REAL:
        txn_data = await seylan_client.get_account_transactions(account_number, n=50)
        balance = await seylan_client.get_account_balance(account_number)
        return {
            "user_id": user_id,
            "account_number": account_number,
            "account_holder": balance["account_holder"],
            "balance_lkr": balance["balance_lkr"],
            "recent_transactions": txn_data["transactions"],
        }
    fixture = pathlib.Path("backend/fixtures/business_account.json")
    return json.loads(fixture.read_text())


# =============================================================================
# backend/services/context_builder.py  →  build_context_for_user()
# =============================================================================

async def build_context_for_user(user_id: str, account_number: str) -> str:
    """
    Inject real Seylan data into the Groq system prompt.
    Call this in backend/routers/chat.py before streaming the Groq response.
    """
    if USE_SEYLAN_REAL:
        return await seylan_client.build_account_context(account_number)
    # fall back to fixture-based context
    return "Account data from fixtures (mock mode)."


# =============================================================================
# backend/main.py  →  lifespan for clean HTTP client teardown
# =============================================================================

from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield  # startup
    await seylan_client.close()  # shutdown — release httpx connections


# app = FastAPI(lifespan=lifespan, ...)


# =============================================================================
# backend/routers/mock.py  →  Tax Jar trigger  (POST /mock/tax-jar/trigger)
# =============================================================================

class TaxJarTrigger(BaseModel):
    user_id: str
    amount_lkr: float
    tax_jar_account: str   # the ring-fenced Seylan savings account


@router.post("/mock/tax-jar/trigger")
async def trigger_tax_jar(req: TaxJarTrigger):
    """Auto-save to tax jar when a taxable transaction is detected."""
    if USE_SEYLAN_REAL:
        result = await seylan_client.internal_transfer(
            amount=req.amount_lkr,
            destination_account=req.tax_jar_account,
            reference=f"TAX-JAR-{req.user_id}",
        )
        return result
    return {"success": True, "mock": True, "amount_lkr": req.amount_lkr}
