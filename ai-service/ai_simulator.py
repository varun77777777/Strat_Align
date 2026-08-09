# ai_simulator.py — External API integrations with deterministic mock fallbacks
"""
Handles:
  - Gemini API  → strategy analysis
  - HuggingFace API → sentiment scoring

Both follow the EXACT same interface regardless of whether the real API is
called or the mock fallback is used. This keeps main.py clean.

Design principle: ALWAYS return a valid result.
  1. Try real API (with timeout)
  2. On any failure → fall back to rule-based deterministic mock
  3. Log the fallback reason so it's visible in server output
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import time
from typing import List, Tuple, Dict, Any, Optional

try:
    import requests
except ImportError:  # Offline demo mode: deterministic fallbacks still work.
    requests = None

logger = logging.getLogger("ai_simulator")

# ── Config (read from env, set by main.py after dotenv load) ─────────────────

def _gemini_key()  -> str: return os.getenv("GEMINI_API_KEY", "")
def _gemini_model() -> str: return os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
def _hf_key()      -> str: return os.getenv("HUGGINGFACE_API_KEY", "")
def _hf_model()    -> str: return os.getenv("HF_SENTIMENT_MODEL",
                                             "cardiffnlp/twitter-roberta-base-sentiment-latest")
def _gemini_timeout() -> float: return float(os.getenv("GEMINI_TIMEOUT", "10"))
def _hf_timeout()     -> float: return float(os.getenv("HF_TIMEOUT", "8"))


# ─────────────────────────────────────────────────────────────────────────────
#  Strategy keyword bank (used by both Gemini path and mock path)
# ─────────────────────────────────────────────────────────────────────────────

STRATEGY_KEYWORDS = [
    "OKR", "objective", "key result", "milestone", "roadmap", "strategic",
    "strategy", "goal", "priority", "vision", "mission", "alignment",
    "quarterly", "growth", "metric", "KPI", "initiative", "revenue",
    "customer", "retention", "acquisition", "velocity", "efficiency",
]

# Terms that carry little strategic meaning on their own.  The fallback model
# extracts the remaining terms from the supplied strategy so it can evaluate
# a public-company strategy without requiring a vendor API key.
STRATEGY_STOPWORDS = {
    "about", "across", "after", "along", "also", "and", "are", "around",
    "because", "before", "between", "business", "company", "deliver", "for",
    "from", "into", "its", "more", "must", "our", "over", "prioritize",
    "should", "that", "the", "their", "this", "through", "to", "with",
    "will", "while",
}

DRIFT_PHRASES = [
    "not sure", "unclear", "confused about", "don't understand",
    "no idea", "what strategy", "hasn't been communicated",
    "management said", "nobody told us", "keeps changing",
    "moving goalposts", "no direction", "what's the plan",
    "siloed", "not aligned", "working in isolation",
    "different page", "conflicting priorities",
]

POSITIVE_SIGNALS = [
    "on track", "making progress", "aligned with", "clear goals",
    "great momentum", "team is focused", "understand the vision",
    "confident we'll hit", "working well together",
]


# ─────────────────────────────────────────────────────────────────────────────
#  Deterministic mock helpers (used as fallback)
# ─────────────────────────────────────────────────────────────────────────────

def _deterministic_seed(text: str) -> float:
    """Produce a stable 0-1 float from a string (for determinism)."""
    h = int(hashlib.md5(text.encode()).hexdigest(), 16)
    return (h % 10_000) / 10_000.0


def _count_keyword_mentions(texts: List[str], keywords: List[str]) -> int:
    combined = " ".join(texts).lower()
    return sum(1 for kw in keywords if kw.lower() in combined)


def _extract_strategy_keywords(strategy: str) -> List[str]:
    found = []
    lower = strategy.lower()
    for kw in STRATEGY_KEYWORDS:
        if kw.lower() in lower:
            found.append(kw)

    # Add the strategy's own material terms (for example "watsonx",
    # "hybrid cloud", or a product/market name) rather than judging every
    # company with a static, generic vocabulary.
    for token in re.findall(r"[a-zA-Z][a-zA-Z0-9-]{2,}", lower):
        if token not in STRATEGY_STOPWORDS and token not in {term.lower() for term in found}:
            found.append(token)

    # Preserve source order for deterministic results and a readable UI.
    return list(dict.fromkeys(found))[:20]


def _extract_drift_signals(texts: List[str]) -> List[str]:
    combined = " ".join(texts).lower()
    found = []
    for phrase in DRIFT_PHRASES:
        if phrase in combined:
            found.append(phrase.title())
    return found[:5]


def _mock_analyze(strategy: str, communications: List[str]) -> Dict[str, Any]:
    """
    Fully deterministic analysis fallback.
    Alignment = function of keyword overlap between strategy and communications.
    """
    strat_keywords  = _extract_strategy_keywords(strategy)
    mention_count = _count_keyword_mentions(communications, strat_keywords)
    total_comms   = max(len(communications), 1)
    mention_rate  = min(1.0, sum(
        1 for text in communications
        if any(keyword.lower() in text.lower() for keyword in strat_keywords)
    ) / total_comms)
    term_coverage = mention_count / max(len(strat_keywords), 1)

    drift_signals   = _extract_drift_signals(communications)
    positive_count  = sum(
        1 for phrase in POSITIVE_SIGNALS
        if phrase in " ".join(communications).lower()
    )
    # Alignment is driven by evidence that the team's language reflects the
    # supplied strategy, not by the strategy document's keyword density.
    raw_score = 20 + term_coverage * 65 + mention_rate * 10 + min(5, positive_count * 2)
    raw_score -= min(30, len(drift_signals) * 12)
    alignment_score = round(float(max(5.0, min(95.0, raw_score))), 1)
    understanding   = round(float(min(95.0, alignment_score + term_coverage * 10)), 1)

    if not drift_signals and alignment_score < 55:
        drift_signals = ["Low strategy keyword presence in team communications"]

    return {
        "alignmentScore":    alignment_score,
        "understanding":     understanding,
        "driftSignals":      drift_signals,
        "strategyKeywords":  strat_keywords,
        "mentionRate":       round(mention_rate, 3),
        "summary":           (
            f"Rule-based analysis: {len(strat_keywords)} strategy keywords identified. "
            f"Communications mention strategy terms at a {round(mention_rate * 100)}% rate. "
            f"Estimated alignment: {alignment_score:.0f}/100."
        ),
        "source":     "mock",
        "confidence": round(0.55 + mention_rate * 0.25, 3),
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Gemini API
# ─────────────────────────────────────────────────────────────────────────────

def _call_gemini(strategy: str, communications: List[str]) -> Optional[Dict[str, Any]]:
    if requests is None:
        logger.info("[gemini] requests package unavailable — using mock fallback")
        return None
    key = _gemini_key()
    if not key or key == "your_gemini_api_key_here":
        logger.info("[gemini] No API key configured — using mock fallback")
        return None

    model = _gemini_model()
    url   = (
        f"https://generativelanguage.googleapis.com/v1beta"
        f"/models/{model}:generateContent?key={key}"
    )

    comms_sample = "\n".join(f"- {c}" for c in communications[:10])
    prompt = f"""You are an organizational strategy alignment expert.

