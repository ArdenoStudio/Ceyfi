import json
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.schemas import TriggerSpendRequest, TaxJarTriggerRequest
from app.services import supabase_client

log = logging.getLogger(__name__)
router = APIRouter(prefix="/mock", tags=["mock"])

_FX = Path(__file__).parent.parent.parent / "fixtures"

# Map demo user_id → real sandbox account number
_REAL_ACCOUNTS = {
    "SEY-USR-001": "064000012548001",
    "SEY-USR-003": "064000012548001",
}


_fixture_cache: dict[str, dict] = {}


def _load(name: str) -> dict:
    if name not in _fixture_cache:
        _fixture_cache[name] = json.loads((_FX / name).read_text(encoding="utf-8"))
    return _fixture_cache[name]


def _normalize_db_txn(row: dict, account_id: str) -> dict:
    """Normalize Supabase transaction rows to fixture-like transaction objects."""
    amount = float(row.get("amount_lkr") or 0)
    txn_id = row.get("id", row.get("transaction_id", f"txn_{uuid.uuid4().hex[:8]}"))
    date = row.get("timestamp") or row.get("created_at") or ""
    return {
        "transaction_id": txn_id,
        "id": txn_id,
        "account_id": account_id,
        "date": date,
        "timestamp": date,
        "description": row.get("merchant", ""),
        "merchant": row.get("merchant", ""),
        "amount_lkr": amount,
        "type": row.get("type", "debit" if amount < 0 else "credit"),
        "bucket_id": row.get("bucket_id"),
        "bucket_label": row.get("bucket_label"),
    }


def _apply_live_rows_to_wallet_buckets(wallet: dict, live_rows: list[dict]) -> None:
    """Adjust fixture bucket balances by Supabase-only activity (fixture txns already baked in)."""
    buckets = wallet.get("buckets") or []
    by_id: dict[str, dict[str, float]] = {}
    for b in buckets:
        bid = b.get("id") or b.get("bucket_id")
        if not bid:
            continue
        by_id[bid] = {
            "balance_lkr": float(b.get("balance_lkr", 0)),
            "spent_lkr": float(b.get("spent_lkr", 0)),
        }
    ordered = sorted(
        live_rows,
        key=lambda r: str(r.get("timestamp") or r.get("created_at") or ""),
    )
    orphan_credit = 0.0
    for row in ordered:
        bid = row.get("bucket_id")
        amt = float(row.get("amount_lkr") or 0)
        typ = str(row.get("type") or "debit").lower()
        if typ == "credit" and not bid:
            orphan_credit += amt
            continue
        if not bid or bid not in by_id:
            continue
        st = by_id[bid]
        if typ == "credit":
            st["balance_lkr"] += amt
        else:
            st["balance_lkr"] -= amt
            st["spent_lkr"] += amt
    for b in buckets:
        bid = b.get("id") or b.get("bucket_id")
        if bid in by_id:
            b["balance_lkr"] = round(by_id[bid]["balance_lkr"], 2)
            b["spent_lkr"] = round(by_id[bid]["spent_lkr"], 2)
    pool = sum(
        float(b.get("balance_lkr", 0)) + float(b.get("spent_lkr", 0))
        for b in buckets
    )
    wallet["total_balance_lkr"] = round(pool + orphan_credit, 2)


@router.get("/account-context/{user_id}")
async def account_context(user_id: str):
    data = _load("account_context.json")
    if user_id not in data:
        return JSONResponse(status_code=404, content={"error": f"Unknown user {user_id}"})
    ctx = dict(data[user_id])
    log.info("mock_call account-context user_id=%s real=%s", user_id, settings.use_seylan_real)

    if settings.use_seylan_real and user_id in _REAL_ACCOUNTS:
        account_number = _REAL_ACCOUNTS[user_id]
        try:
            from app.seylan import account as seylan_acct
            # Real balance
            bal = await seylan_acct.get_balance(account_number)
            ctx["savings_balance"] = bal.get("balance_lkr", ctx.get("savings_balance"))
            ctx["balance_lkr"] = bal.get("balance_lkr", ctx.get("balance_lkr"))
            # Real last 5 transactions
            txns = await seylan_acct.get_recent_transactions(account_number, n=5)
            if txns:
                ctx["recent_transactions"] = txns
            log.info("enriched account-context with real data for %s balance=%.2f txns=%d",
                     account_number, bal.get("balance_lkr", 0), len(txns))
        except Exception as exc:
            log.warning("Seylan enrichment failed for %s: %s — using fixture", user_id, exc)

    return ctx


