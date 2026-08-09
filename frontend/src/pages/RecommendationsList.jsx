import React, { useState } from 'react';

const RecommendationsList = ({ recommendations = [], onApplyRecommendation, applyingId }) => {
  const [targetImprovement, setTargetImprovement] = useState(15);

  const getPriorityBadgeStyle = (priority) => {
    if (priority <= 2) {
      return { background: 'rgba(244, 67, 54, 0.1)', color: '#F44336', border: '1px solid rgba(244, 67, 54, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' };
    }
    return { background: 'rgba(255, 193, 7, 0.1)', color: '#FFC107', border: '1px solid rgba(255, 193, 7, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' };
  };

  // Limit to top 3 recommendations
  const displayRecs = recommendations.slice(0, 3);

  return (
    <div className="glass-card recommendation-list-card" style={{ flex: 1 }}>
      <div className="section-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#764ba2' }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 16 12 12 12 8" />
            <line x1="12" y1="20" x2="12" y2="20" />
          </svg>
          Priority Interventions
        </h2>
        <span className="section-subtitle" style={{ background: 'rgba(118, 75, 162, 0.1)', color: '#a18cd1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>Top 3 Action items</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        
        {/* Expected Improvement Slider */}
        <div className="recommendation-target">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Projected Alignment Improvement:</span>
            <span style={{ fontWeight: 'bold', color: '#00c6ff' }}>+{targetImprovement}%</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="30" 
            value={targetImprovement} 
            onChange={e => setTargetImprovement(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#00c6ff' }}
          />
        </div>

        {/* Actions List */}
        {displayRecs.map((rec) => (
          <div 
            key={rec._id || rec.id} 
            className={`rec-item ${rec.applied ? 'applied' : ''}`}
            style={{ 
              padding: '14px',
              background: rec.applied ? 'rgba(76, 175, 80, 0.03)' : 'rgba(255,255,255,0.01)',
              border: rec.applied ? '1px solid rgba(76, 175, 80, 0.2)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div className="rec-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <span className="rec-action" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'left' }}>{rec.action || rec.description}</span>
              <span className="impact-badge" style={{ fontSize: '10.5px', color: 'var(--status-good)', background: 'var(--status-good-bg)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                +{rec.expectedImprovement || 12}%
              </span>
            </div>

            <div className="rec-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="priority-badge" style={getPriorityBadgeStyle(rec.priority || 2)}>
                P{rec.priority || 2}
              </span>
              
              {rec.applied ? (
                <span style={{ color: 'var(--status-good)', fontSize: '11.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Applied ✓
                </span>
              ) : (
                <button 
                  className="apply-btn"
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '11px', 
                    background: 'var(--primary-gradient)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  disabled={applyingId === (rec.id || rec._id)}
                  onClick={() => onApplyRecommendation(rec.id || rec._id)}
                >
                  {applyingId === (rec.id || rec._id) ? 'Applying...' : 'Apply'}
                </button>
              )}
            </div>
          </div>
        ))}

        {displayRecs.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '10px' }}>
            No priority interventions found for this team.
          </p>
        )}

      </div>
    </div>
  );
};

export default RecommendationsList;
