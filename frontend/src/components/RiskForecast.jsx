import React from 'react';

const RiskForecast = ({ predictions = [] }) => {
  // Aggregate predictions into failure timeframes
  // Categories:
  // - Critical: 2-6 weeks
  // - High: 6-12 weeks
  // - Medium: 12-16 weeks
  // - Low / Stable: 16+ or null weeks
  
  const categories = [
    { label: 'Weeks 2-6 (Critical)', range: [2, 6], color: 'linear-gradient(to top, #ff416c, #ff4b2b)', key: 'critical', teams: [] },
    { label: 'Weeks 7-12 (High)', range: [7, 12], color: 'linear-gradient(to top, #f37335, #fdc830)', key: 'high', teams: [] },
    { label: 'Weeks 13-16 (Medium)', range: [13, 16], color: 'linear-gradient(to top, #11998e, #38ef7d)', key: 'medium', teams: [] },
    { label: 'Stable (No risk)', range: [17, 999], color: 'linear-gradient(to top, #00c6ff, #0072ff)', key: 'stable', teams: [] }
  ];

  predictions.forEach(p => {
    const w = p.weeksToFailure;
    if (w === null || w === undefined) {
      categories[3].teams.push(p.teamName);
    } else if (w >= 2 && w <= 6) {
      categories[0].teams.push(p.teamName);
    } else if (w >= 7 && w <= 12) {
      categories[1].teams.push(p.teamName);
    } else {
      categories[2].teams.push(p.teamName);
    }
  });

  const maxCount = Math.max(...categories.map(c => c.teams.length), 1);

  return (
    <div className="glass-card">
      <div className="section-title-bar">
        <h2 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00c6ff' }}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Drift Failure Forecast
        </h2>
        <span className="section-subtitle">Weeks to Failure</span>
      </div>

      <div className="forecast-chart-container">
        <div className="forecast-bars">
          {categories.map((cat) => {
            const count = cat.teams.length;
            const percentage = (count / maxCount) * 100;
            return (
              <div key={cat.key} className="forecast-bar-column">
                <div 
                  className="forecast-bar-fill"
                  style={{ 
                    height: `${Math.max(percentage, 10)}%`, // minimum height to make it visible
                    background: cat.color,
                    width: '40px'
                  }}
                >
                  <div className="bar-tooltip">
                    {count} {count === 1 ? 'Team' : 'Teams'}
                  </div>
                </div>
                <span className="forecast-bar-label">{cat.label.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.slice(0, 3).map((cat) => {
          if (cat.teams.length === 0) return null;
          return (
            <div 
              key={cat.key} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.01)',
                padding: '6px 12px',
                borderRadius: '8px',
                borderLeft: `4px solid ${cat.key === 'critical' ? '#F44336' : cat.key === 'high' ? '#FFC107' : '#4CAF50'}`
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
              <span style={{ fontWeight: 'bold' }}>{cat.teams.join(', ')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskForecast;
