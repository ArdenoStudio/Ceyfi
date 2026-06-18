import base64
import hashlib
import hmac


def checksum_b64(secret: str, pipe_string: str) -> str:
    """HMAC-SHA512 over pipe_string, uppercase hex, then Base64-encode the hex string."""
    mac = hmac.new(secret.encode("utf-8"), pipe_string.encode("utf-8"), hashlib.sha512).digest()
    hex_upper = mac.hex().upper()
    return base64.b64encode(hex_upper.encode("ascii")).decode("ascii")


def build_pipe(*fields: str) -> str:
    """Join fields with | using empty string for None/blank."""
    return "|".join(f if f else "" for f in fields)