import json
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter

from app.config import settings
from app.models.schemas import (
    CategorizeRequest, CategorizeResponse,
    TaxJarRuleRequest, TaxJarRuleResponse,
)
from app.services.categorizer import categorize_transactions
from app.services import supabase_client

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["business"])

_FX = Path(__file__).parent.parent.parent / "fixtures"


_BIZ_ACCOUNT_MAP = {"SEY-BIZ-001": "064000012548001"}


@router.post("/categorize-transactions", response_model=CategorizeResponse)
async def categorize(req: CategorizeRequest):
    all_txns: list[dict] = []

    # Prefer Supabase (seeded fixture rows + any live activity)
    try:
        from app.routers.mock import _normalize_db_txn
        db_rows = supabase_client.get_recent_transactions(req.user_id, limit=200, ascending=True)
        if db_rows:
            all_txns = [_normalize_db_txn(r, req.user_id) for r in db_rows]
            log.info("categorize loaded %d txns from Supabase for %s", len(all_txns), req.user_id)
    except Exception as exc:
        log.warning("Supabase fetch failed for categorize %s: %s — falling back to fixture", req.user_id, exc)

    if not all_txns:
        data = json.loads((_FX / "business_account.json").read_text(encoding="utf-8"))
        all_txns = data.get(req.user_id, {}).get("transactions", [])

    if req.transaction_ids:
        all_txns = [t for t in all_txns if (t.get("transaction_id") or t.get("id")) in req.transaction_ids]

    log.info("categorize user=%s count=%d", req.user_id, len(all_txns))
    result = await categorize_transactions(all_txns)
    return CategorizeResponse(categorized=result)


_insight_cache: dict[str, str] = {}


@router.get("/business/insight")
async def business_insight(user_id: str = "SEY-BIZ-001"):
    if user_id in _insight_cache:
        return {"insight_text": _insight_cache[user_id], "language": "en"}

    biz_data = json.loads((_FX / "business_account.json").read_text(encoding="utf-8"))
    txns = biz_data.get(user_id, {}).get("transactions", [])
    try:
        from app.services.pl_calculator import compute_pl
        entry = await compute_pl(user_id, txns)
    except Exception as exc:
        log.warning("pl_calculator failed in business_insight: %s — using fixture", exc)
        pl_data = json.loads((_FX / "pl_summary.json").read_text(encoding="utf-8"))
        entry = pl_data.get(user_id, {})
    current = entry.get("current_week", entry)
    previous = entry.get("previous_week", {})

    try:
        from app.services import groq_client
        prompt = (
            "You are a concise business advisor for a Sri Lankan SME. "
            "Summarize this week's P&L in 2-3 sentences. Be specific with numbers."
        )
        content = (
            f"Revenue: LKR {current.get('revenue_lkr', 0):,}, "
            f"Expenses: LKR {current.get('expenses_lkr', 0):,}, "
            f"Net: LKR {current.get('net_lkr', 0):,}, "
            f"Margin: {current.get('margin_pct', 0)}%. "
            f"Previous week margin: {previous.get('margin_pct', 0)}%."
        )
        text = await groq_client.complete(prompt, [{"role": "user", "content": content}], max_tokens=150, temperature=0.3)
    except Exception as exc:
        log.warning("Business insight Groq failed: %s — using fallback", exc)
        rev = current.get("revenue_lkr", 0)
        margin = current.get("margin_pct", 0)
        prev_margin = previous.get("margin_pct", 0)
        direction = "up" if margin > prev_margin else "down"
        text = (
            f"This week your business generated LKR {rev:,} in revenue with a {margin}% margin, "
            f"{direction} from {prev_margin}% last week."
        )

    _insight_cache[user_id] = text
    return {"insight_text": text, "language": "en"}


@router.post("/tax-jar/rule", response_model=TaxJarRuleResponse)
async def tax_jar_rule(req: TaxJarRuleRequest):
    rule_id = f"TAX-RULE-{uuid.uuid4().hex[:6].upper()}"
    try:
        supabase_client.save_tax_jar_rule(
            user_id=req.user_id,
            from_account_id=req.from_account_id,
            to_account_id=req.to_account_id,
            percentage=req.percentage,
            label=req.label,
        )
    except Exception as exc:
        log.warning("Failed to save tax jar rule: %s", exc)

    log.info("tax_jar_rule user=%s pct=%s", req.user_id, req.percentage)
    pct = int(req.percentage)
    return TaxJarRuleResponse(
        rule_id=rule_id,
        status="ACTIVE",
        message=f"{pct}% of every incoming payment will be moved to your Tax Savings account.",
        message_si=f"සෑම ගෙවීමකින් {pct}%ක් ඔබේ බදු ඉතිරිකිරීමේ ගිණුමට ස්වයංක්‍රීයව යොමු වේ.",
    )