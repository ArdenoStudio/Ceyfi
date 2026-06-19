"""
PayHere payment gateway — Hosted Checkout (sandbox).

POST /api/payhere/checkout   generate hash + checkout params
POST /api/payhere/notify     PayHere server notification webhook
"""
import hashlib
import logging
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.routers.payments import _fulfill
from app.services import supabase_client

log = logging.getLogger(__name__)
router = APIRouter(tags=["payhere"])

PurposeType = Literal["remittance", "loan", "tax_jar_inbound", "shop_sale"]

PAYHERE_SANDBOX_CHECKOUT_URL = "https://sandbox.payhere.lk/pay/checkout"

_STATUS_MAP = {
    "2": "CAPTURED",
    "0": "PENDING",
    "-1": "CANCELLED",
    "-2": "FAILED",
    "-3": "FAILED",
}


class PayHereCheckoutRequest(BaseModel):
    amount_lkr: float = Field(..., gt=0, le=10_000_000)
    purpose: PurposeType
    description: str = Field(..., min_length=1, max_length=500)
    items: str | None = Field(default=None, max_length=500)
    metadata: dict[str, Any] = Field(default_factory=dict)
    notify_url: str | None = Field(default=None, max_length=2048)
    first_name: str = Field(default="CEYFI", max_length=100)
    last_name: str = Field(default="Customer", max_length=100)
    email: str = Field(default="demo@ceyfi.lk", max_length=254)
    phone: str = Field(default="0771234567", max_length=20)
    address: str = Field(default="No.1, Galle Road", max_length=200)
    city: str = Field(default="Colombo", max_length=100)
    country: str = Field(default="Sri Lanka", max_length=100)


class PayHereCheckoutResponse(BaseModel):
    order_id: str
    checkout_url: str
    params: dict[str, str]


def _require_payhere() -> None:
    if not settings.payhere_merchant_id or not settings.payhere_secret:
        raise HTTPException(
            status_code=503,
            detail="PayHere not configured. Set PAYHERE_MERCHANT_ID and PAYHERE_SECRET.",
        )


def _format_amount(amount_lkr: float) -> str:
    return f"{amount_lkr:.2f}"


def _secret_hash(secret: str) -> str:
    return hashlib.md5(secret.encode("utf-8")).hexdigest().upper()


def _checkout_hash(
    merchant_id: str,
    order_id: str,
    amount: str,
    currency: str,
    secret: str,
) -> str:
    payload = merchant_id + order_id + amount + currency + _secret_hash(secret)
    return hashlib.md5(payload.encode("utf-8")).hexdigest().upper()


def _notify_hash(
    merchant_id: str,
    order_id: str,
    amount: str,
    currency: str,
    status_code: str,
    secret: str,
) -> str:
    payload = (
        merchant_id
        + order_id
        + amount
        + currency
        + status_code
        + _secret_hash(secret)
    )
    return hashlib.md5(payload.encode("utf-8")).hexdigest().upper()


def _default_notify_url() -> str:
    base = settings.backend_base_url.rstrip("/")
    return base + "/api/payhere/notify"


@router.post("/api/payhere/checkout", response_model=PayHereCheckoutResponse)
async def create_payhere_checkout(body: PayHereCheckoutRequest):
    _require_payhere()

    order_id = f"PH-{body.purpose.upper()}-{uuid4().hex[:10].upper()}"
    amount = _format_amount(body.amount_lkr)
    currency = "LKR"
    merchant_id = settings.payhere_merchant_id
    items = body.items or body.description
    notify_url = (body.notify_url or _default_notify_url()).strip()

    checkout_hash = _checkout_hash(
        merchant_id, order_id, amount, currency, settings.payhere_secret
    )

    frontend = settings.frontend_base_url.rstrip("/")
    params: dict[str, str] = {
        "merchant_id": merchant_id,
        "return_url": f"{frontend}/payments/return?order_id={order_id}",
        "cancel_url": f"{frontend}/payments/checkout?cancelled=1&order_id={order_id}",
        "notify_url": notify_url,
        "order_id": order_id,
        "items": items,
        "currency": currency,
        "amount": amount,
        "hash": checkout_hash,
        "first_name": body.first_name,
        "last_name": body.last_name,
        "email": body.email,
        "phone": body.phone,
        "address": body.address,
        "city": body.city,
        "country": body.country,
    }

    try:
        supabase_client.save_payment({
            "order_id": order_id,
            "status": "PENDING",
            "gateway_response": {
                "gateway": "payhere",
                "amount_lkr": body.amount_lkr,
                "currency": currency,
                "purpose": body.purpose,
                "description": body.description,
                "metadata": body.metadata,
                "checkout_params": params,
            },
        })
    except Exception as exc:
        log.warning("Could not persist PayHere payment (non-fatal): %s", exc)

    log.info("PayHere checkout created order_id=%s amount=%s", order_id, amount)
    return PayHereCheckoutResponse(
        order_id=order_id,
        checkout_url=PAYHERE_SANDBOX_CHECKOUT_URL,
        params=params,
    )


