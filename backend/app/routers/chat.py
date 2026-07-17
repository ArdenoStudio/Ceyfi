import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.config import settings
from app.models.schemas import ChatRequest
from app.services import groq_client, supabase_client, claude_client
from app.services.context_builder import build_assistant_system_prompt
from app.services.chat_tools import TOOL_DEFINITIONS, execute_tool, execute_tool_async
from app.services.auth import assert_user_access

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

# In-process fixture cache
_ctx_cache: dict[str, dict] = {}
_fixture_cache: dict[str, dict] = {}


def _load_fixture(name: str) -> dict:
    from pathlib import Path
    if name not in _fixture_cache:
        fx = Path(__file__).parent.parent.parent / "fixtures" / name
        _fixture_cache[name] = json.loads(fx.read_text(encoding="utf-8"))
    return _fixture_cache[name]


def _get_account_context(user_id: str) -> dict:
    if user_id in _ctx_cache:
        return _ctx_cache[user_id]
    data = _load_fixture("account_context.json")
    # Fallback to SEY-USR-001 demo data if user not in fixtures
    ctx = data.get(user_id) or data.get("SEY-USR-001", {
        "user_id": user_id, "name": "Customer",
        "savings_balance": 0, "current_balance": 0,
        "recent_transactions": [], "loans": [], "fixed_deposits": [],
    })
    _ctx_cache[user_id] = ctx
    return ctx


def _get_supplemental_context(user_id: str) -> tuple[dict | None, dict | None]:
    """Load loans detail and family wallet for richer AI context."""
    loans_detail = None
    wallet = None
    try:
        loans_data = _load_fixture("loans.json")
        loans_detail = loans_data.get(user_id)
    except Exception:
        pass
    try:
        # Only inject the family wallet for the persona that actually owns one
        # (Nimal). Sunil/Suresh have wallet_account_id=None → no wallet section,
        # so we never leak Nimal's wallet into another customer's context.
        from app.services.auth import get_persona
        persona = get_persona(user_id)
        wallet_id = persona.get("wallet_account_id") if persona else None
        if wallet_id:
            wallet_data = _load_fixture("family_wallet.json")
            wallet = wallet_data.get(wallet_id)
    except Exception:
        pass
    return loans_detail, wallet


def _offline_chat_reply(
    message: str,
    language: str,
    account_ctx: dict,
    loans_detail: dict | None,
) -> str:
    """Deterministic reply when Groq/OpenAI are unavailable (local demos)."""
    loan = None
    if isinstance(loans_detail, dict):
        nested = loans_detail.get("loans")
        if isinstance(nested, list) and nested:
            loan = nested[0]
        elif loans_detail.get("next_payment_date") or loans_detail.get("monthly_payment_lkr"):
            loan = loans_detail
    elif isinstance(loans_detail, list) and loans_detail:
        loan = loans_detail[0]
    if not loan:
        loans = account_ctx.get("loans") or []
        loan = loans[0] if loans else {}

    due = loan.get("next_payment_date") or loan.get("next_due_date") or "2026-07-25"
    monthly = float(loan.get("monthly_payment_lkr") or loan.get("emi_lkr") or 22000)
    outstanding = float(loan.get("outstanding_lkr") or 0)
    health = str(loan.get("health_score") or "ON_TRACK").replace("_", " ")
    name = account_ctx.get("name") or account_ctx.get("account_holder") or "there"
    balance = float(
        account_ctx.get("current_balance")
        or account_ctx.get("balance_lkr")
        or account_ctx.get("savings_balance")
        or 0
    )

    msg = (message or "").lower()
    wants_loan = any(
        token in msg
        for token in ("ණය", "loan", "emi", "instalment", "installment", "ගෙවීම", "due")
    )

    if language == "si" and wants_loan:
        return (
            f"{name}, ඔබේ ඊළඟ ණය වාරිකය {due} දාට ගෙවිය යුතුයි — "
            f"LKR {monthly:,.0f}. වත්මන් ශේෂය LKR {balance:,.0f} වන අතර "
            f"ණය තත්ත්වය {health} වේ."
            + (f" හිඟ මුදල LKR {outstanding:,.0f}." if outstanding else "")
        )
    if wants_loan:
        return (
            f"{name}, your next loan instalment of LKR {monthly:,.0f} is due on {due}. "
            f"Current liquid balance is about LKR {balance:,.0f}; loan health is {health}."
            + (f" Outstanding balance LKR {outstanding:,.0f}." if outstanding else "")
        )
    if language == "si":
        return (
            f"{name}, ඔබේ වත්මන් ශේෂය LKR {balance:,.0f} පමණ වේ. "
            f"ණය වාරිකය LKR {monthly:,.0f} — ඊළඟ දිනය {due}."
        )
    return (
        f"{name}, your current balance is about LKR {balance:,.0f}. "
        f"Next loan instalment LKR {monthly:,.0f} is due {due}."
    )


