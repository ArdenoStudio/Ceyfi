"""Unified financial snapshot — single source of truth for intelligence surfaces."""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from app.config import settings
from app.services import loan_state
from app.services.health_score import compute_health_score

log = logging.getLogger(__name__)

_FX = Path(__file__).parent.parent.parent / "fixtures"
_fixture_cache: dict[str, dict] = {}


def _load(name: str) -> dict:
    if name not in _fixture_cache:
        _fixture_cache[name] = json.loads((_FX / name).read_text(encoding="utf-8"))
    return _fixture_cache[name]


def _txn_amount(txn: dict) -> float:
    return abs(float(txn.get("amount_lkr") or 0))


def _txn_desc(txn: dict) -> str:
    return str(txn.get("description") or txn.get("merchant") or "")


def _compute_spending_score(txns: list[dict], balance: float) -> tuple[int, str, list[str]]:
    debits = [t for t in txns if float(t.get("amount_lkr", 0)) < 0]
    credits = [t for t in txns if float(t.get("amount_lkr", 0)) > 0]
    spend = sum(_txn_amount(t) for t in debits)
    income = sum(_txn_amount(t) for t in credits) or 185000
    ratio = spend / income if income else 0.5
    score = max(40, min(95, int(90 - ratio * 40)))
    insight = f"Spending is {ratio * 100:.0f}% of recent income"
    actions = [
        "Set a weekly grocery cap of LKR 4,500",
        "Enable bill-pay alerts 3 days before due",
    ]
    return score, insight, actions


def _compute_savings_score(balance: float, savings: float) -> tuple[int, str, list[str]]:
    rate = (savings / balance * 100) if balance > 0 else 0
    score = max(50, min(95, int(60 + rate * 0.35)))
    insight = f"Savings represent {rate:.1f}% of total balance"
    actions = [
        "Auto-transfer LKR 2,800 on salary day",
        "Round-up spare change to savings bucket",
    ]
    return score, insight, actions


def _compute_debt_score(loans: list[dict], income: float = 185000) -> tuple[int, str, list[str]]:
    if not loans:
        return 85, "No active loans detected", ["Maintain current savings rate"]
    loan = loans[0]
    emi = float(loan.get("monthly_payment_lkr") or loan.get("monthly_installment_lkr") or 0)
    ratio = emi / income * 100 if income else 0
    health = compute_health_score(loan)
    base = {"ON_TRACK": 82, "AT_RISK": 62, "CRITICAL": 35}[health]
    score = max(35, min(95, int(base - ratio * 0.5)))
    insight = f"EMI is {ratio:.0f}% of income, healthy range is under 15%"
    actions = ["Review refinancing options", "Consider a 5-day EMI date shift"]
    return score, insight, actions


def _detect_anomalies(txns: list[dict]) -> list[dict]:
    anomalies: list[dict] = []
    debits = [t for t in txns if float(t.get("amount_lkr", 0)) < 0]
    if not debits:
        return anomalies

    amounts = [_txn_amount(t) for t in debits]
    avg = sum(amounts) / len(amounts)
    for t in debits:
        amt = _txn_amount(t)
        desc = _txn_desc(t)
        if amt > avg * 2.5 and amt > 5000:
            anomalies.append({
                "id": f"a_{t.get('id', len(anomalies))}",
                "title": f"{desc.split('·')[0].strip()} spend above average",
                "description": f"LKR {amt:,.0f} vs usual LKR {avg:,.0f}",
                "date": str(t.get("date", ""))[:10],
                "resolved": False,
            })
        if "CEB" in desc.upper() or "electricity" in desc.lower():
            if amt > 3500:
                anomalies.append({
                    "id": f"a_ceb_{t.get('id', 'x')}",
                    "title": "Electricity bill above average",
                    "description": f"LKR {amt:,.0f} vs usual LKR 3,000",
                    "date": str(t.get("date", ""))[:10],
                    "resolved": False,
                })

    credits = [t for t in txns if float(t.get("amount_lkr", 0)) > 0]
    if credits:
        latest = max(str(t.get("date", ""))[:10] for t in credits)
        try:
            days_since = (date.today() - date.fromisoformat(latest)).days
            if days_since > 10:
                anomalies.append({
                    "id": "a_income_gap",
                    "title": f"No income detected in {days_since} days",
                    "description": "Salary usually arrives by the 2nd",
                    "date": latest,
                    "resolved": False,
                })
        except ValueError:
            pass

    return anomalies[:5]


