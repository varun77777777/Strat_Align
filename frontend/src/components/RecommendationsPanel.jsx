import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Generates contextual recommendations based on team data.
 * Falls back to API recommendations if the teams array is empty.
 */
const generateSmartRecommendations = (teams, apiRecommendations, appliedSmartIds = []) => {
  if (!teams || teams.length === 0) return apiRecommendations;

  const smart = [];

  // Team 1: Enterprise Sales (Comp restructuring & watsonx training)
  const salesTeam = teams.find(t => t.name === 'Enterprise Sales');
  if (salesTeam && salesTeam.alignmentScore < 60) {
    smart.push({
      id: 'smart-sales-incentives',
      action: '🎯 Restructure Sales Quotas & Comp Plan',
      expectedImprovement: 25,
      impact: 'Strategic ARR deals weighted at 1.5x commission',
      complexity: 'Medium',
      timeline: '1 week',
      affectedTeams: 'Enterprise Sales',
      applied: appliedSmartIds.includes('smart-sales-incentives'),
      priority: 1,
      isSmartGenerated: true,
    });
    smart.push({
      id: 'smart-sales-training',
      action: '🎓 Deploy watsonx Sales Bootcamp',
      expectedImprovement: 20,
      impact: 'Certify all 3,000 account reps on strategic bundles',
      complexity: 'Hard',
      timeline: '2 weeks',
      affectedTeams: 'Enterprise Sales',
      applied: appliedSmartIds.includes('smart-sales-training'),
      priority: 1,
      isSmartGenerated: true,
    });
  }

  // Team 2: Security Division (Hiring freeze exemption & Zero Trust prioritization)
  const secTeam = teams.find(t => t.name === 'Security Division');
  if (secTeam && secTeam.alignmentScore < 60) {
    smart.push({
      id: 'smart-security-hiring',
      action: '💼 Unlock Security Architect Headcount Exception',
      expectedImprovement: 18,
      impact: 'Fill 8 open roles to cover regulated bank deployments',
      complexity: 'Medium',
      timeline: '30 days',
      affectedTeams: 'Security Division',
      applied: appliedSmartIds.includes('smart-security-hiring'),
      priority: 2,
      isSmartGenerated: true,
    });
  }

  // Team 3: Cloud Platform (VP mandate synchronization)
  const cloudTeam = teams.find(t => t.name === 'Cloud Platform');
  if (cloudTeam && cloudTeam.alignmentScore < 75) {
    smart.push({
      id: 'smart-cloud-alignment',
      action: '📢 Align VP Engineering & Product Mandates',
      expectedImprovement: 15,
      impact: 'Synchronize AWS co-sell and IBM Cloud roadmap timelines',
      complexity: 'Easy',
      timeline: '1–2 days',
      affectedTeams: 'Cloud Platform',
      applied: appliedSmartIds.includes('smart-cloud-alignment'),
      priority: 2,
      isSmartGenerated: true,
    });
  }

  // Team 4: IBM Consulting (Standardize AI playbook)
  const consultingTeam = teams.find(t => t.name === 'IBM Consulting');
  if (consultingTeam && consultingTeam.alignmentScore < 70) {
    smart.push({
      id: 'smart-consulting-methodology',
      action: '🎯 Standardize AI Consulting Playbooks',
      expectedImprovement: 15,
      impact: 'Equip practice areas with Accenture-beating sales decks',
      complexity: 'Medium',
      timeline: '1 week',
      affectedTeams: 'IBM Consulting',
      applied: appliedSmartIds.includes('smart-consulting-methodology'),
      priority: 3,
      isSmartGenerated: true,
    });
  }

  // Add a generic fallback one if no specific team is matched
  if (smart.length === 0) {
    smart.push({
      id: 'smart-fallback',
      action: '📢 Schedule Strategy Sync Meetings',
      expectedImprovement: 10,
      impact: 'Bridge communication gap via 1:1 syncs',
      complexity: 'Easy',
      timeline: '1–2 days',
      affectedTeams: teams.map(t => t.name).slice(0, 3).join(', '),
      applied: appliedSmartIds.includes('smart-fallback'),
      priority: 3,
      isSmartGenerated: true,
    });
  }

  const apiFiltered = (apiRecommendations || []).filter(r => !r.isSmartGenerated);
  return [...smart, ...apiFiltered];
};

