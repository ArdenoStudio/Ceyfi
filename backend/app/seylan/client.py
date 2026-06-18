import logging
from enum import Enum
import httpx
from app.config import settings
from app.seylan.exceptions import SeylanAPIError

log = logging.getLogger(__name__)


class ServiceGroup(str, Enum):
    DEFAULT = "default"
    QR = "qr"


def _base_url(group: ServiceGroup) -> str:
    return settings.seylan_gateway_qr if group == ServiceGroup.QR else settings.seylan_gateway_default


def _headers() -> dict:
    return {"x-api-key": settings.seylan_api_key, "Accept": "application/json"}


def assert_success(response: dict, wrapper_key: str) -> dict:
    inner = response.get(wrapper_key, response)
    status = inner.get("Status", {})
    code = status.get("Code", "")
    if code != "0000":
        raise SeylanAPIError(
            code=code,
            message=status.get("Message") or "",
            description=status.get("Description") or "",
            txn_ref=status.get("Transaction_Reference") or "",
        )
    return inner


async def seylan_get(group: ServiceGroup, path: str, params: dict) -> dict:
    url = f"{_base_url(group)}{path}"
    log.info("Seylan GET %s params=%s", path, list(params.keys()))
    async with httpx.AsyncClient(verify=False, timeout=15.0) as c:
        resp = await c.get(url, headers=_headers(), params=params)
        resp.raise_for_status()
        return resp.json()


async def seylan_post(group: ServiceGroup, path: str, body: dict) -> dict:
    url = f"{_base_url(group)}{path}"
    log.info("Seylan POST %s", path)
    async with httpx.AsyncClient(verify=False, timeout=15.0) as c:
        resp = await c.post(url, headers=_headers(), json=body)
        resp.raise_for_status()
        return resp.json()