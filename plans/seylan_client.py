"""
Seylan Bank Sandbox API client.

Drop this into: backend/services/seylan_client.py

Env vars expected:
  SEYLAN_API_BASE   = http://34.21.206.87:3000   (sandbox proxy)
  SEYLAN_API_KEY    = 5be33036-59e9-4224-969f-41a1657bd1b7
  USE_SEYLAN_REAL   = true   (set to "false" to fall back to mock fixtures)
"""

from __future__ import annotations

import os
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config — pulled from env vars so Railway / local .env just works
# ---------------------------------------------------------------------------

SEYLAN_API_BASE: str = os.getenv("SEYLAN_API_BASE", "http://34.21.206.87:3000")
SEYLAN_API_KEY: str = os.getenv("SEYLAN_API_KEY", "5be33036-59e9-4224-969f-41a1657bd1b7")
USE_SEYLAN_REAL: bool = os.getenv("USE_SEYLAN_REAL", "false").lower() == "true"

# All sandbox accounts share category "EXT"
ACCOUNT_CATEGORY = "EXT"

# Default demo source account (Nimal Fernando — used for Tax Jar and diaspora wallet)
DEFAULT_SOURCE_ACCOUNT = os.getenv("SEYLAN_SOURCE_ACCOUNT", "064000012548001")

# Shared async HTTP client — created once at module import time
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=SEYLAN_API_BASE,
            headers={"x-api-key": SEYLAN_API_KEY, "Content-Type": "application/json"},
            timeout=httpx.Timeout(15.0, connect=5.0),
        )
    return _client


