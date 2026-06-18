"""
Payments router -- MPGS Hosted Checkout.

POST /api/payments/session       create checkout session
GET  /api/payments/{order_id}    poll payment status
POST /api/payments/webhook       MPGS result notification
"""
import logging
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.seylan import mpgs
from app.services import supabase_client

log = logging.getLogger(__name__)
router = APIRouter(tags=["payments"])

PurposeType = Literal["remittance", "loan", "tax_jar_inbound", "shop_sale"]

_503_MSG = "Payment gateway not enabled. Set MPGS_ENABLE=true and configure credentials."


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CreateSessionRequest(BaseModel):
    amount_lkr: float = Field(..., gt=0)
    purpose: PurposeType
    description: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class CreateSessionResponse(BaseModel):
    order_id: str
    session_id: str
    checkout_url: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_mpgs() -> None:
    if not settings.mpgs_enable:
        raise HTTPException(status_code=503, detail=_503_MSG)
    if not settings.mpgs_merchant_id or not settings.mpgs_api_password:
        raise HTTPException(status_code=503, detail="MPGS credentials not configured.")


async def _fulfill(order_id: str, purpose: str, amount_lkr: float, metadata: dict) -> None:
    """Run the post-capture business action for each payment purpose."""
    try:
        if purpose == "remittance":
            buckets: list[dict] = metadata.get("buckets", [])
            account_id: str = metadata.get("account_id", "SEY-ACC-002")
            for bucket in buckets:
                pct = bucket.get("pct", 0)
                bucket_amount = round(amount_lkr * pct / 100, 2)
                if bucket_amount > 0:
                    supabase_client.insert_transaction(
                        account_id=account_id,
                        merchant="Remittance (MPGS)",
                        amount_lkr=bucket_amount,
                        bucket_id=bucket.get("id"),
                        bucket_label=bucket.get("label"),
                        source="mpgs",
                        txn_type="credit",
                    )

        elif purpose == "tax_jar_inbound":
            user_id: str = metadata.get("user_id", "SEY-BIZ-001")
            tax_rate = float(metadata.get("tax_rate_pct", 10)) / 100
            tax_amount = round(amount_lkr * tax_rate, 2)
            # Business income transaction
            supabase_client.insert_transaction(
                account_id=user_id,
                merchant="Customer Payment (MPGS)",
                amount_lkr=amount_lkr,
                source="mpgs",
                txn_type="credit",
            )
            # Tax jar savings split
            supabase_client.insert_transaction(
                account_id=metadata.get("tax_account_id", "SEY-SAV-001"),
                merchant="Tax Jar Auto-Split",
                amount_lkr=tax_amount,
                source="mpgs",
                txn_type="credit",
            )
            log.info(
                "MPGS tax_jar_inbound captured order_id=%s amount=%.2f tax_saved=%.2f",
                order_id, amount_lkr, tax_amount,
            )

        elif purpose == "shop_sale":
            biz_id: str = metadata.get("user_id", "SEY-BIZ-001")
            supabase_client.insert_transaction(
                account_id=biz_id,
                merchant=metadata.get("merchant_name", "Shop Sale (MPGS)"),
                amount_lkr=amount_lkr,
                source="mpgs",
                txn_type="credit",
            )

        elif purpose == "loan":
            from app.services import loan_state
            loan_id: str = metadata.get("loan_id", "")
            user_id_loan: str = metadata.get("user_id", "SEY-USR-001")
            updated = loan_state.apply_payment(user_id_loan, loan_id, amount_lkr)
            supabase_client.insert_transaction(
                account_id=user_id_loan,
                merchant="Loan Payment — " + loan_id,
                amount_lkr=amount_lkr,
                source="mpgs",
                txn_type="debit",
            )
            log.info(
                "MPGS loan payment applied loan_id=%s user=%s amount=%.2f "
                "new_outstanding=%.2f health=%s",
                loan_id, user_id_loan, amount_lkr,
                updated.get("outstanding_lkr", 0),
                updated.get("health_score", "?"),
            )

    except Exception as exc:
        log.error("MPGS fulfillment failed order_id=%s purpose=%s: %s", order_id, purpose, exc)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/api/payments/session", response_model=CreateSessionResponse)
