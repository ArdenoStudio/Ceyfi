from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field


class AllocationRule(BaseModel):
    bucket_id: str
    pct: float = Field(..., ge=0, le=100)


class SaveAllocationRulesRequest(BaseModel):
    allocation_rules: list[AllocationRule]
    account_id: str = "SEY-ACC-002"


class WalletTransferRequest(BaseModel):
    sender_account_id: str = Field(..., min_length=1, max_length=64)
    recipient_account_id: str = Field(..., min_length=1, max_length=64)
    amount_lkr: float = Field(..., gt=0, le=50_000_000)
    corridor: str = Field(default="GBPLKR", max_length=16)
    allocation_rules: list[AllocationRule] = Field(..., min_length=1, max_length=20)


class BucketCredit(BaseModel):
    bucket_id: str
    amount_lkr: float


class RemittanceTrackStep(BaseModel):
    id: str
    state: str
    at: str | None = None


class RemittanceTracking(BaseModel):
    transfer_id: str
    status: str
    amount_lkr: float
    corridor: str
    current_step: str
    steps: list[RemittanceTrackStep]
    updated_at: str
    source: str = "demo_tracker"


class WalletTransferResponse(BaseModel):
    transfer_id: str
    status: str
    amount_lkr: float
    timestamp: str
    buckets_credited: list[BucketCredit]
    note: str | None = None
    tracking: RemittanceTracking | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    session_id: str = Field(..., max_length=128)
    message: str = Field(..., min_length=1, max_length=4096)
    language: str = Field(default="en", max_length=8)
    history: list[ChatMessage] = Field(default_factory=list, max_length=50)


class TtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(default="en", max_length=8)


class TtsResponse(BaseModel):
    audio_base64: str
    content_type: str = "audio/mpeg"
    duration_ms: int


class LoanAdvisorRequest(BaseModel):
    user_id: str
    loan_id: str | None = None


class LoanAdvisorResponse(BaseModel):
    advisor_text: str
    language: str
    health_score: str


class LoanHealthResponse(BaseModel):
    user_id: str
    health_score: str
    summary: str


class CategorizeRequest(BaseModel):
    user_id: str = "SEY-BIZ-001"
    transaction_ids: list[str] | None = None


class CategorizedTransaction(BaseModel):
    id: str
    description: str
    amount_lkr: float
    category_en: str
    category_si: str
    subcategory: str
    confidence: float


class CategorizeResponse(BaseModel):
    categorized: list[CategorizedTransaction]


class TaxJarRuleRequest(BaseModel):
    user_id: str
    from_account_id: str
    to_account_id: str
    percentage: float = Field(..., ge=0, le=100)
    label: str = "Tax Savings"


class TaxJarRuleResponse(BaseModel):
    rule_id: str
    status: str
    message: str
    message_si: str


class TriggerSpendRequest(BaseModel):
    account_id: str
    merchant: str
    amount_lkr: float
    bucket_id: str


class TaxJarTriggerRequest(BaseModel):
    user_id: str
    incoming_amount_lkr: float
    description: str