from app.seylan.exceptions import NotConfiguredError
from app.seylan.client import ServiceGroup, seylan_post, seylan_get, assert_success
from app.seylan.checksum import checksum_b64, build_pipe
from app.config import settings


def _check_merchant():
    if not settings.seylan_merchant_channel_user_id:
        raise NotConfiguredError("Merchant QR credentials not yet configured")


async def merchant_generate_qr(type_: str, amount: float,
                                bill_no: str = "", mobile_no: str = "",
                                request_ref: str | None = None) -> dict:
    _check_merchant()
    import uuid
    ref = request_ref or str(uuid.uuid4().int)[:12]
    mid = settings.seylan_merchant_mid
    tid = settings.seylan_merchant_tid
    pipe = build_pipe(ref, mid, tid, settings.seylan_merchant_login_id,
                      type_, f"{amount:.0f}", bill_no, mobile_no)
    checksum = checksum_b64(settings.seylan_checksum_key_merchant, pipe)
    body = {
        "GenerateQR_Request": {
            "Institution_id": settings.seylan_merchant_institution_id,
            "Channel_user_id": settings.seylan_merchant_channel_user_id,
            "Channel_pass": settings.seylan_merchant_channel_pass,
            "Request_ref_no": ref,
            "Merchant_login_id": settings.seylan_merchant_login_id,
            "Merchant_login_pass": settings.seylan_merchant_login_pass,
            "Function": "generateQRAPI",
            "Type": type_,
            "Mid": mid,
            "Tid": tid,
            "Transaction_amount": f"{amount:.0f}",
            "Transaction_currency": "144",
            "Bill_no": bill_no,
            "Mobile_no": mobile_no,
            "Check_sum": checksum,
        }
    }
    raw = await seylan_post(ServiceGroup.DEFAULT, "/MerchantQR/1.0/GenerateQR", body)
    inner = assert_success(raw, "GenerateQR_Response")
    info = inner.get("QR_Information", {})
    return {"qr_data_uri": info.get("QR_code", ""), "request_ref_no": ref}


async def lankaqr_initiate(req: dict) -> dict:
    raise NotConfiguredError("LankaQR credentials not yet configured")


async def vmqr_initiate(req: dict) -> dict:
    raise NotConfiguredError("VMQR credentials not yet configured")