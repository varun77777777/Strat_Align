import React from 'react';

const TrendChart = ({ trendData = [] }) => {
  // Safe fallback if trend data is empty, showing declining scores for demo
  const data = trendData.length ? trendData : [
    { score: 50, date: 'Day 1' },
    { score: 48, date: 'Day 2' },
    { score: 46, date: 'Day 3' },
    { score: 45, date: 'Day 4' },
    { score: 44, date: 'Day 5' },
    { score: 43, date: 'Day 6' },
    { score: 42, date: 'Day 7' }
  ];

  const scores = data.map(d => d.score);
  const minVal = Math.min(...scores, 0);
  const maxVal = Math.max(...scores, 100);
  
  // Chart dimensions
  const width = 500;
  const height = 180;
  const padding = 20;

  const pointsCount = data.length;
  
  // Map points to SVG coordinates
  const coords = data.map((d, index) => {
    const x = padding + (index * (width - 2 * padding)) / (pointsCount - 1);
    // Invert Y coordinate since (0,0) is top-left in SVG
    const y = height - padding - ((d.score - minVal) * (height - 2 * padding)) / (Math.max(maxVal - minVal, 1));
    return { 
      x, 
      y, 
      score: d.score, 
      label: d.date ? (new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || d.date) : `Day ${index + 1}`
    };
  });

  // Build the SVG path string for the line
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  // Build the SVG path string for the gradient fill area below the line
  const areaPath = `
    ${linePath} 
    L ${coords[coords.length - 1].x} ${height - padding} 
    L ${coords[0].x} ${height - padding} 
    Z
  `;

  return (
    <div className="glass-card" style={{ flex: 1 }}>
      <div className="section-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff4b2b' }}>
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          7-Day Alignment Trend
        </h2>
        <span className="section-subtitle" style={{ background: 'rgba(255, 75, 43, 0.1)', color: '#ff4b2b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>Declining Signal</span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px`, marginTop: '16px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4b2b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ff4b2b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff4b2b" />
              <stop offset="100%" stopColor="#ff416c" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Line Plot */}
          <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Coordinate Circles & Text */}
          {coords.map((c, i) => (
            <g key={i} className="chart-node" style={{ cursor: 'pointer' }}>
              <circle cx={c.x} cy={c.y} r="5" fill="#07090e" stroke="#ff4b2b" strokeWidth="3" />
              <text x={c.x} y={c.y - 12} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                {c.score}%
              </text>
              <text x={c.x} y={height - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                {data[i].date ? (new Date(data[i].date).toLocaleDateString(undefined, { weekday: 'short' }) || `Day ${i + 1}`) : `Day ${i + 1}`}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default TrendChart;
