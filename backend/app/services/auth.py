"""Demo persona authentication — lightweight signed tokens for the CEYFI demo."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
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

PUBLIC_EXACT_PATHS = frozenset({"/health", "/health/ready"})
PUBLIC_PATH_PREFIXES = (
    "/api/auth/login",
    "/api/auth/personas",
    "/api/payments/webhook",
    "/api/payhere/notify",
)
ADMIN_PATH_PREFIXES = ("/health/deep", "/api/metrics")

_PATH_USER_RE = re.compile(
    r"^/(?:mock/(?:account-context|loans|business-account|pl-summary)|api/financial-snapshot)/([^/?]+)"
)
_PATH_WALLET_RE = re.compile(r"^/mock/family-wallet/([^/?]+)")
_PATH_LOAN_HEALTH_RE = re.compile(r"^/api/loans/([^/?]+)/health")


def is_public_path(path: str) -> bool:
    if path in PUBLIC_EXACT_PATHS:
        return True
    return any(path.startswith(prefix) for prefix in PUBLIC_PATH_PREFIXES)


def requires_admin_path(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in ADMIN_PATH_PREFIXES)


def match_path_resource(path: str) -> tuple[str, str] | None:
    """Return (resource_type, resource_id) when the path names a persona-scoped resource."""
    if m := _PATH_USER_RE.match(path):
        return ("user", m.group(1))
    if m := _PATH_WALLET_RE.match(path):
        return ("wallet", m.group(1))
    if m := _PATH_LOAN_HEALTH_RE.match(path):
        return ("user", m.group(1))
    return None


def ensure_can_access_user(session: dict[str, Any], user_id: str) -> None:
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied for this user")


def ensure_can_access_wallet(session: dict[str, Any], account_id: str) -> None:
    wallet_id = session.get("wallet_account_id")
    if wallet_id != account_id:
        raise HTTPException(status_code=403, detail="Access denied for this wallet")


def authorize_resource(session: dict[str, Any], resource_type: str, resource_id: str) -> None:
    if resource_type == "user":
        ensure_can_access_user(session, resource_id)
    elif resource_type == "wallet":
        ensure_can_access_wallet(session, resource_id)


def _sign(payload: dict[str, Any]) -> str:
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    encoded_body = base64.urlsafe_b64encode(body).rstrip(b"=").decode()
    sig = hmac.new(
        settings.demo_session_secret.encode(),
        encoded_body.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded_body}.{sig}"


def _verify(token: str) -> dict[str, Any] | None:
    if not settings.demo_session_secret:
        return None
    if "." not in token:
        return None
    encoded_body, sig = token.rsplit(".", 1)
    expected = hmac.new(
        settings.demo_session_secret.encode(),
        encoded_body.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None

    try:
        if encoded_body.startswith("{"):
            # Accept sessions issued before tokens became header-safe.
            body = encoded_body
        else:
            padding = "=" * (-len(encoded_body) % 4)
            body = base64.urlsafe_b64decode(encoded_body + padding).decode()
        payload = json.loads(body)
    except (UnicodeDecodeError, ValueError, json.JSONDecodeError):
        return None
    if payload.get("exp", 0) < time.time():
        return None
    user_id = payload.get("user_id")
    if user_id not in DEMO_PERSONAS:
        return None
    return DEMO_PERSONAS[user_id]


def create_session_token(user_id: str) -> str:
    if not settings.demo_session_secret:
        raise ValueError("DEMO_SESSION_SECRET is not configured")
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


def require_session(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not settings.demo_session_secret:
        raise HTTPException(status_code=503, detail="Demo authentication is not configured")
    session = resolve_session(authorization)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return session


def require_admin(x_demo_admin_key: str | None = Header(default=None, alias="X-Demo-Admin-Key")) -> None:
    expected = settings.demo_admin_key
    if not expected:
        raise HTTPException(status_code=503, detail="Admin operations are disabled")
    if not x_demo_admin_key or not hmac.compare_digest(x_demo_admin_key, expected):
        raise HTTPException(status_code=403, detail="Admin key required for this operation")


def assert_user_access(session: dict[str, Any] | None, user_id: str) -> None:
    """Enforce session user matches requested user_id when demo auth is enabled."""
    if not settings.demo_auth_required:
        return
    if session is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    ensure_can_access_user(session, user_id)
