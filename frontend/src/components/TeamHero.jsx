import React from 'react';

const TeamHero = ({ team = {} }) => {
  const getStatusColor = (score) => {
    if (score >= 80) return 'var(--status-good)';
    if (score >= 60) return 'var(--status-at-risk)';
    return 'var(--status-critical)';
  };

  // Select team icon based on department
  const getTeamIcon = (dept = '') => {
    const d = dept.toLowerCase();
    if (d.includes('eng')) {
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );
    }
    if (d.includes('sal')) {
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    }
    if (d.includes('prod')) {
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 8 8 12 12 16 16 12 12 8" />
        </svg>
      );
    }
    // Default fallback icon
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  };

  return (
    <div className="glass-card team-hero-card">
      <div className="team-hero-heading">
        
        <div className="team-identity">
          <div className="kpi-icon-wrapper team-hero-icon">
            {getTeamIcon(team.department)}
          </div>
          <div>
            <h1 className="team-hero-title">
              {team.name}
            </h1>
            <p className="team-hero-meta">
              Strategic Segment: <strong>{team.department}</strong> | Leader: <strong>{team.leader}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="status-badge team-hero-status" style={{
            background: team.alignmentScore >= 80 ? 'var(--status-good-bg)' : team.alignmentScore >= 60 ? 'var(--status-at-risk-bg)' : 'var(--status-critical-bg)',
            color: getStatusColor(team.alignmentScore),
            border: `1px solid ${team.alignmentScore >= 80 ? 'rgba(76, 175, 80, 0.2)' : team.alignmentScore >= 60 ? 'rgba(255, 193, 7, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`,
            padding: '6px 14px',
            fontSize: '12px'
          }}>
            {team.alignmentScore >= 80 ? 'Excellent' : team.alignmentScore >= 60 ? 'Caution' : 'Critical'}
          </div>
        </div>

      </div>

      <div className="team-hero-metrics">
        <div className="hero-metric-item">
          <span className="hero-metric-label">Alignment Score</span>
          <span className="hero-metric-value" style={{ color: getStatusColor(team.alignmentScore) }}>{team.alignmentScore}%</span>
        </div>
        <div className="hero-metric-item">
          <span className="hero-metric-label">Strategy Comprehension</span>
          <span className="hero-metric-value">{team.understanding}%</span>
        </div>
        <div className="hero-metric-item">
          <span className="hero-metric-label">Project Velocity</span>
          <span className="hero-metric-value">{team.projectVelocity}%</span>
        </div>
        <div className="hero-metric-item">
          <span className="hero-metric-label">Team Members</span>
          <span className="hero-metric-value">{team.members}</span>
        </div>
      </div>
    </div>
  );
};

export default TeamHero;