const complexityColor = {
  Easy: '#4CAF50',
  Medium: '#FFC107',
  Hard: '#F44336',
};

const RecommendationsPanel = ({ recommendations = [], teams = [], onApplyRecommendation, applyingId, appliedSmartIds = [] }) => {
  const allRecommendations = useMemo(
    () => generateSmartRecommendations(teams, recommendations, appliedSmartIds),
    [teams, recommendations, appliedSmartIds]
  );

  const pendingCount = allRecommendations.filter(r => !r.applied).length;

  const getPriorityStyle = (priority) => {
    if (priority <= 2) return { background: 'rgba(244, 67, 54, 0.1)', color: '#F44336', border: '1px solid rgba(244, 67, 54, 0.2)' };
    if (priority <= 5) return { background: 'rgba(255, 193, 7, 0.1)', color: '#FFC107', border: '1px solid rgba(255, 193, 7, 0.2)' };
    return { background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.2)' };
  };

  return (
    <div className="glass-card">
      <div className="section-title-bar">
        <h2 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#764ba2' }}>
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Strategic Interventions
        </h2>
        <span className="section-subtitle">{pendingCount} pending</span>
      </div>

      <div className="rec-list">
        {allRecommendations.map((rec) => {
          const prioStyle = getPriorityStyle(rec.priority);
          return (
            <div
              key={rec.id}
              className={`rec-item ${rec.applied ? 'applied' : ''}`}
            >
              <div className="rec-header">
                <span className="rec-action">{rec.action}</span>
                <span className="impact-badge">+{rec.expectedImprovement}%</span>
              </div>

              {/* Impact / Complexity / Timeline row */}
              {(rec.impact || rec.complexity || rec.timeline) && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {rec.impact && (
                    <span style={{
                      fontSize: '11px',
                      color: '#00c6ff',
                      background: 'rgba(0,198,255,0.08)',
                      padding: '2px 8px',
                      borderRadius: '20px',
                    }}>
                      📈 {rec.impact}
                    </span>
                  )}
                  {rec.complexity && (
                    <span style={{
                      fontSize: '11px',
                      color: complexityColor[rec.complexity] || 'var(--text-secondary)',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '2px 8px',
                      borderRadius: '20px',
                    }}>
                      ⚙️ {rec.complexity}
                    </span>
                  )}
                  {rec.timeline && (
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '2px 8px',
                      borderRadius: '20px',
                    }}>
                      ⏱ {rec.timeline}
                    </span>
                  )}
                </div>
              )}

              <div className="rec-meta">
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  {rec.affectedTeams
                    ? `Teams: ${rec.affectedTeams}`
                    : rec.teamName
                    ? `Team: ${rec.teamName}`
                    : ''}
                </span>

                <div className="rec-badge-group">
                  <span className="priority-badge" style={prioStyle}>P{rec.priority}</span>

                  {rec.applied ? (
                    <span style={{ color: 'var(--status-good)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Applied
                    </span>
                  ) : (
                    <button
                      className="apply-btn"
                      disabled={applyingId === rec.id}
                      onClick={() => onApplyRecommendation?.(rec.id)}
                      aria-label={`Apply recommendation: ${rec.action}`}
                    >
                      {applyingId === rec.id ? 'Applying…' : 'Apply Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {allRecommendations.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '14px' }}>
            🎉 No open recommendations — alignment is healthy!
          </div>
        )}
      </div>
    </div>
  );
};

RecommendationsPanel.propTypes = {
  recommendations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    action: PropTypes.string,
    applied: PropTypes.bool,
    priority: PropTypes.number,
    expectedImprovement: PropTypes.number,
  })),
  teams: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    alignmentScore: PropTypes.number,
    trend: PropTypes.string,
  })),
  onApplyRecommendation: PropTypes.func,
  applyingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  appliedSmartIds: PropTypes.arrayOf(PropTypes.string),
};

RecommendationsPanel.defaultProps = {
  recommendations: [],
  teams: [],
  onApplyRecommendation: undefined,
  applyingId: null,
  appliedSmartIds: [],
};

export default RecommendationsPanel;
