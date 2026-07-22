"""CEYFI Telegram bot — Phase 1 demo commands against the internal FastAPI backend."""

from __future__ import annotations

import asyncio
import io
import json
import logging
import os
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import httpx
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from telegram import InputFile, Update
from telegram.ext import Application, CommandHandler, ContextTypes

log = logging.getLogger(__name__)

API_BASE = os.getenv("INTERNAL_API_BASE", "http://localhost:8000")
DEFAULT_USER_ID = "SEY-USR-001"
DEFAULT_WALLET_ID = "SEY-ACC-002"

_BOT_DIR = Path(__file__).parent
SUBSCRIBERS_PATH = _BOT_DIR / "subscribers.json"
ALERT_STATE_PATH = _BOT_DIR / "alert_state.json"

CEYFI_DARK = "#052E16"
CEYFI_PRIMARY = "#059669"
CEYFI_LIGHT = "#34D399"
CEYFI_COLORS = [CEYFI_DARK, CEYFI_PRIMARY, CEYFI_LIGHT]

HELP_TEXT = (
    "CEYFI — your money assistant\n\n"
    "Commands:\n"
    "/balance — savings & current account balances\n"
    "/wallet — family wallet buckets\n"
    "/loans — active loan summary\n"
    "/transactions — recent account activity\n"
    "/summary — financial snapshot\n"
    "/chart — wallet bucket chart\n"
    "/spendchart — spending breakdown chart\n"
    "/track [transfer_id] — remittance path status (default latest/demo)\n"
    "/subscribe — hourly spend alerts\n"
    "/unsubscribe — stop spend alerts\n"
    "/ai <question> — ask the CEYFI assistant\n"
    "/help — this message\n\n"
    "Sinhala/Tamil UI is available in the CEYFI app."
)


def _load_json(path: Path, default: dict) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            log.warning("Could not read %s: %s", path, exc)
    return default


def _save_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _load_subscribers() -> set[int]:
    data = _load_json(SUBSCRIBERS_PATH, {"chat_ids": []})
    return {int(cid) for cid in data.get("chat_ids", [])}


def _save_subscribers(chat_ids: set[int]) -> None:
    _save_json(SUBSCRIBERS_PATH, {"chat_ids": sorted(chat_ids)})


def _fmt_lkr(amount: float) -> str:
    return f"LKR {abs(amount):,.0f}"


async def _api_get(path: str) -> dict:
    async with httpx.AsyncClient(base_url=API_BASE, timeout=30.0) as client:
        resp = await client.get(path)
        resp.raise_for_status()
        return resp.json()


async def _api_post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(base_url=API_BASE, timeout=60.0) as client:
        resp = await client.post(path, json=body)
        resp.raise_for_status()
        return resp.json()


def _wallet_path(account_id: str = DEFAULT_WALLET_ID) -> str:
    return f"/mock/family-wallet/{account_id}"


def _account_path(user_id: str = DEFAULT_USER_ID) -> str:
    return f"/mock/account-context/{user_id}"


def _loans_path(user_id: str = DEFAULT_USER_ID) -> str:
    return f"/mock/loans/{user_id}"


