import uuid
from app.seylan.client import ServiceGroup, seylan_post, assert_success

_TRANSFER_PATH = "/Posting/Account/InternalTransfer/1.0/TransferFunds"
_CEFTS_PATH    = "/Posting/Account/Cefts/1.0/InitiateCEFTSTransfer"


async def transfer_funds(source: str, destination: str, amount: float,
                         category: str = "EXT", user_ref: str | None = None,
                         src_narration: str = "", dst_narration: str = "") -> dict:
    ref = user_ref or str(uuid.uuid4()).replace("-", "")[:16]
    body = {
        "FundsTransfer_Request": {
            "Account_category": category,
            "Source_account_number": source,
            "Destination_account_number": destination,
            "Transaction_amount": f"{amount:.2f}",
            "User_reference": ref,
            "Source_account_narration_1": src_narration,
            "Destination_account_narration_1": dst_narration,
        }
    }
    raw = await seylan_post(ServiceGroup.DEFAULT, _TRANSFER_PATH, body)
    inner = assert_success(raw, "FundsTransfer_Response")
    status = inner.get("Status", {})
    return {"transaction_reference": status.get("Transaction_Reference", ""), "user_reference": ref}


async def initiate_cefts(payload: dict) -> dict:
    raw = await seylan_post(ServiceGroup.DEFAULT, _CEFTS_PATH,
                            {"CEFTSTransactionRequest": payload})
    inner = assert_success(raw, "CEFTSTransactionResponse")
    detail = inner.get("CEFTSTransaction_Detail", {})
    return {
        "transaction_reference": inner.get("Status", {}).get("Transaction_Reference", ""),
        "transaction_id": detail.get("Transaction_id", ""),
        "approval_number": detail.get("Approval_number", ""),
        "response_code": detail.get("Response_code", ""),
    }