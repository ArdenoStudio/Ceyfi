"""CEYFI MCP tool, resource, and prompt handlers."""

from __future__ import annotations

import json
import logging
import re
from datetime import date
from pathlib import Path
from typing import Any

from app.services import auth as auth_service
from app.services import business_intelligence, chat_tools
from app.services import supabase_client
from app.services.financial_snapshot import build_financial_snapshot
from app.mcp.registry import PROMPT_CATALOG, RESOURCE_CATALOG, TOOL_CATALOG

log = logging.getLogger(__name__)

_FX = Path(__file__).resolve().parents[2] / "fixtures"
_fixture_cache: dict[str, dict] = {}

_FX_RATES = {
    ("GBP", "LKR"): 408.30,
    ("USD", "LKR"): 323.50,
    ("EUR", "LKR"): 351.20,
    ("AUD", "LKR"): 211.40,
}


def _load(name: str) -> dict:
    if name not in _fixture_cache:
        _fixture_cache[name] = json.loads((_FX / name).read_text(encoding="utf-8"))
    return _fixture_cache[name]


def _persona_for(user_id: str, override: str | None = None) -> str:
    if override:
        return override
    persona = auth_service.get_persona(user_id)
    return persona["persona"] if persona else "diaspora"


def _user_transactions(user_id: str) -> list[dict]:
    if user_id == "SEY-BIZ-001":
        biz = _load("business_account.json").get(user_id, {})
        return list(biz.get("transactions", []))
    ctx = _load("account_context.json").get(user_id, {})
    return list(ctx.get("recent_transactions", []))


def _txn_desc(txn: dict) -> str:
    return str(txn.get("description") or txn.get("merchant") or "")


def _txn_amount(txn: dict) -> float:
    return float(txn.get("amount_lkr") or 0)


async def execute_tool(name: str, arguments: dict[str, Any]) -> str:
    """Dispatch MCP tool by name. Returns JSON string."""
    handlers: dict[str, Any] = {
        "list_personas": _list_personas,
        "list_accounts": _list_accounts,
        "get_account_balance": _get_account_balance,
        "get_recent_transactions": _get_recent_transactions,
        "search_transactions": _search_transactions,
        "get_spending_summary": _get_spending_summary,
        "categorize_transactions": _categorize_transactions,
        "get_family_wallet": _get_family_wallet,
        "get_fx_rate": _get_fx_rate,
        "check_loan_status": _check_loan_status,
        "get_liabilities": _get_liabilities,
        "summarize_debt": _summarize_debt,
        "pay_loan_instalment": _pay_loan_instalment,
        "get_financial_snapshot": _get_financial_snapshot,
        "list_decisions": _list_decisions,
        "execute_decision": _execute_decision,
        "list_anomalies": _list_anomalies,
        "get_health_breakdown": _get_health_breakdown,
        "simulate_cash_scenario": _simulate_cash_scenario,
        "get_cfo_brief": _get_cfo_brief,
        "list_receivables": _list_receivables,
        "generate_recovery_message": _generate_recovery_message,
        "predict_payment_dates": _predict_payment_dates,
        "get_pl_summary": _get_pl_summary,
        "get_cash_runway": _get_cash_runway,
    }
    fn = handlers.get(name)
    if not fn:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        result = fn(arguments)
        if hasattr(result, "__await__"):
            result = await result
        if isinstance(result, str):
            return result
        return json.dumps(result)
    except Exception as exc:
        return json.dumps({"error": str(exc)})


# Backward-compatible alias
async def execute_banking_tool(name: str, arguments: dict[str, Any]) -> str:
    return await execute_tool(name, arguments)


def _list_personas(_arguments: dict[str, Any]) -> dict[str, Any]:
    return {"personas": list(auth_service.DEMO_PERSONAS.values())}