async def create_payment_session(body: CreateSessionRequest):
    _require_mpgs()

    order_id = f"SH-{body.purpose.upper()}-{uuid4().hex[:10].upper()}"
    return_url = f"{settings.frontend_base_url}/payments/return?order_id={order_id}"

    try:
        session = await mpgs.create_checkout_session(
            order_id=order_id,
            amount_lkr=body.amount_lkr,
            description=body.description,
            return_url=return_url,
            purpose=body.purpose,
        )
    except RuntimeError as exc:
        msg = str(exc)
        log.error("MPGS session creation failed: %s", msg)
        if "[401]" in msg:
            raise HTTPException(status_code=502, detail="MPGS authentication failed — check MPGS_MERCHANT_ID and MPGS_API_PASSWORD credentials.")
        raise HTTPException(status_code=502, detail=f"MPGS gateway error: {msg}")

    try:
        supabase_client.save_payment({
            "order_id": order_id,
            "session_id": session["session_id"],
            "amount_lkr": body.amount_lkr,
            "currency": "LKR",
            "purpose": body.purpose,
            "description": body.description,
            "status": "PENDING",
            "metadata": body.metadata,
            "gateway_response": session,
        })
    except Exception as exc:
        log.warning("Could not persist payment to Supabase (non-fatal): %s", exc)

    return CreateSessionResponse(
        order_id=order_id,
        session_id=session["session_id"],
        checkout_url=session["checkout_url"],
    )


@router.get("/api/payments/{order_id}")
async def get_payment(order_id: str):
    _require_mpgs()

    try:
        row = supabase_client.get_payment(order_id)
    except Exception:
        row = None

    if row and row.get("status") == "PENDING":
        try:
            gateway = await mpgs.get_order_status(order_id)
            supabase_client.update_payment_status(
                order_id=order_id,
                status=gateway["status"],
                gateway_response=gateway,
            )
            row["status"] = gateway["status"]
            row["gateway_response"] = gateway
        except Exception as exc:
            log.warning("MPGS status refresh failed for %s: %s", order_id, exc)
        return row

    try:
        gateway = await mpgs.get_order_status(order_id)
        return {
            "order_id": order_id,
            "status": gateway["status"],
            "amount_lkr": gateway.get("amount"),
            "currency": gateway.get("currency", "LKR"),
            "gateway_response": gateway,
        }
    except Exception:
        raise HTTPException(status_code=404, detail=f"Payment {order_id} not found.")


@router.post("/api/payments/webhook", status_code=200)
async def mpgs_webhook(payload: dict[str, Any]):
    """
    Receive MPGS payment result notification.
    Always return 200 -- MPGS retries on non-2xx.
    """
    try:
        order_id: str = (
            payload.get("orderId")
            or (payload.get("order") or {}).get("id", "")
        )
        if not order_id:
            log.warning("MPGS webhook missing orderId: %s", payload)
            return {"received": True}

        status: str = payload.get("result") or payload.get("status") or "UNKNOWN"
        transactions: list = payload.get("transaction") or []

        amount_lkr: float = 0.0
        if transactions:
            amount_lkr = float(transactions[0].get("amount", 0))

        supabase_client.update_payment_status(
            order_id=order_id,
            status=status,
            gateway_response=payload,
        )

        if status == "CAPTURED":
            row = supabase_client.get_payment(order_id)
            if row:
                await _fulfill(
                    order_id=order_id,
                    purpose=row.get("purpose", ""),
                    amount_lkr=amount_lkr or float(row.get("amount_lkr", 0)),
                    metadata=row.get("metadata") or {},
                )

        log.info("MPGS webhook processed order_id=%s status=%s", order_id, status)
    except Exception as exc:
        log.error("MPGS webhook handler error: %s", exc, exc_info=True)

    return {"received": True}