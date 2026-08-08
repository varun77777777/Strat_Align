// models/Team.js — Mongoose schema for a Team
'use strict';

const mongoose = require('mongoose');

// ── Sub-schemas ─────────────────────────────────────────────────────────────

const ProjectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  status:      { type: String, enum: ['on-track', 'at-risk', 'delayed', 'completed'], default: 'on-track' },
  progress:    { type: Number, min: 0, max: 100, default: 0 },
  dueDate:     { type: Date },
  description: { type: String, default: '' },
}, { _id: false });

const AlignmentPointSchema = new mongoose.Schema({
  date:            { type: Date, required: true },
  score:           { type: Number, min: 0, max: 100, required: true },
  understanding:   { type: Number, min: 0, max: 100, default: 0 },
  projectVelocity: { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

// ── Main Team Schema ─────────────────────────────────────────────────────────

const TeamSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true, index: true },
  department:      { type: String, required: true, trim: true },
  leader:          { type: String, required: true, trim: true },
  members:         { type: Number, min: 1, default: 5 },

  // Current snapshot metrics
  alignmentScore:  { type: Number, min: 0, max: 100, default: 50 },
  understanding:   { type: Number, min: 0, max: 100, default: 50 },
  projectVelocity: { type: Number, min: 0, max: 100, default: 50 },

  // Derived / computed
  trend:  {
    type: String,
    enum: ['improving', 'stable', 'declining'],
    default: 'stable',
  },
  status: {
    type: String,
    enum: ['critical', 'at-risk', 'good', 'excellent'],
    default: 'good',
  },

  // Nested collections
  projects:       { type: [ProjectSchema],       default: [] },
  alignmentTrend: { type: [AlignmentPointSchema], default: [] },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});

// ── Indexes ─────────────────────────────────────────────────────────────────
TeamSchema.index({ department: 1 });
TeamSchema.index({ alignmentScore: -1 });
TeamSchema.index({ status: 1 });

// ── Virtuals ─────────────────────────────────────────────────────────────────

/** Last 7 alignment history points for quick charting */
TeamSchema.virtual('recentTrend').get(function () {
  return this.alignmentTrend.slice(-7);
});

// ── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Recompute `status` and `trend` from current score + history.
 * Call before saving after any score update.
 */
TeamSchema.methods.recomputeDerived = function () {
  const score = this.alignmentScore;

  // Status
  if (score >= 80)      this.status = 'excellent';
  else if (score >= 65) this.status = 'good';
  else if (score >= 50) this.status = 'at-risk';
  else                  this.status = 'critical';

  // Trend — compare last two data points
  const history = this.alignmentTrend;
  if (history.length >= 2) {
    const prev = history[history.length - 2].score;
    const curr = history[history.length - 1].score;
    const delta = curr - prev;
    if (delta > 2)       this.trend = 'improving';
    else if (delta < -2) this.trend = 'declining';
    else                 this.trend = 'stable';
  }

  return this;
};

/**
 * Push a new alignment data-point and keep only last 30.
 */
TeamSchema.methods.addAlignmentPoint = function (score, understanding, projectVelocity) {
  this.alignmentTrend.push({
    date: new Date(),
    score,
    understanding:   understanding   ?? this.understanding,
    projectVelocity: projectVelocity ?? this.projectVelocity,
  });

  // Keep last 30 data points
  if (this.alignmentTrend.length > 30) {
    this.alignmentTrend = this.alignmentTrend.slice(-30);
  }

  this.alignmentScore  = score;
  this.understanding   = understanding   ?? this.understanding;
  this.projectVelocity = projectVelocity ?? this.projectVelocity;
  this.recomputeDerived();
  return this;
};

// ── Statics ──────────────────────────────────────────────────────────────────

/** Lightweight list projection for GET /api/teams */
TeamSchema.statics.listView = function () {
  return this.find({}, {
    name: 1, department: 1, leader: 1, members: 1,
    alignmentScore: 1, understanding: 1, projectVelocity: 1,
    trend: 1, status: 1, createdAt: 1,
  }).sort({ alignmentScore: -1 });
};

module.exports = mongoose.model('Team', TeamSchema);
