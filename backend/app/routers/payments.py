"""
Payments router -- MPGS Hosted Checkout.

POST /api/payments/session       create checkout session
GET  /api/payments/{order_id}    poll payment status
POST /api/payments/webhook       MPGS result notification
"""
import logging
import re
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Path, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.seylan import mpgs
from app.services import supabase_client

log = logging.getLogger(__name__)
router = APIRouter(tags=["payments"])

PurposeType = Literal["remittance", "loan", "tax_jar_inbound", "shop_sale"]

_503_MSG = "Payment gateway not enabled. Set MPGS_ENABLE=true and configure credentials."
_ORDER_ID_RE = re.compile(r"^[A-Z0-9\-]{8,64}$")


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CreateSessionRequest(BaseModel):
    amount_lkr: float = Field(..., gt=0, le=10_000_000)
    purpose: PurposeType
    description: str = Field(..., min_length=1, max_length=500)
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


def _public_payment_view(row: dict[str, Any]) -> dict[str, Any]:
    """Return only client-safe payment fields (no raw gateway payloads)."""
    gw = row.get("gateway_response") or {}
    if isinstance(gw, str):
        import json
        try:
            gw = json.loads(gw)
        except json.JSONDecodeError:
            gw = {}
    amount = row.get("amount_lkr")
    if amount is None and isinstance(gw, dict):
        amount = gw.get("amount_lkr") or gw.get("amount")
    return {
        "order_id": row.get("order_id"),
        "status": row.get("status", "PENDING"),
        "amount_lkr": amount,
        "currency": row.get("currency") or (gw.get("currency") if isinstance(gw, dict) else None) or "LKR",
        "purpose": row.get("purpose") or (gw.get("purpose") if isinstance(gw, dict) else None),
    }


def _assert_payment_owner(row: dict[str, Any], session: dict[str, Any] | None) -> None:
    if session is None:
        return
    meta = row.get("metadata") or {}
    if isinstance(meta, str):
        import json
        try:
            meta = json.loads(meta)
        except json.JSONDecodeError:
            meta = {}
    owner = meta.get("user_id")
    if owner and owner != session["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied for this payment")


async def _fulfill(
    order_id: str,
    purpose: str,
    amount_lkr: float,
    metadata: dict,
    gateway: str = "mpgs",
) -> None:
    """Run the post-capture business action for each payment purpose."""
    label = gateway.upper()
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
                        merchant=f"Remittance ({label})",
                        amount_lkr=bucket_amount,
                        bucket_id=bucket.get("id"),
                        bucket_label=bucket.get("label"),
                        source=gateway,
                        txn_type="credit",
                    )

        elif purpose == "tax_jar_inbound":
            user_id: str = metadata.get("user_id", "SEY-BIZ-001")
            tax_rate = float(metadata.get("tax_rate_pct", 10)) / 100
            tax_amount = round(amount_lkr * tax_rate, 2)
            # Business income transaction
            supabase_client.insert_transaction(
                account_id=user_id,
                merchant=f"Customer Payment ({label})",
                amount_lkr=amount_lkr,
                source=gateway,
                txn_type="credit",
            )
            # Tax jar savings split
            supabase_client.insert_transaction(
                account_id=metadata.get("tax_account_id", "SEY-SAV-001"),
                merchant="Tax Jar Auto-Split",
                amount_lkr=tax_amount,
                source=gateway,
                txn_type="credit",
            )
            log.info(
                "%s tax_jar_inbound captured order_id=%s amount=%.2f tax_saved=%.2f",
                label, order_id, amount_lkr, tax_amount,
            )

        elif purpose == "shop_sale":
            biz_id: str = metadata.get("user_id", "SEY-BIZ-001")
            supabase_client.insert_transaction(
                account_id=biz_id,
                merchant=metadata.get("merchant_name", f"Shop Sale ({label})"),
                amount_lkr=amount_lkr,
                source=gateway,
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
                source=gateway,
                txn_type="debit",
            )
            log.info(
                "%s loan payment applied loan_id=%s user=%s amount=%.2f "
                "new_outstanding=%.2f health=%s",
                label,
                loan_id, user_id_loan, amount_lkr,
                updated.get("outstanding_lkr", 0),
                updated.get("health_score", "?"),
            )

    except Exception as exc:
        log.error("%s fulfillment failed order_id=%s purpose=%s: %s", label, order_id, purpose, exc)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/api/payments/session", response_model=CreateSessionResponse)
async def create_payment_session(body: CreateSessionRequest, request: Request):
    _require_mpgs()
    session = getattr(request.state, "session", None)
    if settings.demo_auth_required and not session:
        raise HTTPException(status_code=401, detail="Authentication required")

    metadata = dict(body.metadata)
    if session:
        metadata["user_id"] = session["user_id"]
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
            "metadata": metadata,
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
async def get_payment(request: Request, order_id: str = Path(..., min_length=8, max_length=64)):
    if not _ORDER_ID_RE.match(order_id):
        raise HTTPException(status_code=422, detail="Invalid order_id format")
    session = getattr(request.state, "session", None)
    if settings.demo_auth_required and not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    row = None
    try:
        row = supabase_client.get_payment(order_id)
    except Exception:
        row = None

    if not row:
        raise HTTPException(status_code=404, detail=f"Payment {order_id} not found.")

    if session:
        _assert_payment_owner(row, session)

    if order_id.startswith("PH-"):
        return _public_payment_view(row)

    _require_mpgs()

    if row.get("status") == "PENDING":
        try:
            gateway = await mpgs.get_order_status(order_id)
            supabase_client.update_payment_status(
                order_id=order_id,
                status=gateway["status"],
                gateway_response=gateway,
            )
            row["status"] = gateway["status"]
        except Exception as exc:
            log.warning("MPGS status refresh failed for %s: %s", order_id, exc)

    return _public_payment_view(row)


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
            verified = status
            if settings.mpgs_webhook_verify and settings.mpgs_enable:
                try:
                    gateway = await mpgs.get_order_status(order_id)
                    verified = gateway.get("status", "UNKNOWN")
                except Exception as exc:
                    log.warning("MPGS webhook verify failed for %s: %s", order_id, exc)
                    return {"received": True, "processed": False, "reason": "verification_failed"}
            if verified != "CAPTURED":
                log.warning(
                    "MPGS webhook rejected: order_id=%s claimed=%s verified=%s",
                    order_id, status, verified,
                )
                return {"received": True, "processed": False, "reason": "status_mismatch"}
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