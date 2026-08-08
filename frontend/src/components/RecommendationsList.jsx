import React, { useState } from 'react';

const RecommendationsList = ({ recommendations = [], onApplyRecommendation, applyingId }) => {
  const [targetImprovement, setTargetImprovement] = useState(15);

  const getPriorityBadgeStyle = (priority) => {
    if (priority <= 2) {
      return { background: 'rgba(244, 67, 54, 0.1)', color: '#F44336', border: '1px solid rgba(244, 67, 54, 0.2)' };
    }
    return { background: 'rgba(255, 193, 7, 0.1)', color: '#FFC107', border: '1px solid rgba(255, 193, 7, 0.2)' };
  };

  // Limit to top 3 recommendations
  const displayRecs = recommendations.slice(0, 3);

  return (
    <div className="glass-card" style={{ flex: 1 }}>
      <div className="section-title-bar">
        <h2 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#764ba2' }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 16 12 12 12 8" />
            <line x1="12" y1="20" x2="12" y2="20" />
          </svg>
          Priority Interventions
        </h2>
        <span className="section-subtitle">Top 3 actions</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        
        {/* Slider */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Projected Target Improvement:</span>
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
            style={{ padding: '14px' }}
          >
            <div className="rec-header">
              <span className="rec-action" style={{ fontSize: '13px' }}>{rec.action}</span>
              <span className="impact-badge" style={{ fontSize: '10.5px' }}>+{rec.expectedImprovement}%</span>
            </div>

            <div className="rec-meta" style={{ marginTop: '8px' }}>
              <span className="priority-badge" style={getPriorityBadgeStyle(rec.priority)}>
                P{rec.priority}
              </span>
              
              {rec.applied ? (
                <span style={{ color: 'var(--status-good)', fontSize: '11.5px', fontWeight: 'bold' }}>
                  Applied ✓
                </span>
              ) : (
                <button 
                  className="apply-btn"
                  style={{ padding: '4px 10px', fontSize: '10.5px' }}
                  disabled={applyingId === rec.id}
                  onClick={() => onApplyRecommendation(rec.id || rec._id)}
                >
                  {applyingId === rec.id ? 'Applying...' : 'Apply'}
                </button>
              )}
            </div>
          </div>
        ))}

        {displayRecs.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '10px' }}>
            No interventions generated.
          </p>
        )}

      </div>
    </div>
  );
};

export default RecommendationsList;