def _summary_path(user_id: str = DEFAULT_USER_ID) -> str:
    return f"/api/financial-snapshot/{user_id}"


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    name = update.effective_user.first_name if update.effective_user else "there"
    await update.message.reply_text(
        f"Hi {name}! Welcome to CEYFI on Telegram.\n\n"
        "Track balances, family wallet buckets, loans, and spending with CEYFI.\n\n"
        f"{HELP_TEXT}"
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(HELP_TEXT)


async def cmd_balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        ctx = await _api_get(_account_path())
        lines = [
            f"*{ctx.get('name', 'Account')}*",
            f"Savings: {_fmt_lkr(ctx.get('savings_balance', 0))}",
            f"Current: {_fmt_lkr(ctx.get('current_balance', 0))}",
            f"Total: {_fmt_lkr(ctx.get('balance_lkr', 0))}",
        ]
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    except Exception as exc:
        log.exception("balance command failed")
        await update.message.reply_text(f"Could not fetch balance: {exc}")


async def cmd_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        wallet = await _api_get(_wallet_path())
        lines = [
            f"*Family wallet — {wallet.get('account_holder', DEFAULT_WALLET_ID)}*",
            f"Total: {_fmt_lkr(wallet.get('total_balance_lkr', 0))}",
            "",
            "Buckets:",
        ]
        for bucket in wallet.get("buckets", []):
            label = bucket.get("label", bucket.get("id", "Bucket"))
            bal = bucket.get("balance_lkr", 0)
            spent = bucket.get("spent_lkr", 0)
            pct = bucket.get("allocated_pct", 0)
            lines.append(f"• {label} ({pct}%): {_fmt_lkr(bal)} left · {_fmt_lkr(spent)} spent")
        remit = wallet.get("last_remittance")
        if remit:
            lines.extend(
                [
                    "",
                    f"Last remittance: {_fmt_lkr(remit.get('amount_lkr', 0))} "
                    f"({remit.get('date', '—')})",
                ]
            )
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    except Exception as exc:
        log.exception("wallet command failed")
        await update.message.reply_text(f"Could not fetch wallet: {exc}")


async def cmd_loans(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        data = await _api_get(_loans_path())
        loans = data.get("loans", [])
        if not loans:
            await update.message.reply_text("No active loans found.")
            return
        lines = ["*Your loans*"]
        for loan in loans:
            health = loan.get("health_score", "—")
            lines.extend(
                [
                    "",
                    f"*{loan.get('type', 'Loan')}* ({loan.get('loan_id', '—')})",
                    f"Outstanding: {_fmt_lkr(loan.get('outstanding_lkr', 0))}",
                    f"Monthly: {_fmt_lkr(loan.get('monthly_payment_lkr', 0))}",
                    f"Next due: {loan.get('next_payment_date', '—')}",
                    f"Health: {health}",
                ]
            )
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    except Exception as exc:
        log.exception("loans command failed")
        await update.message.reply_text(f"Could not fetch loans: {exc}")


async def cmd_transactions(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        ctx = await _api_get(_account_path())
        wallet = await _api_get(_wallet_path())
        lines = [f"*Recent transactions — {ctx.get('name', DEFAULT_USER_ID)}*", ""]

        account_txns = ctx.get("recent_transactions", [])[:5]
        if account_txns:
            lines.append("_Personal account:_")
            for txn in account_txns:
                desc = txn.get("description") or txn.get("merchant", "Transaction")
                amt = txn.get("amount_lkr", 0)
                sign = "+" if txn.get("type") == "credit" or amt > 0 else "−"
                lines.append(f"• {txn.get('date', '—')}: {desc} ({sign}{_fmt_lkr(amt)})")
            lines.append("")

        wallet_txns = wallet.get("recent_transactions", [])[:5]
        if wallet_txns:
            lines.append("_Family wallet:_")
            for txn in wallet_txns:
                merchant = txn.get("merchant", "Spend")
                bucket = txn.get("bucket_label") or txn.get("bucket_id") or ""
                suffix = f" [{bucket}]" if bucket else ""
                lines.append(
                    f"• {txn.get('date', '—')}: {merchant}{suffix} "
                    f"(−{_fmt_lkr(txn.get('amount_lkr', 0))})"
                )

        if len(lines) <= 2:
            lines.append("No recent transactions.")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    except Exception as exc:
        log.exception("transactions command failed")
        await update.message.reply_text(f"Could not fetch transactions: {exc}")


async def cmd_summary(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        snap = await _api_get(_summary_path())
        lines = [
            "*Financial snapshot*",
            f"Health score: {snap.get('health_score', '—')}",
            "",
        ]
        components = snap.get("health_components") or {}
        if components:
            lines.append("_Health components:_")
            for key, val in components.items():
                lines.append(f"• {key.replace('_', ' ').title()}: {val}")
            lines.append("")

        decisions = snap.get("decisions") or []
        if decisions:
            lines.append("_Suggested actions:_")
            for item in decisions[:3]:
                title = item.get("title") or item.get("headline") or str(item)
                lines.append(f"• {title}")

        headline = snap.get("headline") or snap.get("summary")
        if headline:
            lines.extend(["", str(headline)])

        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    except Exception as exc:
        log.exception("summary command failed")
        await update.message.reply_text(f"Could not fetch summary: {exc}")


def _make_bucket_chart(wallet: dict) -> io.BytesIO:
    buckets = wallet.get("buckets") or []
    labels = [b.get("label", b.get("id", "?")) for b in buckets]
    balances = [float(b.get("balance_lkr", 0)) for b in buckets]

    fig, ax = plt.subplots(figsize=(6, 4))
    colors = [CEYFI_COLORS[i % len(CEYFI_COLORS)] for i in range(len(labels))]
    ax.bar(labels, balances, color=colors)
    ax.set_title("Family Wallet Buckets", color=CEYFI_DARK, fontweight="bold")
    ax.set_ylabel("Balance (LKR)")
    ax.tick_params(axis="x", rotation=20)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("#F0FDF4")
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf


def _make_spend_chart(wallet: dict) -> io.BytesIO:
    buckets = wallet.get("buckets") or []
    labels = [b.get("label", b.get("id", "?")) for b in buckets]
    spent = [float(b.get("spent_lkr", 0)) for b in buckets]

    by_day: dict[str, float] = defaultdict(float)
    for txn in wallet.get("recent_transactions") or []:
        if str(txn.get("type", "debit")).lower() != "debit":
            continue
        day = str(txn.get("date", ""))[:10] or "Unknown"
        by_day[day] += float(txn.get("amount_lkr", 0))

    fig, axes = plt.subplots(1, 2, figsize=(10, 4))

    colors = [CEYFI_COLORS[i % len(CEYFI_COLORS)] for i in range(len(labels))]
    axes[0].pie(
        spent if any(spent) else [1],
        labels=labels if any(spent) else ["No spend"],
        autopct="%1.0f%%",
        colors=colors if any(spent) else [CEYFI_LIGHT],
        textprops={"color": CEYFI_DARK},
    )
    axes[0].set_title("Spend by Bucket", color=CEYFI_DARK, fontweight="bold")

    if by_day:
        days = sorted(by_day.keys())
        amounts = [by_day[d] for d in days]
        axes[1].bar(days, amounts, color=CEYFI_PRIMARY)
        axes[1].set_title("Recent Daily Spend", color=CEYFI_DARK, fontweight="bold")
        axes[1].tick_params(axis="x", rotation=30)
    else:
        axes[1].text(0.5, 0.5, "No debit transactions", ha="center", va="center")
        axes[1].set_axis_off()

    fig.patch.set_facecolor("white")
    for ax in axes:
        if ax.has_data():
            ax.set_facecolor("#F0FDF4")
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf


async def cmd_chart(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        wallet = await _api_get(_wallet_path())
        buf = _make_bucket_chart(wallet)
        await update.message.reply_photo(
            photo=InputFile(buf, filename="wallet_buckets.png"),
            caption="Family wallet bucket balances",
        )
    except Exception as exc:
        log.exception("chart command failed")
        await update.message.reply_text(f"Could not generate chart: {exc}")


async def cmd_spendchart(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        wallet = await _api_get(_wallet_path())
        buf = _make_spend_chart(wallet)
        await update.message.reply_photo(
            photo=InputFile(buf, filename="spend_chart.png"),
            caption="Spending breakdown",
        )
    except Exception as exc:
        log.exception("spendchart command failed")
        await update.message.reply_text(f"Could not generate spend chart: {exc}")


async def cmd_subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id if update.effective_chat else None
    if chat_id is None:
        return
    subs = _load_subscribers()
    subs.add(chat_id)
    _save_subscribers(subs)
    await update.message.reply_text(
        "You are subscribed to hourly spend alerts for the CEYFI family wallet."
    )


async def cmd_unsubscribe(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id if update.effective_chat else None
    if chat_id is None:
        return
    subs = _load_subscribers()
    subs.discard(chat_id)
    _save_subscribers(subs)
    await update.message.reply_text("Spend alerts unsubscribed.")


async def cmd_ai(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    question = " ".join(context.args).strip() if context.args else ""
    if not question:
        await update.message.reply_text("Usage: /ai <your question>")
        return

    await update.message.reply_text("Thinking…")
    try:
        result = await _api_post(
            "/api/chat/actions",
            {
                "user_id": DEFAULT_USER_ID,
                "session_id": f"telegram-{update.effective_chat.id}",
                "message": question,
                "language": "en",
                "history": [],
            },
        )
        text = result.get("text") or "No response from assistant."
        if len(text) > 4000:
            text = text[:3997] + "..."
        await update.message.reply_text(text)
    except Exception as exc:
        log.exception("ai command failed")
        await update.message.reply_text(f"Assistant unavailable: {exc}")


_STEP_MARKERS = {
    "done": "✅",
    "current": "▶️",
    "pending": "⬜",
    "failed": "❌",
}

_STEP_LABELS = {
    "initiated": "Initiated",
    "corridor": "Corridor",
    "clearing": "Clearing",
    "landed": "Landed",
}


def _format_remittance_track(tracking: dict) -> str:
    transfer_id = tracking.get("transfer_id", "—")
    status = tracking.get("status", "—")
    amount = tracking.get("amount_lkr", 0)
    lines = [
        "*Remittance path*",
        f"Transfer: `{transfer_id}`",
        f"Status: {status}",
        f"Amount: {_fmt_lkr(amount)}",
        "",
        "Steps:",
    ]
    for step in tracking.get("steps") or []:
        state = str(step.get("state", "pending")).lower()
        marker = _STEP_MARKERS.get(state, "⬜")
        step_id = str(step.get("id", "?"))
        label = _STEP_LABELS.get(step_id, step_id.replace("_", " ").title())
        lines.append(f"{marker} {label}")
    return "\n".join(lines)


async def track_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    transfer_id = " ".join(context.args).strip() if context.args else ""
    path = (
        f"/api/wallet/remittance/{transfer_id}/track"
        if transfer_id
        else "/api/wallet/remittance/demo/track"
    )
    try:
        tracking = await _api_get(path)
        await update.message.reply_text(
            _format_remittance_track(tracking),
            parse_mode="Markdown",
        )
    except Exception as exc:
        log.exception("track command failed")
        await update.message.reply_text(f"Could not fetch remittance track: {exc}")


async def notify_remittance_landed(chat_ids: list[int] | set[int], tracking: dict) -> None:
    """Notify chat IDs that a remittance has landed. Callable from wallet router later."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token or not chat_ids:
        return

    amount = tracking.get("amount_lkr", 0)
    transfer_id = tracking.get("transfer_id", "—")
    message = (
        f"*Money landed*\n"
        f"{_fmt_lkr(amount)} is in the family wallet.\n"
        f"Transfer: `{transfer_id}`"
    )

    from telegram import Bot  # noqa: PLC0415

    bot = Bot(token=token)
    for chat_id in chat_ids:
        try:
            await bot.send_message(chat_id=chat_id, text=message, parse_mode="Markdown")
        except Exception as exc:
            log.warning("Failed to notify remittance landed for %s: %s", chat_id, exc)


async def hourly_spend_alert(context: ContextTypes.DEFAULT_TYPE) -> None:
    subscribers = _load_subscribers()
    if not subscribers:
        return

    try:
        wallet = await _api_get(_wallet_path())
    except Exception as exc:
        log.warning("hourly spend alert: wallet fetch failed: %s", exc)
        return

    txns = wallet.get("recent_transactions") or []
    debit_ids = [
        str(t.get("id") or t.get("transaction_id"))
        for t in txns
        if str(t.get("type", "debit")).lower() == "debit"
    ]

    state = _load_json(ALERT_STATE_PATH, {"seen_debit_ids": []})
    seen = set(state.get("seen_debit_ids", []))
    new_ids = [tid for tid in debit_ids if tid and tid not in seen]

    if not new_ids and seen:
        return

    new_txns = [
        t
        for t in txns
        if str(t.get("id") or t.get("transaction_id")) in new_ids
    ]
    if not new_txns and not seen:
        state["seen_debit_ids"] = debit_ids
        state["last_check"] = datetime.now(timezone.utc).isoformat()
        _save_json(ALERT_STATE_PATH, state)
        return

    if not new_txns:
        return

    lines = ["*CEYFI spend alert*", ""]
    total = 0.0
    for txn in new_txns:
        amt = float(txn.get("amount_lkr", 0))
        total += amt
        bucket = txn.get("bucket_label") or txn.get("bucket_id") or "wallet"
        lines.append(
            f"• {txn.get('merchant', 'Spend')} — {_fmt_lkr(amt)} [{bucket}]"
        )
    lines.extend(["", f"Total new spend: {_fmt_lkr(total)}"])

    message = "\n".join(lines)
    for chat_id in subscribers:
        try:
            await context.bot.send_message(chat_id=chat_id, text=message, parse_mode="Markdown")
        except Exception as exc:
            log.warning("Failed to notify subscriber %s: %s", chat_id, exc)

    state["seen_debit_ids"] = list(seen.union(new_ids))
    state["last_check"] = datetime.now(timezone.utc).isoformat()
    _save_json(ALERT_STATE_PATH, state)


def build_application(token: str) -> Application:
    application = Application.builder().token(token).build()

    handlers = [
        ("start", cmd_start),
        ("help", cmd_help),
        ("balance", cmd_balance),
        ("wallet", cmd_wallet),
        ("loans", cmd_loans),
        ("transactions", cmd_transactions),
        ("summary", cmd_summary),
        ("chart", cmd_chart),
        ("spendchart", cmd_spendchart),
        ("track", track_cmd),
        ("subscribe", cmd_subscribe),
        ("unsubscribe", cmd_unsubscribe),
        ("ai", cmd_ai),
    ]
    for name, handler in handlers:
        application.add_handler(CommandHandler(name, handler))

    if application.job_queue is not None:
        application.job_queue.run_repeating(hourly_spend_alert, interval=3600, first=60)
    else:
        log.warning("JobQueue unavailable — install python-telegram-bot[job-queue] for spend alerts")

    return application