async def close() -> None:
    """Call on app shutdown (lifespan) to release connections."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()


# ---------------------------------------------------------------------------
# Status-code helpers
# ---------------------------------------------------------------------------

SEYLAN_SUCCESS = "0000"

SEYLAN_ERROR_MESSAGES: dict[str, str] = {
    "1010": "Internal communication failure at Seylan gateway",
    "2020": "Request rejected by Seylan core banking",
    "2030": "Account validation failed",
    "2070": "Transaction failed at core banking",
    "2090": "Invalid request parameters",
    "2100": "Account does not exist",
    "2150": "Insufficient funds",
    "2160": "Debits not allowed on this account",
}


def _assert_ok(status_block: dict[str, Any], context: str = "") -> None:
    """Raise RuntimeError if Seylan returned a non-0000 status code."""
    code = status_block.get("Code", "UNKNOWN")
    if code != SEYLAN_SUCCESS:
        msg = SEYLAN_ERROR_MESSAGES.get(code, f"Unknown Seylan error code {code}")
        raise RuntimeError(f"Seylan API error [{code}] {msg}" + (f" — {context}" if context else ""))


# ---------------------------------------------------------------------------
# 1. Account Balance Inquiry
#    Maps to: /mock/family-wallet/{accountId}  (balance field)
#             AI assistant context injection
# ---------------------------------------------------------------------------

async def get_account_balance(account_number: str = DEFAULT_SOURCE_ACCOUNT) -> dict[str, Any]:
    """
    GET /Inquiry/Account/AccountInquiry/1.0/GetAccountBalance

    Returns a normalised dict:
      {
        "account_number": "064000012548001",
        "account_holder": "Nimal Fernando",
        "balance_lkr": 285400.75,
        "ledger_balance_lkr": 285400.75,
        "currency": "LKR"
      }
    """
    resp = await _get_client().get(
        "/Inquiry/Account/AccountInquiry/1.0/GetAccountBalance",
        params={"AccountCategory": ACCOUNT_CATEGORY, "AccountNumber": account_number},
    )
    resp.raise_for_status()
    body = resp.json()

    outer = body.get("Account_Balance_Inquiry", {})
    _assert_ok(outer.get("Status", {}), context=f"account={account_number}")

    acct = outer.get("Account", {})
    return {
        "account_number": account_number,
        "account_holder": acct.get("Customer_full_name", ""),
        "balance_lkr": _to_float(acct.get("Current_available_balance", "0")),
        "ledger_balance_lkr": _to_float(acct.get("Ledger_balance", "0")),
        "currency": "LKR",
    }


# ---------------------------------------------------------------------------
# 2. Transaction History
#    Maps to: /mock/business-account/{userId}  (recent_transactions)
#             AI assistant context injection
#             Loan dashboard (payment history parsing)
# ---------------------------------------------------------------------------

async def get_account_transactions(
    account_number: str = DEFAULT_SOURCE_ACCOUNT,
    n: int = 20,
) -> dict[str, Any]:
    """
    GET /Inquiry/Account/AccountInquiry/1.0/GetAccountTransactions

    Returns:
      {
        "account_number": "...",
        "account_holder": "...",
        "balance_lkr": 285400.75,
        "transactions": [
          {
            "date": "2025-10-01",
            "amount_lkr": -5000.0,      # negative = debit, positive = credit
            "description": "CEFTS Transfer",
            "reference": "SEY-HUB-001",
            "running_balance_lkr": 280400.75
          },
          ...
        ]
      }
    """
    resp = await _get_client().get(
        "/Inquiry/Account/AccountInquiry/1.0/GetAccountTransactions",
        params={
            "AccountCategory": ACCOUNT_CATEGORY,
            "AccountNumber": account_number,
            "NumberOfTransactions": str(n),
        },
    )
    resp.raise_for_status()
    body = resp.json()

    outer = body.get("TransactionHistoryInquiryResponse", {})
    _assert_ok(outer.get("Status", {}), context=f"account={account_number}")

    summary = outer.get("AccountSummary", {})
    raw_txns = outer.get("Transaction", [])
    if isinstance(raw_txns, dict):
        # API returns a single object (not array) when n=1
        raw_txns = [raw_txns]

    transactions = [_map_transaction(t) for t in raw_txns]

    return {
        "account_number": account_number,
        "account_holder": summary.get("Customer_full_name", ""),
        "balance_lkr": _to_float(summary.get("Current_available_balance", "0")),
        "transactions": transactions,
    }


def _map_transaction(raw: dict[str, Any]) -> dict[str, Any]:
    """Convert one Seylan transaction record to SeylanHub schema."""
    # Posting_amount is a signed string: "+5000.00" or "-1000.00"
    amount_str = str(raw.get("Posting_amount", "0")).replace(",", "")
    amount = _to_float(amount_str)

    return {
        "date": raw.get("Posting_date", ""),
        "amount_lkr": amount,
        "description": raw.get("Transaction_Code_Name", ""),
        "reference": raw.get("Users_own_reference", ""),
        "running_balance_lkr": _to_float(raw.get("Running_balance", "0")),
    }


# ---------------------------------------------------------------------------
# 3. Internal Transfer (same-bank)
#    Maps to: POST /api/wallet/transfer  (when both accounts are Seylan)
#             Tax Jar auto-save trigger
# ---------------------------------------------------------------------------

async def internal_transfer(
    amount: float,
    destination_account: str,
    reference: str = "SEY-HUB",
    source_account: str = DEFAULT_SOURCE_ACCOUNT,
) -> dict[str, Any]:
    """
    POST /Posting/Account/InternalTransfer/1.0/TransferFunds

    Returns:
      {
        "success": True,
        "transaction_reference": "TXN20251001001",
        "source_account": "064000012548001",
        "destination_account": "...",
        "amount_lkr": 1000.0,
        "reference": "SEY-HUB"
      }
    """
    payload = {
        "FundsTransfer_Request": {
            "Account_category": ACCOUNT_CATEGORY,
            "Source_account_number": source_account,
            "Destination_account_number": destination_account,
            "Transaction_amount": f"{amount:.2f}",
            "User_reference": reference,
        }
    }

    resp = await _get_client().post(
        "/Posting/Account/InternalTransfer/1.0/TransferFunds",
        json=payload,
    )
    resp.raise_for_status()
    body = resp.json()

    outer = body.get("FundsTransfer_Response", {})
    status = outer.get("Status", {})
    _assert_ok(status, context=f"src={source_account} dst={destination_account} amt={amount}")

    return {
        "success": True,
        "transaction_reference": status.get("Transaction_Reference", ""),
        "source_account": source_account,
        "destination_account": destination_account,
        "amount_lkr": amount,
        "reference": reference,
    }


# ---------------------------------------------------------------------------
# 4. CEFTS Interbank Transfer (cross-bank real-time)
#    Maps to: POST /api/wallet/transfer  (when destination is another bank)
#             Diaspora remittance to family (family may bank elsewhere)
# ---------------------------------------------------------------------------

async def cefts_transfer(
    amount: float,
    destination_account: str,
    destination_bank_code: str,
    reference: str = "SEY-HUB",
    source_account: str = DEFAULT_SOURCE_ACCOUNT,
    currency: str = "LKR",
) -> dict[str, Any]:
    """
    POST /Posting/Account/Cefts/1.0/InitiateCEFTSTransfer

    destination_bank_code: LankaPay 4-digit bank code (e.g. "6990" for a test bank)
      See fintech-vault/12-Research/Seylan Hub — Integration Architecture.md for full list.

    Returns:
      {
        "success": True,
        "transaction_id": "CEFTS20251001001",
        "approval_number": "123456",
        "source_account": "...",
        "destination_account": "...",
        "destination_bank_code": "6990",
        "amount_lkr": 100.0,
        "currency": "LKR"
      }
    """
    payload = {
        "CEFTSTransactionRequest": {
            "Processing_code": "482000",
            "Transaction_code": "52",
            "Account_category": ACCOUNT_CATEGORY,
            "Source_account_number": source_account,
            "Destination_account_number": destination_account,
            "Destination_bank_code": destination_bank_code,
            "Transaction_amount": str(int(amount)),  # API expects integer string
            "Currency_code": currency,
            "Reference": reference,
        }
    }

    resp = await _get_client().post(
        "/Posting/Account/Cefts/1.0/InitiateCEFTSTransfer",
        json=payload,
    )
    resp.raise_for_status()
    body = resp.json()

    outer = body.get("CEFTSTransactionResponse", {})
    _assert_ok(outer.get("Status", {}), context=f"src={source_account} dst={destination_account} bank={destination_bank_code}")

    detail = outer.get("CEFTSTransaction_Detail", {})
    return {
        "success": True,
        "transaction_id": detail.get("Transaction_id", ""),
        "approval_number": detail.get("Approval_number", ""),
        "source_account": source_account,
        "destination_account": destination_account,
        "destination_bank_code": destination_bank_code,
        "amount_lkr": amount,
        "currency": currency,
    }


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _to_float(value: str | int | float) -> float:
    try:
        return float(str(value).replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


# ---------------------------------------------------------------------------
# Convenience: build AI assistant context string
#    Call this in context_builder.py to inject real account data into Groq prompt
# ---------------------------------------------------------------------------

async def build_account_context(account_number: str = DEFAULT_SOURCE_ACCOUNT) -> str:
    """
    Returns a compact natural-language summary of the account for injection
    into the Groq system prompt. Catches errors gracefully so the AI can
    still respond even if the Seylan sandbox is down.
    """
    try:
        balance_data = await get_account_balance(account_number)
        txn_data = await get_account_transactions(account_number, n=10)
    except Exception as exc:
        logger.warning("Seylan API unavailable for context build: %s", exc)
        return "Live account data is temporarily unavailable."

    holder = balance_data["account_holder"]
    balance = balance_data["balance_lkr"]
    txns = txn_data["transactions"]

    recent_lines = []
    for t in txns[:5]:
        sign = "+" if t["amount_lkr"] >= 0 else ""
        recent_lines.append(
            f"  {t['date']}: {sign}{t['amount_lkr']:,.2f} LKR — {t['description']}"
        )
    recent_str = "\n".join(recent_lines) if recent_lines else "  No recent transactions"

    return (
        f"Account holder: {holder}\n"
        f"Current available balance: LKR {balance:,.2f}\n"
        f"Recent transactions (newest first):\n{recent_str}"
    )
