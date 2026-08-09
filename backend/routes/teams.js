// routes/teams.js — All team-related endpoints
'use strict';

const express    = require('express');
const mongoose   = require('mongoose');
const Team       = require('../models/Team');
const Prediction = require('../models/Prediction');
const cache      = require('../cache');

const router = express.Router();

// ── Cache ─────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidId (id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ── GET /api/teams ────────────────────────────────────────────────────────────
// Returns lightweight array of all teams suitable for the dashboard overview.
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'teams_list';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const teams = await Team.listView().lean();

    const result = teams.map(t => ({
      id:              t._id,
      name:            t.name,
      department:      t.department,
      leader:          t.leader,
      members:         t.members,
      alignmentScore:  t.alignmentScore,
      understanding:   t.understanding,
      projectVelocity: t.projectVelocity,
      trend:           t.trend,
      status:          t.status,
      updatedAt:       t.updatedAt,
      lastUpdated:     t.updatedAt,
      executionProbability: t.executionProbability,
      driftVelocity:   t.driftVelocity,
      financialRisk:   t.financialRisk,
      isDriftHotspot:  t.isDriftHotspot,
    }));

    cache.set(cacheKey, result);
    return res.json({ success: true, data: result, count: result.length });

  } catch (err) {
    next(err);
  }
});

// ── GET /api/teams/:id ────────────────────────────────────────────────────────
// Returns full team detail including projects and alignment history.
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid team ID format' });
    }

    const cacheKey = `team_${id}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const team = await Team.findById(id).lean();
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Fetch latest prediction for this team
    const prediction = await Prediction.findOne({ teamId: id })
      .sort({ createdAt: -1 })
      .lean();

    const result = {
      id:              team._id,
      name:            team.name,
      department:      team.department,
      leader:          team.leader,
      members:         team.members,
      alignmentScore:  team.alignmentScore,
      understanding:   team.understanding,
      projectVelocity: team.projectVelocity,
      trend:           team.trend,
      status:          team.status,
      projects:        team.projects || [],
      alignmentTrend:  team.alignmentTrend || [],
      recentTrend:     (team.alignmentTrend || []).slice(-7),
      prediction:      prediction ? {
        riskScore:       prediction.riskScore,
        weeksToFailure:  prediction.weeksToFailure,
        confidence:      prediction.confidence,
        recommendations: prediction.recommendations,
      } : null,
      createdAt:  team.createdAt,
      updatedAt:  team.updatedAt,
    };

    cache.set(cacheKey, result);
    return res.json({ success: true, data: result });

  } catch (err) {
    next(err);
  }
});

// ── GET /api/teams (search / filter) — extend base route via query params ─────
// Supported: ?department=X  ?status=Y  ?minScore=N  ?maxScore=N
// (already handled by the root GET above; optional query filtering below)
router.get('/filter/search', async (req, res, next) => {
  try {
    const { department, status, minScore, maxScore } = req.query;
    const filter = {};

    if (department) filter.department = new RegExp(department, 'i');
    if (status)     filter.status     = status;
    if (minScore || maxScore) {
      filter.alignmentScore = {};
      if (minScore) filter.alignmentScore.$gte = Number(minScore);
      if (maxScore) filter.alignmentScore.$lte = Number(maxScore);
    }

    const teams = await Team.find(filter, {
      name: 1, department: 1, alignmentScore: 1, trend: 1, status: 1,
    }).lean();

    return res.json({ success: true, data: teams, count: teams.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
