import json
import logging
import re
from app.services.context_builder import CATEGORIZER_SYSTEM
from app.services import groq_client

log = logging.getLogger(__name__)

# --- Deterministic fallback regexes ---
_RULES = [
    ("INCOME",    "ආදායම",      "Sales Revenue",   r"Cash Sale|LankaPay QR|Customer Payment|Refund"),
    ("SUPPLIER",  "සැපයුම්කරු", "Supplier Purchase", r"Nippon|Damro|Lanka Aluminium|A\.Baur|Asian Paints|Supplier Invoice"),
    ("UTILITIES", "උපයෝගිතා",  "Utility Bill",    r"CEB|NWSB|National Water|SLT|Dialog|Mobitel|Broadband"),
    ("WAGES",     "වැටුප්",     "Staff Payment",   r"Wages|Staff Advance|Staff Salary"),
    ("RENT",      "කුලිය",      "Premises Rent",   r"Rent|Lease"),
    ("TRANSPORT", "ප්‍රවාහන",   "Local Transport", r"PickMe|Three-Wheeler|Lorry Hire|Lorry|Tuk|Taxi"),
]


def _heuristic(txn: dict) -> dict:
    tid = txn.get("transaction_id") or txn.get("id", "")
    desc = txn.get("description", "")
    amount = txn.get("amount_lkr", 0)
    for cat_en, cat_si, sub, pattern in _RULES:
        if re.search(pattern, desc, re.IGNORECASE):
            return {"id": tid, "description": desc, "amount_lkr": amount,
                    "category_en": cat_en, "category_si": cat_si,
                    "subcategory": sub, "confidence": 0.75}
    return {"id": tid, "description": desc, "amount_lkr": amount,
            "category_en": "MISC", "category_si": "විවිධ",
            "subcategory": "Miscellaneous", "confidence": 0.5}


# Process-lifetime cache keyed by frozen set of ids
_cache: dict[frozenset, list[dict]] = {}


async def categorize_transactions(transactions: list[dict]) -> list[dict]:
    key = frozenset(t.get("transaction_id") or t.get("id","") for t in transactions)
    if key in _cache:
        return _cache[key]

    batch = json.dumps(transactions, ensure_ascii=False)
    user_msg = f"TRANSACTIONS TO CATEGORIZE:\n{batch}"
    try:
        raw = await groq_client.complete(
            system_prompt=CATEGORIZER_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
            max_tokens=2048,
            temperature=0.1,
        )
        # Strip markdown fences if present
        raw = re.sub(r"^```[a-z]*\n?", "", raw.strip(), flags=re.MULTILINE)
        raw = re.sub(r"\n?```$", "", raw.strip())
        cats = json.loads(raw)
        if not isinstance(cats, list):
            raise ValueError(f"Expected JSON list from Groq, got {type(cats).__name__}")
        # Merge amounts/descriptions back in
        by_id = {(t.get("transaction_id") or t.get("id","")): t for t in transactions}
        result = []
        for c in cats:
            cid = c.get("id") or c.get("transaction_id", "")
            orig = by_id.get(cid, {})
            result.append({
                "id": cid,
                "description": orig.get("description", ""),
                "amount_lkr": orig.get("amount_lkr", 0),
                "category_en": c.get("category_en", "MISC"),
                "category_si": c.get("category_si", "විවිධ"),
                "subcategory": c.get("subcategory", ""),
                "confidence": c.get("confidence", 0.8),
            })
        _cache[key] = result
        return result
    except Exception as exc:
        log.warning("Groq categorization failed (%s), using heuristic fallback", exc)
        result = [_heuristic(t) for t in transactions]
        _cache[key] = result
        return result