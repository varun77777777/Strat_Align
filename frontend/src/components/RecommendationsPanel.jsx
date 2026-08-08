import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Generates contextual recommendations based on team data.
 * Falls back to API recommendations if the teams array is empty.
 */
const generateSmartRecommendations = (teams, apiRecommendations, appliedSmartIds = []) => {
  if (!teams || teams.length === 0) return apiRecommendations;

  const smart = [];

  // Rule 1: Communication — teams without updates in 7+ days
  const staleCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const staleTeams = teams.filter(t => {
    try {
      return t.lastUpdated && new Date(t.lastUpdated).getTime() < staleCutoff;
    } catch { return false; }
  });
  if (staleTeams.length > 0) {
    smart.push({
      id: 'smart-comm',
      action: '📢 Schedule Strategy Sync Meetings',
      expectedImprovement: 22,
      impact: '18–25% alignment improvement',
      complexity: 'Easy',
      timeline: '1–2 days',
      affectedTeams: staleTeams.map(t => t.name || t.teamName).join(', '),
      applied: appliedSmartIds.includes('smart-comm'),
      priority: 1,
      isSmartGenerated: true,
    });
  }

  // Rule 2: Resource — teams without resources allocated
  const underResourced = teams.filter(t => !t.resourcesAllocated && t.alignmentScore < 70);
  if (underResourced.length > 0) {
    smart.push({
      id: 'smart-resource',
      action: '💼 Rebalance Resource Allocation',
      expectedImprovement: 28,
      impact: '22–35% execution improvement',
      complexity: 'Medium',
      timeline: '3–5 days',
      affectedTeams: underResourced.map(t => t.name || t.teamName).join(', '),
      applied: appliedSmartIds.includes('smart-resource'),
      priority: 2,
      isSmartGenerated: true,
    });
  }

  // Rule 3: Incentives — teams declining or critical
  const misaligned = teams.filter(t => t.trend === 'declining' || (t.alignmentScore ?? 100) < 50);
  if (misaligned.length > 0) {
    smart.push({
      id: 'smart-incentive',
      action: '🎯 Realign Team Incentives & OKRs',
      expectedImprovement: 23,
      impact: '15–30% improvement',
      complexity: 'Medium',
      timeline: '1–2 weeks',
      affectedTeams: misaligned.map(t => t.name || t.teamName).join(', '),
      applied: appliedSmartIds.includes('smart-incentive'),
      priority: 3,
      isSmartGenerated: true,
    });
  }

  // Merge smart recs with API recs (smart first, then API ones not duplicated)
  const apiFiltered = (apiRecommendations || []).filter(r => !r.isSmartGenerated);
  return [...smart, ...apiFiltered];
};

const complexityColor = {
  Easy: '#4CAF50',
  Medium: '#FFC107',
  Hard: '#F44336',
};

const RecommendationsPanel = ({ recommendations = [], teams = [], onApplyRecommendation, applyingId }) => {
  const allRecommendations = useMemo(
    () => generateSmartRecommendations(teams, recommendations),
    [teams, recommendations]
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
};

RecommendationsPanel.defaultProps = {
  recommendations: [],
  teams: [],
  onApplyRecommendation: undefined,
  applyingId: null,
};

export default RecommendationsPanel;
