# models.py — Pydantic request/response schemas for all endpoints
"""
All input validation and output shaping lives here.
FastAPI automatically uses these for:
  - Request body parsing & validation → 422 on failure
  - OpenAPI schema generation
  - Response serialisation
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


# ── Shared helpers ────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─────────────────────────────────────────────────────────────────────────────
#  /predict
# ─────────────────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    teamId: str = Field(..., description="MongoDB team ObjectId or unique identifier")
    teamName: Optional[str] = Field(None, description="Human-readable team name")
    alignmentScore: float = Field(..., ge=0, le=100, description="Current alignment score 0-100")
    projectVelocity: float = Field(..., ge=0, le=100, description="Project velocity 0-100")
    understanding: Optional[float] = Field(50.0, ge=0, le=100)
    department: Optional[str] = Field("Unknown", description="Team department")
    trend: Optional[str] = Field("stable", description="One of: improving | stable | declining")

    @field_validator("trend")
    @classmethod
    def validate_trend(cls, v: str) -> str:
        allowed = {"improving", "stable", "declining"}
        if v not in allowed:
            raise ValueError(f"trend must be one of {allowed}")
        return v


class RecommendationItem(BaseModel):
    action: str
    impact: str                    # "high" | "medium" | "low"
    priority: int                  # 1 = highest
    category: str
    expectedImprovement: float     # percentage points expected gain


class PredictResponse(BaseModel):
    teamId: str
    teamName: Optional[str]
    riskScore: float = Field(..., ge=0, le=100)
    riskLevel: str                 # "critical" | "high" | "medium" | "low"
    weeksToFailure: Optional[int]
    confidence: float = Field(..., ge=0, le=1)
    recommendations: List[RecommendationItem]
    source: str = "ml_engine"
    timestamp: str = Field(default_factory=_now_iso)


# ─────────────────────────────────────────────────────────────────────────────
#  /analyze
# ─────────────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    strategy: str = Field(..., min_length=10, description="Strategy document text")
    communications: List[str] = Field(
        default_factory=list,
        description="List of communication samples (emails, slack msgs, etc.)",
    )
    teamName: Optional[str] = None
    teamId: Optional[str] = None


class AnalyzeResponse(BaseModel):
    alignmentScore: float = Field(..., ge=0, le=100)
    understanding: float = Field(..., ge=0, le=100)
    driftSignals: List[str]
    strategyKeywords: List[str]
    mentionRate: float             # fraction of comms that mention strategy keywords
    summary: str
    source: str                    # "gemini" | "mock"
    confidence: float = Field(..., ge=0, le=1)
    timestamp: str = Field(default_factory=_now_iso)


# ─────────────────────────────────────────────────────────────────────────────
#  /sentiment
# ─────────────────────────────────────────────────────────────────────────────

class SentimentRequest(BaseModel):
    texts: List[str] = Field(
        ..., min_length=1, description="List of text samples to analyse"
    )

    @field_validator("texts")
    @classmethod
    def non_empty_texts(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("texts list must not be empty")
        cleaned = [t.strip() for t in v if t.strip()]
        if not cleaned:
            raise ValueError("texts list contains only blank strings")
        return cleaned


class SentimentScore(BaseModel):
    text: str
    label: str       # "positive" | "neutral" | "negative"
    score: float     # confidence 0-1
    mood: str        # "engaged" | "neutral" | "stressed" | "disengaged"


class SentimentResponse(BaseModel):
    sentiment_scores: List[SentimentScore]
    overall_mood: str
    concern_phrases: List[str]
    positive_ratio: float
    negative_ratio: float
    neutral_ratio: float
    source: str                    # "huggingface" | "mock"
    timestamp: str = Field(default_factory=_now_iso)


# ─────────────────────────────────────────────────────────────────────────────
#  /recommend
# ─────────────────────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    teamId: str
    teamName: str
    alignmentScore: float = Field(..., ge=0, le=100)
    riskScore: float = Field(..., ge=0, le=100)
    driftSignals: List[str] = Field(default_factory=list)
    understanding: Optional[float] = Field(50.0, ge=0, le=100)
    projectVelocity: Optional[float] = Field(50.0, ge=0, le=100)
    trend: Optional[str] = "stable"


class FullRecommendation(BaseModel):
    action: str
    rationale: str
    impact: str
    priority: int
    category: str
    expectedImprovement: float
    timeframe: str                 # e.g. "2 weeks"


class RecommendResponse(BaseModel):
    teamId: str
    teamName: str
    recommendations: List[FullRecommendation]
    expectedImprovement: float     # total % points improvement expected
    timeToRecovery: str            # human-readable e.g. "4-6 weeks"
    priorityLevel: str             # "critical" | "high" | "medium" | "low"
    confidence: float
    timestamp: str = Field(default_factory=_now_iso)


# ─────────────────────────────────────────────────────────────────────────────
#  Health check
# ─────────────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    uptime: float
    model_ready: bool
    timestamp: str = Field(default_factory=_now_iso)
    external_apis: Dict[str, str]  # e.g. {"gemini": "configured", "huggingface": "missing"}