@router.get("/family-wallet/{account_id}")
async def family_wallet(account_id: str):
    data = _load("family_wallet.json")
    if account_id not in data:
        return JSONResponse(status_code=404, content={"error": f"Unknown account {account_id}"})
    log.info("mock_call family-wallet account_id=%s", account_id)
    wallet = dict(data[account_id])

    # Merge live Supabase transactions on top of fixture
    try:
        live_rows = supabase_client.get_recent_transactions(account_id, limit=20)
        if live_rows:
            fixture_txns = {t["id"]: t for t in wallet.get("recent_transactions", [])}
            for row in live_rows:
                row_id = row.get("id", row.get("transaction_id", ""))
                fixture_txns[row_id] = {
                    "id": row_id,
                    "date": row.get("timestamp") or row.get("created_at"),
                    "merchant": row.get("merchant", ""),
                    "amount_lkr": row.get("amount_lkr", 0),
                    "type": row.get("type", "debit"),
                    "bucket_id": row.get("bucket_id"),
                    "bucket_label": row.get("bucket_label"),
                }
            merged = sorted(fixture_txns.values(),
                            key=lambda t: t.get("date") or "", reverse=True)
            wallet["recent_transactions"] = merged[:10]
            _apply_live_rows_to_wallet_buckets(wallet, live_rows)
    except Exception as exc:
        log.warning("Could not merge Supabase transactions: %s", exc)

    # Apply saved allocation rule percentages (sender → this family account)
    try:
        rule = supabase_client.get_allocation_rules("SEY-USR-001", account_id)
        if rule and rule.get("buckets"):
            total_bal = float(wallet.get("total_balance_lkr", 0))
            for br in rule["buckets"]:
                bid = br.get("id")
                pct = float(br.get("pct", 0))
                if not bid:
                    continue
                for b in wallet.get("buckets", []):
                    rbid = b.get("id") or b.get("bucket_id")
                    if rbid == bid:
                        b["allocated_pct"] = pct
                        b["allocated_lkr"] = round(total_bal * pct / 100.0, 2)
                        break
    except Exception as exc:
        log.warning("merge allocation_rules into wallet failed: %s", exc)

    return wallet


@router.get("/loans/{user_id}")
async def loans(user_id: str):
    from app.services import loan_state
    override = loan_state.get_loan_data(user_id)
    if override is not None:
        log.info("mock_call loans user_id=%s (in-memory override)", user_id)
        return override
    data = _load("loans.json")
    if user_id not in data:
        return JSONResponse(status_code=404, content={"error": f"Unknown user {user_id}"})
    log.info("mock_call loans user_id=%s (fixture)", user_id)
    return data[user_id]


@router.get("/business-account/{user_id}")
async def business_account(user_id: str):
    data = _load("business_account.json")
    if user_id not in data:
        return JSONResponse(status_code=404, content={"error": f"Unknown user {user_id}"})
    log.info("mock_call business-account user_id=%s", user_id)
    return data[user_id]


@router.get("/pl-summary/{user_id}")
async def pl_summary(user_id: str):
    data = _load("pl_summary.json")
    if user_id not in data:
        return JSONResponse(status_code=404, content={"error": f"Unknown user {user_id}"})
    log.info("mock_call pl-summary user_id=%s", user_id)
    return data[user_id]


@router.post("/trigger-spend")
async def trigger_spend(req: TriggerSpendRequest):
    log.info("mock_call trigger-spend account=%s merchant=%s amount=%s",
             req.account_id, req.merchant, req.amount_lkr)
    try:
        row = supabase_client.insert_transaction(
            account_id=req.account_id,
            merchant=req.merchant,
            amount_lkr=req.amount_lkr,
            bucket_id=req.bucket_id,
            bucket_label=req.bucket_id.replace("_", " ").title(),
            source="mock",
        )
        txn_id = row.get("id", f"txn_demo_{uuid.uuid4().hex[:6]}")
    except Exception as exc:
        log.warning("Supabase insert failed: %s — returning mock response", exc)
        txn_id = f"txn_demo_{uuid.uuid4().hex[:6]}"

    return {
        "transaction_id": txn_id,
        "status": "POSTED",
        "bucket_id": req.bucket_id,
        "new_bucket_balance_lkr": 71500 - req.amount_lkr,
        "supabase_event_fired": True,
    }


