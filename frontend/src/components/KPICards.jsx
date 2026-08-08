import React from 'react';
import PropTypes from 'prop-types';

const KPICards = ({ teams = [], predictions = [], recommendations = [] }) => {
  // 1. Overall Alignment %
  const avgAlignment = teams.length > 0
    ? Math.round(teams.reduce((acc, t) => acc + (t.alignmentScore || 0), 0) / teams.length)
    : 0;

  // 2. Alignment trend delta (improving vs declining, no fake +1 bias)
  const improvingCount = teams.filter(t => t.trend === 'improving').length;
  const decliningCount = teams.filter(t => t.trend === 'declining').length;
  const deltaPercent = teams.length > 0
    ? Math.round(((improvingCount - decliningCount) / teams.length) * 100)
    : 0;
  const isTrendUp = deltaPercent >= 0;
  const alignmentTrendText = isTrendUp
    ? `+${deltaPercent}% vs last week`
    : `${deltaPercent}% vs last week`;

  // 3. At-Risk Teams
  const atRiskTeams = teams.filter(t => (t.alignmentScore ?? 100) < 60).length;
  const totalTeams = teams.length || 0;

  // 4. Average Risk Score from predictions
  const avgRisk = predictions.length > 0
    ? Math.round(predictions.reduce((acc, p) => acc + (p.riskScore || 0), 0) / predictions.length)
    : 0;

  // 5. Pending Recommendations (null-safe)
  const pendingRecsCount = recommendations?.filter(r => r?.applied === false)?.length ?? 0;

  return (
    <div className="kpi-grid">
      {/* Overall Alignment KPI */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Overall Alignment</span>
          <div className="kpi-icon-wrapper" style={{ color: '#4CAF50' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
        <div className="kpi-value">{avgAlignment}%</div>
        <div className="kpi-footer">
          <span className={isTrendUp ? 'trend-up' : 'trend-down'}>
            {isTrendUp ? '▲' : '▼'} {alignmentTrendText}
          </span>
        </div>
      </div>

      {/* At-Risk Teams KPI */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">At-Risk Teams</span>
          <div className="kpi-icon-wrapper" style={{ color: atRiskTeams > 2 ? '#F44336' : '#FFC107' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>
        <div className="kpi-value">
          {atRiskTeams}
          <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}> / {totalTeams}</span>
        </div>
        <div className="kpi-footer">
          <span>Target: 0 misaligned teams</span>
        </div>
      </div>

      {/* Average Risk Score KPI */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Risk Forecast Index</span>
          <div className="kpi-icon-wrapper" style={{ color: '#00c6ff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
        <div className="kpi-value">{avgRisk}%</div>
        <div className="kpi-footer">
          <span>Projected organization-wide risk</span>
        </div>
      </div>

      {/* Pending Recommendations KPI */}
      <div className="glass-card kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Open Recommendations</span>
          <div className="kpi-icon-wrapper" style={{ color: '#764ba2' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
        </div>
        <div className="kpi-value">{pendingRecsCount}</div>
        <div className="kpi-footer">
          <span>Interventions available to apply</span>
        </div>
      </div>
    </div>
  );
};

KPICards.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    alignmentScore: PropTypes.number,
    trend: PropTypes.string,
  })),
  predictions: PropTypes.arrayOf(PropTypes.shape({
    riskScore: PropTypes.number,
  })),
  recommendations: PropTypes.arrayOf(PropTypes.shape({
    applied: PropTypes.bool,
  })),
};

KPICards.defaultProps = {
  teams: [],
  predictions: [],
  recommendations: [],
};

export default KPICards;
