// routes/network.js — Organizational Network Intelligence endpoints
'use strict';

const express = require('express');
const Team    = require('../models/Team');
const cache   = require('../cache');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/network/graph
// Returns org network graph: nodes, edges, silos, opinion leaders, degradation
// ─────────────────────────────────────────────────────────────────────────────
router.get('/graph', async (req, res, next) => {
  try {
    const cacheKey = 'network_graph';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const teams = await Team.find({}, {
      name: 1, department: 1, leader: 1, members: 1,
      alignmentScore: 1, trend: 1, status: 1,
      networkConnections: 1, opinionLeaders: 1,
      messageDegradation: 1, informationSilo: 1, siloScore: 1,
      rootCauseSummary: 1, rootCauseConfidence: 1, financialRisk: 1,
    }).lean();

    // Build nodes (one per team)
    const nodes = teams.map((team, i) => ({
      id:             String(team._id),
      label:          team.name,
      department:     team.department,
      leader:         team.leader,
      members:        team.members,
      alignmentScore: team.alignmentScore,
      status:         team.status,
      trend:          team.trend,
      informationSilo: team.informationSilo || false,
      siloScore:       team.siloScore || 0,
      financialRisk:   team.financialRisk || 0,
      rootCauseSummary: team.rootCauseSummary || '',
      rootCauseConfidence: team.rootCauseConfidence || 0,
      opinionLeaders:  team.opinionLeaders || [],
      // Position hint for layout (circular, overrideable by frontend)
      angle:  (i / teams.length) * 2 * Math.PI,
    }));

    // Build edges from networkConnections
    const nodeIdByName = {};
    teams.forEach(t => { nodeIdByName[t.name] = String(t._id); });

    const edgeSet = new Set();
    const edges   = [];

    teams.forEach(team => {
      (team.networkConnections || []).forEach(conn => {
        const sourceId = String(team._id);
        const targetId = nodeIdByName[conn.targetTeam];
        if (!targetId) return;

        // Deduplicate bidirectional edges
        const key = [sourceId, targetId].sort().join('--');
        if (edgeSet.has(key)) return;
        edgeSet.add(key);

        edges.push({
          id:                `${sourceId}-${targetId}`,
          source:            sourceId,
          target:            targetId,
          sourceLabel:       team.name,
          targetLabel:       conn.targetTeam,
          communicationFreq: conn.communicationFreq,
          strength:          conn.strength,
          type:              conn.type,
          weight:            conn.communicationFreq / 100,
        });
      });
    });

    // Detect information silos (teams with very few or weak connections)
    const silos = nodes.filter(n => n.informationSilo || n.siloScore > 60).map(n => ({
      teamId:    n.id,
      teamName:  n.label,
      siloScore: n.siloScore,
      reason:    getSiloReason(n),
    }));

    // Collect all opinion leaders across org
    const allOpinionLeaders = [];
    teams.forEach(team => {
      (team.opinionLeaders || []).forEach(leader => {
        allOpinionLeaders.push({
          ...leader,
          teamId:   String(team._id),
          teamName: team.name,
          department: team.department,
        });
      });
    });
    allOpinionLeaders.sort((a, b) => b.influenceScore - a.influenceScore);

    // Build message degradation flow (use Enterprise Sales as prime example)
    const degradationExamples = teams
      .filter(t => (t.messageDegradation || []).length > 0)
      .map(t => ({
        teamId:     String(t._id),
        teamName:   t.name,
        department: t.department,
        alignmentScore: t.alignmentScore,
        degradationPath: t.messageDegradation,
        maxDegradation: Math.max(...(t.messageDegradation || []).map(m => m.degradationScore)),
      }))
      .sort((a, b) => b.maxDegradation - a.maxDegradation);

    // Org-level network stats
    const avgConnections = teams.reduce((s, t) => s + (t.networkConnections || []).length, 0) / Math.max(teams.length, 1);
    const misalignedLeaders = allOpinionLeaders.filter(l => l.alignmentBias === 'misaligned');

    const networkSummary = {
      totalNodes:          nodes.length,
      totalEdges:          edges.length,
      informationSilos:    silos.length,
      avgConnectionsPerTeam: parseFloat(avgConnections.toFixed(1)),
      totalOpinionLeaders: allOpinionLeaders.length,
      misalignedInfluencers: misalignedLeaders.length,
      highRiskInfluencers: misalignedLeaders.filter(l => l.influenceScore > 70),
      avgSiloScore:        parseFloat(
        (nodes.reduce((s, n) => s + n.siloScore, 0) / Math.max(nodes.length, 1)).toFixed(1)
      ),
    };

    const result = {
      nodes,
      edges,
      silos,
      opinionLeaders: allOpinionLeaders,
      degradationExamples,
      networkSummary,
      // Pre-built IBM org message corruption example for the animated demo
      messageCorrruptionDemo: buildCorruptionDemo(),
    };

    cache.set(cacheKey, result, 60);
    return res.json({ success: true, data: result });

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/network/degradation/:teamId
// Returns message degradation path for a specific team
// ─────────────────────────────────────────────────────────────────────────────
router.get('/degradation/:teamId', async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId, {
      name: 1, department: 1, messageDegradation: 1, alignmentScore: 1,
    }).lean();
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    return res.json({
      success: true,
      data: {
        teamId:    team._id,
        teamName:  team.name,
        department: team.department,
        alignmentScore: team.alignmentScore,
        degradationPath: team.messageDegradation || [],
        maxDegradation:  Math.max(...(team.messageDegradation || [{ degradationScore: 0 }]).map(m => m.degradationScore)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSiloReason(node) {
  if (node.siloScore > 80) return 'Critically isolated — virtually no cross-team communication detected';
  if (node.siloScore > 60) return 'High isolation — few and weak connections to rest of organization';
  return 'Moderate isolation — limited cross-functional communication';
}

function buildCorruptionDemo() {
  return {
    title: 'IBM Strategy: "Expand in Asia" → How it degrades',
    originalMessage: 'Aggressively expand IBM AI and cloud presence in Asia-Pacific by Q4 — priority market for watsonx enterprise growth',
    steps: [
      { level: 0, actor: 'CEO', message: 'Aggressively expand IBM AI and cloud presence in Asia-Pacific by Q4', corruption: 0, note: 'Original directive' },
      { level: 1, actor: 'Regional VP Asia-Pacific', message: 'Drive Asia-Pacific growth — balance cloud and AI with regional partnership development', corruption: 20, note: 'Scope broadened, urgency softened' },
      { level: 2, actor: 'Country Manager', message: 'Grow partnerships with local tech companies — explore cloud and AI where it fits', corruption: 50, note: 'AI/cloud priority dropped, partnerships elevated' },
      { level: 3, actor: 'Business Dev Lead', message: 'Build relationships with local tech companies to reduce cost dependency on US market', corruption: 75, note: 'Strategy reversed — now about cost reduction' },
      { level: 4, actor: 'Sales Team', message: 'Focus on relationship-building with local vendors and reduce US client dependency', corruption: 95, note: 'Original message completely inverted' },
    ],
  };
}

module.exports = router;
