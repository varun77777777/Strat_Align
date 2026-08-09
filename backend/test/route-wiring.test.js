'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const Prediction = require(path.join(__dirname, '..', 'models', 'Prediction'));

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
