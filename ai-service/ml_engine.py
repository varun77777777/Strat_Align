# ml_engine.py — Deterministic ML prediction engine
"""
Provides:
  - RiskClassifier  : scikit-learn LogisticRegression trained on synthetic data
  - predict()       : main entry point for /predict endpoint
  - recommend()     : full recommendation engine for /recommend endpoint

All results are DETERMINISTIC — same input always produces same output.
The sklearn model is trained once at import time on a fixed synthetic dataset.
"""

from __future__ import annotations

import math
import time
import logging
from typing import List, Optional, Tuple

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from models import (
    PredictRequest,
    PredictResponse,
    RecommendationItem,
    RecommendRequest,
    RecommendResponse,
    FullRecommendation,
)

logger = logging.getLogger("ml_engine")

# ── Synthetic training data ───────────────────────────────────────────────────
# Features: [alignmentScore, projectVelocity, understanding, trend_num]
# Label:    0=low_risk, 1=medium_risk, 2=high_risk
# Generated deterministically with numpy seed=42

_SEED = 42
_rng  = np.random.RandomState(_SEED)

def _make_training_data() -> Tuple[np.ndarray, np.ndarray]:
    n = 300
    alignment  = _rng.uniform(10, 100, n)
    velocity   = _rng.uniform(10, 100, n)
    understand = _rng.uniform(10, 100, n)
    trend_num  = _rng.choice([0, 1, 2], n)   # 0=declining, 1=stable, 2=improving

    # Rule-based labels (mirroring our predict logic) with a little noise
    risk_raw = (100 - alignment) + (100 - velocity) * 0.3 - trend_num * 5
    risk_raw += _rng.normal(0, 3, n)        # small label noise
    risk_raw  = np.clip(risk_raw, 0, 100)

    labels = np.where(risk_raw >= 70, 2, np.where(risk_raw >= 50, 1, 0))
    X = np.column_stack([alignment, velocity, understand, trend_num])
    return X, labels


_X_TRAIN, _Y_TRAIN = _make_training_data()

# ── Model: trained once at module import ──────────────────────────────────────

_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("clf",    LogisticRegression(
        max_iter=500,
        random_state=_SEED,
        C=1.0,
        class_weight="balanced",
    )),
])
_pipeline.fit(_X_TRAIN, _Y_TRAIN)
logger.info("RiskClassifier trained on %d synthetic samples", len(_X_TRAIN))

# ── Helpers ───────────────────────────────────────────────────────────────────

_TREND_MAP = {"declining": 0, "stable": 1, "improving": 2}

def _trend_num(trend: Optional[str]) -> int:
    return _TREND_MAP.get((trend or "stable").lower(), 1)


def _risk_score(alignment: float, velocity: float, trend: Optional[str]) -> float:
    """
    Deterministic formula from spec:
      riskScore = (100 - alignmentScore) + (100 - velocity) * 0.3
    Adjusted slightly by trend:
      declining → +5, improving → -5
    """
    base  = (100.0 - alignment) + (100.0 - velocity) * 0.3
    adj   = {0: +5.0, 1: 0.0, 2: -5.0}.get(_trend_num(trend), 0.0)
    score = base + adj
    return round(float(np.clip(score, 0.0, 100.0)), 2)


def _risk_level(score: float) -> str:
    if score >= 75: return "critical"
    if score >= 55: return "high"
    if score >= 35: return "medium"
    return "low"


def _weeks_to_failure(score: float) -> Optional[int]:
    """Higher risk → fewer weeks. Returns None if risk is low."""
    if score >= 70:  return max(2,  int(6  - (score - 70) / 10))
    if score >= 50:  return max(6,  int(12 - (score - 50) / 4))
    if score >= 35:  return 16
    return None


def _confidence_from_model(features: np.ndarray) -> float:
    """Max class probability from the LR pipeline."""
    proba  = _pipeline.predict_proba(features)[0]
    return round(float(proba.max()), 4)


# ── Recommendation library ─────────────────────────────────────────────────────

_RECS_LIBRARY = [
    # (min_risk, max_risk, action, category, impact, priority, expected_improvement)
    (70, 100, "Immediately escalate misalignment risk to executive leadership",
     "escalation", "high", 1, 6.0),
    (70, 100, "Schedule daily stand-ups focused exclusively on strategy alignment",
     "communication", "high", 2, 10.0),
    (50, 100, "Run a mandatory strategy comprehension workshop for all team members",
     "training", "high", 3, 12.0),
    (50, 100, "Audit and reprioritise project backlog against strategic OKRs",
     "project-management", "high", 4, 8.0),
    (35, 100, "Introduce bi-weekly strategy Q&A sessions with department head",
     "communication", "medium", 5, 7.0),
    (35, 100, "Deploy strategy alignment survey to identify knowledge gaps",
     "assessment", "medium", 6, 5.0),
    (0, 60,   "Implement project-level strategy tagging in your project tracker",
     "process", "medium", 7, 4.0),
    (0, 45,   "Establish shared OKR dashboard visible to all team members",
     "transparency", "medium", 8, 6.0),
    (0, 35,   "Continue current practices and monitor alignment monthly",
     "monitoring", "low", 9, 2.0),
]


def _generate_recommendations(risk: float, alignment: float, velocity: float) -> List[RecommendationItem]:
    eligible = [
        RecommendationItem(
            action=action,
            impact=impact,
            priority=priority,
            category=category,
            expectedImprovement=exp,
        )
        for min_r, max_r, action, category, impact, priority, exp in _RECS_LIBRARY
        if min_r <= risk <= max_r
    ]
    # Return top 3 by priority
    eligible.sort(key=lambda r: r.priority)
    return eligible[:3] if eligible else [
        RecommendationItem(
            action="Monitor team alignment and review in 30 days",
            impact="low",
            priority=9,
            category="monitoring",
            expectedImprovement=2.0,
        )
    ]


