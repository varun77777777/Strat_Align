import React from 'react';

const TeamHeatmap = ({ teams = [], onTeamClick }) => {
  
  // Status style helper
  const getStatusStyles = (score) => {
    if (score >= 80) {
      return {
        bg: 'var(--status-good-bg)',
        border: '1px solid rgba(76, 175, 80, 0.2)',
        color: 'var(--status-good)',
        text: 'Excellent',
        barColor: 'var(--status-good)'
      };
    } else if (score >= 60) {
      return {
        bg: 'var(--status-at-risk-bg)',
        border: '1px solid rgba(255, 193, 7, 0.2)',
        color: 'var(--status-at-risk)',
        text: 'Good',
        barColor: 'var(--status-at-risk)'
      };
    } else if (score >= 45) {
      return {
        bg: 'var(--status-at-risk-bg)',
        border: '1px solid rgba(255, 193, 7, 0.2)',
        color: 'var(--status-at-risk)',
        text: 'At Risk',
        barColor: 'var(--status-at-risk)'
      };
    } else {
      return {
        bg: 'var(--status-critical-bg)',
        border: '1px solid rgba(244, 67, 54, 0.2)',
        color: 'var(--status-critical)',
        text: 'Critical',
        barColor: 'var(--status-critical)'
      };
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <span style={{ color: 'var(--status-good)', fontWeight: 'bold' }}>▲</span>;
      case 'declining':
        return <span style={{ color: 'var(--status-critical)', fontWeight: 'bold' }}>▼</span>;
      default:
        return <span style={{ color: 'var(--text-secondary)' }}>●</span>;
    }
  };

  return (
    <div className="glass-card">
      <div className="section-title-bar">
        <h2 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#667eea' }}>
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Team Alignment Matrix
        </h2>
        <span className="section-subtitle">Real-time status</span>
      </div>

      <div className="heatmap-list">
        {teams.map((team) => {
          const styles = getStatusStyles(team.alignmentScore);
          return (
            <div 
              key={team.id || team._id} 
              className="heatmap-row"
              onClick={() => onTeamClick(team)}
            >
              <div className="team-info">
                <span className="team-name">{team.name}</span>
                <span className="team-dept">{team.department}</span>
              </div>
              
              <div className="team-leader">
                {team.leader}
              </div>

              <div className="score-bar-container">
                <div 
                  className="score-bar-fill" 
                  style={{ 
                    width: `${team.alignmentScore}%`,
                    background: styles.barColor
                  }}
                />
              </div>

              <div className="score-value" style={{ color: styles.color }}>
                {team.alignmentScore}% {getTrendIcon(team.trend)}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span 
                  className="status-badge"
                  style={{
                    background: styles.bg,
                    border: styles.border,
                    color: styles.color
                  }}
                >
                  {styles.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamHeatmap;
