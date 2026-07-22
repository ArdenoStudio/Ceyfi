"""Remittance path tracking for sender visibility (demo + future bank rails)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

RemittanceStepId = Literal["initiated", "corridor", "clearing", "landed"]

STEP_ORDER: list[RemittanceStepId] = ["initiated", "corridor", "clearing", "landed"]

# In-memory demo store — sufficient for MVP without requiring bank webhooks yet.
_TRACKS: dict[str, dict[str, Any]] = {}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def build_tracking(
    transfer_id: str,
    *,
    status: str,
    amount_lkr: float,
    corridor: str,
    timestamp: str | None = None,
    force_complete: bool = False,
) -> dict[str, Any]:
    """Build a multi-step remittance path for a transfer."""
    started = (
        datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        if timestamp
        else _utcnow()
    )
    failed = status.upper() == "FAILED"
    completed = force_complete or status.upper() == "COMPLETED"

    # Demo: completed transfers show full path; in-flight advances by elapsed seconds.
    elapsed = (_utcnow() - started).total_seconds()
    if failed:
        current_index = 1
        step_status = "failed"
    elif completed:
        current_index = len(STEP_ORDER) - 1
        step_status = "complete"
    else:
        # Advance one step roughly every 8s in demo mode
        current_index = min(int(elapsed // 8), len(STEP_ORDER) - 1)
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

        at = (started + timedelta(seconds=i * 8)).isoformat()
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
        "source": "demo_tracker",
    }
    _TRACKS[transfer_id] = payload
    return payload


def get_tracking(transfer_id: str) -> dict[str, Any] | None:
    existing = _TRACKS.get(transfer_id)
    if not existing:
        return None
    # Recompute progress for in-transit demo tracks
    if existing["status"] == "IN_TRANSIT":
        first_at = existing["steps"][0].get("at") or existing["updated_at"]
        return build_tracking(
            transfer_id,
            status="IN_TRANSIT",
            amount_lkr=float(existing["amount_lkr"]),
            corridor=str(existing.get("corridor") or "GBPLKR"),
            timestamp=first_at,
            force_complete=False,
        )
    return existing


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
