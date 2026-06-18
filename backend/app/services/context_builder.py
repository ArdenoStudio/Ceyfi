from datetime import date


def build_assistant_system_prompt(
    account_context: dict,
    language: str = "en",
    loans_detail: dict | None = None,
    wallet: dict | None = None,
    business: dict | None = None,
) -> str:
    name = account_context.get("name") or account_context.get("account_holder", "Customer")
    savings = account_context.get("savings_balance", 0)
    current = account_context.get("current_balance", 0)
    today = date.today().isoformat()

    txns = account_context.get("recent_transactions", [])
    txn_lines = "\n".join(
        f"  - {t.get('date') or t.get('timestamp','')[:10]}: "
        f"{t.get('description','Transaction')} — "
        f"LKR {abs(t.get('amount_lkr', 0)):,.0f} "
        f"({'debit' if t.get('type') == 'debit' or t.get('amount_lkr', 0) < 0 else 'credit'})"
        for t in txns[:5]
    )

    # Use detailed loans data if available, otherwise fall back to account_context loans
    raw_loans = (loans_detail.get("loans") if loans_detail else None) or account_context.get("loans", [])
    loan_lines = "\n".join(
        f"  - {l.get('type', l.get('loan_id', 'Loan'))}: "
        f"LKR {l.get('outstanding_lkr', l.get('outstanding_amount_lkr', 0)):,.0f} outstanding "
        f"of LKR {l.get('disbursed_lkr', l.get('disbursed_amount_lkr', 0)):,.0f} disbursed, "
        f"{l.get('payments_made', '?')}/{l.get('total_payments', '?')} payments made, "
        f"LKR {l.get('monthly_payment_lkr', l.get('monthly_installment_lkr', 0)):,.0f}/month at "
        f"{l.get('interest_rate_pct', '?')}% p.a., "
        f"next payment {l.get('next_payment_date', 'unknown')}, "
        f"health: {l.get('health_score', 'unknown')}, "
        f"payoff: {l.get('projected_payoff_date', 'unknown')}"
        for l in raw_loans
    ) or "  None"

    fds = account_context.get("fixed_deposits", [])
    fd_lines = "\n".join(
        f"  - LKR {f.get('amount_lkr', f.get('principal_lkr', 0)):,.0f} "
        f"at {f.get('interest_rate_pct', 0)}% p.a., "
        f"matures {f.get('maturity_date','unknown')}"
        for f in fds
    ) or "  None"

    lang_instruction = (
        "Always respond in English. Be clear and concise."
        if language == "en"
        else "Always respond in Sinhala (Sinhala script). If the user writes in English, still respond in Sinhala."
    )

    wallet_section = ""
    if wallet:
        buckets = wallet.get("buckets", [])
        bucket_lines = "\n".join(
            f"  - {b.get('label', b.get('id'))}: "
            f"LKR {b.get('balance_lkr', 0):,.0f} available, "
            f"LKR {b.get('spent_lkr', 0):,.0f} spent, "
            f"{b.get('allocated_pct', b.get('allocation_pct', 0))}% allocation"
            for b in buckets
        )
        last_rem = wallet.get("last_remittance")
        rem_line = (
            f"\n  Last remittance: LKR {last_rem.get('amount_lkr', 0):,.0f} "
            f"on {last_rem.get('date', 'unknown')} "
            f"(GBP {last_rem.get('sender_amount_gbp', last_rem.get('amount_gbp', '?'))} "
            f"@ {last_rem.get('exchange_rate', last_rem.get('fx_rate', '?'))})"
            if last_rem else ""
        )
        wallet_section = f"""
Family Wallet (linked account — {wallet.get('account_holder', 'Family')}):
  Total balance: LKR {wallet.get('total_balance_lkr', 0):,.0f}{rem_line}
  Buckets:
{bucket_lines}"""

    business_section = ""
    if business:
        biz_txns = business.get("transactions", [])
        biz_txn_lines = "\n".join(
            f"  - {t.get('timestamp', '')[:10]}: {t.get('description', 'Transaction')} — "
            f"LKR {t.get('amount_lkr', 0):,.0f} ({t.get('type', '')})"
            for t in biz_txns[:5]
        )
        business_section = f"""
Business Account ({business.get('business_name', 'Business')} — {business.get('location', '')}):
  Current balance: LKR {business.get('current_balance', 0):,.0f}
  Tax jar balance: LKR {business.get('tax_jar_balance', 0):,.0f} (rule: {business.get('tax_jar_rule_pct', 0)}% auto-save)
  Recent business transactions (last 5):
{biz_txn_lines if biz_txn_lines else "  No recent transactions"}"""

    return f"""You are Seylan AI, a personal banking assistant for Seylan Bank Sri Lanka. You have access to the customer's live account data shown below.

{lang_instruction}

Be helpful, warm, and concise. Maximum 3 sentences per response unless the customer asks for detail. Never make up information that is not in the account context. Never reveal internal account IDs, NIC numbers, or system fields. If asked something outside your account context, answer briefly and honestly.

You can also help customers pay their loan instalments. When a user asks to make a payment, pay their loan, or settle an instalment, use the pay_loan_instalment tool to generate a secure payment link.

CUSTOMER ACCOUNT CONTEXT:
Name: {name}
Savings account balance: LKR {savings:,.0f}
Current account balance: LKR {current:,.0f}

Recent transactions (last 5):
{txn_lines if txn_lines else "  No recent transactions"}

Active loans:
{loan_lines}

Fixed deposits:
{fd_lines}{wallet_section}{business_section}

Today's date is {today}. Use this when the customer asks about dates relative to today."""