# ── Public API ────────────────────────────────────────────────────────────────

def predict(req: PredictRequest) -> PredictResponse:
    """Main prediction pipeline. Deterministic < 10 ms."""
    t0 = time.perf_counter()

    risk    = _risk_score(req.alignmentScore, req.projectVelocity, req.trend)
    level   = _risk_level(risk)
    weeks   = _weeks_to_failure(risk)

    # ML confidence
    understand = req.understanding or 50.0
    features   = np.array([[req.alignmentScore, req.projectVelocity,
                             understand, _trend_num(req.trend)]])
    conf = _confidence_from_model(features)

    recs = _generate_recommendations(risk, req.alignmentScore, req.projectVelocity)

    elapsed = (time.perf_counter() - t0) * 1000
    logger.debug("predict() for %s: risk=%.1f level=%s (%.1f ms)",
                 req.teamId, risk, level, elapsed)

    return PredictResponse(
        teamId=req.teamId,
        teamName=req.teamName,
        riskScore=risk,
        riskLevel=level,
        weeksToFailure=weeks,
        confidence=conf,
        recommendations=recs,
        source="ml_engine",
    )


# ── Full recommendation engine (/recommend) ───────────────────────────────────

_FULL_RECS_LIBRARY = [
    # (min_align, max_align, action, rationale, category, impact, priority, exp_imp, timeframe)
    (0, 40,
     "Reallocate senior leadership time to direct strategy coaching sessions",
     "Alignment below 40 indicates a fundamental comprehension gap requiring direct leadership involvement.",
     "leadership", "high", 1, 15.0, "1-2 weeks"),
    (0, 40,
     "Suspend non-critical projects and focus resources on strategy alignment sprint",
     "Resource dilution across too many initiatives is a leading cause of severe misalignment.",
     "resource-management", "high", 2, 12.0, "2 weeks"),
    (0, 40,
     "Conduct individual 1:1 strategy alignment reviews for all team members",
     "Individual gaps are masked by team averages; targeted coaching accelerates recovery.",
     "coaching", "high", 3, 10.0, "3 weeks"),
    (40, 60,
     "Run bi-weekly alignment workshops anchored to current OKRs",
     "Teams in this band respond well to structured, recurring alignment touchpoints.",
     "training", "medium", 1, 10.0, "4 weeks"),
    (40, 60,
     "Introduce strategy-tagging in project management to surface misalignment early",
     "Making alignment visible in daily tools creates natural accountability.",
     "process", "medium", 2, 7.0, "2 weeks"),
    (40, 60,
     "Share weekly alignment metrics in team stand-ups",
     "Transparency around alignment data increases intrinsic motivation to improve.",
     "communication", "medium", 3, 6.0, "1 week"),
    (60, 100,
     "Maintain current strategy communication cadence",
     "High alignment is fragile; consistent communication prevents drift.",
     "monitoring", "low", 1, 3.0, "Ongoing"),
    (60, 100,
     "Introduce peer-led strategy discussion circles quarterly",
     "High-performing teams benefit from bottom-up strategy reinforcement.",
     "culture", "low", 2, 4.0, "3 months"),
]


def recommend(req: RecommendRequest) -> RecommendResponse:
    """Full recommendation set with rationale."""
    eligible = [
        FullRecommendation(
            action=action,
            rationale=rationale,
            impact=impact,
            priority=priority,
            category=category,
            expectedImprovement=exp,
            timeframe=timeframe,
        )
        for min_a, max_a, action, rationale, category, impact, priority, exp, timeframe
        in _FULL_RECS_LIBRARY
        if min_a <= req.alignmentScore <= max_a
    ]

    # Add drift-signal-specific recommendations
    for signal in (req.driftSignals or []):
        sig_lower = signal.lower()
        if "communicat" in sig_lower:
            eligible.append(FullRecommendation(
                action=f"Address detected communication drift: '{signal}'",
                rationale="Drift signal detected in team communications suggests early misalignment.",
                impact="medium", priority=4, category="communication",
                expectedImprovement=5.0, timeframe="1-2 weeks",
            ))
        elif "project" in sig_lower or "priorit" in sig_lower:
            eligible.append(FullRecommendation(
                action=f"Re-align project priorities addressing: '{signal}'",
                rationale="Misaligned project priorities are a primary driver of strategy drift.",
                impact="medium", priority=3, category="project-management",
                expectedImprovement=6.0, timeframe="1 week",
            ))

    eligible.sort(key=lambda r: r.priority)
    recs = eligible[:5]

    total_improvement = min(30.0, sum(r.expectedImprovement for r in recs[:3]))

    if req.alignmentScore < 40:
        priority_level   = "critical"
        time_to_recovery = "6-10 weeks"
    elif req.alignmentScore < 60:
        priority_level   = "high"
        time_to_recovery = "4-6 weeks"
    elif req.alignmentScore < 75:
        priority_level   = "medium"
        time_to_recovery = "2-4 weeks"
    else:
        priority_level   = "low"
        time_to_recovery = "Ongoing monitoring"

    # ML-based confidence
    features = np.array([[req.alignmentScore, req.projectVelocity or 50.0,
                          req.understanding or 50.0, _trend_num(req.trend)]])
    conf = _confidence_from_model(features)

    return RecommendResponse(
        teamId=req.teamId,
        teamName=req.teamName,
        recommendations=recs,
        expectedImprovement=round(total_improvement, 1),
        timeToRecovery=time_to_recovery,
        priorityLevel=priority_level,
        confidence=conf,
    )