@router.post("/chat")
async def chat(req: ChatRequest, request: Request):
    session = getattr(request.state, "session", None)
    assert_user_access(session, req.user_id)
    account_ctx = _get_account_context(req.user_id)
    if settings.use_seylan_real:
        try:
            from app.seylan import account as seylan_acct
            account_number = settings.seylan_sandbox_source_account
            if account_number:
                bal = await seylan_acct.get_balance(account_number)
                txns = await seylan_acct.get_recent_transactions(account_number, n=5)
                account_ctx = {
                    **account_ctx,
                    "balance_lkr": bal.get("balance_lkr", account_ctx.get("balance_lkr")),
                    "current_balance": bal.get("balance_lkr", account_ctx.get("current_balance")),
                    "savings_balance": bal.get("balance_lkr", account_ctx.get("savings_balance")),
                    "recent_transactions": txns or account_ctx.get("recent_transactions", []),
                }
        except Exception as exc:
            log.warning("Seylan balance fetch for context failed: %s", exc)

    loans_detail, wallet = _get_supplemental_context(req.user_id)
    system_prompt = build_assistant_system_prompt(account_ctx, req.language, loans_detail=loans_detail, wallet=wallet)
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    async def event_stream():
        full_response = []
        payment_action = None
        try:
            # Check if message triggers a payment tool call (non-streaming pre-check)
            try:
                probe = await groq_client.complete_with_tools(
                    system_prompt, messages,
                    tools=[t for t in TOOL_DEFINITIONS if t["function"]["name"] == "pay_loan_instalment"],
                    max_tokens=64, temperature=0.1,
                )
                if probe.tool_calls:
                    tc = probe.tool_calls[0]
                    fn_args = json.loads(tc.function.arguments)
                    result_str = await execute_tool_async(tc.function.name, {**fn_args, "user_id": req.user_id})
                    result = json.loads(result_str)
                    if "checkout_url" in result:
                        payment_action = result
                        # Inject tool result and get follow-up text
                        messages.append({
                            "role": "assistant", "content": None,
                            "tool_calls": [{"id": tc.id, "type": "function",
                                            "function": {"name": tc.function.name,
                                                         "arguments": tc.function.arguments}}],
                        })
                        messages.append({"role": "tool", "tool_call_id": tc.id, "content": result_str})
            except Exception as probe_exc:
                log.debug("payment probe skipped: %s", probe_exc)

            async for event_type, content in claude_client.stream_chat(system_prompt, messages):
                if event_type == "thinking":
                    payload = json.dumps({"thinking": content}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
                else:
                    full_response.append(content)
                    payload = json.dumps({"token": content}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"

            if payment_action:
                pa_payload = json.dumps({"payment_action": payment_action}, ensure_ascii=False)
                yield f"data: {pa_payload}\n\n"

            yield 'data: {"done": true}\n\n'
        except Exception as exc:
            # Local / keyless demos: stream a fixture-grounded answer instead of a hard fail.
            log.warning("Groq streaming error: %s — using deterministic chat fallback", exc)
            fallback = _offline_chat_reply(
                req.message, req.language, account_ctx, loans_detail
            )
            full_response.append(fallback)
            # Tokenise lightly so the UI still "streams".
            for i in range(0, len(fallback), 24):
                chunk = fallback[i : i + 24]
                payload = json.dumps({"token": chunk}, ensure_ascii=False)
                yield f"data: {payload}\n\n"
                await asyncio.sleep(0.01)
            yield 'data: {"done": true}\n\n'
        finally:
            # Fire-and-forget session save
            try:
                updated = [{"role": m.role, "content": m.content} for m in req.history]
                updated.append({"role": "user", "content": req.message})
                updated.append({"role": "assistant", "content": "".join(full_response)})
                supabase_client.save_session(req.user_id, req.language, updated)
            except Exception:
                pass

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/chat/actions")
async def chat_with_actions(req: ChatRequest, request: Request):
    """Non-streaming chat that supports tool calling. Returns text + any actions taken."""
    session = getattr(request.state, "session", None)
    assert_user_access(session, req.user_id)
    account_ctx = _get_account_context(req.user_id)
    loans_detail, wallet = _get_supplemental_context(req.user_id)
    system_prompt = build_assistant_system_prompt(account_ctx, req.language, loans_detail=loans_detail, wallet=wallet)
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    actions_taken = []
    try:
        response_msg = await groq_client.complete_with_tools(
            system_prompt, messages, tools=TOOL_DEFINITIONS, max_tokens=512, temperature=0.3,
        )

        if response_msg.tool_calls:
            for tool_call in response_msg.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                result = execute_tool(fn_name, fn_args)
                actions_taken.append({"tool": fn_name, "arguments": fn_args, "result": json.loads(result)})
                messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": tool_call.id, "type": "function", "function": {"name": fn_name, "arguments": tool_call.function.arguments}}]})
                messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": result})

            final_text = await groq_client.complete(system_prompt, messages, max_tokens=512, temperature=0.3)
        else:
            final_text = response_msg.content or ""

        return {"text": final_text, "actions": actions_taken, "language": req.language}

    except Exception as exc:
        log.error("Chat with actions error: %s", exc)
        return {"text": "I'm having trouble right now. Please try again.", "actions": [], "language": req.language}