def build_loan_advisor_prompt(loan: dict) -> str:
    paid = loan.get("payments_made", 0)
    total = loan.get("total_payments", 36)
    pct = round(paid / total * 100) if total else 0
    remaining = total - paid

    return f"""You are a loan advisor for Seylan Bank Sri Lanka. Give a brief, encouraging, and accurate 2-3 sentence summary of the customer's loan health. Be specific with numbers. Mention the payoff date. If they are on track, say so positively. If they could save money by paying extra, mention the exact saving. Do not use bullet points. Write in plain conversational English.

LOAN DATA:
Loan type: {loan.get('type', 'Loan')}
Original amount: LKR {loan.get('disbursed_lkr', 0):,.0f}
Outstanding: LKR {loan.get('outstanding_lkr', 0):,.0f}
Payments made: {paid} of {total}
Percent paid: {pct}%
Months remaining: {remaining}
Monthly instalment: LKR {loan.get('monthly_payment_lkr', 0):,.0f}
Missed payments: {loan.get('missed_payments', 0)}
Health score: {loan.get('health_score', 'UNKNOWN')}
Projected payoff date: {loan.get('projected_payoff_date', 'unknown')}"""


CATEGORIZER_SYSTEM = """You are a financial transaction categorizer for Sri Lankan small businesses. Categorize each transaction into exactly one of these categories: INCOME, SUPPLIER, UTILITIES, WAGES, RENT, TRANSPORT, MISC. Also provide the Sinhala translation.

CATEGORIES:
- INCOME (ආදායම): Any credit - cash sales, QR payments, customer payments, refunds
- SUPPLIER (සැපයුම්කරු): Payments to named suppliers - paint, cement, tiles, hardware stock
- UTILITIES (උපයෝගිතා): CEB, water board, SLT/Dialog, broadband bills
- WAGES (වැටුප්): Staff wages, advances, bonuses - any payment to an employee
- RENT (කුලිය): Shop rent, warehouse rent, premises lease
- TRANSPORT (ප්‍රවාහන): PickMe, three-wheeler, lorry hire, fuel, delivery charges
- MISC (විවිධ): Stationery, refreshments, anything that doesn't fit above

Return ONLY a valid JSON array. No markdown, no explanation. Each object must have: id, category_en, category_si, subcategory, confidence (0.0-1.0)."""