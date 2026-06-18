"""
In-memory loan state override layer.

Fixtures are immutable on disk; this module holds per-user mutations
(payment applications) that live for the lifetime of the server process.
The mock /loans endpoint reads from here first.
"""
import copy
import json
import logging
from pathlib import Path
from typing import Optional

from app.services.health_score import compute_health_score

log = logging.getLogger(__name__)

_FX = Path(__file__).parent.parent.parent / "fixtures" / "loans.json"

# { user_id: { "loans": [...] } }
_overrides: dict[str, dict] = {}


def _load_fixture(user_id: str) -> dict:
    raw = json.loads(_FX.read_text(encoding="utf-8"))
    return copy.deepcopy(raw.get(user_id, {}))


def get_loan_data(user_id: str) -> Optional[dict]:
    """Return in-memory override for user_id, or None if no override exists."""
    return _overrides.get(user_id)


def apply_payment(user_id: str, loan_id: str, amount_lkr: float) -> dict:
    """
    Apply a payment to a loan in the in-memory store.
    Bootstraps from fixture on first call for this user.
    Returns the updated loan dict (empty dict if loan_id not found).
    """
    if user_id not in _overrides:
        _overrides[user_id] = _load_fixture(user_id)

    user_data = _overrides[user_id]
    loans: list[dict] = user_data.get("loans", [])

    loan: Optional[dict] = None
    for l in loans:
        if l.get("loan_id") == loan_id:
            loan = l
            break

    if loan is None:
        log.warning("loan_state.apply_payment: loan_id=%s not found for user=%s", loan_id, user_id)
        return {}

    # Decrement outstanding (floor at 0)
    prev_outstanding = float(loan.get("outstanding_lkr", 0))
    loan["outstanding_lkr"] = round(max(0.0, prev_outstanding - amount_lkr), 2)

    # Increment payments_made (cap at total_payments)
    total = int(loan.get("total_payments", 999))
    loan["payments_made"] = min(int(loan.get("payments_made", 0)) + 1, total)

    # Mark the first DUE / UPCOMING schedule entry as PAID
    for entry in loan.get("schedule", []):
        if entry.get("status") in ("DUE", "UPCOMING"):
            entry["status"] = "PAID"
            break

    # Recompute health score
    loan["health_score"] = compute_health_score(loan)

    log.info(
        "loan_state: applied payment loan_id=%s user=%s amount=%.2f "
        "outstanding %.2f->%.2f health=%s",
        loan_id, user_id, amount_lkr,
        prev_outstanding, loan["outstanding_lkr"],
        loan["health_score"],
    )
    return loan