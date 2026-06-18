from datetime import date, timedelta
from app.seylan.client import ServiceGroup, seylan_get, assert_success

_BALANCE_PATH = "/Inquiry/Account/AccountInquiry/1.0/GetAccountBalance"
_TXN_PATH     = "/Inquiry/Account/AccountInquiry/1.0/GetAccountTransactions"


async def get_balance(account_number: str, category: str = "EXT") -> dict:
    raw = await seylan_get(ServiceGroup.DEFAULT, _BALANCE_PATH,
                           {"AccountCategory": category, "AccountNumber": account_number})
    inner = assert_success(raw, "Account_Balance_Inquiry")
    acct = inner.get("Account", {})
    return {
        "account_number": account_number,
        "account_holder": acct.get("Customer_full_name", ""),
        "balance_lkr": float(acct.get("Current_available_balance") or acct.get("Ledger_balance") or 0),
        "ledger_balance": float(acct.get("Ledger_balance") or 0),
        "currency": acct.get("Currency_mnemonic", "LKR"),
        "raw": acct,
    }


async def get_transactions(account_number: str, start_date: str, end_date: str,
                           category: str = "EXT") -> list[dict]:
    params = {"AccountCategory": category, "AccountNumber": account_number,
              "StartDate": start_date, "EndDate": end_date}
    raw = await seylan_get(ServiceGroup.DEFAULT, _TXN_PATH, params)
    inner = assert_success(raw, "TransactionHistoryInquiryResponse")
    txns = inner.get("Transaction", [])
    if isinstance(txns, dict):
        txns = [txns]
    return _map_transactions(txns)


async def get_recent_transactions(account_number: str, n: int = 5,
                                   category: str = "EXT") -> list[dict]:
    params = {"AccountCategory": category, "AccountNumber": account_number,
              "NumberOfTransactions": str(n)}
    raw = await seylan_get(ServiceGroup.DEFAULT, _TXN_PATH, params)
    inner = assert_success(raw, "TransactionHistoryInquiryResponse")
    txns = inner.get("Transaction", [])
    if isinstance(txns, dict):
        txns = [txns]
    return _map_transactions(txns)


async def iter_transactions_range(account_number: str, start: str, end: str,
                                   category: str = "EXT") -> list[dict]:
    """Paginate until Date_to >= end."""
    all_txns: list[dict] = []
    cursor = start
    while True:
        params = {"AccountCategory": category, "AccountNumber": account_number,
                  "StartDate": cursor, "EndDate": end}
        raw = await seylan_get(ServiceGroup.DEFAULT, _TXN_PATH, params)
        inner = assert_success(raw, "TransactionHistoryInquiryResponse")
        txns = inner.get("Transaction", [])
        if isinstance(txns, dict):
            txns = [txns]
        all_txns.extend(_map_transactions(txns))
        date_to = inner.get("AccountSummary", {}).get("Date_to", end)
        if not txns or date_to >= end:
            break
        next_cursor = (date.fromisoformat(date_to) + timedelta(days=1)).isoformat()
        if next_cursor > end:
            break
        cursor = next_cursor
    return all_txns


def _map_transactions(raw_list: list[dict]) -> list[dict]:
    out = []
    for t in raw_list:
        amount_raw = t.get("Posting_amount", "0") or "0"
        try:
            amount = float(amount_raw)
        except ValueError:
            amount = 0.0
        out.append({
            "id": t.get("Narrative_4") or t.get("Event_key", ""),
            "date": t.get("Posting_date", ""),
            "description": t.get("Transaction_Code_Name", "") + (
                f" — {t['Users_own_reference']}" if t.get("Users_own_reference") else ""),
            "amount_lkr": amount,
            "type": "debit" if amount < 0 else "credit",
            "bucket_id": None,
        })
    return out