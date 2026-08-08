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
    if (d.includes('prod') || d.includes('product') || d.includes('mktg')) {
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
    <div className="glass-card team-hero-card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div className="kpi-icon-wrapper" style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: '#00c6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getTeamIcon(team.department)}
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', textAlign: 'left', background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {team.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
              Strategic Segment: <strong>{team.department}</strong> | Leader: <strong>{team.leader}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="status-badge" style={{
            background: team.alignmentScore >= 80 ? 'var(--status-good-bg)' : team.alignmentScore >= 60 ? 'var(--status-at-risk-bg)' : 'var(--status-critical-bg)',
            color: getStatusColor(team.alignmentScore),
            border: `1px solid ${team.alignmentScore >= 80 ? 'rgba(76, 175, 80, 0.2)' : team.alignmentScore >= 60 ? 'rgba(255, 193, 7, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`,
            padding: '6px 14px',
            fontSize: '12px',
            borderRadius: '20px',
            fontWeight: 'bold'
          }}>
            {team.alignmentScore >= 80 ? 'Excellent' : team.alignmentScore >= 60 ? 'Caution' : 'Critical'}
          </div>
        </div>

      </div>

      <div className="team-hero-metrics" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '20px'
      }}>
        <div className="hero-metric-item">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Alignment Score</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: getStatusColor(team.alignmentScore) }}>{team.alignmentScore}%</span>
        </div>
        <div className="hero-metric-item">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Strategy Comprehension</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{team.understanding}%</span>
        </div>
        <div className="hero-metric-item">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Project Velocity</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{team.projectVelocity}%</span>
        </div>
        <div className="hero-metric-item">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Team Members</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{team.members}</span>
        </div>
      </div>
    </div>
  );
};

export default TeamHero;