Analyse the alignment between the following strategy document and the team's communications.
Return ONLY a JSON object in this exact format (no markdown, no extra text):

{{
  "alignmentScore": <number 0-100>,
  "understanding": <number 0-100>,
  "driftSignals": [<string>, ...],
  "strategyKeywords": [<string>, ...],
  "mentionRate": <number 0-1>,
  "summary": "<one-paragraph analysis>"
}}

Strategy document:
{strategy[:3000]}

Team communications sample ({len(communications)} messages):
{comms_sample}

Return only the JSON object."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature":     0.1,
            "maxOutputTokens": 512,
            "topP":            0.8,
        },
    }

    try:
        t0  = time.perf_counter()
        res = requests.post(url, json=payload, timeout=_gemini_timeout())
        res.raise_for_status()
        elapsed = (time.perf_counter() - t0) * 1000

        text = (
            res.json()
            .get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )

        # Strip markdown fences if present
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```",        "", text).strip()

        result = json.loads(text)
        result["source"]     = "gemini"
        result["confidence"] = 0.88
        logger.info("[gemini] Analysis complete in %.0f ms", elapsed)
        return result

    except requests.exceptions.Timeout:
        logger.warning("[gemini] Request timed out after %.0f s — using mock", _gemini_timeout())
    except requests.exceptions.RequestException as e:
        logger.warning("[gemini] API error: %s — using mock", e)
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.warning("[gemini] Response parse error: %s — using mock", e)

    return None


def analyze_strategy(strategy: str, communications: List[str]) -> Dict[str, Any]:
    """
    Primary entry point for /analyze.
    Tries Gemini, falls back to mock.
    """
    result = _call_gemini(strategy, communications)
    if result is None:
        result = _mock_analyze(strategy, communications)

    # Ensure all required keys exist
    result.setdefault("strategyKeywords", _extract_strategy_keywords(strategy))
    result.setdefault("mentionRate",      0.0)
    result.setdefault("driftSignals",     [])
    result.setdefault("summary",          "Analysis completed.")
    result.setdefault("confidence",       0.60)
    return result


# ─────────────────────────────────────────────────────────────────────────────
#  HuggingFace Sentiment API
# ─────────────────────────────────────────────────────────────────────────────

_HF_LABEL_MAP = {
    "LABEL_0": "negative",
    "LABEL_1": "neutral",
    "LABEL_2": "positive",
    "negative": "negative",
    "neutral":  "neutral",
    "positive": "positive",
    # Older model labels
    "NEG": "negative",
    "NEU": "neutral",
    "POS": "positive",
}


def _mood_from_label(label: str, score: float) -> str:
    if label == "positive" and score > 0.75: return "engaged"
    if label == "positive":                   return "neutral"
    if label == "neutral":                    return "neutral"
    if label == "negative" and score > 0.75:  return "disengaged"
    return "stressed"


def _mock_sentiment(texts: List[str]) -> List[Dict[str, Any]]:
    """
    Deterministic sentiment without HuggingFace.
    Uses keyword heuristics + MD5 seeding for stability.
    """
    results = []
    for text in texts:
        lower = text.lower()

        pos_hits = sum(1 for p in POSITIVE_SIGNALS if p in lower)
        neg_hits = sum(1 for p in DRIFT_PHRASES    if p in lower)

        if pos_hits > neg_hits:
            label = "positive"
            score = round(0.60 + _deterministic_seed(text) * 0.30, 4)
        elif neg_hits > pos_hits:
            label = "negative"
            score = round(0.60 + _deterministic_seed(text) * 0.30, 4)
        else:
            label = "neutral"
            score = round(0.50 + _deterministic_seed(text) * 0.30, 4)

        results.append({
            "text":  text[:100],
            "label": label,
            "score": score,
            "mood":  _mood_from_label(label, score),
        })
    return results


def _call_huggingface(texts: List[str]) -> Optional[List[Dict[str, Any]]]:
    if requests is None:
        logger.info("[hf] requests package unavailable — using mock fallback")
        return None
    key = _hf_key()
    if not key or key == "your_huggingface_token_here":
        logger.info("[hf] No API key configured — using mock fallback")
        return None

    model = _hf_model()
    url   = f"https://api-inference.huggingface.co/models/{model}"
    headers = {"Authorization": f"Bearer {key}"}

    try:
        t0  = time.perf_counter()
        res = requests.post(
            url,
            headers=headers,
            json={"inputs": texts[:20]},  # HF limit
            timeout=_hf_timeout(),
        )
        res.raise_for_status()
        elapsed = (time.perf_counter() - t0) * 1000
        raw     = res.json()

        # HF returns list[list[dict]] — one list per input
        results = []
        for text, scored_labels in zip(texts, raw):
            if isinstance(scored_labels, list):
                best = max(scored_labels, key=lambda x: x.get("score", 0))
            else:
                best = scored_labels

            raw_label = best.get("label", "neutral")
            label     = _HF_LABEL_MAP.get(raw_label.upper(),
                        _HF_LABEL_MAP.get(raw_label, "neutral"))
            score     = round(float(best.get("score", 0.5)), 4)

            results.append({
                "text":  text[:100],
                "label": label,
                "score": score,
                "mood":  _mood_from_label(label, score),
            })

        logger.info("[hf] Sentiment for %d texts in %.0f ms", len(texts), elapsed)
        return results

    except requests.exceptions.Timeout:
        logger.warning("[hf] Request timed out — using mock")
    except requests.exceptions.RequestException as e:
        logger.warning("[hf] API error: %s — using mock", e)
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        logger.warning("[hf] Parse error: %s — using mock", e)

    return None


def _concern_phrases(texts: List[str]) -> List[str]:
    combined = " ".join(texts).lower()
    return [p.title() for p in DRIFT_PHRASES if p in combined][:6]


def analyze_sentiment(texts: List[str]) -> Dict[str, Any]:
    """
    Primary entry point for /sentiment.
    Returns structured sentiment analysis with overall mood and concern phrases.
    """
    scored = _call_huggingface(texts)
    source = "huggingface" if scored is not None else "mock"
    if scored is None:
        scored = _mock_sentiment(texts)

    total = len(scored)
    pos   = sum(1 for s in scored if s["label"] == "positive")
    neg   = sum(1 for s in scored if s["label"] == "negative")
    neu   = total - pos - neg

    pos_r = round(pos / total, 3)
    neg_r = round(neg / total, 3)
    neu_r = round(neu / total, 3)

    if pos_r > 0.6:   overall = "engaged"
    elif neg_r > 0.5: overall = "disengaged"
    elif neg_r > 0.3: overall = "stressed"
    else:             overall = "neutral"

    return {
        "sentiment_scores": scored,
        "overall_mood":     overall,
        "concern_phrases":  _concern_phrases(texts),
        "positive_ratio":   pos_r,
        "negative_ratio":   neg_r,
        "neutral_ratio":    neu_r,
        "source":           source,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  API availability check (used by health endpoint)
# ─────────────────────────────────────────────────────────────────────────────

def api_status() -> Dict[str, str]:
    gemini_key = _gemini_key()
    hf_key     = _hf_key()

    return {
        "gemini":       "configured" if gemini_key and gemini_key != "your_gemini_api_key_here" else "missing_key",
        "huggingface":  "configured" if hf_key     and hf_key     != "your_huggingface_token_here" else "missing_key",
    }
