// routes/recommendations.js — Recommendations + POST analyze endpoints
'use strict';

const express    = require('express');
const mongoose   = require('mongoose');
const axios      = require('axios');
const NodeCache  = require('node-cache');
const Team       = require('../models/Team');
const Prediction = require('../models/Prediction');

const router = express.Router();

const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidId (id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function callGemini (prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model  = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[analyze] No Gemini API key — returning mock analysis');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const { data } = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:     0.3,
        maxOutputTokens: 1024,
      },
    }, { timeout: 15000 });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Extract JSON block from response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);

    // Attempt direct parse
    return JSON.parse(text);
  } catch (err) {
    console.error('[analyze] Gemini call failed:', err.message);
    return null;
  }
}

async function callStrategyAnalyzer (strategy, communications) {
  const predictionUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/predict';
  const url = process.env.AI_ANALYSIS_URL || predictionUrl.replace(/\/predict$/, '/analyze');

  try {
    const { data } = await axios.post(url, {
      strategy: strategy || 'No strategy document was provided.',
      communications: Array.isArray(communications) ? communications : [String(communications || '')],
    }, { timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '5000', 10) });
    return data;
  } catch (err) {
    console.warn('[analyze] AI service unavailable, using local deterministic fallback:', err.message);
    return null;
  }
}

// ── GET /api/recommendations ──────────────────────────────────────────────────
// Returns all recommendations across all teams, sorted by priority.
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'recommendations_all';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const predictions = await Prediction.find({}).lean();

    const all = [];
    for (const pred of predictions) {
      for (const rec of (pred.recommendations || [])) {
        all.push({
          id:                  rec._id,
          teamId:              pred.teamId,
          teamName:            pred.teamName,
          action:              rec.action,
          impact:              rec.impact,
          priority:            rec.priority,
          category:            rec.category,
          applied:             rec.applied,
          appliedAt:           rec.appliedAt,
          expectedImprovement: rec.expectedImprovement,
          predictionId:        pred._id,
        });
      }
    }

    // Sort: unapplied first, then by priority asc, then by impact weight
    const impactWeight = { high: 0, medium: 1, low: 2 };
    all.sort((a, b) => {
      if (a.applied !== b.applied)    return a.applied ? 1 : -1;
      if (a.priority !== b.priority)  return a.priority - b.priority;
      return (impactWeight[a.impact] ?? 2) - (impactWeight[b.impact] ?? 2);
    });

    cache.set(cacheKey, all);
    return res.json({ success: true, data: all, count: all.length });

  } catch (err) {
    next(err);
  }
});

// ── POST /api/recommendations/:id/apply ───────────────────────────────────────
// Marks a recommendation as applied; returns updated prediction with projected improvement.
router.post('/:id/apply', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid recommendation ID' });
    }

    // Find the prediction that contains this recommendation
    const prediction = await Prediction.findOne({ 'recommendations._id': id });
    if (!prediction) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    const rec = prediction.recommendations.id(id);
    if (!rec) {
      return res.status(404).json({ success: false, error: 'Recommendation not found in prediction' });
    }

    if (rec.applied) {
      return res.status(409).json({
        success: false,
        error:   'Recommendation already applied',
        appliedAt: rec.appliedAt,
      });
    }

    rec.applied   = true;
    rec.appliedAt = new Date();
    await prediction.save();

    // Compute expected new risk score after applying this recommendation
    const improvement  = rec.expectedImprovement || 5;
    const newRiskScore = Math.max(0, prediction.riskScore - improvement);

    // Invalidate caches
    cache.del('recommendations_all');
    cache.del('predictions_all');

    return res.json({
      success: true,
      message: `Recommendation applied for team ${prediction.teamName}`,
      data: {
        recommendationId:    id,
        action:              rec.action,
        appliedAt:           rec.appliedAt,
        expectedImprovement: improvement,
        updatedPrediction: {
          teamId:            prediction.teamId,
          teamName:          prediction.teamName,
          previousRiskScore: prediction.riskScore,
          projectedRiskScore: newRiskScore,
          confidence:        prediction.confidence,
        },
      },
    });

  } catch (err) {
    next(err);
  }
});