@router.post("/tax-jar/trigger")
async def tax_jar_trigger(req: TaxJarTriggerRequest):
    log.info("mock_call tax-jar/trigger user=%s amount=%s", req.user_id, req.incoming_amount_lkr)
    tax_amount = round(req.incoming_amount_lkr * 0.10)
    base_balance = 15070
    new_balance = base_balance + tax_amount
    return {
        "transaction_id": f"biz_demo_tax_{uuid.uuid4().hex[:6]}",
        "incoming_amount_lkr": req.incoming_amount_lkr,
        "tax_transfer_amount_lkr": tax_amount,
        "to_account_id": "SEY-SAV-001",
        "new_tax_jar_balance_lkr": new_balance,
        "fund_transfer_id": f"FT-2026-{uuid.uuid4().hex[:5].upper()}",
        "status": "COMPLETED",
        "message_si": f"LKR {tax_amount:,} ක් ඔබේ බදු ඉතිරිකිරීමේ ගිණුමට ස්වයංක්‍රීයව මාරු කරන ලදී.",
    }


@router.post("/reset-demo")
async def reset_demo():
    result: dict = {}
    try:
        result = supabase_client.reset_demo_full()
        log.info("reset-demo complete: %s", result)
    except Exception as exc:
        log.warning("reset-demo supabase error: %s", exc)
        result = {"error": str(exc)}
    return {
        "reset": True,
        "tax_jar": 15070,
        "buckets": "reset",
        "transactions_cleared": result.get("transactions_cleared", 0),
        "sessions": result.get("sessions", "cleared"),
    }


@router.post("/seed")
async def admin_seed():
    tables_reset = []
    try:
        cleared = supabase_client.clear_demo_transactions("SEY-ACC-002")
        tables_reset.append(f"transactions ({cleared} rows)")
    except Exception as exc:
        log.warning("seed: transactions clear failed: %s", exc)

    try:
        supabase_client.reset_demo_state()
        tables_reset.append("demo_state")
    except Exception as exc:
        log.warning("seed: demo_state reset failed: %s", exc)

    from app.routers.loans import _advisor_cache
    from app.routers.business import _insight_cache
    from app.services.categorizer import _cache as cat_cache
    _advisor_cache.clear()
    _insight_cache.clear()
    cat_cache.clear()
    _fixture_cache.clear()
    tables_reset.append("in-process caches (advisor, categorizer, insight, fixtures)")

    return {"status": "seeded", "tables_reset": tables_reset}


@router.post("/warm-up")
async def warm_up():
    import asyncio
    import time
    results: dict[str, str] = {}

    # 1 — Groq
    t0 = time.monotonic()
    try:
        from app.services import groq_client as _groq
        await _groq.complete(
            system_prompt="You are a ping test. Reply with one word.",
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=3,
            temperature=0.0,
        )
        results["groq"] = f"ok ({int((time.monotonic()-t0)*1000)}ms)"
    except Exception as exc:
        results["groq"] = f"error: {exc}"
        log.warning("warm-up groq failed: %s", exc)

    # 2 — ElevenLabs
    t0 = time.monotonic()
    try:
        from app.services import elevenlabs_client as _tts
        await asyncio.to_thread(_tts.text_to_speech, "ready", "en")
        results["elevenlabs"] = f"ok ({int((time.monotonic()-t0)*1000)}ms)"
    except Exception as exc:
        results["elevenlabs"] = f"error: {exc}"
        log.warning("warm-up elevenlabs failed: %s", exc)

    # 3 — Supabase
    t0 = time.monotonic()
    try:
        await asyncio.to_thread(supabase_client.ping)
        results["supabase"] = f"ok ({int((time.monotonic()-t0)*1000)}ms)"
    except Exception as exc:
        results["supabase"] = f"error: {exc}"
        log.warning("warm-up supabase failed: %s", exc)

    log.info("warm-up complete: %s", results)
    return results
