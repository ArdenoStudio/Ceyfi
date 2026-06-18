import asyncio
import os
import time

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BACKEND_URL = os.getenv("SEYLAN_BACKEND_URL", "http://localhost:8000").rstrip("/")
TIMEOUT = float(os.getenv("CHECK_TIMEOUT_SECONDS", "5.0"))

app = FastAPI(title="SeylanHub Status Agent", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SERVICES: dict[str, dict] = {
    "health": {
        "label": "Core API",
        "url": f"{BACKEND_URL}/health",
        "method": "GET",
        "aliases": ["api", "backend", "core api", "core"],
    },
    "wallet": {
        "label": "Wallet Service",
        "url": f"{BACKEND_URL}/api/wallet/rules/demo_user",
        "method": "GET",
        "aliases": ["wallet", "transfer", "family wallet"],
    },
    "loans": {
        "label": "Loans Service",
        "url": f"{BACKEND_URL}/api/loans/demo_user/health",
        "method": "GET",
        "aliases": ["loan", "loans", "borrower", "credit"],
    },
    "mock": {
        "label": "Demo Data",
        "url": f"{BACKEND_URL}/mock/account-context/demo_user",
        "method": "GET",
        "aliases": ["mock", "demo", "demo data", "fixture", "fixtures", "seed"],
    },
}


async def _probe(client: httpx.AsyncClient, name: str, cfg: dict) -> dict:
    t0 = time.perf_counter()
    try:
        r = await client.request(cfg["method"], cfg["url"], timeout=TIMEOUT)
        latency = round((time.perf_counter() - t0) * 1000)
        ok = r.status_code < 500
        return {
            "service": name,
            "label": cfg["label"],
            "status": "up" if ok else "degraded",
            "http_status": r.status_code,
            "latency_ms": latency,
        }
    except (httpx.TimeoutException, httpx.ConnectError) as exc:
        latency = round((time.perf_counter() - t0) * 1000)
        return {
            "service": name,
            "label": cfg["label"],
            "status": "down",
            "http_status": None,
            "latency_ms": latency,
            "error": type(exc).__name__,
        }


async def _full_status() -> dict:
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_probe(client, n, c) for n, c in SERVICES.items()])

    services = list(results)
    all_up = all(s["status"] == "up" for s in services)
    any_down = any(s["status"] == "down" for s in services)
    overall = "operational" if all_up else ("outage" if any_down else "degraded")

    return {
        "overall": overall,
        "backend_url": BACKEND_URL,
        "services": services,
        "checked_at": time.time(),
    }


def _status_emoji(status: str) -> str:
    return {"up": "✅", "degraded": "⚠️", "down": "❌"}.get(status, "❓")


def _explain_result(result: dict, q: str) -> str:
    status = result["status"]
    label = result["label"]
    latency = result["latency_ms"]
    http = result["http_status"]
    emoji = _status_emoji(status)

    if status == "up" and http == 404:
        return (
            f"⚠️ {label} is reachable ({latency}ms) but returned HTTP 404. "
            "The service is running, but no data is seeded for demo_user. "
            "This is a data issue, not an infrastructure outage."
        )
    elif status == "up":
        return (
            f"{emoji} {label} is operational. "
            f"Responding in {latency}ms (HTTP {http})."
        )
    elif status == "degraded":
        hint = ""
        if http == 404:
            hint = " The endpoint exists but returned 404 — likely no data seeded for demo_user."
        elif http == 422:
            hint = " The request was rejected — possible schema or auth issue."
        elif http and http >= 500:
            hint = " The server returned an error — the service may be misconfigured."
        return (
            f"{emoji} {label} is degraded (HTTP {http}, {latency}ms).{hint}"
        )
    else:
        err = result.get("error", "connection error")
        return (
            f"{emoji} {label} is unreachable ({err}, {latency}ms). "
            "The service may be down or the machine is cold-starting."
        )


# ── Nasiko agent health ────────────────────────────────────────────────────────

@app.get("/health")
async def agent_health():
    return {"status": "healthy", "service": "seylan-status"}


# ── Status endpoints ───────────────────────────────────────────────────────────

@app.get("/status")
async def full_status():
    return await _full_status()


@app.get("/check/{service}")
async def check_service(service: str):
    if service not in SERVICES:
        return {"error": f"Unknown service '{service}'.", "available": list(SERVICES.keys())}
    async with httpx.AsyncClient() as client:
        return await _probe(client, service, SERVICES[service])


# ── Nasiko natural-language entry point ───────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    context: dict = {}


@app.post("/")
async def handle_query(req: QueryRequest):
    q = req.query.lower()

    # Match against service key, label, and aliases
    matched_name = None
    for name, cfg in SERVICES.items():
        all_terms = [name, cfg["label"].lower()] + [a.lower() for a in cfg.get("aliases", [])]
        if any(term in q for term in all_terms):
            matched_name = name
            break

    if matched_name:
        cfg = SERVICES[matched_name]
        async with httpx.AsyncClient() as client:
            result = await _probe(client, matched_name, cfg)
        return {
            "response": _explain_result(result, q),
            "data": result,
        }

    # Full status summary
    status = await _full_status()
    up = [s for s in status["services"] if s["status"] == "up"]
    issues = [s for s in status["services"] if s["status"] != "up"]
    overall_emoji = _status_emoji("up" if not issues else ("down" if any(s["status"] == "down" for s in issues) else "degraded"))

    if not issues:
        response = f"{overall_emoji} All {len(up)} SeylanHub services are operational."
    else:
        issue_summary = ", ".join(
            f"{s['label']} ({s['status']})" for s in issues
        )
        response = (
            f"{overall_emoji} {len(up)}/{len(status['services'])} services operational. "
            f"Issues: {issue_summary}."
        )

    return {"response": response, "data": status}
