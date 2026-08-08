import React from 'react';

const ProjectTable = ({ projects = [] }) => {
  const getStatusBadgeStyles = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'on-track' || s === 'completed') {
      return { background: 'var(--status-good-bg)', color: 'var(--status-good)', border: '1px solid rgba(76,175,80,0.2)' };
    }
    if (s === 'at-risk') {
      return { background: 'var(--status-at-risk-bg)', color: 'var(--status-at-risk)', border: '1px solid rgba(255,193,7,0.2)' };
    }
    return { background: 'var(--status-critical-bg)', color: 'var(--status-critical)', border: '1px solid rgba(244,67,54,0.2)' };
  };

  const getStrategyPillStyles = (progress, status) => {
    // If progress is low or status is delayed, it drifts "off-strategy"
    if (status === 'delayed' || status === 'at-risk' || progress < 50) {
      return { background: 'rgba(244, 67, 54, 0.1)', color: '#F44336', border: '1px solid rgba(244, 67, 54, 0.15)', text: 'Off-Strategy' };
    }
    return { background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.15)', text: 'Strategic' };
  };

  return (
    <div className="glass-card" style={{ flex: 1.5 }}>
      <div className="section-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#667eea' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M21 9H3" />
            <path d="M21 15H3" />
            <path d="M12 3v18" />
          </svg>
          Project Alignment Status
        </h2>
        <span className="section-subtitle" style={{ background: 'rgba(102, 126, 234, 0.1)', color: '#667eea', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>Strategic vs Off-Strategy</span>
      </div>

      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Project Initiative</th>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Alignment Focus</th>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Execution Progress</th>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj, index) => {
              const badgeStyle = getStatusBadgeStyles(proj.status);
              const stratPill = getStrategyPillStyles(proj.progress, proj.status);
              return (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', color: 'var(--text-primary)', textAlign: 'left' }}>{proj.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textAlign: 'left' }}>{proj.description}</span>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <span className="status-badge" style={{ ...stratPill, padding: '2px 8px', fontSize: '10px', borderRadius: '12px', fontWeight: 'bold' }}>
                      {stratPill.text}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="score-bar-container" style={{ margin: 0, flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${proj.progress}%`,
                            height: '100%',
                            borderRadius: '3px',
                            background: proj.status === 'delayed' ? 'var(--status-critical)' : 'var(--primary-gradient)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{proj.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <span className="status-badge" style={{ ...badgeStyle, borderRadius: '12px', fontWeight: 'bold', padding: '2px 8px', fontSize: '10px' }}>
                      {proj.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No active projects recorded for this team.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;
