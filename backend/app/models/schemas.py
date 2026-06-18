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
    sender_account_id: str
    recipient_account_id: str
    amount_lkr: float
    corridor: str = "GBPLKR"
    allocation_rules: list[AllocationRule]


class BucketCredit(BaseModel):
    bucket_id: str
    amount_lkr: float


class WalletTransferResponse(BaseModel):
    transfer_id: str
    status: str
    amount_lkr: float
    timestamp: str
    buckets_credited: list[BucketCredit]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    language: str = "en"
    history: list[ChatMessage] = []


class TtsRequest(BaseModel):
    text: str
    language: str = "en"


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