import logging
import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.services import metrics_store

from app.config import settings
from app.routers import mock, wallet, chat, tts, loans, business, payments, stt, auth, snapshot

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
log = logging.getLogger(__name__)


# --- Simple in-memory rate limiter ---
_rate_buckets: dict[str, list[float]] = defaultdict(list)
_RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/chat": (20, 60),
    "/api/tts": (10, 60),
    "/api/stt": (10, 60),
    "/api/categorize-transactions": (5, 60),
    "/api/loans/advisor": (10, 60),
}


def _check_rate_limit(path: str, client_ip: str) -> bool:
    for prefix, (max_requests, window_seconds) in _RATE_LIMITS.items():
        if path.startswith(prefix):
            key = f"{client_ip}:{prefix}"
            now = time.time()
            _rate_buckets[key] = [t for t in _rate_buckets[key] if now - t < window_seconds]
            if len(_rate_buckets[key]) >= max_requests:
                return False
            _rate_buckets[key].append(now)
            return True
    return True


async def _prewarm():
    """Pre-generate cached LLM responses so first page loads are instant."""
    if not settings.groq_api_key:
        log.info("PREWARM skipped — GROQ_API_KEY not set")
        return
    try:
        from app.routers.loans import _get_loans, _advisor_cache
        from app.services import groq_client
        from app.services.context_builder import build_loan_advisor_prompt
        for uid in ("SEY-USR-001", "SEY-USR-003"):
            cache_key = f"{uid}:primary"
            if cache_key not in _advisor_cache:
                loans = _get_loans(uid)
                if loans:
                    prompt = build_loan_advisor_prompt(loans[0])
                    text = await groq_client.complete(prompt, [{"role": "user", "content": "Give me my loan summary."}], max_tokens=256, temperature=0.3)
                    _advisor_cache[cache_key] = text
                    log.info("PREWARM advisor %s OK", uid)
    except Exception as exc:
        log.warning("PREWARM advisor failed: %s", exc)

    try:
        from app.services.categorizer import categorize_transactions
        import json
        from pathlib import Path
        fx = Path(__file__).parent.parent / "fixtures" / "business_account.json"
        data = json.loads(fx.read_text(encoding="utf-8"))
        txns = data.get("SEY-BIZ-001", {}).get("transactions", [])
        if txns:
            await categorize_transactions(txns)
            log.info("PREWARM categorization OK (%d txns)", len(txns))
    except Exception as exc:
        log.warning("PREWARM categorization failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("SEYLAN HUB API STARTING — USE_SEYLAN_REAL=%s", settings.use_seylan_real)
    import asyncio
    if settings.database_url:
        try:
            from app.services import supabase_client
            await asyncio.to_thread(supabase_client.run_migrations)
        except Exception as exc:
            log.error("DB migration failed: %s", exc)
    asyncio.create_task(_prewarm())
    yield
    log.info("shutdown")


app = FastAPI(title="CEYFI API — powered by Seylan", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    t0 = time.perf_counter()
    agent_key = metrics_store.route_to_agent(request.url.path)
    response = await call_next(request)
    if agent_key:
        latency_ms = (time.perf_counter() - t0) * 1000
        metrics_store.record(agent_key, latency_ms, response.status_code < 500)
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(request.url.path, client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please try again later."},
            headers={"Retry-After": "60"},
        )

    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


app.include_router(auth.router)
app.include_router(snapshot.router)
app.include_router(mock.router)
app.include_router(wallet.router)
app.include_router(chat.router)
app.include_router(tts.router)
app.include_router(stt.router)
app.include_router(loans.router)
app.include_router(business.router)
app.include_router(payments.router)


@app.exception_handler(Exception)
async def global_error(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    log.error("unhandled error [%s] %s %s: %s", request_id, request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal server error", "request_id": request_id})


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}


@app.get("/api/metrics")
async def get_metrics():
    return metrics_store.get_all_metrics()


@app.get("/health/deep")
async def health_deep():
    deps: dict[str, str] = {}

    if settings.database_url:
        try:
            from app.services import supabase_client
            deps["database"] = "ok" if supabase_client.ping() else "error"
        except Exception:
            deps["database"] = "error"
    else:
        deps["database"] = "not_configured"

    deps["openai"] = "configured" if settings.openai_api_key else "not_configured"
    deps["groq"] = "configured" if settings.groq_api_key else "not_configured"
    deps["elevenlabs"] = "configured" if settings.elevenlabs_api_key else "not_configured"
    deps["seylan_real"] = "enabled" if settings.use_seylan_real else "disabled"

    overall = "ok" if deps.get("groq") == "configured" or deps.get("openai") == "configured" else "degraded"
    return {"status": overall, "version": "0.1.0", "dependencies": deps}
