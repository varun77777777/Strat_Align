// seed.js — IBM Strategy Scenario: Strategic Alignment Intelligence Simulation
'use strict';

require('dotenv').config();
const mongoose   = require('mongoose');
const Team       = require('./models/Team');
const Prediction = require('./models/Prediction');

// ── IBM 2024 Annual Report Strategy (condensed) ───────────────────────────────
const IBM_STRATEGY_DOCUMENT = `
IBM ANNUAL REPORT 2024 — STRATEGIC PRIORITIES

STRATEGIC VISION: IBM is focused on being the trusted partner for businesses embracing
hybrid cloud and AI transformation. Our strategy centers on three core pillars:

PILLAR 1 — HYBRID CLOUD PLATFORM
IBM's hybrid cloud platform enables clients to deploy, run, and manage workloads
consistently across on-premises, private cloud, and multiple public cloud environments.
Red Hat OpenShift serves as the unified operational layer. Target: 50% of enterprise
workloads migrated to hybrid cloud by 2026. Revenue target: $35B from hybrid cloud.

PILLAR 2 — ARTIFICIAL INTELLIGENCE (watsonx)
IBM watsonx is our enterprise AI and data platform — the foundation for AI-driven
business transformation. Focus on foundation models, AI governance (IBM OpenScale),
and domain-specific AI models for banking, healthcare, and manufacturing.
Target: 40,000 clients using watsonx by end of FY2025.

PILLAR 3 — CONSULTING & SERVICES TRANSFORMATION  
IBM Consulting drives implementation of hybrid cloud and AI solutions for clients.
Strategic focus: AI-powered consulting, digital labor solutions, and workforce upskilling.
Partnership with SAP, Salesforce, and AWS to deliver integrated solutions.
Revenue target: $25B from consulting by 2026.

STRATEGIC METRICS & OKRs:
- Gross profit margin target: 57% by FY2026
- Annual recurring revenue (ARR): Grow 15% YoY
- Client Net Promoter Score (NPS): Improve by 12 points
- Employee utilization: Maintain above 85%
- Sustainability: Net zero greenhouse gas emissions by 2030

RISK FACTORS REQUIRING ALIGNMENT:
- Competitive pressure from Microsoft Azure AI and Google Cloud
- Talent shortage in AI/ML domain expertise  
- Customer adoption lag in regulated industries (financial services, healthcare)
- Integration complexity between legacy IBM systems and new cloud-native stack
`;

// ── Employee communication templates ────────────────────────────────────────

// Informed employee messages (understand strategy well)
const INFORMED_MESSAGES = {
  'Watson AI': [
    "We're focusing all our sprint work on watsonx foundation model integration — this directly ties to our Q3 OKRs around AI adoption.",
    "Team meeting this week: aligning our roadmap to IBM's 40,000 client watsonx target — we need to accelerate onboarding flows.",
    "Excellent momentum on AI governance features. NPS targets are front of mind and we're building toward that.",
    "Clear direction from leadership: watsonx enterprise adoption is THE strategic priority. All hands on deck.",
    "Our hybrid cloud + watsonx coupling is ahead of plan. Revenue target feels achievable.",
  ],
  'Cloud Platform': [
    "Red Hat OpenShift migration dashboard is live. We're tracking the 50% enterprise workload target weekly.",
    "Hybrid cloud architecture review done. Our roadmap maps directly to IBM Pillar 1 objectives.",
    "OpenShift certification for 3 new client environments this week — on track for ARR growth target.",
    "Cross-team alignment on AWS partnership integration — consulting and cloud working well together.",
    "Executive review flagged we're ahead on hybrid cloud but need to close gaps in regulated industries.",
  ],
  'Consulting': [
    "Client workshops going well. AI-powered consulting methodology is resonating with enterprise clients.",
    "SAP + IBM integration deal closed. Directly contributes to $25B consulting revenue target.",
    "Workforce upskilling program launched — 200 consultants trained on watsonx this quarter.",
    "IBM Consulting is the strategic engine. Our AI transformation engagements are accelerating.",
    "NPS improvements visible in quarterly client feedback. We're hitting the right notes.",
  ],
  'Security': [
    "Security strategy is fully aligned to hybrid cloud protection requirements.",
    "Zero trust architecture implementation aligns to IBM's enterprise platform security OKRs.",
    "Team is clear on priorities: protect hybrid cloud assets for enterprise clients.",
    "Threat intelligence roadmap syncs well with IBM's overall risk mitigation strategy.",
    "Working closely with Watson AI team on AI governance and security integration.",
  ],
  'Research': [
    "Foundation model research directly feeding watsonx product roadmap — strong alignment.",
    "Quantum computing milestones on track. Leadership understands the long-term strategic value.",
    "AI for sustainability research maps to IBM's net zero 2030 commitment.",
    "Research outcomes are being commercialized faster than ever — strategy is working.",
    "Collaboration with consulting team on domain-specific AI models is producing results.",
  ],
  'Sales': [
    "Q3 pipeline fully focused on watsonx and hybrid cloud solutions — our quota structure matches strategic priorities.",
    "Client conversations centered on ROI of AI transformation — message is landing well.",
    "Compensation plan updated to incentivize hybrid cloud + AI bundled deals.",
    "Win rate improving on watsonx deals as clients see concrete IBM differentiation.",
    "Sales playbook updated with new competitive battlecards vs Microsoft and Google.",
  ],
};

