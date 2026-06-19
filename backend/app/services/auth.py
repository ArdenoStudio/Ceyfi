"""Demo persona authentication — lightweight signed tokens for the CEYFI demo."""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any

from fastapi import Header, HTTPException

from app.config import settings

DEMO_PERSONAS: dict[str, dict[str, Any]] = {
    "SEY-USR-001": {
        "user_id": "SEY-USR-001",
        "name": "Nimal Fernando",
        "persona": "diaspora",
        "tagline": "Diaspora parent · sends money home",
        "wallet_account_id": "SEY-ACC-002",
        "avatar": "/nimal-avatar.jpg",
        "language_preference": "en",
    },
    "SEY-USR-003": {
        "user_id": "SEY-USR-003",
        "name": "Sunil Bandara",
        "persona": "borrower",
        "tagline": "Business borrower · loan clarity",
        "wallet_account_id": None,
        "avatar": "/nimal-avatar.jpg",
        "language_preference": "si",
    },
    "SEY-BIZ-001": {
        "user_id": "SEY-BIZ-001",
        "name": "Suresh Silva",
        "persona": "sme",
        "tagline": "SME owner · Silva Hardware",
        "wallet_account_id": None,
        "avatar": "/nimal-avatar.jpg",
        "language_preference": "en",
    },
}


def _sign(payload: dict[str, Any]) -> str:
    body = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    sig = hmac.new(
        settings.demo_session_secret.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{body}.{sig}"


def _verify(token: str) -> dict[str, Any] | None:
    if "." not in token:
        return None
    body, sig = token.rsplit(".", 1)
    expected = hmac.new(
        settings.demo_session_secret.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return None
    if payload.get("exp", 0) < time.time():
        return None
    user_id = payload.get("user_id")
    if user_id not in DEMO_PERSONAS:
        return None
    return DEMO_PERSONAS[user_id]


def create_session_token(user_id: str) -> str:
    if user_id not in DEMO_PERSONAS:
        raise ValueError(f"Unknown persona: {user_id}")
    payload = {
        "user_id": user_id,
        "exp": int(time.time()) + settings.demo_session_ttl_seconds,
    }
    return _sign(payload)


def get_persona(user_id: str) -> dict[str, Any] | None:
    return DEMO_PERSONAS.get(user_id)


def list_personas() -> list[dict[str, Any]]:
    return list(DEMO_PERSONAS.values())


def resolve_session(authorization: str | None = None) -> dict[str, Any] | None:
    if not authorization:
        return None
    token = authorization.removeprefix("Bearer ").strip()
    return _verify(token)


def require_admin(x_demo_admin_key: str | None = Header(default=None, alias="X-Demo-Admin-Key")) -> None:
    expected = settings.demo_admin_key
    if not expected:
        return
    if not x_demo_admin_key or not hmac.compare_digest(x_demo_admin_key, expected):
        raise HTTPException(status_code=403, detail="Admin key required for this operation")
