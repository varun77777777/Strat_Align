# main.py — FastAPI application entry point
"""
Strat-Align AI Service  |  Port 8000
Endpoints:
  GET  /health
  POST /predict
  POST /analyze
  POST /sentiment
  POST /recommend
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone

# Load .env BEFORE any other imports that read env vars
from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# ── Local modules ──────────────────────────────────────────────────────────────
from models import (
    PredictRequest, PredictResponse,
    AnalyzeRequest, AnalyzeResponse,
    SentimentRequest, SentimentResponse, SentimentScore,
    RecommendRequest, RecommendResponse,
    HealthResponse,
)
import ml_engine
import ai_simulator

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("main")

# ── App ───────────────────────────────────────────────────────────────────────
_START_TIME = time.time()

app = FastAPI(
    title="Strat-Align AI Service",
    description=(
        "AI-powered strategic alignment prediction service. "
        "Provides risk scoring, sentiment analysis, and actionable recommendations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5000,http://localhost:3000,http://localhost:5173"
)
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    t0       = time.perf_counter()
    response = await call_next(request)
    elapsed  = (time.perf_counter() - t0) * 1000
    response.headers["X-Response-Time-Ms"] = f"{elapsed:.1f}"
    logger.info("%s %s → %d  (%.1f ms)",
                request.method, request.url.path, response.status_code, elapsed)
    return response

# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " → ".join(str(e) for e in err["loc"])
        errors.append(f"{field}: {err['msg']}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error":   "Validation error",
            "details": errors,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success":   False,
            "error":     str(exc) or "Internal server error",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

# ─────────────────────────────────────────────────────────────────────────────
#  GET /health
# ─────────────────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    tags=["System"],
)
async def health():
    return HealthResponse(
        status="ok",
        service="strat-align-ai-service",
        version="1.0.0",
        uptime=round(time.time() - _START_TIME, 1),
        model_ready=True,       # sklearn model loaded at import time
        external_apis=ai_simulator.api_status(),
    )

# ─────────────────────────────────────────────────────────────────────────────
#  POST /predict
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/predict",
    response_model=PredictResponse,
    summary="Predict team risk score",
    tags=["Prediction"],
)
async def predict(req: PredictRequest):
    """
    Predicts alignment risk for a team using the ML engine.

    **Formula** (deterministic):
    - `riskScore = (100 - alignmentScore) + (100 - projectVelocity) * 0.3`
    - Adjusted by trend: declining +5, improving −5
    - `weeksToFailure` derived from risk bands
    - `confidence` from LogisticRegression class probability
    """
    try:
        return ml_engine.predict(req)
    except Exception as e:
        logger.error("predict() error: %s", e)
        raise

# ─────────────────────────────────────────────────────────────────────────────
#  POST /analyze
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze strategy vs. team communications",
    tags=["Analysis"],
)
async def analyze(req: AnalyzeRequest):
    """
    Compares a strategy document against team communication samples.

    - Calls **Gemini API** if key is configured; falls back to rule-based mock.
    - Returns `alignmentScore`, `understanding`, `driftSignals`, and a summary.
    """
    try:
        result = ai_simulator.analyze_strategy(req.strategy, req.communications)
        return AnalyzeResponse(**result)
    except Exception as e:
        logger.error("analyze() error: %s", e)
        raise

# ─────────────────────────────────────────────────────────────────────────────
#  POST /sentiment
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/sentiment",
    response_model=SentimentResponse,
    summary="Sentiment analysis on team communications",
    tags=["Analysis"],
)
async def sentiment(req: SentimentRequest):
    """
    Scores sentiment of each text and aggregates an overall team mood.

    - Calls **HuggingFace Inference API** if token is configured; falls back to mock.
    - Labels: `positive / neutral / negative`
    - Moods:  `engaged / neutral / stressed / disengaged`
    - Extracts `concern_phrases` that indicate strategy drift.
    """
    try:
        result = ai_simulator.analyze_sentiment(req.texts)

        # Map raw dicts → SentimentScore model instances
        scores = [
            SentimentScore(
                text=s["text"],
                label=s["label"],
                score=s["score"],
                mood=s["mood"],
            )
            for s in result["sentiment_scores"]
        ]

        return SentimentResponse(
            sentiment_scores=scores,
            overall_mood=result["overall_mood"],
            concern_phrases=result["concern_phrases"],
            positive_ratio=result["positive_ratio"],
            negative_ratio=result["negative_ratio"],
            neutral_ratio=result["neutral_ratio"],
            source=result["source"],
        )
    except Exception as e:
        logger.error("sentiment() error: %s", e)
        raise

# ─────────────────────────────────────────────────────────────────────────────
#  POST /recommend
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/recommend",
    response_model=RecommendResponse,
    summary="Generate prioritised recommendations for a team",
    tags=["Prediction"],
)
async def recommend(req: RecommendRequest):
    """
    Generates a prioritised action plan based on alignment and risk scores.

    **Priority bands:**
    - `alignment < 40` → **Critical** — resource reallocation + leadership coaching
    - `alignment 40-60` → **High** — alignment workshops + process changes
    - `alignment > 60` → **Medium / Low** — maintain & monitor
    """
    try:
        return ml_engine.recommend(req)
    except Exception as e:
        logger.error("recommend() error: %s", e)
        raise

# ─────────────────────────────────────────────────────────────────────────────
#  Startup / Shutdown events
# ─────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup():
    logger.info("╔══════════════════════════════════════════╗")
    logger.info("║   Strat-Align AI Service v1.0  (:8000)   ║")
    logger.info("╚══════════════════════════════════════════╝")
    logger.info("ML model : ready (trained on synthetic data)")
    logger.info("CORS     : %s", ", ".join(_origins))

    status_info = ai_simulator.api_status()
    for api, s in status_info.items():
        icon = "✓" if s == "configured" else "✗"
        logger.info("API %-14s %s %s", api + ":", icon, s)

    logger.info("Docs     : http://localhost:8000/docs")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Strat-Align AI Service shutting down…")


# ─────────────────────────────────────────────────────────────────────────────
#  Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        workers=int(os.getenv("WORKERS", "1")),
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
        reload=os.getenv("NODE_ENV", "development") == "development",
    )