// Random (uninformed) employee messages — show drift
const RANDOM_MESSAGES = {
  'Watson AI': [
    "Not really sure what direction product is taking — keeps changing every quarter.",
    "Been working on internal tooling. Not sure how this fits into the bigger picture.",
    "Heard something about watsonx but our team hasn't gotten any clear briefing.",
    "Management says AI is the priority but no one has explained what that means for our work.",
    "Don't know what the 40,000 client target is or why it matters to us.",
  ],
  'Cloud Platform': [
    "We're still maintaining legacy systems. Not sure how this connects to cloud strategy.",
    "Got conflicting messages from two different VPs about cloud migration timelines.",
    "No one told us about the OpenShift mandate until last week — way behind now.",
    "Unclear if we should be supporting AWS or just IBM Cloud. Different teams say different things.",
    "What's the actual difference between hybrid cloud and multi-cloud? Strategy unclear.",
  ],
  'Consulting': [
    "Clients keep asking about AI but we don't have a clear AI consulting offering yet.",
    "The SAP partnership sounds good in theory but we haven't been trained on it.",
    "Revenue targets feel arbitrary — no clear link to what we're doing day to day.",
    "We're losing deals to Accenture because our AI story isn't as compelling.",
    "Not sure if we should be pushing watsonx or other AI tools — no clear guidance.",
  ],
  'Security': [
    "Security team is understaffed and we're not sure which cloud platforms to prioritize.",
    "Compliance requirements for different cloud environments are confusing us.",
    "Leadership hasn't communicated what zero trust means for our specific workloads.",
    "We're reactive to threats rather than proactively aligned to a security strategy.",
    "Not clear if we're supposed to be building for IBM clients or internal systems.",
  ],
  'Research': [
    "Research direction seems disconnected from what product teams actually need.",
    "Not sure if our quantum computing work is still a priority or has been deprioritized.",
    "Publications are great but we're not seeing our work influence product decisions.",
    "Sustainability research feels like a checkbox exercise rather than strategic priority.",
    "Communication from leadership about research impact has dropped significantly.",
  ],
  'Sales': [
    "Our quota targets went up but nobody explained which products to prioritize.",
    "Customers ask about competitors and we don't have good answers for them.",
    "The compensation plan changed but I'm not sure how it connects to strategic goals.",
    "Confusing whether to push cloud or AI — feels like we're running two strategies.",
    "Lost 3 deals last month but got no strategic guidance on how to improve.",
  ],
};