// ── POST /api/analyze ─────────────────────────────────────────────────────────
// Receives team_id, strategy_doc, communications → returns AI analysis.
router.post('/analyze', async (req, res, next) => {
  try {
    const { team_id, strategy_doc, communications } = req.body;

    if (!team_id) {
      return res.status(400).json({ success: false, error: 'team_id is required' });
    }
    if (!isValidId(team_id)) {
      return res.status(400).json({ success: false, error: 'Invalid team_id format' });
    }

    const team = await Team.findById(team_id).lean();
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Build Gemini prompt
    const prompt = buildAnalysisPrompt(team, strategy_doc, communications);
    const geminiResult = await callGemini(prompt);
    const aiResult = geminiResult || await callStrategyAnalyzer(strategy_doc, communications);

    let analysis;
    if (aiResult) {
      analysis = {
        alignmentScore:  clamp(aiResult.alignmentScore ?? team.alignmentScore, 0, 100),
        understanding:   clamp(aiResult.understanding  ?? team.understanding,  0, 100),
        driftSignals:    aiResult.driftSignals || [],
        recommendations: aiResult.recommendations || defaultRecommendations(),
        summary:         aiResult.summary || '',
        source:          geminiResult ? 'gemini' : 'ai-service',
      };
    } else {
      // Deterministic mock
      analysis = mockAnalysis(team);
    }

    // Persist updated scores
    await Team.findByIdAndUpdate(team_id, {
      $set: {
        alignmentScore: analysis.alignmentScore,
        understanding:  analysis.understanding,
      },
      $push: {
        alignmentTrend: {
          date:           new Date(),
          score:          analysis.alignmentScore,
          understanding:  analysis.understanding,
          projectVelocity: team.projectVelocity,
        },
      },
    });

    // Invalidate team caches
    cache.del(`team_${team_id}`);
    cache.del('teams_list');
    cache.del('predictions_all');

    return res.json({ success: true, data: analysis });

  } catch (err) {
    next(err);
  }
});

// ── Private helpers ───────────────────────────────────────────────────────────

function buildAnalysisPrompt (team, strategyDoc, communications) {
  return `You are an organizational alignment expert AI.

Analyze the strategic alignment of the following team and return ONLY a JSON object with this exact structure:
{
  "alignmentScore": <number 0-100>,
  "understanding": <number 0-100>,
  "driftSignals": [<string>, ...],
  "recommendations": [<string>, ...],
  "summary": "<brief analysis>"
}

Team: ${team.name} (${team.department})
Leader: ${team.leader}
Current alignment score: ${team.alignmentScore}
Current understanding score: ${team.understanding}
Project velocity: ${team.projectVelocity}
Trend: ${team.trend}

Strategy document:
${strategyDoc || 'Not provided'}

Recent communications sample:
${communications || 'Not provided'}

Return ONLY valid JSON wrapped in \`\`\`json ... \`\`\` code fences.`;
}

function mockAnalysis (team) {
  const base = team.alignmentScore;
  const drift = base < 50
    ? ['Misaligned project priorities', 'Low strategy comprehension', 'Siloed communication']
    : ['Minor terminology drift', 'Infrequent cross-team syncs'];

  return {
    alignmentScore:  Math.max(0, Math.min(100, base + Math.round((Math.random() - 0.5) * 10))),
    understanding:   Math.max(0, Math.min(100, team.understanding + Math.round((Math.random() - 0.5) * 8))),
    driftSignals:    drift,
    recommendations: defaultRecommendations(),
    summary: `Mock analysis for ${team.name}. Real analysis requires a valid Gemini API key.`,
    source:  'mock',
  };
}

function defaultRecommendations () {
  return [
    'Hold bi-weekly strategy Q&A sessions',
    'Share OKR progress in team standups',
    'Align project backlog to strategic pillars',
  ];
}

function clamp (val, min, max) {
  return Math.max(min, Math.min(max, Number(val) || 0));
}

module.exports = router;
