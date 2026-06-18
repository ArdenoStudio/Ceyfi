"""SME intelligence: CFO brief, trust scores, recovery messages, receivables."""

from __future__ import annotations

import json
import logging
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from app.services import groq_client

log = logging.getLogger(__name__)

_FX = Path(__file__).parent.parent.parent / "fixtures"

RECEIVABLES: list[dict[str, Any]] = [
    {
        "client": "Colombo Hardware",
        "invoice": "INV-1042",
        "amount": 85000,
        "due": "2026-06-10",
        "overdue": 8,
        "status": "amber",
        "payments_on_time": 11,
        "payments_late": 2,
        "avg_days_late": 6,
    },
    {
        "client": "Gampaha Traders",
        "invoice": "INV-1038",
        "amount": 42000,
        "due": "2026-06-25",
        "overdue": 0,
        "status": "green",
        "payments_on_time": 14,
        "payments_late": 0,
        "avg_days_late": 0,
    },
    {
        "client": "Negombo Builders",
        "invoice": "INV-1029",
        "amount": 128000,
        "due": "2026-05-15",
        "overdue": 34,
        "status": "orange",
        "payments_on_time": 6,
        "payments_late": 4,
        "avg_days_late": 18,
    },
    {
        "client": "Kandy Supplies",
        "invoice": "INV-1021",
        "amount": 67000,
        "due": "2026-04-20",
        "overdue": 59,
        "status": "red",
        "payments_on_time": 3,
        "payments_late": 5,
        "avg_days_late": 28,
    },
]


def compute_trust_score(row: dict[str, Any]) -> int:
    on_time = int(row.get("payments_on_time", 0))
    late = int(row.get("payments_late", 0))
    total = max(1, on_time + late)
    on_time_pct = on_time / total
    overdue = int(row.get("overdue", 0))
    avg_late = float(row.get("avg_days_late", 0))
    score = int(55 + on_time_pct * 35 - min(overdue, 60) * 0.35 - avg_late * 0.4)
    return max(15, min(98, score))


def list_receivables_with_trust() -> list[dict[str, Any]]:
    out = []
    for row in RECEIVABLES:
        trust = compute_trust_score(row)
        out.append({**row, "trust_score": trust})
    return out


def _load_pl(user_id: str) -> dict[str, Any]:
    data = json.loads((_FX / "pl_summary.json").read_text(encoding="utf-8"))
    return data.get(user_id, {})


def _load_biz(user_id: str) -> dict[str, Any]:
    data = json.loads((_FX / "business_account.json").read_text(encoding="utf-8"))
    return data.get(user_id, {})


def compute_cash_runway_days(user_id: str) -> int:
    pl = _load_pl(user_id)
    current = pl.get("current_week", pl)
    expenses = float(current.get("expenses_lkr", 0))
    net = float(current.get("net_lkr", 0))
    daily = expenses / 7 if expenses > 0 else 0
    if daily <= 0:
        return 30
    return max(1, int(round(net / daily)))