function generateCommunications(deptName, informedPct, count = 8) {
  const comms = [];
  const informedMsgs = INFORMED_MESSAGES[deptName] || INFORMED_MESSAGES['Sales'];
  const randomMsgs   = RANDOM_MESSAGES[deptName]   || RANDOM_MESSAGES['Sales'];

  for (let i = 0; i < count; i++) {
    const isInformed = Math.random() * 100 < informedPct;
    const msgs = isInformed ? informedMsgs : randomMsgs;
    const msg  = msgs[i % msgs.length];
    comms.push({
      employeeId:       `emp-${deptName.toLowerCase().replace(/\s/g, '-')}-${i + 1}`,
      role:             i < 2 ? 'senior-manager' : i < 4 ? 'team-lead' : 'individual-contributor',
      informedLevel:    isInformed ? 'informed' : 'random',
      message:          msg,
      sentiment:        isInformed ? 'positive' : i % 3 === 0 ? 'negative' : 'neutral',
      strategyMentions: isInformed ? Math.floor(Math.random() * 3) + 1 : 0,
    });
  }
  return comms;
}

function generateTrendHistory(pointsArray) {
  const totalDays = pointsArray.length;
  return pointsArray.map((score, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (totalDays - 1 - index));
    return {
      date,
      score,
      understanding: Math.max(5, score - 5 + Math.floor(Math.random() * 6) - 3),
      projectVelocity: Math.max(5, score + 2 + Math.floor(Math.random() * 8) - 4),
    };
  });
}

function calcDriftVelocity(points) {
  if (points.length < 2) return 0;
  const recent = points.slice(-7);
  const delta  = recent[recent.length - 1] - recent[0];
  return parseFloat((delta / (recent.length - 1)).toFixed(2));
}

function calcExecutionProbability(alignmentScore, projectVelocity, understanding, driftVelocity) {
  const velBonus = Math.max(-10, Math.min(10, driftVelocity * 2));
  return Math.max(5, Math.min(98,
    alignmentScore * 0.7 + projectVelocity * 0.2 + understanding * 0.1 + velBonus
  ));
}

function calcFinancialRisk(alignmentScore) {
  return parseFloat(Math.max(0, ((80 - alignmentScore) / 10) * 50).toFixed(1));
}

// ── IBM Scenario Seed Data ───────────────────────────────────────────────────

