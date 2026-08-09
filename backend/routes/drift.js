// routes/drift.js — Drift Hotspot, Impact Modeling & Simulation endpoints
'use strict';

const express    = require('express');
const mongoose   = require('mongoose');
const Team       = require('../models/Team');
const Prediction = require('../models/Prediction');
const cache      = require('../cache');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drift/hotspots
// Returns teams sorted by drift severity with rich context
// ─────────────────────────────────────────────────────────────────────────────
router.get('/hotspots', async (req, res, next) => {
  try {
    const cacheKey = 'drift_hotspots';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const teams = await Team.find({}, {
      name: 1, department: 1, leader: 1, members: 1,
      alignmentScore: 1, understanding: 1, projectVelocity: 1,
      trend: 1, status: 1, driftVelocity: 1, executionProbability: 1,
      financialRisk: 1, isDriftHotspot: 1, strategyContext: 1,
      alignmentTrend: 1, lastAnalyzedAt: 1,
    }).lean();

    const hotspots = teams.map(team => {
      // Compute drift quadrant
      const score    = team.alignmentScore || 0;
      const velocity = team.driftVelocity  || 0;
      let quadrant;
      if (score >= 70 && velocity >= 0)       quadrant = 'safe';
      else if (score >= 70 && velocity < 0)   quadrant = 'warning';
      else if (score >= 50 && velocity < 0)   quadrant = 'at-risk';
      else if (score < 50  && velocity < -1)  quadrant = 'emergency';
      else                                    quadrant = 'critical';

      // Weeks to critical misalignment (score < 40 = critical threshold)
      let weeksToCritical = null;
      if (velocity < 0 && score > 40) {
        weeksToCritical = Math.ceil((score - 40) / Math.abs(velocity));
      }

      return {
        id:                   team._id,
        name:                 team.name,
        department:           team.department,
        leader:               team.leader,
        members:              team.members,
        alignmentScore:       score,
        understanding:        team.understanding || 0,
        projectVelocity:      team.projectVelocity || 0,
        trend:                team.trend,
        status:               team.status,
        driftVelocity:        parseFloat(velocity.toFixed(2)),
        executionProbability: parseFloat((team.executionProbability || 50).toFixed(1)),
        financialRisk:        parseFloat((team.financialRisk || 0).toFixed(1)),
        isDriftHotspot:       team.isDriftHotspot || false,
        quadrant,
        weeksToCritical,
        strategyContext:      team.strategyContext,
        recentHistory:        (team.alignmentTrend || []).slice(-7).map(p => ({
          date:  p.date,
          score: p.score,
        })),
        lastAnalyzedAt:       team.lastAnalyzedAt,
      };
    });

    // Sort: emergency first, then by drift velocity (most negative first)
    const quadrantOrder = { emergency: 0, critical: 1, 'at-risk': 2, warning: 3, safe: 4 };
    hotspots.sort((a, b) => {
      const qDiff = (quadrantOrder[a.quadrant] ?? 5) - (quadrantOrder[b.quadrant] ?? 5);
      if (qDiff !== 0) return qDiff;
      return a.driftVelocity - b.driftVelocity;
    });

    const summary = {
      totalTeams:       hotspots.length,
      emergencyTeams:   hotspots.filter(h => h.quadrant === 'emergency').length,
      criticalTeams:    hotspots.filter(h => h.quadrant === 'critical').length,
      atRiskTeams:      hotspots.filter(h => h.quadrant === 'at-risk').length,
      warningTeams:     hotspots.filter(h => h.quadrant === 'warning').length,
      safeTeams:        hotspots.filter(h => h.quadrant === 'safe').length,
      avgAlignment:     Math.round(hotspots.reduce((s, h) => s + h.alignmentScore, 0) / Math.max(hotspots.length, 1)),
      totalFinancialRisk: parseFloat(hotspots.reduce((s, h) => s + h.financialRisk, 0).toFixed(1)),
      hotspotCount:     hotspots.filter(h => h.isDriftHotspot).length,
    };

    const result = { hotspots, summary };
    cache.set(cacheKey, result);
    return res.json({ success: true, data: result });

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drift/impact-model
// Returns financial & execution impact model for the organization
// ─────────────────────────────────────────────────────────────────────────────
router.get('/impact-model', async (req, res, next) => {
  try {
    const cacheKey = 'impact_model';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const [teams, predictions] = await Promise.all([
      Team.find({}, {
        name: 1, alignmentScore: 1, executionProbability: 1,
        financialRisk: 1, driftVelocity: 1, trend: 1,
      }).lean(),
      Prediction.find({}, {
        teamName: 1, riskScore: 1, weeksToFailure: 1, confidence: 1,
      }).lean(),
    ]);

    const avgAlignment     = teams.reduce((s, t) => s + (t.alignmentScore || 0), 0) / Math.max(teams.length, 1);
    const avgExecProb      = teams.reduce((s, t) => s + (t.executionProbability || 50), 0) / Math.max(teams.length, 1);
    const totalFinRisk     = teams.reduce((s, t) => s + (t.financialRisk || 0), 0);
    const avgDriftVel      = teams.reduce((s, t) => s + (t.driftVelocity || 0), 0) / Math.max(teams.length, 1);

    // Project 12-week trajectory without intervention
    const weeklyDriftImpact = avgDriftVel < 0 ? avgDriftVel * 1.2 : 0;
    const projectedTimeline = Array.from({ length: 13 }, (_, w) => {
      const proj = Math.max(10, avgAlignment + weeklyDriftImpact * w);
      const interv = Math.min(100, avgAlignment + w * 1.5); // with intervention: +1.5/wk
      return {
        week: w,
        withoutIntervention: parseFloat(proj.toFixed(1)),
        withIntervention:    parseFloat(interv.toFixed(1)),
        financialRiskWithout: parseFloat(Math.max(0, ((80 - proj) / 10) * 50 * teams.length).toFixed(0)),
        financialRiskWith:    parseFloat(Math.max(0, ((80 - interv) / 10) * 30 * teams.length).toFixed(0)),
      };
    });

    // ROI calculation
    const currentRisk  = totalFinRisk;
    const improvedRisk = Math.max(0, totalFinRisk * 0.3);
    const potentialROI = parseFloat((currentRisk - improvedRisk).toFixed(1));
    const interventionCost = 2.5; // $M estimated intervention cost

    // Execution success probability by scenario
    const worstCaseAlignment = Math.max(10, avgAlignment + weeklyDriftImpact * 12);
    const bestCaseAlignment  = Math.min(95, avgAlignment + 15);

    const result = {
      orgSummary: {
        avgAlignment:        parseFloat(avgAlignment.toFixed(1)),
        avgExecutionProb:    parseFloat(avgExecProb.toFixed(1)),
        totalFinancialRisk:  parseFloat(totalFinRisk.toFixed(1)),
        avgDriftVelocity:    parseFloat(avgDriftVel.toFixed(2)),
        teamCount:           teams.length,
      },
      scenarios: {
        current: {
          label:               'Current State',
          alignment:           parseFloat(avgAlignment.toFixed(1)),
          executionSuccess:    parseFloat(avgExecProb.toFixed(1)),
          financialRisk:       parseFloat(currentRisk.toFixed(1)),
          strategySuccessRate: Math.round(avgExecProb * 0.85),
        },
        withoutIntervention: {
          label:               'No Intervention (12 weeks)',
          alignment:           parseFloat(worstCaseAlignment.toFixed(1)),
          executionSuccess:    parseFloat(Math.max(10, avgExecProb - 20).toFixed(1)),
          financialRisk:       parseFloat((currentRisk * 1.8).toFixed(1)),
          strategySuccessRate: Math.round(Math.max(10, avgExecProb * 0.85 - 25)),
        },
        withIntervention: {
          label:               'With Autonomous Correction (12 weeks)',
          alignment:           parseFloat(bestCaseAlignment.toFixed(1)),
          executionSuccess:    parseFloat(Math.min(95, avgExecProb + 18).toFixed(1)),
          financialRisk:       parseFloat(improvedRisk.toFixed(1)),
          strategySuccessRate: Math.round(Math.min(95, avgExecProb * 0.85 + 20)),
        },
      },
      roi: {
        currentRisk:       parseFloat(currentRisk.toFixed(1)),
        potentialSavings:  potentialROI,
        interventionCost,
        netROI:            parseFloat((potentialROI - interventionCost).toFixed(1)),
        roiMultiple:       parseFloat((potentialROI / interventionCost).toFixed(1)),
      },
      projectedTimeline,
      teamRisks: teams.map(t => ({
        name:           t.name,
        alignment:      t.alignmentScore,
        executionProb:  t.executionProbability || 50,
        financialRisk:  t.financialRisk || 0,
        driftVelocity:  t.driftVelocity || 0,
        trend:          t.trend,
      })).sort((a, b) => b.financialRisk - a.financialRisk),
    };

    cache.set(cacheKey, result);
    return res.json({ success: true, data: result });

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drift/simulate-understanding
// Runs understanding simulation: returns analysis of alignment at different
// "% informed employees" levels
// ─────────────────────────────────────────────────────────────────────────────
router.post('/simulate-understanding', async (req, res, next) => {
  try {
    const { teamId, informedPercent = 50 } = req.body;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ success: false, error: 'Valid teamId required' });
    }

    const team = await Team.findById(teamId).lean();
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const requestedPercent = Number(informedPercent);
    if (!Number.isFinite(requestedPercent)) {
      return res.status(400).json({ success: false, error: 'informedPercent must be a number between 0 and 100' });
    }
    const pct = Math.max(0, Math.min(100, requestedPercent));

    // Simulate alignment score based on informed percent
    // Baseline: random employees → ~30% alignment
    // Fully informed → ~90% alignment
    const baseScore    = 25;
    const maxScore     = 92;
    const simAlignment = Math.round(baseScore + (pct / 100) * (maxScore - baseScore));
    // Keep the demo repeatable: a given team and informed percentage must
    // yield the same scenario result so decision-makers can compare runs.
    const teamOffset = [...String(team._id)].reduce((total, char) => total + char.charCodeAt(0), 0) % 7 - 3;
    const simUnderstanding = Math.round(simAlignment + teamOffset);

    // Drift signals based on uninformed employees
    const uninformedPct = 100 - pct;
    const driftSignals  = [];
    if (uninformedPct > 60) driftSignals.push('Critical communication breakdown detected');
    if (uninformedPct > 40) driftSignals.push('Strategy comprehension gap — majority unaware of OKRs');
    if (uninformedPct > 20) driftSignals.push('Misaligned project priorities observed');
    if (pct < 50)           driftSignals.push('Low IBM hybrid cloud + watsonx keyword mention rate');

    // Financial impact
    const financialRisk = parseFloat(Math.max(0, ((80 - simAlignment) / 10) * 50).toFixed(1));

    // Execution probability
    const execProb = parseFloat(Math.max(5, Math.min(98,
      simAlignment * 0.7 + 50 * 0.2 + simUnderstanding * 0.1
    )).toFixed(1));

    // Generate sample messages
    const comms = (team.employeeCommunications || []).slice(0, 8).map((c, i) => ({
      ...c,
      selected: i < Math.round(pct / 100 * 8),
    }));

    // 7-step scenario projections
    const scenarios = [0, 15, 30, 50, 65, 80, 100].map(p => ({
      informedPercent: p,
      alignment:       Math.round(baseScore + (p / 100) * (maxScore - baseScore)),
      executionProb:   Math.round(Math.max(5, Math.min(98, (baseScore + (p / 100) * (maxScore - baseScore)) * 0.9))),
      financialRisk:   parseFloat(Math.max(0, ((80 - (baseScore + (p / 100) * (maxScore - baseScore))) / 10) * 50).toFixed(1)),
    }));

    return res.json({
      success: true,
      data: {
        teamId,
        teamName:           team.name,
        department:         team.department,
        informedPercent:    pct,
        simulatedAlignment: simAlignment,
        simulatedUnderstanding: Math.min(100, Math.max(0, simUnderstanding)),
        executionProbability:   execProb,
        financialRisk,
        driftSignals,
        communicationSamples: comms,
        scenarioComparison:   scenarios,
        interpretation:       getSimInterpretation(pct, simAlignment),
      },
    });

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drift/strategy-context
// Returns IBM strategy document and per-team strategy context
// ─────────────────────────────────────────────────────────────────────────────
router.get('/strategy-context', async (req, res, next) => {
  try {
    const teams = await Team.find({}, {
      name: 1, department: 1, strategyContext: 1, strategyDocument: 1,
      alignmentScore: 1, executionProbability: 1, isDriftHotspot: 1,
    }).lean();

    const strategyDocument = teams[0]?.strategyDocument || '';

    return res.json({
      success: true,
      data: {
        strategyDocument,
        teamContexts: teams.map(t => ({
          id:                   t._id,
          name:                 t.name,
          department:           t.department,
          strategyContext:      t.strategyContext,
          alignmentScore:       t.alignmentScore,
          executionProbability: t.executionProbability,
          isDriftHotspot:       t.isDriftHotspot,
        })),
        ibmPillars: [
          { id: 1, name: 'Hybrid Cloud Platform', icon: '☁️', revenue: '$35B', teams: ['Cloud Platform', 'Finance & Operations'] },
          { id: 2, name: 'Artificial Intelligence (watsonx)', icon: '🤖', revenue: 'N/A', teams: ['Watson AI', 'Research Division'] },
          { id: 3, name: 'Consulting & Services', icon: '🤝', revenue: '$25B', teams: ['IBM Consulting', 'Enterprise Sales'] },
        ],
      },
    });

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drift/auto-correct
// Triggers autonomous alignment correction for a team
// ─────────────────────────────────────────────────────────────────────────────
router.post('/auto-correct', async (req, res, next) => {
  try {
    const { teamId } = req.body;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ success: false, error: 'Valid teamId required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Simulate autonomous correction: boost alignment while accurately
    // reporting the realised impact when a score is already near 100.
    const previousAlignment = team.alignmentScore;
    const plannedImpact     = previousAlignment < 50 ? 12 : 7;
    const newAlignment      = Math.min(100, previousAlignment + plannedImpact);
    const correctionImpact  = newAlignment - previousAlignment;
    const newUnderstanding  = Math.min(100, team.understanding + correctionImpact * 0.8);

    team.addAlignmentPoint(newAlignment, newUnderstanding, team.projectVelocity);
    await team.save();
    // Force the next forecast to use the corrected alignment snapshot.
    await Prediction.deleteOne({ teamId });

    // Invalidate caches
    cache.del(['drift_hotspots', 'impact_model', 'teams_list', 'predictions_all', 'recommendations_all', 'alignment_history', `team_${teamId}`]);

    const actions = getAutoCorrectionActions(team.department, team.alignmentScore);

    return res.json({
      success: true,
      data: {
        teamId,
        teamName:         team.name,
        previousAlignment,
        newAlignment,
        correctionImpact,
        autonomousActions: actions,
        estimatedRecovery: newAlignment >= 80
          ? 'Healthy alignment threshold reached'
          : `${Math.ceil((80 - newAlignment) / 2)} weeks to healthy alignment`,
        message: `Autonomous correction applied to ${team.name}. ${correctionImpact} point alignment boost initiated.`,
      },
    });

  } catch (err) {
    next(err);
  }
});

// ── Private helpers ───────────────────────────────────────────────────────────

function getSimInterpretation(pct, alignment) {
  if (pct >= 80) return `Excellent: ${pct}% of employees understand IBM strategy. Alignment at ${alignment}% — execution on track.`;
  if (pct >= 60) return `Good: ${pct}% informed. Some communication gaps exist. Targeted strategy sessions recommended.`;
  if (pct >= 40) return `Warning: Only ${pct}% understand strategy. Significant drift risk. Mandatory alignment workshops needed.`;
  if (pct >= 20) return `Critical: ${pct}% informed — majority lacks strategic context. Emergency re-alignment required.`;
  return `Emergency: Only ${pct}% understand IBM strategy. This team is flying blind. Immediate leadership intervention needed.`;
}

function getAutoCorrectionActions(department, currentScore) {
  const baseActions = [
    { type: 'communication', action: `Auto-generated: Strategy briefing scheduled for ${department} team — IBM watsonx & hybrid cloud priorities`, triggered: true },
    { type: 'coaching', action: `Leadership 1:1 alignment review auto-triggered for ${department} team leads`, triggered: true },
  ];

  if (currentScore < 50) {
    baseActions.push({ type: 'resource', action: `Resource reallocation analysis initiated — ${department} budget review vs strategic OKRs`, triggered: true });
    baseActions.push({ type: 'escalation', action: 'Executive notification sent — critical misalignment in ' + department, triggered: true });
  }

  if (currentScore < 65) {
    baseActions.push({ type: 'training', action: `IBM watsonx Academy enrollment triggered for ${department} team members`, triggered: true });
  }

  return baseActions;
}

module.exports = router;
