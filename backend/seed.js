// seed.js — Populates MongoDB with specific realistic teams & predictions
'use strict';

require('dotenv').config();
const mongoose   = require('mongoose');
const Team       = require('./models/Team');
const Prediction = require('./models/Prediction');

// Helper to generate the exact specified historical points
function generateTrendHistory(pointsArray) {
  const totalDays = pointsArray.length;
  return pointsArray.map((score, index) => {
    // Generate date offset by index (e.g. 7 days ago down to today)
    const date = new Date();
    date.setDate(date.getDate() - (totalDays - 1 - index));
    return {
      date,
      score,
      understanding: Math.max(5, score - 5),
      projectVelocity: Math.max(5, score + 2),
    };
  });
}

// ── Seed Data definition ─────────────────────────────────────────────────────

const TEAMS_DATA = [
  {
    name: 'Engineering',
    department: 'Engineering',
    leader: 'Sarah Chen',
    members: 24,
    alignmentScore: 45,
    understanding: 38,
    projectVelocity: 55,
    trend: 'declining',
    status: 'critical', // Mapping CRITICAL -> critical
    historyPoints: [50, 48, 46, 45, 44, 43, 42],
    projects: [
      { name: 'Legacy Maintenance', status: 'delayed', progress: 70, description: 'Fixing technical debt in monolithic codebase' },
      { name: 'Cloud Migration', status: 'at-risk', progress: 30, description: 'Transitioning key services to AWS cloud hosting' }
    ],
    // Predictions override details
    prediction: {
      riskScore: 78,
      weeksToFailure: 4.5,
      confidence: 0.88,
      recommendations: [
        { action: 'Initiate core system architecture realignment workshop', impact: 'high', priority: 1, category: 'architecture', expectedImprovement: 15 },
        { action: 'Standardize communication logs on strategic roadmap goals', impact: 'medium', priority: 2, category: 'process', expectedImprovement: 8 },
        { action: 'Conduct 1:1 strategy alignment reviews for senior leads', impact: 'medium', priority: 3, category: 'coaching', expectedImprovement: 10 }
      ]
    }
  },
  {
    name: 'Sales',
    department: 'Sales',
    leader: 'Jessica Williams',
    members: 18,
    alignmentScore: 38,
    understanding: 32,
    projectVelocity: 42,
    trend: 'declining',
    status: 'critical', // Mapping CRITICAL -> critical
    historyPoints: [42, 40, 38, 37, 36, 35, 35],
    projects: [
      { name: 'Enterprise Pitch Overhaul', status: 'at-risk', progress: 25, description: 'Align messaging to executive value proposition' },
      { name: 'Sales Process Automation', status: 'delayed', progress: 15, description: 'Integration of new CRM strategy logs' }
    ],
    prediction: {
      riskScore: 72,
      weeksToFailure: 6,
      confidence: 0.85,
      recommendations: [
        { action: 'Deploy sales enablement strategy training modules', impact: 'high', priority: 1, category: 'training', expectedImprovement: 12 },
        { action: 'Re-align target commissions to product roadmap execution milestones', impact: 'high', priority: 2, category: 'incentives', expectedImprovement: 18 }
      ]
    }
  },
  {
    name: 'Product',
    department: 'Product',
    leader: 'Marcus Johnson',
    members: 12,
    alignmentScore: 82,
    understanding: 85,
    projectVelocity: 80,
    trend: 'stable',
    status: 'excellent', // Mapping HEALTHY -> excellent
    historyPoints: [78, 79, 80, 81, 82, 82, 82],
    projects: [
      { name: 'Unified Dashboard Beta', status: 'on-track', progress: 85, description: 'Public beta release of telemetry dashboards' },
      { name: 'Continuous Discovery Cycle', status: 'on-track', progress: 95, description: 'Weekly customer feedback loops' }
    ],
    prediction: {
      riskScore: 15,
      weeksToFailure: 24,
      confidence: 0.92,
      recommendations: [
        { action: 'Continue current roadmap communication protocols', impact: 'low', priority: 1, category: 'monitoring', expectedImprovement: 2 },
        { action: 'Document alignment playbook to export to other teams', impact: 'medium', priority: 2, category: 'documentation', expectedImprovement: 5 }
      ]
    }
  },
  {
    name: 'Customer Success',
    department: 'Customer Success',
    leader: 'Emily Davis',
    members: 20,
    alignmentScore: 75,
    understanding: 78,
    projectVelocity: 74,
    trend: 'improving',
    status: 'excellent', // Mapping HEALTHY -> excellent
    historyPoints: [73, 74, 75, 75, 75, 75, 76],
    projects: [
      { name: 'Onboarding System Redesign', status: 'on-track', progress: 65, description: 'New visual walkthrough for platform trial accounts' }
    ],
    prediction: {
      riskScore: 25,
      weeksToFailure: 18,
      confidence: 0.89,
      recommendations: [
        { action: 'Create strategy-tagged playbook templates for post-sales support', impact: 'medium', priority: 1, category: 'support', expectedImprovement: 6 }
      ]
    }
  },
  {
    name: 'Operations',
    department: 'Operations',
    leader: 'David Park',
    members: 15,
    alignmentScore: 68,
    understanding: 70,
    projectVelocity: 66,
    trend: 'stable',
    status: 'good', // Mapping CAUTION -> good
    historyPoints: [65, 66, 67, 68, 68, 68, 68],
    projects: [
      { name: 'Infrastructure Optimization', status: 'on-track', progress: 50, description: 'Reducing compute resources by standardizing deployment pipelines' }
    ],
    prediction: {
      riskScore: 32,
      weeksToFailure: 14,
      confidence: 0.82,
      recommendations: [
        { action: 'Review compute objectives with strategy coordinator', impact: 'medium', priority: 1, category: 'operations', expectedImprovement: 7 }
      ]
    }
  },
  {
    name: 'Finance',
    department: 'Finance',
    leader: 'Amanda Torres',
    members: 8,
    alignmentScore: 55,
    understanding: 58,
    projectVelocity: 60,
    trend: 'stable',
    status: 'at-risk', // Mapping CAUTION -> at-risk
    historyPoints: [52, 53, 54, 55, 55, 55, 56],
    projects: [
      { name: 'Quarterly Audit Integration', status: 'at-risk', progress: 40, description: 'Re-aligning audit milestones to operational objectives' }
    ],
    prediction: {
      riskScore: 45,
      weeksToFailure: 11,
      confidence: 0.78,
      recommendations: [
        { action: 'Establish recurring finance alignment checkpoints', impact: 'medium', priority: 1, category: 'checks', expectedImprovement: 9 }
      ]
    }
  },
  {
    name: 'Marketing',
    department: 'Marketing',
    leader: 'Michael Brown',
    members: 14,
    alignmentScore: 58,
    understanding: 60,
    projectVelocity: 62,
    trend: 'stable',
    status: 'at-risk', // Mapping CAUTION -> at-risk
    historyPoints: [55, 56, 57, 58, 58, 58, 58],
    projects: [
      { name: 'Brand Overhaul Launch', status: 'at-risk', progress: 45, description: 'Aligning design guidelines to updated strategic roadmap' }
    ],
    prediction: {
      riskScore: 42,
      weeksToFailure: 12,
      confidence: 0.80,
      recommendations: [
        { action: 'Align external communications to OKR targets', impact: 'medium', priority: 1, category: 'branding', expectedImprovement: 10 }
      ]
    }
  },
  {
    name: 'Human Resources',
    department: 'HR',
    leader: 'Rachel Kim',
    members: 10,
    alignmentScore: 72,
    understanding: 74,
    projectVelocity: 70,
    trend: 'stable',
    status: 'good', // Mapping HEALTHY -> good
    historyPoints: [70, 71, 72, 72, 72, 72, 72],
    projects: [
      { name: 'Strategic Recruiting Backlog', status: 'on-track', progress: 80, description: 'Hiring key resources for high-priority projects' }
    ],
    prediction: {
      riskScore: 28,
      weeksToFailure: 16,
      confidence: 0.84,
      recommendations: [
        { action: 'Refactor talent pipelines using strategic metrics', impact: 'medium', priority: 1, category: 'recruiting', expectedImprovement: 7 }
      ]
    }
  }
];

