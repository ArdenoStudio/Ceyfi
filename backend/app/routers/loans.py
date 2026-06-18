import json
import logging
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.schemas import LoanAdvisorRequest, LoanAdvisorResponse, LoanHealthResponse
from app.services import groq_client, supabase_client
from app.services.context_builder import build_loan_advisor_prompt
from app.services.health_score import compute_health_score, HEALTH_SUMMARY

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["loans"])

_FX = Path(__file__).parent.parent.parent / "fixtures"

# Per-process cache so repeat page loads are instant
_advisor_cache: dict[str, str] = {}


def _get_loans(user_id: str) -> list[dict]:
    data = json.loads((_FX / "loans.json").read_text(encoding="utf-8"))
    entry = data.get(user_id, {})
    loans = entry.get("loans", [])
    for loan in loans:
        loan["health_score"] = compute_health_score(loan)
    return loans


@router.get("/loans/{user_id}/health", response_model=LoanHealthResponse)
async def loan_health(user_id: str):
    loans = _get_loans(user_id)
    if not loans:
        return LoanHealthResponse(user_id=user_id, health_score="ON_TRACK",
                                  summary="No active loans found.")
    worst = loans[0]
    for l in loans:
        order = {"ON_TRACK": 0, "AT_RISK": 1, "CRITICAL": 2}
        if order.get(l["health_score"], 0) > order.get(worst["health_score"], 0):
            worst = l
    score = worst["health_score"]
    return LoanHealthResponse(user_id=user_id, health_score=score,
                              summary=HEALTH_SUMMARY[score])


class DemoPaymentRequest(BaseModel):
    user_id: str
    loan_id: str
    amount_lkr: float = Field(..., gt=0)


@router.post("/loans/demo-payment")
async def demo_loan_payment(req: DemoPaymentRequest):
    from app.services import loan_state
    updated = loan_state.apply_payment(req.user_id, req.loan_id, req.amount_lkr)
    if not updated:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Loan {req.loan_id} not found for user {req.user_id}")

    try:
        supabase_client.insert_transaction(
            account_id=req.user_id,
            merchant=f"Loan Payment (Demo) — {req.loan_id}",
            amount_lkr=req.amount_lkr,
            source="demo",
            txn_type="debit",
        )
    except Exception as exc:
        log.warning("demo_loan_payment: supabase insert failed (non-fatal): %s", exc)

    log.info("demo_loan_payment applied user=%s loan=%s amount=%.2f", req.user_id, req.loan_id, req.amount_lkr)
    return {
        "ok": True,
        "loan_id": req.loan_id,
        "outstanding_lkr": updated.get("outstanding_lkr"),
        "payments_made": updated.get("payments_made"),
        "health_score": updated.get("health_score"),
    }


@router.post("/loans/advisor", response_model=LoanAdvisorResponse)
async def loan_advisor(req: LoanAdvisorRequest):
    cache_key = f"{req.user_id}:{req.loan_id or 'primary'}"
    if cache_key in _advisor_cache:
        loans = _get_loans(req.user_id)
        loan = next((l for l in loans if l.get("loan_id") == req.loan_id), loans[0] if loans else {})
        return LoanAdvisorResponse(
            advisor_text=_advisor_cache[cache_key],
            language="en",
            health_score=loan.get("health_score", "ON_TRACK"),
        )

    loans = _get_loans(req.user_id)
    if not loans:
        return LoanAdvisorResponse(advisor_text="No active loans found.", language="en",
                                   health_score="ON_TRACK")

    loan = next((l for l in loans if l.get("loan_id") == req.loan_id), loans[0])
    prompt = build_loan_advisor_prompt(loan)

    try:
        text = await groq_client.complete(
            system_prompt=prompt,
            messages=[{"role": "user", "content": "Give me my loan summary."}],
            max_tokens=256,
            temperature=0.3,
        )
    except Exception as exc:
        log.warning("Groq loan advisor failed: %s — using deterministic fallback", exc)
        paid = loan.get("payments_made", 0)
        total = loan.get("total_payments", 36)
        outstanding = loan.get("outstanding_lkr", 0)
        payoff = loan.get("projected_payoff_date", "unknown")
        monthly = loan.get("monthly_payment_lkr", 0)
        text = (f"You've paid {paid} of {total} instalments with "
                f"LKR {outstanding:,.0f} remaining. Your next payment of "
                f"LKR {monthly:,.0f} keeps you on track to be debt-free by {payoff}.")

    _advisor_cache[cache_key] = text
    return LoanAdvisorResponse(advisor_text=text, language="en",
                               health_score=loan.get("health_score", "ON_TRACK"))