const IBM_TEAMS_DATA = [
  {
    name: 'Watson AI',
    department: 'Artificial Intelligence',
    leader: 'Dr. Priya Mehta',
    members: 34,
    alignmentScore: 88,
    understanding: 91,
    projectVelocity: 85,
    trend: 'improving',
    status: 'excellent',
    informedPct: 85,
    historyPoints: [78, 80, 82, 84, 85, 87, 88],
    strategyContext: `Watson AI directly implements IBM Pillar 2: watsonx enterprise AI platform.
Team OKRs: Drive adoption to 40,000 enterprise clients by FY2025. Current pipeline: 28,400 active clients.
Key deliverables: Foundation model fine-tuning APIs, AI governance dashboard, domain-specific models for financial services.
This team has highest strategic alignment — watsonx IS the product strategy.`,
    projects: [
      { name: 'watsonx Foundation Models v2', status: 'on-track', progress: 78, description: 'Next-gen foundation models for enterprise AI applications' },
      { name: 'AI Governance Dashboard', status: 'on-track', progress: 92, description: 'OpenScale integration for enterprise AI compliance' },
      { name: 'Healthcare Domain Models', status: 'at-risk', progress: 45, description: 'Specialized AI models for medical diagnosis assistance' },
    ],
    prediction: {
      riskScore: 12,
      weeksToFailure: null,
      confidence: 0.93,
      recommendations: [
        { action: 'Accelerate healthcare domain model delivery to close regulated-industry gap', impact: 'high', priority: 1, category: 'delivery', expectedImprovement: 5 },
        { action: 'Expand watsonx partner ecosystem to reach 40k client target', impact: 'medium', priority: 2, category: 'growth', expectedImprovement: 3 },
        { action: 'Document watsonx alignment playbook to replicate success across teams', impact: 'medium', priority: 3, category: 'documentation', expectedImprovement: 2 },
      ],
    },
  },
  {
    name: 'Cloud Platform',
    department: 'Hybrid Cloud Engineering',
    leader: 'James Okafor',
    members: 28,
    alignmentScore: 72,
    understanding: 75,
    projectVelocity: 70,
    trend: 'stable',
    status: 'good',
    informedPct: 70,
    historyPoints: [68, 70, 71, 72, 72, 72, 72],
    strategyContext: `Cloud Platform owns IBM Pillar 1: Hybrid Cloud via Red Hat OpenShift.
Target: 50% enterprise workload migration to hybrid cloud by 2026.
Current: 34% migrated. Gap: 16 percentage points. Revenue target: $35B.
Execution risk: Regulated industries (banking, healthcare) moving slower than projected.`,
    projects: [
      { name: 'OpenShift Enterprise Migration', status: 'on-track', progress: 68, description: 'Mass migration of enterprise workloads to hybrid cloud' },
      { name: 'AWS Partnership Integration', status: 'on-track', progress: 80, description: 'Joint go-to-market with AWS for hybrid deployments' },
      { name: 'Financial Services Cloud', status: 'at-risk', progress: 35, description: 'Regulated cloud environment for banking sector' },
    ],
    prediction: {
      riskScore: 28,
      weeksToFailure: 18,
      confidence: 0.87,
      recommendations: [
        { action: 'Accelerate Financial Services Cloud to unlock regulated-industry revenue', impact: 'high', priority: 1, category: 'delivery', expectedImprovement: 12 },
        { action: 'Increase cross-training between Red Hat and IBM Cloud teams', impact: 'medium', priority: 2, category: 'training', expectedImprovement: 7 },
        { action: 'Deploy weekly hybrid cloud migration scorecards to track 50% target', impact: 'medium', priority: 3, category: 'monitoring', expectedImprovement: 5 },
      ],
    },
  },
  {
    name: 'IBM Consulting',
    department: 'Global Business Services',
    leader: 'Maria Rodriguez',
    members: 45,
    alignmentScore: 62,
    understanding: 65,
    projectVelocity: 58,
    trend: 'stable',
    status: 'at-risk',
    informedPct: 60,
    historyPoints: [60, 61, 62, 63, 62, 62, 62],
    strategyContext: `IBM Consulting drives IBM Pillar 3: Services transformation to AI-powered consulting.
Revenue target: $25B by 2026. Current trajectory: $22B.
Key gap: AI consulting methodologies not yet standardized. Competing with Accenture/McKinsey on AI transformation deals.
Workforce: 25% of consultants trained on watsonx. Target: 80% by end of FY2025.`,
    projects: [
      { name: 'AI Consulting Methodology', status: 'at-risk', progress: 40, description: 'Standardized AI transformation playbook for enterprise clients' },
      { name: 'SAP + IBM Integration Deals', status: 'on-track', progress: 72, description: 'Joint SAP implementation using IBM AI tools' },
      { name: 'Digital Labor Platform', status: 'delayed', progress: 28, description: 'AI-driven workforce automation for consulting clients' },
    ],
    prediction: {
      riskScore: 38,
      weeksToFailure: 14,
      confidence: 0.81,
      recommendations: [
        { action: 'Accelerate watsonx training to reach 80% consultant certification by Q4', impact: 'high', priority: 1, category: 'training', expectedImprovement: 15 },
        { action: 'Standardize AI consulting methodology across all practice areas', impact: 'high', priority: 2, category: 'process', expectedImprovement: 12 },
        { action: 'Launch competitive intelligence program vs Accenture/McKinsey', impact: 'medium', priority: 3, category: 'strategy', expectedImprovement: 8 },
      ],
    },
  },
  {
    name: 'Security Division',
    department: 'IBM Security',
    leader: 'Chen Wei',
    members: 22,
    alignmentScore: 54,
    understanding: 57,
    projectVelocity: 50,
    trend: 'declining',
    status: 'at-risk',
    informedPct: 45,
    historyPoints: [60, 58, 57, 56, 55, 55, 54],
    strategyContext: `IBM Security must protect the hybrid cloud platform as it scales to enterprise adoption.
Zero trust architecture is the strategic security framework aligned to Pillar 1.
Current gap: Security team 40% understaffed relative to growth projections.
Risk: Client adoption of hybrid cloud delayed by security concerns in regulated industries.`,
    projects: [
      { name: 'Zero Trust Architecture Rollout', status: 'at-risk', progress: 42, description: 'Enterprise zero trust security for hybrid cloud environments' },
      { name: 'AI Threat Detection', status: 'delayed', progress: 25, description: 'Watson-powered security incident response' },
      { name: 'Compliance Automation', status: 'on-track', progress: 65, description: 'Automated compliance for banking and healthcare clouds' },
    ],
    prediction: {
      riskScore: 46,
      weeksToFailure: 10,
      confidence: 0.79,
      recommendations: [
        { action: 'Emergency hiring: fill 8 open security architect positions within 30 days', impact: 'high', priority: 1, category: 'hiring', expectedImprovement: 18 },
        { action: 'Align Zero Trust roadmap explicitly to hybrid cloud migration timeline', impact: 'high', priority: 2, category: 'alignment', expectedImprovement: 12 },
        { action: 'Brief all team members on IBM security strategy at full-day offsite', impact: 'medium', priority: 3, category: 'communication', expectedImprovement: 8 },
      ],
    },
  },
  {
    name: 'Research Division',
    department: 'IBM Research',
    leader: 'Dr. Aisha Kamau',
    members: 19,
    alignmentScore: 77,
    understanding: 80,
    projectVelocity: 75,
    trend: 'improving',
    status: 'good',
    informedPct: 78,
    historyPoints: [70, 72, 73, 74, 75, 76, 77],
    strategyContext: `IBM Research underpins all three strategic pillars through fundamental innovation.
Key research areas: quantum computing, foundation model architecture, AI safety & governance.
Direct commercialization path: Research → watsonx → enterprise products.
Sustainability research aligns to IBM net zero 2030 commitment.`,
    projects: [
      { name: 'Quantum Computing Roadmap', status: 'on-track', progress: 60, description: '1000+ qubit system for commercial applications' },
      { name: 'Foundation Model Architecture', status: 'on-track', progress: 82, description: 'Next-generation model architectures for watsonx' },
      { name: 'AI Safety Framework', status: 'on-track', progress: 71, description: 'Governance and safety standards for enterprise AI deployment' },
    ],
    prediction: {
      riskScore: 22,
      weeksToFailure: 22,
      confidence: 0.90,
      recommendations: [
        { action: 'Accelerate commercialization pipeline from research to watsonx product', impact: 'high', priority: 1, category: 'commercialization', expectedImprovement: 10 },
        { action: 'Increase cross-functional collaboration with Watson AI team', impact: 'medium', priority: 2, category: 'collaboration', expectedImprovement: 6 },
        { action: 'Publish quarterly research-to-product alignment report for leadership', impact: 'low', priority: 3, category: 'reporting', expectedImprovement: 3 },
      ],
    },
  },
  {
    name: 'Enterprise Sales',
    department: 'Global Sales',
    leader: 'Marcus Thompson',
    members: 38,
    alignmentScore: 42,
    understanding: 38,
    projectVelocity: 44,
    trend: 'declining',
    status: 'critical',
    informedPct: 35,
    historyPoints: [52, 50, 48, 46, 45, 43, 42],
    strategyContext: `Enterprise Sales drives revenue across all three IBM strategic pillars.
Target: $60B total revenue FY2025. Current trajectory: $54B (10% shortfall).
Critical gap: Sales team primarily trained on legacy IBM products (mainframe, traditional software).
Only 35% of reps have received hybrid cloud + watsonx sales training.
Quota structures still incentivize legacy product sales over strategic hybrid cloud/AI bundles.`,
    projects: [
      { name: 'Hybrid Cloud Sales Playbook', status: 'delayed', progress: 20, description: 'New sales methodology for hybrid cloud and watsonx deals' },
      { name: 'Sales Training Transformation', status: 'delayed', progress: 18, description: 'Reskilling 3000 reps on AI and hybrid cloud selling' },
      { name: 'Competitive Battle Cards', status: 'at-risk', progress: 35, description: 'Win strategies vs Microsoft, Google, AWS' },
    ],
    prediction: {
      riskScore: 82,
      weeksToFailure: 5,
      confidence: 0.91,
      recommendations: [
        { action: 'URGENT: Launch emergency 2-week watsonx + hybrid cloud bootcamp for all 3000 sales reps', impact: 'high', priority: 1, category: 'training', expectedImprovement: 25 },
        { action: 'Restructure compensation: 60% of quota tied to hybrid cloud + AI deals immediately', impact: 'high', priority: 2, category: 'incentives', expectedImprovement: 20 },
        { action: 'Assign dedicated watsonx technical sales specialist to every enterprise account team', impact: 'high', priority: 3, category: 'resourcing', expectedImprovement: 15 },
      ],
    },
  },
  {
    name: 'Finance & Operations',
    department: 'Finance',
    leader: 'Sandra Mitchell',
    members: 16,
    alignmentScore: 68,
    understanding: 70,
    projectVelocity: 65,
    trend: 'stable',
    status: 'good',
    informedPct: 65,
    historyPoints: [64, 65, 66, 67, 68, 68, 68],
    strategyContext: `Finance & Operations supports IBM strategic targets: 57% gross margin, 15% ARR growth.
Key role: Budget allocation across three pillars (Cloud, AI, Consulting).
Current challenge: Legacy cost structures slowing reallocation to high-growth areas.
OKRs: Maintain operating efficiency while funding transformation investments.`,
    projects: [
      { name: 'Strategic Budget Reallocation', status: 'at-risk', progress: 48, description: 'Shift 30% of traditional SW budget to hybrid cloud and AI' },
      { name: 'ARR Growth Tracking Dashboard', status: 'on-track', progress: 78, description: 'Real-time revenue tracking against 15% ARR growth target' },
      { name: 'Gross Margin Optimization', status: 'on-track', progress: 62, description: 'Cost reduction initiatives to reach 57% gross margin' },
    ],
    prediction: {
      riskScore: 32,
      weeksToFailure: 16,
      confidence: 0.83,
      recommendations: [
        { action: 'Accelerate budget reallocation — every quarter delay costs $300M in strategic investment', impact: 'high', priority: 1, category: 'budget', expectedImprovement: 10 },
        { action: 'Create real-time financial scorecard linked to all three strategic pillar OKRs', impact: 'medium', priority: 2, category: 'monitoring', expectedImprovement: 7 },
        { action: 'Monthly finance-strategy alignment reviews with each BU leader', impact: 'medium', priority: 3, category: 'governance', expectedImprovement: 5 },
      ],
    },
  },
  {
    name: 'HR & Talent',
    department: 'Human Resources',
    leader: 'Lisa Park',
    members: 14,
    alignmentScore: 71,
    understanding: 74,
    projectVelocity: 69,
    trend: 'improving',
    status: 'good',
    informedPct: 72,
    historyPoints: [65, 67, 68, 69, 70, 70, 71],
    strategyContext: `HR must address IBM's #1 execution risk: AI/ML talent shortage.
Target: Hire 5,000 AI engineers by FY2026. Current hiring rate: 800/year (shortage: 2,200).
Key programs: IBM SkillsBuild (external), watsonx Academy (internal), Strategic MBA hiring.
Critical: 80% of departing talent citie misalignment between their role and IBM's AI direction as exit reason.`,
    projects: [
      { name: 'AI Talent Acquisition Sprint', status: 'on-track', progress: 58, description: 'Accelerated hiring of AI/ML engineers to close talent gap' },
      { name: 'watsonx Academy', status: 'on-track', progress: 75, description: 'Internal reskilling program for 20,000 employees' },
      { name: 'Strategic Retention Program', status: 'at-risk', progress: 35, description: 'Retain top AI talent in competitive market' },
    ],
    prediction: {
      riskScore: 29,
      weeksToFailure: 20,
      confidence: 0.85,
      recommendations: [
        { action: 'Triple AI talent acquisition budget — talent shortage is the #1 execution risk', impact: 'high', priority: 1, category: 'hiring', expectedImprovement: 15 },
        { action: 'Launch retention bonus program tied to IBM strategic pillar milestones', impact: 'high', priority: 2, category: 'retention', expectedImprovement: 12 },
        { action: 'Accelerate watsonx Academy to reskill 5,000 employees by Q4', impact: 'medium', priority: 3, category: 'training', expectedImprovement: 8 },
      ],
    },
  },
];