// ── Seeding Script logic ─────────────────────────────────────────────────────

async function seed() {
  console.log('[seed] Cleaning database tables...');
  
  // Clean old data to prevent duplicates
  await Team.deleteMany({});
  await Prediction.deleteMany({});
  console.log('[seed] Database collections cleared.');

  console.log('[seed] Starting seeding process...');
  
  for (const teamData of TEAMS_DATA) {
    const alignmentTrend = generateTrendHistory(teamData.historyPoints);
    
    // Create Team document
    const teamDoc = await Team.create({
      name: teamData.name,
      department: teamData.department,
      leader: teamData.leader,
      members: teamData.members,
      alignmentScore: teamData.alignmentScore,
      understanding: teamData.understanding,
      projectVelocity: teamData.projectVelocity,
      trend: teamData.trend,
      status: teamData.status,
      projects: teamData.projects,
      alignmentTrend,
    });

    // Create Prediction document linked to the created Team ID
    await Prediction.create({
      teamId: teamDoc._id,
      teamName: teamDoc.name,
      riskScore: teamData.prediction.riskScore,
      weeksToFailure: teamData.prediction.weeksToFailure,
      confidence: teamData.prediction.confidence,
      source: 'mock',
      recommendations: teamData.prediction.recommendations,
      snapshotAlignmentScore: teamDoc.alignmentScore,
      lastRefreshed: new Date(),
    });

    console.log(`  ✓ Successfully seeded: ${teamDoc.name}`);
  }

  console.log('[seed] Seeding process completed successfully! ✓');
}

// Direct Execution check
async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/strat_align';
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('[seed] Connected to MongoDB.');
  try {
    await seed();
  } catch (err) {
    console.error('[seed] Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[seed] Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('[seed] Fatal exception:', err);
    process.exit(1);
  });
}

module.exports = { seed };