def _build_decisions(
    user_id: str,
    balance: float,
    savings: float,
    loans: list[dict],
    persona: str,
) -> list[dict]:
    decisions: list[dict] = []
    move_amount = max(5000, round(balance * 0.07, -2))

    decisions.append({
        "id": "d1",
        "title": f"Move LKR {move_amount:,.0f} to savings this week",
        "category": "Save",
        "benefit_lkr": move_amount,
        "benefit_label": f"LKR {move_amount:,.0f} moved to savings",
        "risk_reduced": "Reduces shortfall probability by 34%",
        "confidence": 87,
        "evidence": ["Salary cleared recently", "No bills due for 9 days"],
        "tradeoffs": [f"Reduces everyday account to LKR {max(0, balance - move_amount):,.0f}"],
        "deadline": "Act within 3 days",
        "reversible": True,
        "urgency": "High",
    })

    if loans:
        loan = loans[0]
        emi = float(loan.get("monthly_payment_lkr") or loan.get("monthly_installment_lkr") or 22000)
        decisions.append({
            "id": "d2",
            "title": "Optimize EMI payment date to the 28th",
            "category": "Protect",
            "benefit_lkr": 2200,
            "benefit_label": "LKR 2,200 late-fee risk avoided",
            "risk_reduced": "Aligns EMI with salary cycle",
            "confidence": 79,
            "evidence": ["Salary arrives on the 1st", "Current EMI creates a 4-day gap"],
            "tradeoffs": ["Requires bank request", "One-time processing fee may apply"],
            "deadline": "Act within 7 days",
            "reversible": False,
            "urgency": "Medium",
        })
        outstanding = float(loan.get("outstanding_lkr", 0))
        if outstanding > 100000:
            saved = round(outstanding * 0.025)
            decisions.append({
                "id": "d5",
                "title": "Refinance personal loan at lower rate",
                "category": "Grow",
                "benefit_lkr": saved,
                "benefit_label": f"LKR {saved:,.0f} interest saved over term",
                "risk_reduced": "Reduces debt service ratio",
                "confidence": 68,
                "evidence": ["Current rate 14%", "Seylan promotional rate 11.5% available"],
                "tradeoffs": ["Processing fee LKR 5,000", "Credit check required"],
                "deadline": "Act within 30 days",
                "reversible": False,
                "urgency": "Medium",
            })

    if persona == "diaspora":
        decisions.append({
            "id": "d3",
            "title": "Time remittance for best GBP rate",
            "category": "Grow",
            "benefit_lkr": 3200,
            "benefit_label": "LKR 3,200 extra on next transfer",
            "risk_reduced": "FX timing improves yield by 0.8%",
            "confidence": 76,
            "evidence": ["GBP/LKR at 30-day high tomorrow", "Last transfer was 12 days ago"],
            "tradeoffs": ["Family may wait 1 extra day for funds"],
            "deadline": "Act within 1 day",
            "reversible": False,
            "urgency": "High",
        })

    if persona == "sme":
        decisions.append({
            "id": "d7",
            "title": "Send payment reminder to overdue client",
            "category": "Move",
            "benefit_lkr": 128000,
            "benefit_label": "LKR 128,000 receivable collected",
            "risk_reduced": "Reduces 60+ day overdue exposure",
            "confidence": 71,
            "evidence": ["Invoice 34 days overdue", "Client paid on time last quarter"],
            "tradeoffs": ["May strain client relationship"],
            "deadline": "Act within 2 days",
            "reversible": True,
            "urgency": "High",
        })

    emergency_target = max(0, round((balance * 0.12) - savings, -2))
    if emergency_target > 0:
        decisions.append({
            "id": "d6",
            "title": f"Top up emergency fund by LKR {emergency_target:,.0f}",
            "category": "Protect",
            "benefit_lkr": emergency_target,
            "benefit_label": f"Emergency fund reaches {min(3.0, savings / 65000):.1f} months",
            "risk_reduced": "Liquidity score improves",
            "confidence": 84,
            "evidence": [f"Current buffer covers {savings / 65000:.1f} months", "CEB bill spike expected"],
            "tradeoffs": ["Less available for discretionary spend"],
            "deadline": "Act within 5 days",
            "reversible": True,
            "urgency": "High",
        })

    return sorted(decisions, key=lambda d: d["benefit_lkr"], reverse=True)


def _build_opportunities(decisions: list[dict]) -> list[dict]:
    icons = ["TrendingUp", "Lightbulb", "Sparkles", "AlertTriangle", "CheckCircle2"]
    opps = []
    for i, d in enumerate(decisions[:5]):
        opps.append({
            "title": d["title"],
            "benefit": d["benefit_lkr"],
            "confidence": d["confidence"],
            "icon": icons[i % len(icons)],
        })
    return opps


