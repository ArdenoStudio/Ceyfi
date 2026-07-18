"""CSE Market module — Chime-backed (or mock) watchlist + alerts for Ceyfi host UI.

Ceyfi never scrapes cse.lk. When CHIME_API_BASE is set, we proxy Chime's
/api/v1/* with a demo session; otherwise we return deterministic mocks so
the Market UI works in demos offline.
"""

from __future__ import annotations

import hashlib
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Header, HTTPException, Query

from app.config import settings
from app.services.auth import DEMO_PERSONAS, resolve_session

router = APIRouter(prefix="/api/market", tags=["market"])

CHIME_API_BASE = os.getenv("CHIME_API_BASE", "").rstrip("/")
CHIME_DEMO_TELEGRAM_ID = os.getenv("CHIME_DEMO_TELEGRAM_ID", "123456789")
_DEFAULT_DEMO_USER = "SEY-USR-001"

NFA = (
    "Information only — not financial advice. Not an invitation to deal in "
    "securities. Ceyfi is not a stockbroker; place trades with your licensed broker."
)

_PERSONA_BLURB = {
    "SEY-USR-001": "Diaspora lens — CSE names beside remittance cash you already track.",
    "SEY-USR-003": "Borrower lens — a short list so market noise does not drown loan clarity.",
    "SEY-BIZ-001": "SME lens — banks you bank with, watched for context not trading.",
}

# Per-persona demo watchlists (mock mode)
_MOCK_WATCH: dict[str, list[dict[str, Any]]] = {
    "SEY-USR-001": [
        {
            "symbol": "COMB.N0000",
            "name": "Commercial Bank of Ceylon PLC",
            "price": 128.5,
            "change_pct": 1.2,
            "volume": 245_000,
        },
        {
            "symbol": "JKH.N0000",
            "name": "John Keells Holdings PLC",
            "price": 22.4,
            "change_pct": -0.4,
            "volume": 1_120_000,
        },
        {
            "symbol": "CARS.N0000",
            "name": "Carson Cumberbatch PLC",
            "price": 380.0,
            "change_pct": 0.8,
            "volume": 42_000,
        },
    ],
    "SEY-USR-003": [
        {
            "symbol": "DIAL.N0000",
            "name": "Dialog Axiata PLC",
            "price": 11.2,
            "change_pct": 0.0,
            "volume": 890_000,
        },
    ],
    "SEY-BIZ-001": [
        {
            "symbol": "HNB.N0000",
            "name": "Hatton National Bank PLC",
            "price": 210.0,
            "change_pct": -0.7,
            "volume": 156_000,
        },
        {
            "symbol": "SAMP.N0000",
            "name": "Sampath Bank PLC",
            "price": 78.5,
            "change_pct": 0.3,
            "volume": 98_000,
        },
    ],
}

_MOCK_ALERTS: dict[str, list[dict[str, Any]]] = {
    "SEY-USR-001": [
        {
            "id": "a-comb-above",
            "symbol": "COMB.N0000",
            "type": "price_above",
            "threshold": 125.0,
            "active": True,
            "created_at": "2026-07-10T04:00:00Z",
        },
        {
            "id": "a-jkh-move",
            "symbol": "JKH.N0000",
            "type": "daily_move",
            "threshold": 3.0,
            "active": True,
            "created_at": "2026-07-12T04:00:00Z",
        },
        {
            "id": "a-cars-disc",
            "symbol": "CARS.N0000",
            "type": "disclosure",
            "threshold": None,
            "active": True,
            "created_at": "2026-07-14T04:00:00Z",
        },
    ],
    "SEY-USR-003": [
        {
            "id": "a-dial-below",
            "symbol": "DIAL.N0000",
            "type": "price_below",
            "threshold": 10.5,
            "active": True,
            "created_at": "2026-07-11T04:00:00Z",
        },
    ],
    "SEY-BIZ-001": [
        {
            "id": "a-hnb-above",
            "symbol": "HNB.N0000",
            "type": "price_above",
            "threshold": 220.0,
            "active": True,
            "created_at": "2026-07-09T04:00:00Z",
        },
    ],
}

