"""Unified financial snapshot API."""

from fastapi import APIRouter, HTTPException

from app.services.auth import DEMO_PERSONAS, get_persona
from app.services.financial_snapshot import build_financial_snapshot

router = APIRouter(prefix="/api", tags=["snapshot"])


@router.get("/financial-snapshot/{user_id}")
async def financial_snapshot(user_id: str):
    persona_info = get_persona(user_id)
    if user_id not in DEMO_PERSONAS and user_id not in ("SEY-USR-001", "SEY-USR-003", "SEY-BIZ-001"):
        # Allow legacy user IDs from fixtures
        from pathlib import Path
        import json
        fx = Path(__file__).parent.parent.parent / "fixtures" / "account_context.json"
        data = json.loads(fx.read_text(encoding="utf-8"))
        if user_id not in data and user_id != "SEY-BIZ-001":
            raise HTTPException(status_code=404, detail=f"Unknown user {user_id}")

    persona = persona_info["persona"] if persona_info else "diaspora"
    snapshot = await build_financial_snapshot(user_id, persona=persona)
    return snapshot