def _list_accounts(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    if user_id == "SEY-BIZ-001":
        biz = _load("business_account.json").get(user_id, {})
        return {
            "user_id": user_id,
            "accounts": [
                {
                    "type": "business_current",
                    "balance_lkr": biz.get("current_balance", 0),
                    "name": biz.get("business_name", ""),
                },
                {
                    "type": "tax_jar",
                    "balance_lkr": biz.get("tax_jar_balance", 0),
                    "name": "Tax Jar",
                },
            ],
        }
    ctx = _load("account_context.json").get(user_id, {})
    persona = _persona_for(user_id)
    accounts = [
        {"type": "savings", "balance_lkr": ctx.get("savings_balance", 0)},
        {"type": "current", "balance_lkr": ctx.get("current_balance", 0)},
    ]
    if persona == "diaspora":
        wallet = _load("family_wallet.json").get("SEY-ACC-002", {})
        accounts.append(
            {
                "type": "family_wallet",
                "wallet_id": "SEY-ACC-002",
                "balance_lkr": wallet.get("total_balance_lkr", 0),
            }
        )
    fds = ctx.get("fixed_deposits", [])
    for fd in fds:
        accounts.append({"type": "fixed_deposit", **fd})
    return {"user_id": user_id, "name": ctx.get("name", user_id), "accounts": accounts}


def _get_account_balance(arguments: dict[str, Any]) -> str:
    return chat_tools.execute_tool(
        "check_balance",
        {
            "user_id": arguments["user_id"],
            "account_type": arguments["account_type"],
        },
    )


def _get_recent_transactions(arguments: dict[str, Any]) -> str:
    return chat_tools.execute_tool(
        "get_recent_transactions",
        {
            "user_id": arguments["user_id"],
            "count": arguments.get("count", 5),
        },
    )


def _search_transactions(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    query = (arguments.get("query") or "").lower()
    min_amt = arguments.get("min_amount_lkr")
    max_amt = arguments.get("max_amount_lkr")
    limit = int(arguments.get("limit", 20))
    txns = _user_transactions(user_id)
    out: list[dict] = []
    for t in txns:
        amt = abs(_txn_amount(t))
        desc = _txn_desc(t).lower()
        if query and query not in desc:
            continue
        if min_amt is not None and amt < float(min_amt):
            continue
        if max_amt is not None and amt > float(max_amt):
            continue
        out.append(t)
    return {"user_id": user_id, "matches": out[:limit], "count": len(out[:limit])}


def _get_spending_summary(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    txns = _user_transactions(user_id)
    debits = [t for t in txns if _txn_amount(t) < 0]
    credits = [t for t in txns if _txn_amount(t) > 0]
    spend = sum(abs(_txn_amount(t)) for t in debits)
    income = sum(_txn_amount(t) for t in credits) or 185000
    merchants: dict[str, float] = {}
    for t in debits:
        key = _txn_desc(t).split(" - ")[0].strip() or "Other"
        merchants[key] = merchants.get(key, 0) + abs(_txn_amount(t))
    top = sorted(merchants.items(), key=lambda x: x[1], reverse=True)[:5]
    return {
        "user_id": user_id,
        "period_days": arguments.get("days", 30),
        "total_income_lkr": round(income, 2),
        "total_spend_lkr": round(spend, 2),
        "spend_to_income_pct": round(spend / income * 100, 1) if income else 0,
        "top_merchants": [{"merchant": m, "amount_lkr": a} for m, a in top],
        "transaction_count": len(txns),
    }


async def _categorize_transactions(arguments: dict[str, Any]) -> dict[str, Any]:
    from app.services.categorizer import categorize_transactions

    user_id = arguments.get("user_id", "SEY-BIZ-001")
    limit = int(arguments.get("limit", 15))
    txns = _user_transactions(user_id)[:limit]
    categorized = await categorize_transactions(txns)
    return {"user_id": user_id, "transactions": categorized}


def _get_family_wallet(arguments: dict[str, Any]) -> dict[str, Any]:
    wallet_id = arguments.get("wallet_account_id", "SEY-ACC-002")
    wallet = _load("family_wallet.json").get(wallet_id, {})
    if not wallet:
        return {"error": f"Wallet not found: {wallet_id}"}
    return {"wallet_id": wallet_id, **wallet}


def _get_fx_rate(arguments: dict[str, Any]) -> dict[str, Any]:
    fr = arguments.get("from_currency", "GBP").upper()
    to = arguments.get("to_currency", "LKR").upper()
    rate = _FX_RATES.get((fr, to), 0)
    return {"from": fr, "to": to, "rate": rate, "source": "ceyfi_demo"}


def _check_loan_status(arguments: dict[str, Any]) -> str:
    return chat_tools.execute_tool("check_loan_status", {"user_id": arguments["user_id"]})


def _get_liabilities(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    loans_data = _load("loans.json").get(user_id, {})
    loans = loans_data.get("loans", [])
    ctx = _load("account_context.json").get(user_id, {})
    if not loans:
        loans = ctx.get("loans", [])
    liabilities = []
    for loan in loans:
        liabilities.append(
            {
                "loan_id": loan.get("loan_id") or loan.get("id", ""),
                "type": loan.get("type", "loan"),
                "outstanding_lkr": loan.get("outstanding_lkr", 0),
                "monthly_payment_lkr": loan.get("monthly_payment_lkr")
                or loan.get("monthly_installment_lkr", 0),
                "next_payment_date": loan.get("next_payment_date", ""),
                "interest_rate_pct": loan.get("interest_rate_pct", 14.0),
                "payments_made": loan.get("payments_made", 0),
                "total_payments": loan.get("total_payments", 0),
            }
        )
    total_outstanding = sum(float(l["outstanding_lkr"]) for l in liabilities)
    total_emi = sum(float(l["monthly_payment_lkr"]) for l in liabilities)
    return {
        "user_id": user_id,
        "liabilities": liabilities,
        "total_outstanding_lkr": total_outstanding,
        "total_monthly_emi_lkr": total_emi,
    }


def _summarize_debt(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    strategy = arguments.get("strategy", "avalanche")
    liab = _get_liabilities({"user_id": user_id})
    loans = liab["liabilities"]
    if not loans:
        return {"user_id": user_id, "message": "No active liabilities", "months_to_free": 0}

    ordered = sorted(
        loans,
        key=lambda l: float(l["outstanding_lkr"]),
        reverse=(strategy == "snowball"),
    )
    if strategy == "avalanche":
        ordered = sorted(loans, key=lambda l: float(l.get("interest_rate_pct", 14)), reverse=True)

    months = 0
    schedule = []
    for loan in ordered:
        emi = float(loan["monthly_payment_lkr"]) or 1
        outstanding = float(loan["outstanding_lkr"])
        loan_months = max(1, int(outstanding / emi))
        months += loan_months
        schedule.append(
            {
                "loan_id": loan["loan_id"],
                "strategy": strategy,
                "months": loan_months,
                "outstanding_lkr": outstanding,
            }
        )
    return {
        "user_id": user_id,
        "strategy": strategy,
        "estimated_months_to_debt_free": months,
        "payoff_order": schedule,
        "total_outstanding_lkr": liab["total_outstanding_lkr"],
    }


async def _pay_loan_instalment(arguments: dict[str, Any]) -> str:
    return await chat_tools.execute_tool_async(
        "pay_loan_instalment",
        {
            "amount_lkr": arguments.get("amount_lkr", 22000),
        },
    )


async def _get_financial_snapshot(arguments: dict[str, Any]) -> str:
    user_id = arguments["user_id"]
    persona = _persona_for(user_id, arguments.get("persona"))
    snap = await build_financial_snapshot(user_id, persona)
    return json.dumps(snap)


async def _list_decisions(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    persona = _persona_for(user_id, arguments.get("persona"))
    snap = await build_financial_snapshot(user_id, persona)
    return {"user_id": user_id, "decisions": snap.get("decisions", [])}


async def _execute_decision(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    decision_id = arguments["decision_id"]
    persona_type = _persona_for(user_id)
    snap = await build_financial_snapshot(user_id, persona_type)
    decision = next((d for d in snap.get("decisions", []) if d["id"] == decision_id), None)
    if not decision:
        return {"ok": False, "error": "Decision not found", "decision_id": decision_id}

    if decision_id == "d7" or "reminder" in decision["title"].lower():
        receivables = business_intelligence.list_receivables_with_trust()
        worst = max(receivables, key=lambda r: r["overdue"], default=receivables[0])
        msgs = await business_intelligence.generate_recovery_messages(
            client=worst["client"],
            invoice=worst["invoice"],
            amount=float(worst["amount"]),
            overdue_days=int(worst["overdue"]),
        )
        return {
            "ok": True,
            "action_type": "recovery",
            "redirect": "/business",
            "message": decision["benefit_label"],
            "recovery_messages": msgs,
            "client": worst["client"],
            "decision": decision,
        }

    benefit = float(decision.get("benefit_lkr") or 0)
    category = decision.get("category")

    # ID-based routing for demo decisions.
    if decision_id in ("d1", "d6"):
        amount = benefit if benefit > 0 else 8400
        account_id = "SEY-ACC-002"
        try:
            supabase_client.insert_transaction(
                account_id=account_id,
                merchant=f"CEYFI decision · {decision.get('title', 'Savings move')[:48]}",
                amount_lkr=amount,
                bucket_id="savings",
                bucket_label="Savings",
                source="decision_execute",
                txn_type="credit",
            )
        except Exception as exc:
            log.warning("execute_decision savings credit failed: %s", exc)
        return {
            "ok": True,
            "action_type": "wallet_credit",
            "redirect": "/wallet",
            "message": f"Moved LKR {amount:,.0f} into the Savings bucket",
            "decision": decision,
            "amount_lkr": amount,
            "reference": f"DEC-{decision_id.upper()}-SAVE",
        }

    if decision_id == "d2":
        return {
            "ok": True,
            "action_type": "redirect",
            "redirect": "/loans",
            "message": "EMI date shift request opened — review your repayment schedule",
            "decision": decision,
        }

    if decision_id == "d3":
        return {
            "ok": True,
            "action_type": "redirect",
            "redirect": "/wallet",
            "message": "Remittance timing tip — check wallet buckets before the next send",
            "decision": decision,
        }

    if decision_id == "d5":
        return {
            "ok": True,
            "action_type": "redirect",
            "redirect": "/loans",
            "message": "Refinance options opened — compare rates against your current facility",
            "decision": decision,
        }

    redirect = "/assistant"
    if category == "Save":
        redirect = "/wallet"
    elif category == "Protect" and persona_type == "borrower":
        redirect = "/loans"
    elif persona_type == "sme":
        redirect = "/business"

    return {
        "ok": True,
        "action_type": "redirect",
        "redirect": redirect,
        "message": decision["benefit_label"],
        "decision": decision,
    }


async def _list_anomalies(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    persona = _persona_for(user_id)
    snap = await build_financial_snapshot(user_id, persona)
    return {"user_id": user_id, "anomalies": snap.get("anomalies", [])}


async def _get_health_breakdown(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    persona = _persona_for(user_id, arguments.get("persona"))
    snap = await build_financial_snapshot(user_id, persona)
    return {
        "user_id": user_id,
        "health_score": snap.get("health_score"),
        "components": snap.get("health_components", []),
    }


async def _simulate_cash_scenario(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments["user_id"]
    persona = _persona_for(user_id)
    snap = await build_financial_snapshot(user_id, persona)
    base = float(snap.get("balance_lkr", 0))
    income_delta = float(arguments.get("income_delta_lkr", 0))
    expense_delta = float(arguments.get("expense_delta_lkr", 0))
    days = int(arguments.get("days", 30))
    daily_net = (income_delta - expense_delta) / max(days, 1)
    projected = base + daily_net * days
    return {
        "user_id": user_id,
        "base_balance_lkr": base,
        "projected_balance_lkr": round(projected, 2),
        "income_delta_lkr": income_delta,
        "expense_delta_lkr": expense_delta,
        "horizon_days": days,
        "forecast": snap.get("forecast", [])[:days],
    }


async def _get_cfo_brief(arguments: dict[str, Any]) -> str:
    brief = await business_intelligence.build_cfo_brief(arguments["user_id"])
    return json.dumps(brief)


def _list_receivables(_arguments: dict[str, Any]) -> str:
    return json.dumps(business_intelligence.list_receivables_with_trust())


async def _generate_recovery_message(arguments: dict[str, Any]) -> str:
    msgs = await business_intelligence.generate_recovery_messages(
        client=arguments["client"],
        invoice=arguments["invoice"],
        amount=float(arguments["amount"]),
        overdue_days=int(arguments["overdue_days"]),
        tone=arguments.get("tone", "friendly"),
    )
    return json.dumps(msgs)


def _predict_payment_dates(arguments: dict[str, Any]) -> str:
    return json.dumps(business_intelligence.predict_payment_dates(arguments["user_id"]))


def _get_pl_summary(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments.get("user_id", "SEY-BIZ-001")
    pl = _load("pl_summary.json").get(user_id, {})
    current = pl.get("current_week", pl)
    return {
        "user_id": user_id,
        "period": "current_week",
        "revenue_lkr": current.get("revenue_lkr", 0),
        "expenses_lkr": current.get("expenses_lkr", 0),
        "net_lkr": current.get("net_lkr", 0),
        "margin_pct": current.get("margin_pct", 0),
    }


def _get_cash_runway(arguments: dict[str, Any]) -> dict[str, Any]:
    user_id = arguments.get("user_id", "SEY-BIZ-001")
    days = business_intelligence.compute_cash_runway_days(user_id)
    return {"user_id": user_id, "runway_days": days}


# --- Resources ---

def read_resource(uri: str) -> tuple[str, str]:
    """Return (mime_type, text body) for a resource URI."""
    if uri == "ceyfi://catalog/personas":
        return "application/json", json.dumps(_list_personas({}), indent=2)
    if uri == "ceyfi://catalog/tools":
        return "application/json", json.dumps({"tools": TOOL_CATALOG}, indent=2)
    if uri == "ceyfi://business/receivables":
        return "application/json", json.dumps(
            business_intelligence.list_receivables_with_trust(), indent=2
        )
    if uri == "ceyfi://fx/rates":
        rates = [
            {"from": fr, "to": to, "rate": rate}
            for (fr, to), rate in _FX_RATES.items()
        ]
        return "application/json", json.dumps({"rates": rates, "base": "LKR"}, indent=2)

    wallet_match = re.match(r"ceyfi://wallet/(.+)", uri)
    if wallet_match:
        body = _get_family_wallet({"wallet_account_id": wallet_match.group(1)})
        return "application/json", json.dumps(body, indent=2)

    user_match = re.match(r"ceyfi://user/([^/]+)/context", uri)
    if user_match:
        user_id = user_match.group(1)
        body = _list_accounts({"user_id": user_id})
        body["recent_transactions"] = _user_transactions(user_id)[:10]
        return "application/json", json.dumps(body, indent=2)

    raise ValueError(f"Unknown resource: {uri}")


def list_resource_uris() -> list[str]:
    static = [r["uri"] for r in RESOURCE_CATALOG if "{" not in r["uri"]]
    return static


# --- Prompts ---

async def get_prompt(name: str, arguments: dict[str, Any]) -> list[dict[str, str]]:
    """Return MCP prompt messages for the given prompt name."""
    if name == "cfo-morning-brief":
        user_id = arguments.get("user_id", "SEY-BIZ-001")
        brief = await business_intelligence.build_cfo_brief(user_id)
        return [
            {
                "role": "user",
                "content": (
                    f"Using this CEYFI CFO brief data, write a concise morning briefing "
                    f"for the business owner:\n{json.dumps(brief, indent=2)}"
                ),
            }
        ]
    if name == "recovery-collection":
        msgs = await business_intelligence.generate_recovery_messages(
            client=arguments["client"],
            invoice=arguments["invoice"],
            amount=float(arguments["amount"]),
            overdue_days=int(arguments["overdue_days"]),
            tone=arguments.get("tone", "friendly"),
        )
        return [
            {
                "role": "user",
                "content": (
                    "Polish these trilingual recovery messages for tone and cultural fit. "
                    f"Return JSON with en, si, ta:\n{json.dumps(msgs)}"
                ),
            }
        ]
    if name == "loan-health-review":
        user_id = arguments["user_id"]
        status = json.loads(_check_loan_status({"user_id": user_id}))
        debt = _summarize_debt({"user_id": user_id, "strategy": "avalanche"})
        return [
            {
                "role": "user",
                "content": (
                    f"Review this borrower's loan health and recommend 3 concrete next steps.\n"
                    f"Status: {json.dumps(status)}\nDebt plan: {json.dumps(debt)}"
                ),
            }
        ]
    if name == "diaspora-remittance-timing":
        user_id = arguments.get("user_id", "SEY-USR-001")
        fx = _get_fx_rate({"from_currency": "GBP", "to_currency": "LKR"})
        wallet = _get_family_wallet({"wallet_account_id": "SEY-ACC-002"})
        return [
            {
                "role": "user",
                "content": (
                    "Advise a diaspora sender on whether to remit now or wait, "
                    f"given FX {json.dumps(fx)} and family wallet {json.dumps(wallet)} "
                    f"for user {user_id}."
                ),
            }
        ]
    if name == "anomaly-fraud-review":
        user_id = arguments["user_id"]
        anomalies = await _list_anomalies({"user_id": user_id})
        return [
            {
                "role": "user",
                "content": (
                    "Review these flagged transaction anomalies. "
                    "Classify severity and suggest protective actions:\n"
                    f"{json.dumps(anomalies, indent=2)}"
                ),
            }
        ]
    if name == "debt-payoff-plan":
        user_id = arguments["user_id"]
        strategy = arguments.get("strategy", "avalanche")
        avalanche = _summarize_debt({"user_id": user_id, "strategy": "avalanche"})
        snowball = _summarize_debt({"user_id": user_id, "strategy": "snowball"})
        return [
            {
                "role": "user",
                "content": (
                    f"Compare debt payoff strategies for user {user_id}.\n"
                    f"Avalanche: {json.dumps(avalanche)}\n"
                    f"Snowball: {json.dumps(snowball)}\n"
                    f"Preferred: {strategy}"
                ),
            }
        ]

    known = {p["name"] for p in PROMPT_CATALOG}
    if name not in known:
        raise ValueError(f"Unknown prompt: {name}")
    raise ValueError(f"Prompt not implemented: {name}")