def _build_forecast(base_balance: float) -> list[dict]:
    return [
        {
            "day": f"D{i + 1}",
            "actual": round(base_balance + (i * 200) + (i % 7) * 800),
            "predicted": round(base_balance + (i * 180) + (i % 7) * 750),
        }
        for i in range(30)
    ]


async def build_financial_snapshot(user_id: str, persona: str = "diaspora") -> dict[str, Any]:
    """Aggregate account, loan, and wallet data into a unified snapshot."""
    data_source = "fixture"

    if user_id == "SEY-BIZ-001":
        biz = _load("business_account.json").get(user_id, {})
        txns = biz.get("transactions", [])
        balance = float(biz.get("current_balance", 0))
        savings = float(biz.get("tax_jar_balance", 0))
        name = biz.get("name", "Suresh Silva")
        recent_txns = txns[-10:]
        loans: list[dict] = []
        loan_override = loan_state.get_loan_data("SEY-USR-003")
        if loan_override:
            loans = loan_override.get("loans", [])
    else:
        ctx_data = _load("account_context.json")
        ctx = dict(ctx_data.get(user_id) or ctx_data.get("SEY-USR-001", {}))
        balance = float(ctx.get("balance_lkr", 0))
        savings = float(ctx.get("savings_balance", balance * 0.5))
        name = ctx.get("name", ctx.get("account_holder", "Customer"))
        recent_txns = ctx.get("recent_transactions", [])

        if settings.use_seylan_real and user_id in ("SEY-USR-001", "SEY-USR-003"):
            try:
                from app.seylan import account as seylan_acct
                acct_num = "064000012548001"
                bal = await seylan_acct.get_balance(acct_num)
                txns = await seylan_acct.get_recent_transactions(acct_num, n=10)
                balance = bal.get("balance_lkr", balance)
                savings = balance * 0.5
                if txns:
                    recent_txns = txns
                data_source = "live"
            except Exception as exc:
                log.warning("Seylan snapshot enrichment failed: %s", exc)

        loan_override = loan_state.get_loan_data(user_id)
        if loan_override:
            loans = loan_override.get("loans", [])
        else:
            loans_data = _load("loans.json")
            loans = loans_data.get(user_id, {}).get("loans", [])

        if persona == "diaspora":
            wallet_data = _load("family_wallet.json").get("SEY-ACC-002", {})
            balance = float(wallet_data.get("total_balance_lkr", balance))

    spend_score, spend_insight, spend_actions = _compute_spending_score(recent_txns, balance)
    save_score, save_insight, save_actions = _compute_savings_score(balance, savings)
    debt_score, debt_insight, debt_actions = _compute_debt_score(loans)

    bill_score = 95 if not any("missed" in str(l).lower() for l in loans) else 72
    liquidity_months = savings / 65000 if savings else 0
    liq_score = max(45, min(90, int(50 + liquidity_months * 15)))

    components = [
        {"name": "Spending Discipline", "score": spend_score, "insight": spend_insight, "actions": spend_actions},
        {"name": "Savings Rate", "score": save_score, "insight": save_insight, "actions": save_actions},
        {"name": "Debt Service Ratio", "score": debt_score, "insight": debt_insight, "actions": debt_actions},
        {"name": "Bill Reliability", "score": bill_score, "insight": "11/12 bills paid on time this year", "actions": ["Enable auto-pay for Dialog and CEB"]},
        {"name": "Liquidity", "score": liq_score, "insight": f"Emergency fund covers {liquidity_months:.1f} months, target is 3+", "actions": [f"Move LKR {max(0, round(65000 * 3 - savings, -2)):,.0f} to savings"]},
    ]

    health_score = round(sum(c["score"] for c in components) / len(components))
    anomalies = _detect_anomalies(recent_txns)
    decisions = _build_decisions(user_id, balance, savings, loans, persona)
    opportunities = _build_opportunities(decisions)
    forecast = _build_forecast(balance)

    return {
        "user_id": user_id,
        "name": name,
        "persona": persona,
        "balance_lkr": balance,
        "savings_balance": savings,
        "current_balance": balance - savings,
        "health_score": health_score,
        "health_components": components,
        "anomalies": anomalies,
        "opportunities": opportunities,
        "decisions": decisions,
        "forecast": forecast,
        "scenario_base_balance": balance,
        "recent_transactions": recent_txns,
        "loans": loans,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "data_source": data_source,
    }
