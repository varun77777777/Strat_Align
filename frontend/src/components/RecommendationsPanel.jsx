import React from 'react';

const RecommendationsPanel = ({ recommendations = [], onApplyRecommendation, applyingId }) => {
  
  const getPriorityStyle = (priority) => {
    if (priority <= 2) {
      return { background: 'rgba(244, 67, 54, 0.1)', color: '#F44336', border: '1px solid rgba(244, 67, 54, 0.2)' };
    } else if (priority <= 5) {
      return { background: 'rgba(255, 193, 7, 0.1)', color: '#FFC107', border: '1px solid rgba(255, 193, 7, 0.2)' };
    } else {
      return { background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.2)' };
    }
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
        <span className="section-subtitle">{recommendations.filter(r => !r.applied).length} pending</span>
      </div>

      <div className="rec-list">
        {recommendations.map((rec) => {
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

              <div className="rec-meta">
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  Team: {rec.teamName}
                </span>
                
                <div className="rec-badge-group">
                  <span 
                    className="priority-badge"
                    style={prioStyle}
                  >
                    P{rec.priority}
                  </span>
                  
                  {rec.applied ? (
                    <span style={{ color: 'var(--status-good)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Applied
                    </span>
                  ) : (
                    <button 
                      className="apply-btn"
                      disabled={applyingId === rec.id}
                      onClick={() => onApplyRecommendation(rec.id)}
                    >
                      {applyingId === rec.id ? 'Applying...' : 'Apply Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {recommendations.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            No recommendations generated.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
