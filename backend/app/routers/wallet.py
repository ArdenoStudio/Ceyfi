import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.config import settings
from app.models.schemas import (
    AllocationRule,
    BucketCredit,
    RemittanceTracking,
    SaveAllocationRulesRequest,
    WalletTransferRequest,
    WalletTransferResponse,
)
from app.services import supabase_client
from app.services.auth import assert_transfer_access, assert_user_access
from app.services.remittance_tracking import build_tracking, get_tracking, seed_demo_track

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["wallet"])


def _split_transfer_amount_lkr(amount_lkr: float, rules: list[AllocationRule]) -> list[tuple[str, float]]:
    """Per-bucket LKR amounts that sum to *amount_lkr* (last bucket absorbs rounding remainder)."""
    rules_list = list(rules)
    n = len(rules_list)
    out: list[tuple[str, float]] = []
    allocated = 0.0
    for i, r in enumerate(rules_list):
        if i == n - 1:
            part = round(amount_lkr - allocated, 2)
        else:
            part = round(amount_lkr * float(r.pct) / 100.0, 2)
            allocated += part
        out.append((r.bucket_id, part))
    return out


@router.get("/wallet/sandbox-transfer-accounts")
async def sandbox_transfer_accounts(request: Request):
    """Sandbox account numbers — only when live bank adapter is enabled for the session user."""
    if not settings.use_seylan_real:
        return {"configured": False}
    session = getattr(request.state, "session", None)
    if settings.demo_auth_required:
        if not session:
            raise HTTPException(status_code=401, detail="Authentication required")
        if session.get("persona") != "diaspora":
            raise HTTPException(status_code=403, detail="Sandbox transfers are diaspora-only")
    return {
        "configured": True,
        "source_account": settings.seylan_sandbox_source_account,
        "destination_account": settings.seylan_sandbox_destination_account,
    }


@router.get("/fx")
async def get_fx_rate(from_currency: str = "GBP", to_currency: str = "LKR"):
    rates = {
        ("GBP", "LKR"): 408.30,
        ("USD", "LKR"): 323.50,
        ("EUR", "LKR"): 351.20,
        ("AUD", "LKR"): 211.40,
    }
    rate = rates.get((from_currency.upper(), to_currency.upper()), 0)
    return {
        "from": from_currency.upper(),
        "to": to_currency.upper(),
        "rate": rate,
        "source": "demo_fixture",
    }


@router.post("/wallet/transfer", response_model=WalletTransferResponse)
async def wallet_transfer(req: WalletTransferRequest, request: Request):
    session = getattr(request.state, "session", None)
    assert_transfer_access(session, req.sender_account_id, req.recipient_account_id)
    total_pct = sum(r.pct for r in req.allocation_rules)
    if abs(total_pct - 100) > 0.01:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Allocation percentages must sum to 100 (got {total_pct})")

    splits = _split_transfer_amount_lkr(float(req.amount_lkr), req.allocation_rules)
    buckets_credited = [BucketCredit(bucket_id=bid, amount_lkr=part) for bid, part in splits]
    transfer_id = f"TRF-{uuid.uuid4().hex[:8].upper()}"

    # Persist allocation rules
    try:
        supabase_client.save_allocation_rule(
            sender_id=req.sender_account_id,
            account_id=req.recipient_account_id,
            buckets=[{"id": r.bucket_id, "pct": r.pct} for r in req.allocation_rules],
        )
    except Exception as exc:
        log.warning("Failed to persist allocation rule: %s", exc)

    # Real bank transfer when enabled — uses configured sandbox test accounts
    status = "COMPLETED"
    note: str | None = None
    if settings.seylan_enable_transfers and settings.use_seylan_real:
        try:
            from app.seylan import transfers
            result = await transfers.transfer_funds(
                source=settings.seylan_sandbox_source_account,
                destination=settings.seylan_sandbox_destination_account,
                amount=req.amount_lkr,
                user_ref=transfer_id[:16],
                src_narration=f"Ceyfi remit {req.corridor}",
                dst_narration=f"Family wallet — {req.corridor}",
            )
            log.info("Seylan transfer succeeded: ref=%s", result.get("transaction_reference"))
            note = "Seylan sandbox transfer completed"
        except Exception as exc:
            log.error("Seylan transfer failed: %s — not claiming COMPLETED", exc)
            failed_ts = datetime.now(timezone.utc).isoformat()
            tracking = RemittanceTracking(
                **build_tracking(
                    transfer_id,
                    status="FAILED",
                    amount_lkr=float(req.amount_lkr),
                    corridor=req.corridor,
                    timestamp=failed_ts,
                )
            )
            return WalletTransferResponse(
                transfer_id=transfer_id,
                status="FAILED",
                amount_lkr=req.amount_lkr,
                timestamp=failed_ts,
                buckets_credited=[],
                note="Seylan transfer failed — funds were not moved",
                tracking=tracking,
            )
    else:
        note = "Demo transfer (Seylan transfers not enabled)"

    # Record per-bucket credits so Supabase realtime and bucket balances stay consistent
    try:
        for bucket_id, part in splits:
            if part <= 0:
                continue
            supabase_client.insert_transaction(
                account_id=req.recipient_account_id,
                merchant=f"Remittance from {req.sender_account_id}",
                amount_lkr=part,
                bucket_id=bucket_id,
                bucket_label=bucket_id.replace("bucket_", "").replace("_", " ").title(),
                source="transfer",
                txn_type="credit",
            )
    except Exception as exc:
        log.warning("Failed to record transfer transaction: %s", exc)

    ts = datetime.now(timezone.utc).isoformat()
    tracking = RemittanceTracking(
        **build_tracking(
            transfer_id,
            status=status,
            amount_lkr=float(req.amount_lkr),
            corridor=req.corridor,
            timestamp=ts,
            force_complete=status == "COMPLETED",
        )
    )
    log.info("wallet_transfer sender=%s amount=%s status=%s", req.sender_account_id, req.amount_lkr, status)
    return WalletTransferResponse(
        transfer_id=transfer_id,
        status=status,
        amount_lkr=req.amount_lkr,
        timestamp=ts,
        buckets_credited=buckets_credited,
        note=note,
        tracking=tracking,
    )


