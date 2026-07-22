"""Remittance path tracking for sender visibility (demo + bank webhooks)."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

RemittanceStepId = Literal["initiated", "corridor", "clearing", "landed"]

STEP_ORDER: list[RemittanceStepId] = ["initiated", "corridor", "clearing", "landed"]
STEP_SECONDS = 6  # demo: ~24s end-to-end

log = logging.getLogger(__name__)

_TRACKS: dict[str, dict[str, Any]] = {}
_STORE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "remittance_tracks.json"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_store_dir() -> None:
    _STORE_PATH.parent.mkdir(parents=True, exist_ok=True)


def _load_persisted() -> None:
    if _TRACKS:
        return
    if not _STORE_PATH.exists():
        return
    try:
        raw = json.loads(_STORE_PATH.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            for key, value in raw.items():
                if isinstance(value, dict):
                    _TRACKS[str(key)] = value
    except (json.JSONDecodeError, OSError) as exc:
        log.warning("Could not load remittance tracks: %s", exc)


def _persist() -> None:
    try:
        _ensure_store_dir()
        _STORE_PATH.write_text(
            json.dumps(_TRACKS, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
    except OSError as exc:
        log.warning("Could not persist remittance tracks: %s", exc)


def build_tracking(
    transfer_id: str,
    *,
    status: str,
    amount_lkr: float,
    corridor: str,
    timestamp: str | None = None,
    force_complete: bool = False,
    source: str = "demo_tracker",
) -> dict[str, Any]:
    """Build a multi-step remittance path for a transfer."""
    _load_persisted()
    started = (
        datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        if timestamp
        else _utcnow()
    )
    failed = status.upper() == "FAILED"
    completed = force_complete or status.upper() == "COMPLETED"

    elapsed = (_utcnow() - started).total_seconds()
    if failed:
        current_index = 1
        step_status = "failed"
    elif completed:
        current_index = len(STEP_ORDER) - 1
        step_status = "complete"
    else:
        current_index = min(int(elapsed // STEP_SECONDS), len(STEP_ORDER) - 1)
        # Auto-complete after full demo path
        if current_index >= len(STEP_ORDER) - 1 and elapsed >= STEP_SECONDS * (
            len(STEP_ORDER) - 1
        ):
            completed = True
            step_status = "complete"
            current_index = len(STEP_ORDER) - 1
        else:
            step_status = "active"

    steps: list[dict[str, Any]] = []
    for i, step_id in enumerate(STEP_ORDER):
        if failed and i > current_index:
            state = "pending"
        elif failed and i == current_index:
            state = "failed"
        elif i < current_index:
            state = "done"
        elif i == current_index:
            state = "current" if step_status != "complete" else "done"
        else:
            state = "pending"

        at = (started + timedelta(seconds=i * STEP_SECONDS)).isoformat()
        steps.append(
            {
                "id": step_id,
                "state": state,
                "at": at if state in ("done", "current", "failed") else None,
            }
        )

    if completed and not failed:
        for step in steps:
            step["state"] = "done"
            if step["at"] is None:
                step["at"] = started.isoformat()

    payload = {
        "transfer_id": transfer_id,
        "status": "FAILED" if failed else ("COMPLETED" if completed else "IN_TRANSIT"),
        "amount_lkr": amount_lkr,
        "corridor": corridor,
        "current_step": STEP_ORDER[current_index],
        "steps": steps,
        "updated_at": _utcnow().isoformat(),
        "source": source,
        "started_at": started.isoformat(),
    }
    _TRACKS[transfer_id] = payload
    _persist()
    return payload


def get_tracking(transfer_id: str) -> dict[str, Any] | None:
    _load_persisted()
    existing = _TRACKS.get(transfer_id)
    if not existing:
        return None
    if existing["status"] == "IN_TRANSIT":
        first_at = (
            existing.get("started_at")
            or (existing["steps"][0].get("at") if existing.get("steps") else None)
            or existing["updated_at"]
        )
        return build_tracking(
            transfer_id,
            status="IN_TRANSIT",
            amount_lkr=float(existing["amount_lkr"]),
            corridor=str(existing.get("corridor") or "GBPLKR"),
            timestamp=first_at,
            force_complete=False,
            source=str(existing.get("source") or "demo_tracker"),
        )
    return existing


def apply_webhook_step(
    transfer_id: str,
    *,
    step: RemittanceStepId | str,
    amount_lkr: float | None = None,
    corridor: str | None = None,
) -> dict[str, Any] | None:
    """Advance or complete a track from a bank/partner webhook."""
    _load_persisted()
    existing = _TRACKS.get(transfer_id)
    if not existing and amount_lkr is None:
        return None

    amount = float(amount_lkr if amount_lkr is not None else existing["amount_lkr"])  # type: ignore[index]
    corr = str(corridor or (existing or {}).get("corridor") or "GBPLKR")
    started = (existing or {}).get("started_at") or _utcnow().isoformat()
    step_l = str(step).lower()

    if step_l == "failed":
        return build_tracking(
            transfer_id,
            status="FAILED",
            amount_lkr=amount,
            corridor=corr,
            timestamp=started,
            source="bank_webhook",
        )

    if step_l == "landed" or step_l == "completed":
        return build_tracking(
            transfer_id,
            status="COMPLETED",
            amount_lkr=amount,
            corridor=corr,
            timestamp=started,
            force_complete=True,
            source="bank_webhook",
        )

    # Force current step by backdating start so timer lands on target index
    try:
        target_index = STEP_ORDER.index(step_l)  # type: ignore[arg-type]
    except ValueError:
        target_index = 0
    fake_started = _utcnow() - timedelta(seconds=target_index * STEP_SECONDS + 1)
    return build_tracking(
        transfer_id,
        status="IN_TRANSIT",
        amount_lkr=amount,
        corridor=corr,
        timestamp=fake_started.isoformat(),
        force_complete=False,
        source="bank_webhook",
    )


def seed_demo_track(
    transfer_id: str = "TRF-DEMO01",
    *,
    amount_lkr: float = 244980.0,
    corridor: str = "GBPLKR",
) -> dict[str, Any]:
    """Seed a completed path so the wallet UI can show tracking without a fresh send."""
    started = _utcnow() - timedelta(hours=2)
    return build_tracking(
        transfer_id,
        status="COMPLETED",
        amount_lkr=amount_lkr,
        corridor=corridor,
        timestamp=started.isoformat(),
        force_complete=True,
    )


def list_recent_tracks(limit: int = 10) -> list[dict[str, Any]]:
    _load_persisted()
    items = sorted(
        _TRACKS.values(),
        key=lambda t: t.get("updated_at") or "",
        reverse=True,
    )
    return items[:limit]
