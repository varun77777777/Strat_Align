// routes/causal.js — Causal Reasoning Engine endpoints
'use strict';

const express = require('express');
const Team    = require('../models/Team');
const cache   = require('../cache');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/causal/report
// Returns per-team causal reasoning reports with root causes, evidence, forecast
// ─────────────────────────────────────────────────────────────────────────────
router.get('/report', async (req, res, next) => {
  try {
    const cacheKey = 'causal_report';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const teams = await Team.find({}, {
      name: 1, department: 1, leader: 1, members: 1,
      alignmentScore: 1, trend: 1, status: 1,
      deviationMetric: 1, deviationMagnitude: 1,
      rootCauseSummary: 1, rootCauseConfidence: 1,
      causalChain: 1, evidenceQuotes: 1,
      forecastRevenueMiss: 1, forecastTimeframeWeeks: 1,
      counterfactualWithFix: 1, counterfactualWorstCase: 1,
      financialRisk: 1, executionProbability: 1,
      isDriftHotspot: 1, driftVelocity: 1,
    }).lean();

    const reports = teams.map(team => {
      const severity = getSeverity(team.alignmentScore, team.driftVelocity);
      const causeTypeLabel = getCauseTypeLabel(team.causalChain);
      const needsEscalation = team.alignmentScore < 55 || (team.driftVelocity || 0) < -2;
      const interventionRecommendation = getIntervention(team, causeTypeLabel);

      return {
        id:              team._id,
        teamName:        team.name,
        department:      team.department,
        leader:          team.leader,
        alignmentScore:  team.alignmentScore,
        trend:           team.trend,
        status:          team.status,
        severity,
        deviationMetric:     team.deviationMetric || 'Alignment Score',
        deviationMagnitude:  team.deviationMagnitude || 0,
        rootCauseSummary:    team.rootCauseSummary || 'Insufficient data for root cause analysis',
        rootCauseConfidence: team.rootCauseConfidence || 75,
        primaryCauseType:    causeTypeLabel,
        causalChain:         team.causalChain || [],
        evidenceQuotes:      team.evidenceQuotes || [],
        evidenceCount:       (team.evidenceQuotes || []).length,
        forecastRevenueMiss:     team.forecastRevenueMiss || 0,
        forecastTimeframeWeeks:  team.forecastTimeframeWeeks || 12,
        counterfactualWithFix:   team.counterfactualWithFix || 0,
        counterfactualWorstCase: team.counterfactualWorstCase || 0,
        financialRisk:           team.financialRisk || 0,
        executionProbability:    team.executionProbability || 50,
        needsEscalation,
        interventionRecommendation,
        estimatedRecoveryWeeks: Math.ceil((80 - team.alignmentScore) / 3),
      };
    });

    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    reports.sort((a, b) =>
      (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    );

    const orgSummary = {
      totalTeams:              reports.length,
      criticalTeams:           reports.filter(r => r.severity === 'critical').length,
      highRiskTeams:           reports.filter(r => r.severity === 'high').length,
      teamsNeedingEscalation:  reports.filter(r => r.needsEscalation).length,
      totalRevenueMiss:        parseFloat(reports.reduce((s, r) => s + r.forecastRevenueMiss, 0).toFixed(1)),
      worstCaseMiss:           parseFloat(reports.reduce((s, r) => s + r.counterfactualWorstCase, 0).toFixed(1)),
      withFixMiss:             parseFloat(reports.reduce((s, r) => s + r.counterfactualWithFix, 0).toFixed(1)),
      topCauseTypes:           getTopCauses(reports),
    };

    const result = { reports, orgSummary };
    cache.set(cacheKey, result, 60);
    return res.json({ success: true, data: result });

  } catch (err) {
    next(err);
  }
});

router.get('/report/:teamId', async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId).lean();
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const severity = getSeverity(team.alignmentScore, team.driftVelocity);
    const causeTypeLabel = getCauseTypeLabel(team.causalChain);
    const needsEscalation = team.alignmentScore < 55 || (team.driftVelocity || 0) < -2;

    return res.json({
      success: true,
      data: {
        id: team._id, teamName: team.name, department: team.department,
        leader: team.leader, alignmentScore: team.alignmentScore,
        trend: team.trend, status: team.status, severity,
        deviationMetric: team.deviationMetric, deviationMagnitude: team.deviationMagnitude,
        rootCauseSummary: team.rootCauseSummary, rootCauseConfidence: team.rootCauseConfidence,
        primaryCauseType: causeTypeLabel,
        causalChain: team.causalChain || [], evidenceQuotes: team.evidenceQuotes || [],
        forecastRevenueMiss: team.forecastRevenueMiss, forecastTimeframeWeeks: team.forecastTimeframeWeeks,
        counterfactualWithFix: team.counterfactualWithFix, counterfactualWorstCase: team.counterfactualWorstCase,
        financialRisk: team.financialRisk, executionProbability: team.executionProbability,
        needsEscalation,
        interventionRecommendation: getIntervention(team, causeTypeLabel),
        estimatedRecoveryWeeks: Math.ceil((80 - team.alignmentScore) / 3),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSeverity(alignmentScore, driftVelocity) {
  if (alignmentScore < 45 || (driftVelocity || 0) < -3)   return 'critical';
  if (alignmentScore < 60 || (driftVelocity || 0) < -1.5)  return 'high';
  if (alignmentScore < 75)                                  return 'medium';
  return 'low';
}

function getCauseTypeLabel(causalChain) {
  if (!causalChain || causalChain.length === 0) return 'communication';
  const typeCounts = {};
  causalChain.forEach(step => {
    typeCounts[step.evidenceType] = (typeCounts[step.evidenceType] || 0) + 1;
  });
  return Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'communication';
}

function getTopCauses(reports) {
  const typeCounts = {};
  reports.forEach(r => {
    const t = r.primaryCauseType || 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}

function getIntervention(team, causeType) {
  const interventions = {
    resource:      `Immediate resource reallocation for ${team.name}: unlock budget and headcount within 2 weeks. Expected alignment improvement: 12-18% in 4 weeks.`,
    talent:        `Emergency talent acquisition for ${team.name}: fast-track key hires, engage interim contractors. Expected recovery: 8-16 weeks.`,
    incentive:     `Compensation restructuring for ${team.name}: realign bonus triggers to IBM strategic priorities (watsonx adoption, hybrid cloud). Behavior change expected in 2 sprints.`,
    communication: `Communication repair for ${team.name}: executive clarification session, eliminate conflicting mandates. Issue single written directive within 5 business days.`,
    market:        `Market signal integration for ${team.name}: update roadmap to reflect competitor moves with leadership sign-off. Rebalance priorities immediately.`,
    external:      `External factor mitigation for ${team.name}: regulatory/competitive landscape review, update risk model, re-align team on revised priorities.`,
  };
  return interventions[causeType] || interventions['communication'];
}

module.exports = router;
