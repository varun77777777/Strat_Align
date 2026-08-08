import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const getBarColor = (riskScore) => {
  if (riskScore > 70) return { bg: 'rgba(244, 67, 54, 0.75)', border: '#F44336' };
  if (riskScore > 40) return { bg: 'rgba(255, 193, 7, 0.75)', border: '#FFC107' };
  return { bg: 'rgba(76, 175, 80, 0.75)', border: '#4CAF50' };
};

const HistogramChart = ({ riskData = [] }) => {
  const chartRef = useRef(null);

  // Cleanup on unmount to avoid canvas memory leaks
  useEffect(() => {
    const currentChart = chartRef.current;
    return () => {
      if (currentChart) {
        currentChart.destroy?.();
      }
    };
  }, []);

  if (!riskData || riskData.length === 0) {
    return (
      <div className="glass-card">
        <div className="section-title-bar">
          <h2 className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00c6ff' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            Risk Distribution by Team
          </h2>
          <span className="section-subtitle">No predictions yet</span>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          Waiting for prediction data…
        </div>
      </div>
    );
  }

  const labels = riskData.map(d => d.teamName || d.name || 'Unknown');
  const scores = riskData.map(d => d.riskScore || 0);
  const colors = scores.map(getBarColor);

  const data = {
    labels,
    datasets: [
      {
        label: 'Risk Score (%)',
        data: scores,
        backgroundColor: colors.map(c => c.bg),
        borderColor: colors.map(c => c.border),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(7, 9, 14, 0.92)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#a0aec0',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const score = ctx.parsed.y;
            const level = score > 70 ? '🔴 Critical' : score > 40 ? '🟡 At-Risk' : '🟢 Aligned';
            return ` ${score}% — ${level}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#718096',
          font: { size: 11, family: 'Plus Jakarta Sans, system-ui' },
          maxRotation: 35,
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: '#718096',
          font: { size: 11 },
          callback: (v) => `${v}%`,
          stepSize: 25,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  return (
    <div className="glass-card">
      <div className="section-title-bar">
        <h2 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00c6ff' }}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Risk Distribution by Team
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#F44336' }}>● Critical &gt;70%</span>
          <span style={{ fontSize: '11px', color: '#FFC107' }}>● At-Risk &gt;40%</span>
          <span style={{ fontSize: '11px', color: '#4CAF50' }}>● Aligned</span>
        </div>
      </div>
      <div style={{ height: '220px', position: 'relative' }}>
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

HistogramChart.propTypes = {
  riskData: PropTypes.arrayOf(
    PropTypes.shape({
      teamName: PropTypes.string,
      riskScore: PropTypes.number,
    })
  ),
};

HistogramChart.defaultProps = {
  riskData: [],
};

export default HistogramChart;