_MOCK_FIRES: dict[str, list[dict[str, Any]]] = {
    "SEY-USR-001": [
        {
            "id": "f-1",
            "alert_id": "a-comb-above",
            "symbol": "COMB.N0000",
            "type": "price_above",
            "title": "COMB crossed above LKR 125",
            "message": "COMB.N0000 last 128.50 — above your 125 alert. Not financial advice.",
            "price": 128.5,
            "fired_at": "2026-07-17T05:12:00Z",
            "delivery_status": "sent",
        },
        {
            "id": "f-2",
            "alert_id": "a-cars-disc",
            "symbol": "CARS.N0000",
            "type": "disclosure",
            "title": "New disclosure on CARS",
            "message": "Annual report filing detected for CARS.N0000. Review on CSE — not advice.",
            "price": 380.0,
            "fired_at": "2026-07-16T09:40:00Z",
            "delivery_status": "sent",
        },
    ],
    "SEY-USR-003": [],
    "SEY-BIZ-001": [
        {
            "id": "f-3",
            "alert_id": "a-hnb-above",
            "symbol": "HNB.N0000",
            "type": "price_above",
            "title": "HNB near your alert level",
            "message": "HNB.N0000 last 210.00 — watching for 220. Demo fire. Not advice.",
            "price": 210.0,
            "fired_at": "2026-07-15T06:00:00Z",
            "delivery_status": "sent",
        },
    ],
}

_MOCK_DISCLOSURES: dict[str, list[dict[str, Any]]] = {
    "CARS.N0000": [
        {
            "id": "d-cars-1",
            "title": "Annual Report 2025/26",
            "category": "Financial Report",
            "published_at": "2026-07-16T09:30:00Z",
            "pdf_url": None,
            "url": "https://www.cse.lk/",
            "brief": (
                "Demo brief — group revenue and profit commentary extracted from the "
                "filing PDF by Chime. Research only; not advice."
            ),
            "brief_status": "ready",
        }
    ],
    "COMB.N0000": [
        {
            "id": "d-comb-1",
            "title": "Interim Financial Statements — Q1",
            "category": "Financial Report",
            "published_at": "2026-07-08T04:00:00Z",
            "pdf_url": None,
            "url": "https://www.cse.lk/",
            "brief": "Demo brief — net interest income steady; capital ratios solid. Not advice.",
            "brief_status": "ready",
        }
    ],
    "JKH.N0000": [
        {
            "id": "d-jkh-1",
            "title": "Corporate Disclosure — Segment Update",
            "category": "Announcement",
            "published_at": "2026-07-05T06:00:00Z",
            "pdf_url": None,
            "url": "https://www.cse.lk/",
            "brief": None,
            "brief_status": "pending",
        }
    ],
    "HNB.N0000": [
        {
            "id": "d-hnb-1",
            "title": "Basel III Capital Disclosure",
            "category": "Financial Report",
            "published_at": "2026-07-01T04:00:00Z",
            "pdf_url": None,
            "url": "https://www.cse.lk/",
            "brief": "Demo brief — CET1 above regulatory minimum. Not advice.",
            "brief_status": "ready",
        }
    ],
    "DIAL.N0000": [
        {
            "id": "d-dial-1",
            "title": "Subscriber & ARPU Update",
            "category": "Announcement",
            "published_at": "2026-07-03T05:00:00Z",
            "pdf_url": None,
            "url": "https://www.cse.lk/",
            "brief": "Demo brief — mobile data traffic growth. Not advice.",
            "brief_status": "ready",
        }
    ],
    "SAMP.N0000": [
        {
            "id": "d-samp-1",
            "title": "Unaudited Interim Results",
            "category": "Financial Report",
            "published_at": "2026-07-02T04:00:00Z",
            "pdf_url": None,
            "url": "https://www.cse.lk/",
            "brief": "Demo brief — loans and advances growth moderated. Not advice.",
            "brief_status": "ready",
        }
    ],
}

_SYMBOL_RE = re.compile(r"^[A-Z0-9]{1,12}\.(N|X)0000$", re.I)


def _user_from_auth(authorization: str | None) -> str:
    """Resolve persona from Bearer session; default demo user when auth is off."""
    session = resolve_session(authorization)
    if session:
        uid = session.get("user_id")
        if not uid or uid not in DEMO_PERSONAS:
            raise HTTPException(status_code=401, detail="Unknown persona")
        return str(uid)
    if settings.demo_auth_required:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _DEFAULT_DEMO_USER


def _unwrap_list(payload: Any, *keys: str) -> list[Any] | None:
    """Normalize Chime shapes: items | events | rules | bars | list."""
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return None
    for key in keys:
        if key in payload and isinstance(payload[key], list):
            return list(payload[key])
    return None


