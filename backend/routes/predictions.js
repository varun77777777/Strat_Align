// routes/predictions.js — Prediction & alignment-history endpoints
'use strict';

const express    = require('express');
const mongoose   = require('mongoose');
const axios      = require('axios');
const Team       = require('../models/Team');
const Prediction = require('../models/Prediction');
const cache      = require('../cache');

const router = express.Router();

// ── Cache ─────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

async function callAIService (teamData) {
  const url     = process.env.AI_SERVICE_URL  || 'http://localhost:8000/predict';
  const timeout = parseInt(process.env.AI_SERVICE_TIMEOUT || '5000', 10);

  try {
    const { data } = await axios.post(url, teamData, { timeout });
    return { ...data, source: 'ai' };
  } catch {
    // Graceful fallback — build deterministic prediction
    console.warn('[predictions] AI service unreachable, using mock fallback');
    return null;
  }
}

async function ensurePredictions (teams) {
  const predictions = [];

  for (const team of teams) {
    // Check if a recent prediction exists (< 5 minutes old)
    let pred = await Prediction.findOne({
      teamId:       team._id,
      lastRefreshed: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    }).lean();

    if (!pred) {
      // Try AI service
      const aiResult = await callAIService({
        teamId:          team._id,
        teamName:        team.name,
        alignmentScore:  team.alignmentScore,
        understanding:   team.understanding,
        projectVelocity: team.projectVelocity,
        trend:           team.trend,
      });

      const built = aiResult || Prediction.buildFromTeam(team);

      pred = await Prediction.findOneAndUpdate(
        { teamId: team._id },
        { $set: { ...built, lastRefreshed: new Date() } },
        { upsert: true, new: true, runValidators: true }
      ).lean();
    }

    predictions.push(pred);
  }

  return predictions;
}

// ── GET /api/predictions ──────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'predictions_all';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const teams       = await Team.find({}).lean();
    const predictions = await ensurePredictions(teams);

    const result = predictions.map(p => ({
      id:              p._id,
      teamId:          p.teamId,
      teamName:        p.teamName,
      riskScore:       p.riskScore,
      riskLevel:       riskLevel(p.riskScore),
      weeksToFailure:  p.weeksToFailure,
      confidence:      p.confidence,
      source:          p.source,
      recommendations: p.recommendations || [],
      lastRefreshed:   p.lastRefreshed,
    }));

    // Sort by risk descending
    result.sort((a, b) => b.riskScore - a.riskScore);

    cache.set(cacheKey, result);
    return res.json({ success: true, data: result, count: result.length });

  } catch (err) {
    next(err);
  }
});

// ── GET /api/alignment-history ────────────────────────────────────────────────
// Returns 7-day time-series for all teams in a chart-friendly format.
router.get('/alignment-history', async (req, res, next) => {
  try {
    const cacheKey = 'alignment_history';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const days  = parseInt(req.query.days || '7', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const teams = await Team.find({}, { name: 1, department: 1, alignmentTrend: 1 }).lean();

    // Build a day-keyed map: { "2025-07-01": { Engineering: 45, Product: 82, … } }
    const dayMap = {};

    for (let i = days - 1; i >= 0; i--) {
      const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key };
    }

    for (const team of teams) {
      const points = (team.alignmentTrend || []).filter(p => new Date(p.date) >= since);

      for (const key of Object.keys(dayMap)) {
        // Find closest point to this day
        const dayStart = new Date(key);
        const dayEnd   = new Date(key);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const match = points.find(p => {
          const d = new Date(p.date);
          return d >= dayStart && d < dayEnd;
        });

        dayMap[key][team.name] = match ? match.score : team.alignmentScore;
      }
    }

    const result = {
      teams:    teams.map(t => ({ id: t._id, name: t.name, department: t.department })),
      timeline: Object.values(dayMap),
    };

    cache.set(cacheKey, result);
    return res.json({ success: true, data: result });

  } catch (err) {
    next(err);
  }
});

// ── Utility ───────────────────────────────────────────────────────────────────
function riskLevel (score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

module.exports = router;