async def build_cfo_brief(user_id: str) -> dict[str, Any]:
    pl = _load_pl(user_id)
    biz = _load_biz(user_id)
    current = pl.get("current_week", pl)
    revenue = float(current.get("revenue_lkr", 0))
    expenses = float(current.get("expenses_lkr", 0))
    net = float(current.get("net_lkr", 0))
    margin = float(current.get("margin_pct", 0))
    runway_days = compute_cash_runway_days(user_id)
    receivables = list_receivables_with_trust()
    overdue_total = sum(r["amount"] for r in receivables if r["overdue"] > 0)
    worst = max(receivables, key=lambda r: r["overdue"], default=None)

    bullets = [
        f"Cash runway: {runway_days} days at current burn.",
        f"Weekly net: LKR {net:,.0f} ({margin:.1f}% margin).",
        f"Outstanding receivables: LKR {overdue_total:,.0f} overdue.",
    ]
    actions = []
    if worst and worst["overdue"] > 14:
        actions.append(
            {
                "priority": 1,
                "title": f"Collect {worst['client']} invoice {worst['invoice']}",
                "benefit_lkr": worst["amount"],
                "href": "/decisions",
            }
        )
    if runway_days < 14:
        actions.append(
            {
                "priority": 2,
                "title": "Reduce discretionary supplier spend this week",
                "benefit_lkr": int(expenses * 0.08),
                "href": "/business",
            }
        )
    actions.append(
        {
            "priority": 3,
            "title": "Review uncategorised transactions before filing",
            "benefit_lkr": 0,
            "href": "/business#business-feed",
        }
    )

    summary = (
        f"Good morning, {biz.get('name', 'there')}. "
        f"Revenue LKR {revenue:,.0f}, expenses LKR {expenses:,.0f}, "
        f"net LKR {net:,.0f}. Runway {runway_days} days."
    )

    try:
        prompt = (
            "You are a Sri Lankan SME CFO. Write a 3-bullet morning briefing. "
            "Be specific with LKR amounts. Max 80 words total."
        )
        content = (
            f"Business: {biz.get('business_name', '')}. "
            f"Revenue {revenue}, expenses {expenses}, net {net}, margin {margin}%. "
            f"Runway {runway_days} days. Overdue AR {overdue_total}."
        )
        ai_text = await groq_client.complete(
            prompt,
            [{"role": "user", "content": content}],
            max_tokens=180,
            temperature=0.3,
        )
        summary = ai_text.strip()
    except Exception as exc:
        log.warning("CFO brief Groq failed: %s", exc)

    return {
        "user_id": user_id,
        "date": date.today().isoformat(),
        "summary": summary,
        "bullets": bullets,
        "actions": sorted(actions, key=lambda a: a["priority"])[:3],
        "runway_days": runway_days,
        "overdue_receivables_lkr": overdue_total,
        "tax_jar_balance": float(biz.get("tax_jar_balance", 0)),
    }


async def generate_recovery_messages(
    client: str,
    invoice: str,
    amount: float,
    overdue_days: int,
    tone: str = "friendly",
) -> dict[str, str]:
    fallback = {
        "en": (
            f"Dear {client}, invoice {invoice} for LKR {amount:,.0f} is "
            f"{overdue_days} days overdue. Please arrange payment at your earliest convenience."
        ),
        "si": (
            f"{client} යන අයට, {invoice} බිල්පත සඳහා රු. {amount:,.0f} "
            f"ගෙවීම් දින {overdue_days} ක් ඉකුත් වී ඇත. කරුණාකර ඉක්මනින් ගෙවන්න."
        ),
        "ta": (
            f"அன்புள்ள {client}, {invoice} விலைப்பட்டியல் LKR {amount:,.0f} "
            f"{overdue_days} நாட்கள் தாமதமாக உள்ளது. தயவுசெய்து விரைவில் செலுத்தவும்."
        ),
    }
    try:
        prompt = (
            f"Write payment collection messages for invoice {invoice}, "
            f"client {client}, LKR {amount:,.0f}, {overdue_days} days overdue. "
            f"Tone: {tone}. Return JSON with keys en, si, ta only."
        )
        raw = await groq_client.complete(
            "You output valid JSON only.",
            [{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.4,
        )
        parsed = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
        return {
            "en": str(parsed.get("en", fallback["en"])),
            "si": str(parsed.get("si", fallback["si"])),
            "ta": str(parsed.get("ta", fallback["ta"])),
        }
    except Exception as exc:
        log.warning("recovery message generation failed: %s", exc)
        return fallback


def predict_payment_dates(user_id: str) -> list[dict[str, Any]]:
    """Expected incoming payments based on receivables due dates."""
    predictions = []
    today = date.today()
    for row in RECEIVABLES:
        due = date.fromisoformat(row["due"])
        trust = compute_trust_score(row)
        delay = max(0, int((trust - 50) / -3)) if trust < 80 else 0
        expected = due + timedelta(days=delay)
        predictions.append(
            {
                "client": row["client"],
                "invoice": row["invoice"],
                "amount": row["amount"],
                "due_date": row["due"],
                "expected_payment_date": expected.isoformat(),
                "confidence": min(95, trust),
                "days_until": (expected - today).days,
            }
        )
    return sorted(predictions, key=lambda p: p["days_until"])
