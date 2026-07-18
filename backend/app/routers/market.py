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

APPETITE_DISCLAIMER = (
    "Market Appetite is a research composite from CSE breadth, move intensity, "
    "ASPI day change, and participation. It is not financial advice and not a "
    "buy/sell signal."
)

APPETITE_BANDS = (
    "extreme_caution",
    "caution",
    "neutral",
    "appetite",
    "strong_appetite",
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
    sparkline: list[float] | None = None,
    spark_bars: list[dict[str, Any]] | None = None,
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
    if sparkline is not None:
        out["sparkline"] = sparkline
    if spark_bars is not None:
        out["spark_bars"] = spark_bars
    return out


def _match_alert_for_fire(
    fire: dict[str, Any],
    alerts: list[dict[str, Any]],
) -> dict[str, Any] | None:
    alert = next(
        (a for a in alerts if str(a.get("id")) == str(fire.get("alert_id"))),
        None,
    )
    if alert is None:
        alert = next(
            (
                a
                for a in alerts
                if a.get("symbol") == fire.get("symbol") and a.get("type") == fire.get("type")
            ),
            None,
        )
    return alert


def _resolve_last_price(
    fire: dict[str, Any],
    watch: list[dict[str, Any]],
    uid: str,
) -> float | None:
    last_price = fire.get("price")
    if last_price is not None:
        try:
            return float(last_price)
        except (TypeError, ValueError):
            pass
    row = next((w for w in watch if w.get("symbol") == fire.get("symbol")), None)
    if row and row.get("price") is not None:
        return float(row["price"])
    return _lookup_price(str(fire.get("symbol") or ""), uid)


def _normalize_spark_bar(row: dict[str, Any]) -> dict[str, Any] | None:
    """Sanitize one daily bar for home candlestick sparklines."""
    close_raw = row.get("close", row.get("price"))
    try:
        close = float(close_raw)
    except (TypeError, ValueError):
        return None
    if not (close > 0):
        return None

    def _opt(key: str) -> float | None:
        v = row.get(key)
        if v is None:
            return None
        try:
            n = float(v)
        except (TypeError, ValueError):
            return None
        return n if n > 0 else None

    open_p = _opt("open")
    high = _opt("high")
    low = _opt("low")
    open_for_bound = open_p if open_p is not None else close
    if high is None:
        high = max(open_for_bound, close)
    if low is None:
        low = min(open_for_bound, close)
    high = max(high, open_for_bound, close)
    low = min(low, open_for_bound, close)

    trade_date = row.get("trade_date") or row.get("date")
    if isinstance(trade_date, str) and len(trade_date) >= 10:
        trade_date = trade_date[:10]
    else:
        trade_date = None

    vol = row.get("volume")
    try:
        volume = float(vol) if vol is not None else None
    except (TypeError, ValueError):
        volume = None

    return {
        "trade_date": trade_date,
        "open": round(open_p, 4) if open_p is not None else None,
        "high": round(high, 4),
        "low": round(low, 4),
        "close": round(close, 4),
        "volume": volume,
    }


def _closes_from_bars(bars: list[dict[str, Any]]) -> list[float]:
    return [float(b["close"]) for b in bars if b.get("close") is not None]


async def _bars_for_symbol(symbol: str, uid: str, limit: int = 20) -> list[dict[str, Any]]:
    """Prefer Chime daily OHLC; fall back to deterministic mock bars."""
    symbol = symbol.upper()
    path = f"/api/v1/symbols/{quote(symbol, safe='')}/daily-bars?limit={limit}"
    live = await _chime_get(path)
    raw = _unwrap_list(live, "bars", "items")
    if raw:
        bars: list[dict[str, Any]] = []
        for b in raw:
            if not isinstance(b, dict):
                continue
            norm = _normalize_spark_bar(b)
            if norm:
                bars.append(norm)
        if bars:
            return bars[-limit:]
    return _mock_daily_bars(symbol, _lookup_price(symbol, uid), limit=limit)


async def _sparkline_for_symbol(symbol: str, uid: str, limit: int = 20) -> list[float]:
    """Prefer Chime daily closes; fall back to deterministic mock path."""
    return _closes_from_bars(await _bars_for_symbol(symbol, uid, limit=limit))


async def _enrich_fire_card(
    fire: dict[str, Any],
    *,
    uid: str,
    watch: list[dict[str, Any]],
    alerts: list[dict[str, Any]],
    include_path: bool = False,
    path_limit: int = 28,
) -> dict[str, Any]:
    """Attach depth + optional disclosure snippet / path for Market home cards."""
    alert = _match_alert_for_fire(fire, alerts)
    threshold = alert.get("threshold") if alert else None
    last_price = _resolve_last_price(fire, watch, uid)
    depth = _fire_status(
        fire,
        float(threshold) if threshold is not None else None,
        last_price,
    )
    out: dict[str, Any] = {
        **fire,
        "depth": depth,
        "alert": alert,
    }
    if str(fire.get("type")) == "disclosure":
        disc = await _symbol_disclosures_payload(str(fire.get("symbol") or ""), uid, limit=1)
        items = disc.get("items") or []
        if items:
            d0 = items[0]
            brief = d0.get("brief") if d0.get("brief_status") == "ready" else None
            out["disclosure_snippet"] = {
                "title": d0.get("title"),
                "brief": brief,
                "brief_status": d0.get("brief_status"),
                "published_at": d0.get("published_at"),
            }
    if include_path:
        bars = await _bars_for_symbol(str(fire.get("symbol") or ""), uid, limit=path_limit)
        closes = _closes_from_bars(bars)
        fire_date = str(fire.get("fired_at") or "")[:10] or None
        points: list[dict[str, Any]] = []
        for b in bars:
            points.append(
                {
                    "date": b.get("trade_date"),
                    "open": b.get("open"),
                    "high": b.get("high"),
                    "low": b.get("low"),
                    "close": b.get("close"),
                    "volume": b.get("volume"),
                    "threshold": depth.get("threshold"),
                    "is_fire_day": bool(
                        fire_date and b.get("trade_date") == fire_date
                    ),
                }
            )
        # Mark last point as fire-day proxy when we lack an exact bar date match
        if points and not any(p.get("is_fire_day") for p in points):
            points[-1]["is_fire_day"] = True
        out["path"] = {
            "threshold": depth.get("threshold"),
            "fire_date": fire_date,
            "closes": closes,
            "bars": bars,
            "points": points,
        }
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


def _band_for_score(score: float) -> str:
    s = max(0.0, min(100.0, float(score)))
    if s < 20:
        return "extreme_caution"
    if s < 40:
        return "caution"
    if s < 60:
        return "neutral"
    if s < 80:
        return "appetite"
    return "strong_appetite"


def _normalize_appetite_band(raw: Any) -> str:
    if isinstance(raw, str) and raw in APPETITE_BANDS:
        return raw
    return "neutral"


def _appetite_delta(history_asc: list[dict[str, Any]], days_back: int) -> float | None:
    if len(history_asc) < 2:
        return None
    end = len(history_asc) - 1
    idx = end - days_back
    if idx < 0:
        return None
    try:
        d = float(history_asc[end]["score"]) - float(history_asc[idx]["score"])
    except (KeyError, TypeError, ValueError):
        return None
    return round(d, 1) if d == d else None  # NaN guard


def _days_in_band(history_asc: list[dict[str, Any]]) -> int:
    if not history_asc:
        return 0
    band = history_asc[-1].get("band")
    n = 0
    for row in reversed(history_asc):
        if row.get("band") != band:
            break
        n += 1
    return n


def _normalize_appetite_day(row: dict[str, Any]) -> dict[str, Any] | None:
    trade_date = row.get("trade_date")
    if isinstance(trade_date, str) and len(trade_date) >= 10:
        trade_date = trade_date[:10]
    else:
        return None
    try:
        score = float(row.get("score"))
    except (TypeError, ValueError):
        return None
    if score != score:  # NaN
        return None
    score = max(0.0, min(100.0, score))
    comps_raw = row.get("components") if isinstance(row.get("components"), dict) else {}

    def _comp(key: str) -> float | None:
        v = comps_raw.get(key)
        if v is None:
            return None
        try:
            n = float(v)
        except (TypeError, ValueError):
            return None
        if n != n:
            return None
        return round(max(0.0, min(100.0, n)), 1)

    source = row.get("source") if row.get("source") in ("cse", "hybrid_research") else "cse"
    band = _normalize_appetite_band(row.get("band")) or _band_for_score(score)

    def _int_or_none(key: str) -> int | None:
        v = row.get(key)
        if v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    aspi = row.get("aspi_change_pct")
    try:
        aspi_f = float(aspi) if aspi is not None else None
    except (TypeError, ValueError):
        aspi_f = None
    if aspi_f is not None and aspi_f != aspi_f:
        aspi_f = None

    return {
        "trade_date": trade_date,
        "score": round(score, 1),
        "band": band,
        "components": {
            "breadth": _comp("breadth"),
            "intensity": _comp("intensity"),
            "index": _comp("index"),
            "participation": _comp("participation"),
        },
        "source": source,
        "universe_n": max(0, int(row.get("universe_n") or 0)),
        "advancers": _int_or_none("advancers"),
        "decliners": _int_or_none("decliners"),
        "unchanged": _int_or_none("unchanged"),
        "aspi_change_pct": round(aspi_f, 2) if aspi_f is not None else None,
        "computed_at": row.get("computed_at"),
    }


def _mock_appetite_history(limit: int = 60) -> list[dict[str, Any]]:
    """Deterministic CSE-breadth style series for offline demos.

    Lands near Appetite (~64) so the meter needle is visibly off-centre.
    History is ascending by trade_date (weekday sessions only).
    """
    end = datetime(2026, 7, 17, tzinfo=timezone.utc).date()
    n = max(2, min(int(limit), 252))
    base_scores: list[float] = []
    for i in range(n):
        t = i / max(n - 1, 1)
        score = 48.0 + 10.0 * (0.5 - abs(t - 0.55)) + 14.0 * t
        wobble = ((i * 17) % 7) - 3
        score = max(22.0, min(86.0, score + wobble * 0.6))
        base_scores.append(score)
    # Pin the last two for caption-stable demo numbers (+1.4 d1).
    base_scores[-2] = 62.8
    base_scores[-1] = 64.2

    # Walk backwards collecting weekdays, then reverse.
    dates: list[Any] = []
    cursor = end
    while len(dates) < n:
        if cursor.weekday() < 5:
            dates.append(cursor)
        cursor -= timedelta(days=1)
    dates.reverse()

    out: list[dict[str, Any]] = []
    for i, score in enumerate(base_scores):
        d = dates[i]
        band = _band_for_score(score)
        breadth = max(20.0, min(90.0, score + 4))
        intensity = max(20.0, min(90.0, score - 6))
        index = max(20.0, min(90.0, score + 1))
        participation = max(20.0, min(90.0, score - 2))
        adv = int(120 + (score - 50) * 1.8)
        dec = int(140 - (score - 50) * 1.6)
        unc = max(0, 280 - adv - dec)
        aspi_pct = round((score - 50.0) / 25.0, 2)
        out.append(
            {
                "trade_date": d.isoformat(),
                "score": round(score, 1),
                "band": band,
                "components": {
                    "breadth": round(breadth, 1),
                    "intensity": round(intensity, 1),
                    "index": round(index, 1),
                    "participation": round(participation, 1),
                },
                "source": "cse",
                "universe_n": 280,
                "advancers": adv,
                "decliners": max(0, dec),
                "unchanged": unc,
                "aspi_change_pct": aspi_pct,
                "computed_at": datetime(
                    d.year, d.month, d.day, 11, 0, tzinfo=timezone.utc
                ).isoformat(),
            }
        )
    return out


def _appetite_payload_from_history(
    history_asc: list[dict[str, Any]],
    *,
    source: str,
    limit: int,
) -> dict[str, Any]:
    latest = history_asc[-1] if history_asc else None
    return {
        "source": source,
        "nfa": NFA,
        "latest": latest,
        "history": history_asc,
        "deltas": {
            "d1": _appetite_delta(history_asc, 1),
            "d5": _appetite_delta(history_asc, 5),
            "d21": _appetite_delta(history_asc, 21),
        },
        "days_in_band": _days_in_band(history_asc),
        "limit": limit,
        "appetite_source": latest.get("source") if latest else "cse",
        "disclaimer": APPETITE_DISCLAIMER,
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


async def _load_appetite(limit: int = 60) -> dict[str, Any]:
    """Chime GET /api/v1/appetite when configured; else deterministic mock."""
    limit = max(1, min(int(limit), 252))
    live = await _chime_get(f"/api/v1/appetite?limit={limit}&source=cse")
    if isinstance(live, dict):
        raw_hist = live.get("history")
        if isinstance(raw_hist, list) and raw_hist:
            history: list[dict[str, Any]] = []
            for row in raw_hist:
                if isinstance(row, dict):
                    norm = _normalize_appetite_day(row)
                    if norm:
                        history.append(norm)
            if history:
                history.sort(key=lambda r: r["trade_date"])
                # Prefer Chime's latest/deltas when present; recompute if thin.
                payload = _appetite_payload_from_history(
                    history, source="chime", limit=limit
                )
                # Overlay Chime deltas when they look sane.
                chime_deltas = live.get("deltas")
                if isinstance(chime_deltas, dict):
                    for key in ("d1", "d5", "d21"):
                        v = chime_deltas.get(key)
                        if isinstance(v, (int, float)) and v == v:
                            payload["deltas"][key] = round(float(v), 1)
                if isinstance(live.get("days_in_band"), int):
                    payload["days_in_band"] = live["days_in_band"]
                if isinstance(live.get("disclaimer"), str) and live["disclaimer"].strip():
                    payload["disclaimer"] = live["disclaimer"]
                return payload

    history = _mock_appetite_history(limit=limit)
    return _appetite_payload_from_history(history, source="mock", limit=limit)


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

    # OHLC candle sparklines for watched symbols (home watchlist)
    enriched: list[dict[str, Any]] = []
    for w in watch:
        sym = str(w.get("symbol") or "")
        bars = await _bars_for_symbol(sym, uid, limit=20) if sym else []
        enriched.append(
            _enrich_watch_row(
                w,
                alerts,
                fires,
                sparkline=_closes_from_bars(bars),
                spark_bars=bars,
            )
        )

    # Richer fire cards (depth + disclosure snippet); focus fire also gets a path
    recent = fires[:5]
    rich_fires: list[dict[str, Any]] = []
    for i, f in enumerate(recent):
        rich_fires.append(
            await _enrich_fire_card(
                f,
                uid=uid,
                watch=watch,
                alerts=alerts,
                include_path=(i == 0),
                path_limit=28,
            )
        )

    focus = rich_fires[0] if rich_fires else None
    appetite = await _load_appetite(limit=60)
    # Overview source stays watch/alerts based; appetite may independently be mock/chime.
    return {
        "source": source,
        "nfa": NFA,
        "persona_blurb": _PERSONA_BLURB.get(uid, ""),
        "watchlist": enriched,
        "alerts": alerts,
        "fires": rich_fires,
        "focus_fire": focus,
        "appetite": {
            "latest": appetite.get("latest"),
            "history": appetite.get("history"),
            "deltas": appetite.get("deltas"),
            "days_in_band": appetite.get("days_in_band"),
            "source": appetite.get("source"),
            "disclaimer": appetite.get("disclaimer"),
        },
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/appetite")
async def market_appetite(
    limit: int = Query(default=60, ge=1, le=252),
    authorization: str | None = Header(default=None),
):
    """Market Appetite (CSE breadth composite) — Chime proxy or mock."""
    _user_from_auth(authorization)
    return await _load_appetite(limit=limit)


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
