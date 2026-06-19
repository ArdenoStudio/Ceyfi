"""Demo persona authentication endpoints."""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.services.auth import (
    DEMO_PERSONAS,
    create_session_token,
    list_personas,
    resolve_session,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)


@router.get("/personas")
async def get_personas():
    return {"personas": list_personas()}


@router.post("/login")
async def login(req: LoginRequest):
    if not settings.demo_session_secret:
        raise HTTPException(status_code=503, detail="Demo authentication is not configured")
    if req.user_id not in DEMO_PERSONAS:
        raise HTTPException(status_code=404, detail="Unknown persona")
    persona = DEMO_PERSONAS[req.user_id]
    token = create_session_token(req.user_id)
    return {
        "token": token,
        "user": persona,
    }


@router.get("/me")
async def me(authorization: str | None = Header(default=None)):
    session = resolve_session(authorization)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": session}
