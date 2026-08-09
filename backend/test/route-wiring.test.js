'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const driftSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'drift.js'), 'utf8');
const recommendationsSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'recommendations.js'), 'utf8');
const backendEnvExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
const rootEnvExample = fs.readFileSync(path.join(__dirname, '..', '..', '.env.example'), 'utf8');
const Prediction = require(path.join(__dirname, '..', 'models', 'Prediction'));
const Team = require(path.join(__dirname, '..', 'models', 'Team'));

test('registers the strategic drift router under the public API path', () => {
  assert.match(serverSource, /require\('\.\/routes\/drift'\)/);
  assert.match(serverSource, /app\.use\('\/api\/drift',\s*driftRouter\)/);
});

test('advertises all autonomous correction endpoints', () => {
  for (const endpoint of [
    '/api/drift/hotspots',
    '/api/drift/impact-model',
    '/api/drift/strategy-context',
    '/api/drift/simulate-understanding',
    '/api/drift/auto-correct',
  ]) {
    assert.ok(serverSource.includes(endpoint), `Missing ${endpoint}`);
  }
});

test('preserves an existing scenario and accepts its seeded prediction source', () => {
  assert.match(serverSource, /const teamCount = await Team\.countDocuments\(\)/);
  assert.match(serverSource, /if \(teamCount === 0\)/);
  assert.ok(Prediction.schema.path('source').enumValues.includes('ibm-scenario'));
});

test('corrections and analysis invalidate stale forecasts and use deterministic fallbacks', () => {
  assert.match(driftSource, /await Prediction\.deleteOne\(\{ teamId \}\)/);
  assert.doesNotMatch(driftSource, /Math\.random\(/);
  assert.match(recommendationsSource, /await Prediction\.deleteOne\(\{ teamId: team_id \}\)/);
  assert.doesNotMatch(recommendationsSource, /Math\.random\(/);
  assert.match(recommendationsSource, /const mentioned = strategyTerms\.filter/);
});

test('team derived metrics remain within valid bounds after an alignment correction', () => {
  const team = new Team({
    name: 'Test Team', department: 'Engineering', leader: 'Test Lead',
    alignmentScore: 96, understanding: 96, projectVelocity: 85,
    alignmentTrend: [
      { date: new Date('2026-01-01'), score: 90, understanding: 90, projectVelocity: 80 },
      { date: new Date('2026-01-08'), score: 96, understanding: 96, projectVelocity: 85 },
    ],
  });

  team.addAlignmentPoint(100, 100, 85);
  assert.equal(team.alignmentScore, 100);
  assert.equal(team.understanding, 100);
  assert.ok(team.executionProbability <= 98);
  assert.ok(team.executionProbability >= 5);
  assert.equal(team.financialRisk, 0);
  assert.equal(team.status, 'excellent');
});

test('environment templates are local-safe and do not include deployed credentials', () => {
  for (const envTemplate of [backendEnvExample, rootEnvExample]) {
    assert.match(envTemplate, /MONGODB_URI=mongodb:\/\/127\.0\.0\.1:27017\/strat_align/);
    assert.match(envTemplate, /GEMINI_API_KEY=your_gemini_api_key_here/);
    assert.doesNotMatch(envTemplate, /^MONGODB_URI=mongodb\+srv:\/\//m);
    assert.doesNotMatch(envTemplate, /^HUGGINGFACE_API_KEY=hf_[A-Za-z0-9]{20,}/m);
  }
});