// ── Seeding Script ───────────────────────────────────────────────────────────

async function seed() {
  console.log('[seed] 🔄 Cleaning existing data...');
  await Team.deleteMany({});
  await Prediction.deleteMany({});
  console.log('[seed] ✓ Collections cleared');

  console.log('[seed] 🏢 Seeding IBM Strategic Alignment Scenario...');

  for (const teamData of IBM_TEAMS_DATA) {
    const histPoints  = teamData.historyPoints;
    const driftVel    = calcDriftVelocity(histPoints);
    const execProb    = calcExecutionProbability(
      teamData.alignmentScore, teamData.projectVelocity,
      teamData.understanding, driftVel
    );
    const finRisk     = calcFinancialRisk(teamData.alignmentScore);
    const isHotspot   = driftVel < -1.5 || (teamData.alignmentScore < 60 && teamData.trend === 'declining');
    const alignTrend  = generateTrendHistory(histPoints);
    const empComms    = generateCommunications(teamData.name, teamData.informedPct, 10);

    const teamDoc = await Team.create({
      name:            teamData.name,
      department:      teamData.department,
      leader:          teamData.leader,
      members:         teamData.members,
      alignmentScore:  teamData.alignmentScore,
      understanding:   teamData.understanding,
      projectVelocity: teamData.projectVelocity,
      trend:           teamData.trend,
      status:          teamData.status,
      projects:        teamData.projects,
      alignmentTrend:  alignTrend,
      strategyContext: teamData.strategyContext.trim(),
      strategyDocument: IBM_STRATEGY_DOCUMENT.trim(),
      employeeCommunications: empComms,
      executionProbability: parseFloat(execProb.toFixed(1)),
      driftVelocity:   driftVel,
      financialRisk:   finRisk,
      isDriftHotspot:  isHotspot,
      lastAnalyzedAt:  new Date(),
    });

    await Prediction.create({
      teamId:                  teamDoc._id,
      teamName:                teamDoc.name,
      riskScore:               teamData.prediction.riskScore,
      weeksToFailure:          teamData.prediction.weeksToFailure,
      confidence:              teamData.prediction.confidence,
      source:                  'ibm-scenario',
      recommendations:         teamData.prediction.recommendations,
      snapshotAlignmentScore:  teamDoc.alignmentScore,
      lastRefreshed:           new Date(),
    });

    console.log(`  ✓ ${teamDoc.name} (alignment: ${teamDoc.alignmentScore}%, exec prob: ${execProb.toFixed(0)}%, fin risk: $${finRisk}M, hotspot: ${isHotspot})`);
  }

  // Compute org-wide stats
  const teams      = IBM_TEAMS_DATA;
  const avgAlign   = Math.round(teams.reduce((s, t) => s + t.alignmentScore, 0) / teams.length);
  const totalRisk  = teams.reduce((s, t) => s + calcFinancialRisk(t.alignmentScore), 0);
  const hotspots   = teams.filter(t => calcDriftVelocity(t.historyPoints) < -1.5 || (t.alignmentScore < 60 && t.trend === 'declining')).length;

  console.log('\n[seed] ═══════════════════════════════════════');
  console.log('[seed] IBM Strategic Alignment Intelligence');
  console.log('[seed] ═══════════════════════════════════════');
  console.log(`[seed] Organizations seeded:  ${IBM_TEAMS_DATA.length} IBM departments`);
  console.log(`[seed] Avg alignment score:   ${avgAlign}%`);
  console.log(`[seed] Total financial risk:  $${totalRisk.toFixed(0)}M`);
  console.log(`[seed] Drift hotspots:        ${hotspots} departments`);
  console.log('[seed] ✓ IBM scenario seeding complete!');
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/strat_align';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
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
