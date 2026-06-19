"""Live FX rates via open.er-api.com with 1-hour in-process cache and hardcoded fallback."""

from __future__ import annotations

import logging
import time

import httpx

log = logging.getLogger(__name__)

_FALLBACK: dict[tuple[str, str], float] = {
    ("GBP", "LKR"): 408.30,
    ("USD", "LKR"): 323.50,
    ("EUR", "LKR"): 351.20,
    ("AUD", "LKR"): 211.40,
}

_TRACKED_CURRENCIES = ("USD", "EUR", "AUD")
_API_URL = "https://open.er-api.com/v6/latest/GBP"
_TTL = 3600.0

_cache: dict[tuple[str, str], float] = {}
_fetched_at: float = 0.0


def _parse_rates(rates: dict) -> dict[tuple[str, str], float]:
    """Derive X→LKR cross-rates from a GBP-base response."""
    lkr = float(rates.get("LKR", 0))
    if not lkr:
        return {}
    out: dict[tuple[str, str], float] = {("GBP", "LKR"): round(lkr, 4)}
    for cur in _TRACKED_CURRENCIES:
        gbp_per_cur = float(rates.get(cur, 0))
        if gbp_per_cur:
            out[(cur, "LKR")] = round(lkr / gbp_per_cur, 4)
    return out


def _refresh_sync() -> None:
    global _fetched_at
    try:
        with httpx.Client(timeout=5) as client:
            r = client.get(_API_URL)
            r.raise_for_status()
            new = _parse_rates(r.json().get("rates", {}))
            if new:
                _cache.update(new)
                _fetched_at = time.monotonic()
                log.info("FX rates refreshed: %s", _cache)
    except Exception as exc:
        log.warning("FX rate refresh failed (%s) — using cached/fallback rates", exc)


async def _refresh_async() -> None:
    global _fetched_at
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(_API_URL)
            r.raise_for_status()
            new = _parse_rates(r.json().get("rates", {}))
            if new:
                _cache.update(new)
                _fetched_at = time.monotonic()
                log.info("FX rates refreshed: %s", _cache)
    except Exception as exc:
        log.warning("FX rate refresh failed (%s) — using cached/fallback rates", exc)


def _stale() -> bool:
    return time.monotonic() - _fetched_at > _TTL


def _resolve(pair: tuple[str, str]) -> tuple[float, str]:
    rate = _cache.get(pair) or _FALLBACK.get(pair, 0.0)
    source = "live" if pair in _cache else "fallback"
    return rate, source


def get_rate_sync(from_currency: str, to_currency: str) -> tuple[float, str]:
    """Return (rate, source). Refreshes synchronously when cache is stale."""
    if _stale():
        _refresh_sync()
    return _resolve((from_currency.upper(), to_currency.upper()))


async def get_rate(from_currency: str, to_currency: str) -> tuple[float, str]:
    """Return (rate, source). Refreshes asynchronously when cache is stale."""
    if _stale():
        await _refresh_async()
    return _resolve((from_currency.upper(), to_currency.upper()))


def all_rates() -> list[dict]:
    """All cached rates for resource endpoints; falls back to hardcoded if cache is empty."""
    source = _cache if _cache else _FALLBACK
    return [{"from": fr, "to": to, "rate": rate} for (fr, to), rate in source.items()]
