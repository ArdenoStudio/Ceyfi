"""In-memory rolling metrics store. Tracks latency and success/error counts per agent.

Data lives in the process — resets on restart. Good enough for a live demo.
"""
import datetime
import time
from collections import deque
from dataclasses import dataclass, field
from threading import Lock

# Route prefixes → agent key
ROUTE_MAP: dict[str, str] = {
    "/api/chat": "seylan_ai",
    "/api/loans/advisor": "loan_advisor",
    "/api/categorize-transactions": "categorizer",
    "/api/tts": "tts_agent",
    "/api/wallet/": "wallet",
}

AGENT_DEFS = [
    {"key": "seylan_ai",    "label": "Seylan AI",                "description": "Conversational banking assistant"},
    {"key": "loan_advisor", "label": "Loan Advisor",             "description": "AI-powered loan health & advisory"},
    {"key": "categorizer",  "label": "Transaction Categorizer",  "description": "Business analytics & spend categorization"},
    {"key": "tts_agent",    "label": "Voice (TTS)",              "description": "Multilingual text-to-speech"},
    {"key": "wallet",       "label": "Wallet Service",           "description": "Family wallet & remittance transfers"},
]


@dataclass
class _AgentStore:
    events: deque = field(default_factory=lambda: deque(maxlen=5000))

    def record(self, latency_ms: float, success: bool) -> None:
        self.events.append((time.time(), latency_ms, success))


_stores: dict[str, _AgentStore] = {d["key"]: _AgentStore() for d in AGENT_DEFS}
_lock = Lock()


def route_to_agent(path: str) -> str | None:
    for prefix, key in ROUTE_MAP.items():
        if path.startswith(prefix):
            return key
    return None


def record(agent_key: str, latency_ms: float, success: bool) -> None:
    with _lock:
        store = _stores.get(agent_key)
        if store:
            store.record(latency_ms, success)


def _hourly_series(events: list[tuple[float, float, bool]], now: float) -> list[dict]:
    bucket_data: list[dict] = [{"lats": [], "success": 0, "error": 0} for _ in range(24)]

    for ts, lat, ok in events:
        age = now - ts
        if age > 86400:
            continue
        bucket_idx = 23 - min(int(age / 3600), 23)  # 0=oldest hour, 23=current hour
        bucket_data[bucket_idx]["lats"].append(lat)
        if ok:
            bucket_data[bucket_idx]["success"] += 1
        else:
            bucket_data[bucket_idx]["error"] += 1

    result = []
    for i, b in enumerate(bucket_data):
        ts = now - (23 - i) * 3600
        dt = datetime.datetime.utcfromtimestamp(ts)
        avg_lat = round(sum(b["lats"]) / len(b["lats"])) if b["lats"] else 0
        result.append({
            "hour": f"{dt.hour:02d}:00",
            "responseTime": avg_lat,
            "success": b["success"],
            "error": b["error"],
        })
    return result


def get_agent_stats(agent_key: str) -> dict:
    with _lock:
        store = _stores.get(agent_key)
        events_snapshot = list(store.events) if store else []

    now = time.time()
    cutoff = now - 86400
    recent = [(ts, lat, ok) for ts, lat, ok in events_snapshot if ts >= cutoff]

    if not recent:
        return {
            "successCount": 0,
            "errorCount": 0,
            "avgResponseTime": 0,
            "uptime": 100.0,
            "currentLatency": None,
            "status": "up",
            "series": _hourly_series([], now),
        }

    total = len(recent)
    success_count = sum(1 for _, _, ok in recent if ok)
    error_count = total - success_count
    avg_lat = sum(lat for _, lat, _ in recent) / total
    uptime = (success_count / total) * 100

    five_min_ago = now - 300
    recent_5m = [lat for ts, lat, _ in recent if ts >= five_min_ago]
    current_latency = round(sum(recent_5m) / len(recent_5m)) if recent_5m else None

    status = "up"
    if uptime < 95:
        status = "degraded"
    if uptime < 80:
        status = "down"

    return {
        "successCount": success_count,
        "errorCount": error_count,
        "avgResponseTime": round(avg_lat),
        "uptime": round(uptime, 1),
        "currentLatency": current_latency,
        "status": status,
        "series": _hourly_series(recent, now),
    }


def get_all_metrics() -> dict:
    agents = []
    for defn in AGENT_DEFS:
        stats = get_agent_stats(defn["key"])
        agents.append({**defn, **stats})
    return {
        "agents": agents,
        "phoenixConnected": True,
        "generatedAt": datetime.datetime.utcnow().isoformat() + "Z",
    }
