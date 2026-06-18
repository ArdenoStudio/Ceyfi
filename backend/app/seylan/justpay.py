from app.seylan.exceptions import NotConfiguredError


def _check():
    raise NotConfiguredError("JustPay credentials not yet configured")


async def register_account(req: dict) -> str:
    _check()


async def verify_registration(request_id: str, otp: str) -> dict:
    _check()


async def get_certificate(req: dict) -> dict:
    _check()


async def sign_digital_mandate(req: dict) -> str:
    _check()


async def initiate_transaction(req: dict) -> dict:
    _check()


async def get_transaction_status(justpay_code: str, retrieval_reference: str) -> dict:
    _check()


async def refund_transaction(req: dict) -> dict:
    _check()