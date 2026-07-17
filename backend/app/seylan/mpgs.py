import logging
from typing import Any
from urllib.parse import quote

import httpx

from app.config import settings

log = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


def _base_url() -> str:
    return "https://" + settings.mpgs_host + "/api/rest/version/" + settings.mpgs_api_version


def _auth() -> tuple[str, str]:
    # If an operator ID is set, use operator-scoped credentials
    # MPGS format: merchant.{MID}.operator.{OPID}  or just  merchant.{MID}
    if settings.mpgs_operator_id:
        username = f"merchant.{settings.mpgs_merchant_id}.operator.{settings.mpgs_operator_id}"
    else:
        username = "merchant." + settings.mpgs_merchant_id
    return (username, settings.mpgs_api_password)


def _checkout_url(session_id: str) -> str:
    base = settings.frontend_base_url.rstrip("/")
    return (
        base
        + "/payments/checkout?session="
        + quote(session_id, safe="")
        + "&merchant="
        + quote(settings.mpgs_merchant_id, safe="")
        + "&version="
        + quote(settings.mpgs_api_version, safe="")
    )


def _format_amount(amount_lkr: float) -> str:
    return f"{amount_lkr:.2f}"


async def create_checkout_session(
    order_id: str,
    amount_lkr: float,
    description: str,
    return_url: str,
    purpose: str,
) -> dict[str, Any]:
    """Create a Hosted Checkout session (two-step for Seylan gateway).

    Step 1: CREATE_CHECKOUT_SESSION — sets interaction + order metadata.
    Step 2: UPDATE_SESSION — sets the order amount (required separately).
    """
    mid = settings.mpgs_merchant_id
    session_url = _base_url() + "/merchant/" + mid + "/session"

    create_payload: dict[str, Any] = {"apiOperation": "CREATE_CHECKOUT_SESSION"}

    log.info("MPGS create_checkout_session order_id=%s amount=%.2f", order_id, amount_lkr)

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(session_url, json=create_payload, auth=_auth())

        if not resp.is_success:
            log.error("MPGS session create error %s: %s", resp.status_code, resp.text)
            raise RuntimeError(
                "MPGS session creation failed [" + str(resp.status_code) + "]: " + resp.text
            )

        data = resp.json()
        session_id: str = data.get("session", {}).get("id", "")
        success_indicator: str = data.get("successIndicator", "")

        update_resp = await client.put(
            session_url + "/" + session_id,
            json={
                "apiOperation": "UPDATE_SESSION",
                "order": {
                    "id": order_id,
                    "amount": _format_amount(amount_lkr),
                    "currency": "LKR",
                },
                "interaction": {
                    "operation": "PURCHASE",
                    "returnUrl": return_url,
                },
            },
            auth=_auth(),
        )

        if not update_resp.is_success:
            log.error("MPGS session update error %s: %s", update_resp.status_code, update_resp.text)
            raise RuntimeError(
                "MPGS session update failed [" + str(update_resp.status_code) + "]: " + update_resp.text
            )

    log.info("MPGS session created session_id=%s", session_id)
    return {
        "session_id": session_id,
        "success_indicator": success_indicator,
        "order_id": order_id,
        "checkout_url": _checkout_url(session_id),
    }


async def get_order_status(order_id: str) -> dict[str, Any]:
    """Query an order from MPGS (GET /order/{order_id})."""
    url = _base_url() + "/merchant/" + settings.mpgs_merchant_id + "/order/" + order_id

    log.info("MPGS get_order_status order_id=%s", order_id)

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(url, auth=_auth())

    if not resp.is_success:
        log.error("MPGS order status error %s: %s", resp.status_code, resp.text)
        raise RuntimeError(
            "MPGS order query failed [" + str(resp.status_code) + "]: " + resp.text
        )

    data = resp.json()
    return {
        "status": data.get("status", "UNKNOWN"),
        "amount": data.get("amount"),
        "currency": data.get("currency", "LKR"),
        "transactions": data.get("transaction", []),
        "last_updated_time": data.get("lastUpdatedTime", ""),
    }
