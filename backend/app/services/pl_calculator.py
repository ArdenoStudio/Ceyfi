"""
Derives a P&L summary from a raw transaction list.

Usage:
    result = await compute_pl("SEY-BIZ-001", txns)

The returned dict matches the pl_summary fixture schema so the frontend
needs no changes.
"""

from __future__ import annotations

from datetime import date, timedelta

from app.services.categorizer import categorize_transactions

# Categories that count as expenses (everything else falls to MISC)
_EXPENSE_CATS = {"SUPPLIER", "UTILITIES", "TRANSPORT", "WAGES", "MISC"}


def _parse_date(txn: dict) -> date | None:
    ts = str(txn.get("timestamp") or txn.get("date") or "")
    try:
        return date.fromisoformat(ts[:10])
    except (ValueError, TypeError):
        return None


def _aggregate(txns: list[dict], cat_by_id: dict[str, str],
               start: date, end: date) -> dict:
    revenue = 0.0
    breakdown: dict[str, float] = {}

    for txn in txns:
        d = _parse_date(txn)
        if d is None or not (start <= d <= end):
            continue

        amount = float(txn.get("amount_lkr") or 0)
        tid = txn.get("transaction_id") or txn.get("id", "")
        cat = cat_by_id.get(tid, "MISC")

        if txn.get("type") == "credit":
            revenue += amount
        else:
            key = cat if cat in _EXPENSE_CATS else "MISC"
            breakdown[key] = breakdown.get(key, 0.0) + amount

    total_exp = sum(breakdown.values())
    net = revenue - total_exp
    margin = round(net / revenue * 100, 1) if revenue > 0 else 0.0

    return {
        "revenue_lkr": round(revenue),
        "expenses_lkr": round(total_exp),
        "net_lkr": round(net),
        "margin_pct": margin,
        "expense_breakdown": {
            k: round(v)
            for k, v in sorted(breakdown.items(), key=lambda x: -x[1])
        },
    }


async def compute_pl(user_id: str, txns: list[dict]) -> dict:
    """
    Categorise *txns* with the AI categoriser, then aggregate into a
    P&L dict whose schema matches the pl_summary fixture.

    'This week'  = the 7 calendar days ending on the latest transaction date.
    'Last week'  = the 7 days immediately before that.
    """
    if not txns:
        return {}

    categorized = await categorize_transactions(txns)
    cat_by_id = {c["id"]: c["category_en"] for c in categorized}

    dates = [d for d in (_parse_date(t) for t in txns) if d]
    if not dates:
        return {}

    max_date = max(dates)
    this_start = max_date - timedelta(days=6)
    prev_end = this_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=6)

    current = _aggregate(txns, cat_by_id, this_start, max_date)
    previous = _aggregate(txns, cat_by_id, prev_start, prev_end)

    week_label = (
        f"{this_start.strftime('%b')} {this_start.day}"
        f" – "
        f"{max_date.strftime('%b')} {max_date.day}, {max_date.year}"
    )

    return {
        "user_id": user_id,
        "week_label": week_label,
        **current,
        "previous_margin_pct": previous["margin_pct"],
        "previous_expense_breakdown": previous.get("expense_breakdown", {}),
        "current_week": current,
        "previous_week": previous,
    }
