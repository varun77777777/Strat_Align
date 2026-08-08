// models/Prediction.js — Mongoose schema for AI-driven risk predictions
'use strict';

const mongoose = require('mongoose');

// ── Sub-schemas ─────────────────────────────────────────────────────────────

const RecommendationSchema = new mongoose.Schema({
  action:      { type: String, required: true },
  impact:      { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  priority:    { type: Number, min: 1, max: 10, default: 5 },
  category:    { type: String, default: 'general' },
  applied:     { type: Boolean, default: false },
  appliedAt:   { type: Date, default: null },
  expectedImprovement: { type: Number, min: 0, max: 30, default: 0 },
}, { _id: true });

// ── Main Prediction Schema ───────────────────────────────────────────────────

const PredictionSchema = new mongoose.Schema({
  teamId:   {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Team',
    required: true,
    index:    true,
  },
  teamName: { type: String, required: true, index: true },

  riskScore:      { type: Number, min: 0, max: 100, default: 50 },
  weeksToFailure: { type: Number, min: 0, default: null }, // null = no immediate risk
  confidence:     { type: Number, min: 0, max: 1, default: 0.75 },
  source:         { type: String, enum: ['ai', 'mock', 'manual'], default: 'mock' },

  recommendations: { type: [RecommendationSchema], default: [] },

  // Snapshot of team score when this prediction was generated
  snapshotAlignmentScore: { type: Number, default: 0 },
  // When this record was last refreshed from the AI service
  lastRefreshed: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────────
PredictionSchema.index({ riskScore: -1 });
PredictionSchema.index({ teamId: 1, createdAt: -1 });

// ── Virtuals ─────────────────────────────────────────────────────────────────

PredictionSchema.virtual('riskLevel').get(function () {
  if (this.riskScore >= 75) return 'critical';
  if (this.riskScore >= 55) return 'high';
  if (this.riskScore >= 35) return 'medium';
  return 'low';
});

PredictionSchema.virtual('pendingRecommendations').get(function () {
  return this.recommendations.filter(r => !r.applied);
});

// ── Statics ──────────────────────────────────────────────────────────────────

/** Build a prediction from a team document (deterministic fallback) */
PredictionSchema.statics.buildFromTeam = function (team) {
  const score      = team.alignmentScore ?? 50;
  const riskScore  = Math.max(0, Math.min(100, 100 - score));
  let   weeks      = null;

  if (riskScore >= 75)      weeks = Math.round(4  + (100 - score) / 5);
  else if (riskScore >= 55) weeks = Math.round(8  + (100 - score) / 4);
  else if (riskScore >= 35) weeks = Math.round(16 + (100 - score) / 3);

  const recommendations = generateRecommendations(team, riskScore);

  return {
    teamId:                 team._id,
    teamName:               team.name,
    riskScore,
    weeksToFailure:         weeks,
    confidence:             0.78,
    source:                 'mock',
    snapshotAlignmentScore: score,
    lastRefreshed:          new Date(),
    recommendations,
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateRecommendations (team, riskScore) {
  const recs = [];

  if (riskScore >= 60) {
    recs.push({
      action:              'Schedule weekly strategy alignment meeting with team leads',
      impact:              'high',
      priority:            1,
      category:            'communication',
      expectedImprovement: 12,
    });
  }
  if (riskScore >= 50) {
    recs.push({
      action:              'Conduct strategy comprehension survey across all members',
      impact:              'high',
      priority:            2,
      category:            'assessment',
      expectedImprovement: 8,
    });
  }
  if (team.projectVelocity < 50) {
    recs.push({
      action:              'Review and reprioritize project backlog against strategic goals',
      impact:              'medium',
      priority:            3,
      category:            'project-management',
      expectedImprovement: 7,
    });
  }
  if (team.understanding < 55) {
    recs.push({
      action:              'Deliver focused strategy briefing sessions for team members',
      impact:              'medium',
      priority:            4,
      category:            'training',
      expectedImprovement: 10,
    });
  }
  if (riskScore >= 70) {
    recs.push({
      action:              'Escalate misalignment risk to executive leadership immediately',
      impact:              'high',
      priority:            1,
      category:            'escalation',
      expectedImprovement: 5,
    });
  }

  // Always provide at least one recommendation
  if (recs.length === 0) {
    recs.push({
      action:              'Continue current alignment practices and monitor monthly',
      impact:              'low',
      priority:            8,
      category:            'monitoring',
      expectedImprovement: 2,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

module.exports = mongoose.model('Prediction', PredictionSchema);