def _normalize_fire(raw: dict[str, Any]) -> dict[str, Any]:
    """Map Chime history events into Ceyfi fire shape."""
    msg = raw.get("message") or raw.get("message_text") or ""
    title = raw.get("title")
    if not title and msg:
        title = str(msg).split("\n", 1)[0][:120]
    price = raw.get("price")
    if price is None and isinstance(msg, str):
        m = re.search(r"(?:Price|last)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)", msg, re.I)
        if m:
            price = float(m.group(1))
    return {
        "id": str(raw.get("id")),
        "alert_id": str(raw["rule_id"]) if raw.get("rule_id") is not None else raw.get("alert_id"),
        "symbol": raw.get("symbol") or "",
        "type": raw.get("type") or "unknown",
        "title": title,
        "message": msg,
        "price": price,
        "fired_at": raw.get("fired_at"),
        "delivery_status": raw.get("delivery_status") or ("sent" if raw.get("message_sent") else None),
    }


def _normalize_alert(raw: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(raw.get("id")),
        "symbol": raw.get("symbol") or "",
        "type": raw.get("type") or "unknown",
        "threshold": raw.get("threshold"),
        "active": bool(raw.get("active", True)),
        "created_at": raw.get("created_at"),
    }


def _seed_unit(symbol: str, i: int) -> float:
    h = hashlib.sha256(f"{symbol}:{i}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def _mock_daily_bars(symbol: str, last_price: float, limit: int = 60) -> list[dict[str, Any]]:
    """Deterministic synthetic OHLC path ending near last_price (demo offline)."""
    limit = max(5, min(limit, 260))
    # Walk backwards from last_price with mild noise.
    closes: list[float] = [float(last_price)]
    for i in range(1, limit):
        u = _seed_unit(symbol, i)
        shock = (u - 0.5) * 0.028
        prev = closes[-1]
        closes.append(max(0.5, prev * (1.0 - shock)))
    closes.reverse()
    # Drift so the final close matches last_price exactly.
    scale = last_price / closes[-1] if closes[-1] else 1.0
    closes = [c * scale for c in closes]

    start = datetime(2026, 7, 17, tzinfo=timezone.utc) - timedelta(days=limit - 1)
    bars: list[dict[str, Any]] = []
    for i, close in enumerate(closes):
        u = _seed_unit(symbol, 1000 + i)
        open_p = close * (1.0 + (u - 0.5) * 0.012)
        high = max(open_p, close) * (1.0 + u * 0.008)
        low = min(open_p, close) * (1.0 - (1.0 - u) * 0.008)
        vol = int(40_000 + u * 900_000)
        day = start + timedelta(days=i)
        # Skip weekends for a slightly more market-like series
        if day.weekday() >= 5:
            day = day - timedelta(days=2)
        bars.append(
            {
                "trade_date": day.date().isoformat(),
                "open": round(open_p, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
                "volume": vol,
            }
        )
    return bars


def _lookup_price(symbol: str, uid: str) -> float:
    for row in _MOCK_WATCH.get(uid, []):
        if row["symbol"] == symbol:
            return float(row["price"])
    for rows in _MOCK_WATCH.values():
        for row in rows:
            if row["symbol"] == symbol:
                return float(row["price"])
    return 100.0


def _activity_badge(alert_count: int, fires_30d: int) -> str:
    if alert_count == 0 and fires_30d == 0:
        return "quiet"
    if fires_30d >= 3 or alert_count >= 3:
        return "noisy"
    return "active"


def _enrich_watch_row(
    row: dict[str, Any],
    alerts: list[dict[str, Any]],
    fires: list[dict[str, Any]],
) -> dict[str, Any]:
    sym = row.get("symbol") or ""
    sym_alerts = [a for a in alerts if a.get("symbol") == sym and a.get("active", True)]
    sym_fires = sorted(
        [f for f in fires if f.get("symbol") == sym],
        key=lambda f: str(f.get("fired_at") or ""),
        reverse=True,
    )
    last = sym_fires[0] if sym_fires else None
    out = dict(row)
    out["alert_count"] = len(sym_alerts)
    out["fire_count"] = len(sym_fires)
    out["last_fire"] = (
        {
            "id": last.get("id"),
            "type": last.get("type"),
            "fired_at": last.get("fired_at"),
            "title": last.get("title"),
        }
        if last
        else None
    )
    out["activity"] = _activity_badge(len(sym_alerts), len(sym_fires))
    return out


def _fire_status(fire: dict[str, Any], threshold: float | None, last_price: float | None) -> dict[str, Any]:
    ftype = str(fire.get("type") or "")
    fired_at = fire.get("fired_at")
    hours_ago: float | None = None
    if isinstance(fired_at, str) and fired_at:
        try:
            ts = datetime.fromisoformat(fired_at.replace("Z", "+00:00"))
            hours_ago = max(0.0, (datetime.now(timezone.utc) - ts).total_seconds() / 3600.0)
        except ValueError:
            hours_ago = None

    status = "informational"
    reason = "Event recorded — review the filing or move; not a trade cue."
    if ftype == "price_above" and threshold is not None and last_price is not None:
        if last_price >= threshold:
            status = "still_true"
            reason = f"Last {last_price:.2f} is still at/above your {threshold:.2f} alert."
        else:
            status = "cooled_off"
            reason = f"Last {last_price:.2f} has moved back below your {threshold:.2f} alert."
    elif ftype == "price_below" and threshold is not None and last_price is not None:
        if last_price <= threshold:
            status = "still_true"
            reason = f"Last {last_price:.2f} is still at/below your {threshold:.2f} alert."
        else:
            status = "cooled_off"
            reason = f"Last {last_price:.2f} has moved back above your {threshold:.2f} alert."
    elif ftype == "daily_move":
        status = "informational"
        reason = "Daily-move pings are session events — they do not stay 'armed' overnight."
    elif ftype == "disclosure":
        status = "informational"
        reason = "Disclosure fire — read the filing brief; price may not have moved."

    return {
        "status": status,
        "reason": reason,
        "hours_ago": round(hours_ago, 1) if hours_ago is not None else None,
        "threshold": threshold,
        "last_price": last_price,
        "gap_to_threshold": (
            round(last_price - threshold, 2)
            if threshold is not None and last_price is not None
            else None
        ),
    }


async def _chime_session_get(paths: list[str]) -> dict[str, Any | None]:
    """One demo login, many GETs. Missing paths map to None."""
    out: dict[str, Any | None] = {p: None for p in paths}
    if not CHIME_API_BASE:
        return out
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            login = await client.post(
                f"{CHIME_API_BASE}/api/v1/auth/demo",
                json={"telegram_id": int(CHIME_DEMO_TELEGRAM_ID)},
            )
            if login.status_code >= 400:
                return out
            cookies = login.cookies
            for path in paths:
                try:
                    res = await client.get(f"{CHIME_API_BASE}{path}", cookies=cookies)
                    if res.status_code < 400:
                        out[path] = res.json()
                except Exception:
                    out[path] = None
    except Exception:
        return out
    return out


async def _chime_get(path: str) -> Any | None:
    return (await _chime_session_get([path])).get(path)


async def _load_alerts_fires_watch(
    uid: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], str]:
    """Return (watch, alerts, fires, source)."""
    watch = list(_MOCK_WATCH.get(uid, []))
    alerts = list(_MOCK_ALERTS.get(uid, []))
    fires = list(_MOCK_FIRES.get(uid, []))
    source = "mock"

    if not CHIME_API_BASE:
        return watch, alerts, fires, source

    bundle = await _chime_session_get(
        [
            "/api/v1/watchlist",
            "/api/v1/alerts",
            "/api/v1/alerts/history?limit=50",
        ]
    )
    live_watch = _unwrap_list(bundle.get("/api/v1/watchlist"), "items")
    live_alerts = _unwrap_list(bundle.get("/api/v1/alerts"), "rules", "items")
    live_fires = _unwrap_list(bundle.get("/api/v1/alerts/history?limit=50"), "events", "items")
    if live_fires is None:
        alt = await _chime_get("/api/v1/alerts/fires?limit=50")
        live_fires = _unwrap_list(alt, "events", "items")

    if live_watch is not None:
        watch = [w for w in live_watch if isinstance(w, dict)]
        source = "chime"
    if live_alerts is not None:
        alerts = [_normalize_alert(a) for a in live_alerts if isinstance(a, dict)]
        source = "chime"
    if live_fires is not None:
        fires = [_normalize_fire(f) for f in live_fires if isinstance(f, dict)]
        source = "chime"

    return watch, alerts, fires, source


@router.get("/overview")
async def market_overview(authorization: str | None = Header(default=None)):
    uid = _user_from_auth(authorization)
    watch, alerts, fires, source = await _load_alerts_fires_watch(uid)
    enriched = [_enrich_watch_row(w, alerts, fires) for w in watch]
    return {
        "source": source,
        "nfa": NFA,
        "persona_blurb": _PERSONA_BLURB.get(uid, ""),
        "watchlist": enriched,
        "alerts": alerts,
        "fires": fires[:5],
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/watchlist")
async def market_watchlist(authorization: str | None = Header(default=None)):
    uid = _user_from_auth(authorization)
    watch, alerts, fires, source = await _load_alerts_fires_watch(uid)
    items = [_enrich_watch_row(w, alerts, fires) for w in watch]
    return {
        "source": source,
        "nfa": NFA,
        "persona_blurb": _PERSONA_BLURB.get(uid, ""),
        "items": items,
    }


@router.get("/alerts")
async def market_alerts(authorization: str | None = Header(default=None)):
    uid = _user_from_auth(authorization)
    _watch, alerts, _fires, source = await _load_alerts_fires_watch(uid)
    return {"source": source, "nfa": NFA, "items": alerts}


@router.get("/fires")
async def market_fires(authorization: str | None = Header(default=None)):
    uid = _user_from_auth(authorization)
    _watch, _alerts, fires, source = await _load_alerts_fires_watch(uid)
    return {"source": source, "nfa": NFA, "items": fires}


@router.get("/fires/{fire_id}")
async def market_fire_detail(
    fire_id: str,
    authorization: str | None = Header(default=None),
):
    uid = _user_from_auth(authorization)
    watch, alerts, fires, source = await _load_alerts_fires_watch(uid)
    hit = next((x for x in fires if str(x.get("id")) == fire_id), None)
    if not hit:
        for rows in _MOCK_FIRES.values():
            hit = next((x for x in rows if x["id"] == fire_id), None)
            if hit:
                source = "mock"
                break
    if not hit:
        raise HTTPException(status_code=404, detail="Alert fire not found")

    alert = next(
        (a for a in alerts if str(a.get("id")) == str(hit.get("alert_id"))),
        None,
    )
    if alert is None:
        # Prefer same symbol + type
        alert = next(
            (
                a
                for a in alerts
                if a.get("symbol") == hit.get("symbol") and a.get("type") == hit.get("type")
            ),
            None,
        )
    threshold = alert.get("threshold") if alert else None
    last_price = hit.get("price")
    if last_price is None:
        row = next((w for w in watch if w.get("symbol") == hit.get("symbol")), None)
        if row and row.get("price") is not None:
            last_price = float(row["price"])
        else:
            last_price = _lookup_price(str(hit.get("symbol") or ""), uid)

    depth = _fire_status(hit, float(threshold) if threshold is not None else None, float(last_price) if last_price is not None else None)

    disclosures: list[dict[str, Any]] = []
    if str(hit.get("type")) == "disclosure":
        disc = await _symbol_disclosures_payload(str(hit.get("symbol") or ""), uid, limit=3)
        disclosures = disc.get("items") or []

    return {
        "source": source,
        "nfa": NFA,
        "fire": hit,
        "alert": alert,
        "depth": depth,
        "disclosures": disclosures,
        "user_id": uid,
        "broker_cta": {
            "label": "Open my broker",
            "hint": "Ceyfi does not place CSE orders. Use your licensed stockbroker / CDS participant. Phase 4 — licensed partner handoff; button stays disabled.",
        },
    }


async def _symbol_disclosures_payload(symbol: str, uid: str, limit: int = 5) -> dict[str, Any]:
    symbol = symbol.upper()
    path = f"/api/v1/symbols/{quote(symbol, safe='')}/disclosures?limit={limit}"
    live = await _chime_get(path)
    items = _unwrap_list(live, "items")
    if items is not None:
        return {"source": "chime", "nfa": NFA, "symbol": symbol, "items": items[:limit]}
    mock = list(_MOCK_DISCLOSURES.get(symbol, []))[:limit]
    return {"source": "mock", "nfa": NFA, "symbol": symbol, "items": mock}


@router.get("/symbols/{symbol}/bars")
async def market_symbol_bars(
    symbol: str,
    authorization: str | None = Header(default=None),
    limit: int = Query(default=60, ge=5, le=260),
):
    uid = _user_from_auth(authorization)
    symbol = symbol.upper()
    if not _SYMBOL_RE.match(symbol):
        raise HTTPException(status_code=400, detail="Invalid CSE symbol")

    path = f"/api/v1/symbols/{quote(symbol, safe='')}/daily-bars?limit={limit}"
    live = await _chime_get(path)
    bars = _unwrap_list(live, "bars", "items")
    source = "mock"
    candle_ok = False
    if bars is not None and len(bars) > 0:
        source = "chime"
        # Candle mode only when we have real high/low distinct from close enough times
        with_range = 0
        for b in bars:
            if not isinstance(b, dict):
                continue
            try:
                h = float(b.get("high") or 0)
                low = float(b.get("low") or 0)
                c = float(b.get("close") or b.get("price") or 0)
            except (TypeError, ValueError):
                continue
            if h > 0 and low > 0 and (h - low) >= max(0.01, c * 0.0005):
                with_range += 1
        candle_ok = with_range >= max(3, len(bars) // 4)
        # Normalize field names
        norm = []
        for b in bars:
            if not isinstance(b, dict):
                continue
            close = b.get("close", b.get("price"))
            norm.append(
                {
                    "trade_date": b.get("trade_date") or (str(b.get("ts") or "")[:10]),
                    "open": b.get("open"),
                    "high": b.get("high", close),
                    "low": b.get("low", close),
                    "close": close,
                    "volume": b.get("volume"),
                }
            )
        bars = norm
    else:
        bars = _mock_daily_bars(symbol, _lookup_price(symbol, uid), limit=limit)
        candle_ok = True

    return {
        "source": source,
        "nfa": NFA,
        "symbol": symbol,
        "count": len(bars),
        "bars": bars,
        "candle_ok": candle_ok,
        "preferred_chart": "candles" if candle_ok else "line",
        "disclaimer": "Price path from Chime daily bars (or demo mock) — research only.",
    }


@router.get("/symbols/{symbol}/disclosures")
async def market_symbol_disclosures(
    symbol: str,
    authorization: str | None = Header(default=None),
    limit: int = Query(default=5, ge=1, le=50),
):
    uid = _user_from_auth(authorization)
    symbol = symbol.upper()
    if not _SYMBOL_RE.match(symbol):
        raise HTTPException(status_code=400, detail="Invalid CSE symbol")
    return await _symbol_disclosures_payload(symbol, uid, limit=limit)


@router.get("/symbols/{symbol}/path")
async def market_symbol_path(
    symbol: str,
    authorization: str | None = Header(default=None),
    fire_id: str | None = Query(default=None),
    limit: int = Query(default=60, ge=5, le=260),
):
    """Close path + optional threshold / fire marker for alert detail charts."""
    uid = _user_from_auth(authorization)
    symbol = symbol.upper()
    if not _SYMBOL_RE.match(symbol):
        raise HTTPException(status_code=400, detail="Invalid CSE symbol")

    bars_resp = await market_symbol_bars(symbol, authorization=authorization, limit=limit)
    bars = list(bars_resp["bars"])
    _watch, alerts, fires, _src = await _load_alerts_fires_watch(uid)

    fire = None
    if fire_id:
        fire = next((f for f in fires if str(f.get("id")) == fire_id), None)
        if fire is None:
            for rows in _MOCK_FIRES.values():
                fire = next((x for x in rows if x["id"] == fire_id), None)
                if fire:
                    break

    alert = None
    if fire:
        alert = next((a for a in alerts if str(a.get("id")) == str(fire.get("alert_id"))), None)
    if alert is None:
        alert = next((a for a in alerts if a.get("symbol") == symbol), None)

    threshold = alert.get("threshold") if alert else None
    fire_date = None
    if fire and fire.get("fired_at"):
        fire_date = str(fire["fired_at"])[:10]

    points = []
    for b in bars:
        points.append(
            {
                "date": b.get("trade_date"),
                "close": b.get("close"),
                "open": b.get("open"),
                "high": b.get("high"),
                "low": b.get("low"),
                "volume": b.get("volume"),
                "threshold": threshold,
                "is_fire_day": bool(fire_date and b.get("trade_date") == fire_date),
            }
        )

    return {
        "source": bars_resp["source"],
        "nfa": NFA,
        "symbol": symbol,
        "threshold": threshold,
        "fire_id": fire.get("id") if fire else None,
        "fire_date": fire_date,
        "candle_ok": bars_resp["candle_ok"],
        "preferred_chart": bars_resp["preferred_chart"],
        "points": points,
        "disclaimer": bars_resp["disclaimer"],
    }
