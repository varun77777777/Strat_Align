// models/Strategy.js — Optional strategy / OKR document model
'use strict';

const mongoose = require('mongoose');

const ObjectiveSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  keyResults:  [{ type: String }],
  owner:       { type: String, default: '' },
  dueDate:     { type: Date },
  progress:    { type: Number, min: 0, max: 100, default: 0 },
}, { _id: true });

const GoalSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  objectives:  [ObjectiveSchema],
  priority:    { type: Number, min: 1, max: 5, default: 3 },
}, { _id: true });

const StrategySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  vision:      { type: String, default: '' },
  quarter:     { type: String, default: '' },    // e.g. "Q3 2025"
  year:        { type: Number, default: () => new Date().getFullYear() },

  status: {
    type:    String,
    enum:    ['draft', 'active', 'archived'],
    default: 'active',
    index:   true,
  },

  goals:      { type: [GoalSchema], default: [] },
  objectives: { type: [ObjectiveSchema], default: [] },

  // Teams this strategy applies to
  targetTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],

  overallProgress: { type: Number, min: 0, max: 100, default: 0 },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});

StrategySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Strategy', StrategySchema);