def _verify_notify_signature(payload: dict[str, str]) -> bool:
    """
    Verify PayHere server notification md5sig.

    Hash formula (PayHere docs):
      MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret).upper()).upper()

    Production: set PAYHERE_STRICT_NOTIFY_HASH=true so invalid signatures skip fulfillment.
    Always return HTTP 200 to the webhook — PayHere retries on non-2xx responses.
    """
    merchant_id = payload.get("merchant_id", "")
    order_id = payload.get("order_id", "")
    payhere_amount = payload.get("payhere_amount", "")
    payhere_currency = payload.get("payhere_currency", "LKR")
    status_code = payload.get("status_code", "")
    md5sig = payload.get("md5sig", "")

    if not settings.payhere_merchant_id or not settings.payhere_secret:
        log.warning("PayHere notify: credentials not configured — skipping hash check (dev only)")
        return True

    if not md5sig:
        log.warning("PayHere notify missing md5sig order_id=%s", order_id)
        return not settings.payhere_strict_notify_hash

    expected = _notify_hash(
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        settings.payhere_secret,
    )
    if md5sig.upper() != expected:
        log.warning(
            "PayHere notify hash mismatch order_id=%s expected=%s got=%s strict=%s",
            order_id,
            expected,
            md5sig,
            settings.payhere_strict_notify_hash,
        )
        return False
    return True


@router.post("/api/payhere/notify", status_code=200)
async def payhere_notify(request: Request):
    """
    Receive PayHere payment notification (application/x-www-form-urlencoded).
    Always return 200 — PayHere retries on non-2xx.
    """
    try:
        form = await request.form()
        payload = {k: str(v) for k, v in form.items()}

        order_id = payload.get("order_id", "")
        if not order_id:
            log.warning("PayHere notify missing order_id: %s", payload)
            return {"received": True, "processed": False}

        if not _verify_notify_signature(payload):
            # PRODUCTION: PAYHERE_STRICT_NOTIFY_HASH=true rejects bad signatures here.
            return {"received": True, "processed": False, "reason": "invalid_signature"}

        status_code = payload.get("status_code", "")
        payhere_amount = payload.get("payhere_amount", "")
        status = _STATUS_MAP.get(status_code, "UNKNOWN")
        amount_lkr = float(payhere_amount) if payhere_amount else 0.0

        supabase_client.update_payment_status(
            order_id=order_id,
            status=status,
            gateway_response={**payload, "gateway": "payhere", "status_code": status_code},
        )

        if status == "CAPTURED":
            row = supabase_client.get_payment(order_id)
            gw = (row or {}).get("gateway_response") or {}
            if isinstance(gw, str):
                import json
                gw = json.loads(gw)
            purpose = gw.get("purpose", "")
            metadata = gw.get("metadata") or {}
            await _fulfill(
                order_id=order_id,
                purpose=purpose,
                amount_lkr=amount_lkr or float(gw.get("amount_lkr", 0)),
                metadata=metadata,
                gateway="payhere",
            )

        log.info(
            "PayHere notify processed order_id=%s status_code=%s status=%s",
            order_id,
            status_code,
            status,
        )
        return {"received": True, "processed": True}
    except Exception as exc:
        log.error("PayHere notify handler error: %s", exc, exc_info=True)

    return {"received": True, "processed": False}
