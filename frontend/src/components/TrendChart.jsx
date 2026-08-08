import React from 'react';
import PropTypes from 'prop-types';

const TrendChart = ({ trendData = [] }) => {
  // Handle both array format and { teams, timeline } object format
  let data = [];
  if (Array.isArray(trendData)) {
    data = trendData;
  } else if (trendData && Array.isArray(trendData.timeline)) {
    data = trendData.timeline.map(dayObj => {
      const scores = Object.entries(dayObj)
        .filter(([key, val]) => key !== 'date' && typeof val === 'number')
        .map(([, val]) => val);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;
      return {
        date: dayObj.date,
        score: avgScore
      };
    });
  }

  // Show loading/empty state instead of fake hardcoded data
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ flex: 1 }}>
        <div className="section-title-bar">
          <h2 className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff4b2b' }}>
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            7-Day Alignment Trend
          </h2>
          <span className="section-subtitle" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
            Loading…
          </span>
        </div>
        <div className="skeleton-chart" />
      </div>
    );
  }

  // Safe date label parser
  const safeLabel = (dateStr, index) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return `Day ${index + 1}`;
      return d.toLocaleDateString(undefined, { weekday: 'short' });
    } catch {
      return `Day ${index + 1}`;
    }
  };

  const scores = data.map(d => typeof d.score === 'number' ? d.score : 0);
  const minVal = Math.min(...scores, 0);
  const maxVal = Math.max(...scores, 100);

  const width = 500;
  const height = 180;
  const padding = 20;
  const pointsCount = data.length;

  const coords = data.map((d, index) => {
    const x = pointsCount > 1
      ? padding + (index * (width - 2 * padding)) / (pointsCount - 1)
      : width / 2;
    const y = height - padding - ((d.score - minVal) * (height - 2 * padding)) / (Math.max(maxVal - minVal, 1));
    return { x, y, score: d.score, label: safeLabel(d.date, index) };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `
    ${linePath}
    L ${coords[coords.length - 1].x} ${height - padding}
    L ${coords[0].x} ${height - padding}
    Z
  `;

  // Detect overall trend direction
  const firstScore = scores[0] ?? 0;
  const lastScore = scores[scores.length - 1] ?? 0;
  const trendDir = lastScore >= firstScore ? 'Improving' : 'Declining';
  const trendColor = lastScore >= firstScore ? '#4CAF50' : '#ff4b2b';

  return (
    <div className="glass-card" style={{ flex: 1 }}>
      <div className="section-title-bar">
        <h2 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: trendColor }}>
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          7-Day Alignment Trend
        </h2>
        <span
          className="section-subtitle"
          style={{ background: `${trendColor}18`, color: trendColor }}
        >
          {trendDir} Signal
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px`, marginTop: '16px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={trendColor} />
              <stop offset="100%" stopColor={lastScore >= firstScore ? '#00c6ff' : '#ff416c'} />
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

          {/* Data Points */}
          {coords.map((c, i) => (
            <g key={i} className="chart-node" style={{ cursor: 'pointer' }}>
              <circle cx={c.x} cy={c.y} r="5" fill="#07090e" stroke={trendColor} strokeWidth="3" />
              <text x={c.x} y={c.y - 12} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                {c.score}%
              </text>
              <text x={c.x} y={height - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

TrendChart.propTypes = {
  trendData: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string,
    score: PropTypes.number,
  })),
};

TrendChart.defaultProps = {
  trendData: [],
};

export default TrendChart;