@router.get("/wallet/remittance/{transfer_id}/track", response_model=RemittanceTracking)
async def remittance_track(transfer_id: str):
    """Multi-step remittance path (initiated → corridor → clearing → landed)."""
    track = get_tracking(transfer_id)
    if track:
        return RemittanceTracking(**track)
    # Demo fallback so the wallet UI can show a completed path without a fresh send
    if transfer_id.upper() in {"TRF-DEMO01", "LAST", "DEMO"}:
        return RemittanceTracking(**seed_demo_track(transfer_id.upper() if transfer_id.upper().startswith("TRF") else "TRF-DEMO01"))
    raise HTTPException(status_code=404, detail="Remittance track not found")


@router.get("/wallet/remittance/demo/track", response_model=RemittanceTracking)
async def remittance_demo_track():
    """Seeded completed remittance path for diaspora wallet demos."""
    return RemittanceTracking(**seed_demo_track())


@router.post("/wallet/rules/{sender_id}")
async def save_wallet_rules_by_sender(sender_id: str, req: SaveAllocationRulesRequest, request: Request):
    session = getattr(request.state, "session", None)
    assert_user_access(session, sender_id)
    total_pct = sum(r.pct for r in req.allocation_rules)
    if abs(total_pct - 100) > 0.01:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Allocation percentages must sum to 100 (got {total_pct})")
    try:
        result = supabase_client.save_allocation_rule(
            sender_id=sender_id,
            account_id=req.account_id,
            buckets=[{"id": r.bucket_id, "pct": r.pct} for r in req.allocation_rules],
        )
        return {"status": "saved", "data": result}
    except Exception as exc:
        log.error("save_wallet_rules_by_sender failed: %s", exc)
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Failed to save allocation rules")


@router.get("/wallet/rules/{sender_id}")
async def get_wallet_rules(sender_id: str, request: Request, account_id: str = "SEY-ACC-002"):
    session = getattr(request.state, "session", None)
    assert_user_access(session, sender_id)
    try:
        rule = supabase_client.get_allocation_rules(sender_id, account_id)
    except Exception as exc:
        log.warning("get_allocation_rules failed: %s", exc)
        rule = None
    if rule:
        return rule
    return {
        "sender_id": sender_id,
        "account_id": account_id,
        "buckets": [
            {"id": "school",    "label": "School Fees", "pct": 40},
            {"id": "household", "label": "Household",   "pct": 40},
            {"id": "savings",   "label": "Savings",     "pct": 20},
        ],
    }


class SaveRulesRequest(BaseModel):
    sender_id: str
    account_id: str = "SEY-ACC-002"
    buckets: list[dict]


@router.post("/wallet/rules")
async def save_wallet_rules_legacy_body(req: SaveRulesRequest, request: Request):
    session = getattr(request.state, "session", None)
    assert_user_access(session, req.sender_id)
    total_pct = sum(b.get("pct", 0) for b in req.buckets)
    if abs(total_pct - 100) > 0.01:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Allocation percentages must sum to 100 (got {total_pct})")
    try:
        supabase_client.save_allocation_rule(
            sender_id=req.sender_id,
            account_id=req.account_id,
            buckets=req.buckets,
        )
    except Exception as exc:
        log.warning("Failed to save allocation rules: %s", exc)
    return {"status": "saved", "sender_id": req.sender_id, "buckets": req.buckets}