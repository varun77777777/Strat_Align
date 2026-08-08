import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICards from './KPICards';
import TeamHeatmap from './TeamHeatmap';
import RiskForecast from './RiskForecast';
import RecommendationsPanel from './RecommendationsPanel';
import TrendChart from './TrendChart';
import HistogramChart from './HistogramChart';
import { generateDashboardPDF } from '../services/pdfExport';
import {
  getTeams,
  getPredictions,
  getRecommendations,
  getAlignmentHistory,
  applyRecommendation,
} from '../api';

// ─── Skeleton card placeholders ────────────────────────────────────────────────
const KPISkeleton = () => (
  <div className="kpi-grid">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="glass-card kpi-card">
        <div className="skeleton skeleton-title" style={{ width: '60%', marginBottom: '12px' }} />
        <div className="skeleton skeleton-value" style={{ width: '40%', marginBottom: '8px' }} />
        <div className="skeleton skeleton-sub" style={{ width: '70%' }} />
      </div>
    ))}
  </div>
);

// ─── Toast notification ────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <div
    className="toast"
    style={{
      background: type === 'error' ? 'rgba(244,67,54,0.12)' : 'rgba(76,175,80,0.12)',
      borderColor: type === 'error' ? 'rgba(244,67,54,0.4)' : 'rgba(76,175,80,0.4)',
      color: type === 'error' ? '#ff8a80' : '#81c784',
    }}
  >
    <span>{message}</span>
    <button onClick={onClose} className="toast-close" aria-label="Dismiss">✕</button>
  </div>
);

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const dashboardRef = useRef(null);

  const [teams, setTeams] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendData, setTrendData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [appliedSmartIds, setAppliedSmartIds] = useState(() => {
    try {
      const stored = localStorage.getItem('applied_smart_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all dashboard data
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [teamsData, predictionsData, recsData, historyData] = await Promise.all([
        getTeams(),
        getPredictions(),
        getRecommendations(),
        getAlignmentHistory(7),
      ]);

      if (teamsData?.success) setTeams(teamsData.data ?? []);
      if (predictionsData?.success) setPredictions(predictionsData.data ?? []);
      if (recsData?.success) setRecommendations(recsData.data ?? []);
      if (historyData?.success) setTrendData(historyData.data ?? []);

      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Service connection degraded. Retrying…');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial fetch + 5-second polling
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle recommendation application
  const handleApplyRecommendation = async (id) => {
    try {
      setApplyingId(id);
      if (typeof id === 'string' && id.startsWith('smart-')) {
        // Handle virtual smart recommendation client-side
        const newApplied = [...appliedSmartIds, id];
        setAppliedSmartIds(newApplied);
        try {
          localStorage.setItem('applied_smart_ids', JSON.stringify(newApplied));
        } catch (e) {
          console.error(e);
        }
        showToast('✅ Recommendation applied!', 'success');
        return;
      }

      const res = await applyRecommendation(id);
      if (res?.success) {
        setRecommendations(prev =>
          prev.map(r => r.id === id ? { ...r, applied: true, appliedAt: new Date() } : r)
        );
        showToast('✅ Recommendation applied!', 'success');
        fetchData(false);
      }
    } catch (err) {
      console.error('Error applying recommendation:', err);
      showToast('❌ Could not apply recommendation. Please try again.', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      showToast('📄 Generating PDF report…', 'info');
      await generateDashboardPDF(dashboardRef, 'strat-align-report');
      showToast('✅ PDF downloaded!', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('❌ PDF export failed. Try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleTeamClick = (team) => {
    navigate(`/team/${team.id || team._id}`);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <nav className="glass-navbar">
          <div className="nav-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            STRAT-ALIGN
            <span className="nav-logo-sub">DRIFT DETECTOR</span>
          </div>
          <div className="live-indicator">
            <span className="pulse-dot" />
            LIVE RADAR
          </div>
        </nav>
        <KPISkeleton />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading strategic alignment data…</p>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div ref={dashboardRef}>
      {/* Glass Navbar */}
      <nav className="glass-navbar">
        <div className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          STRAT-ALIGN
          <span className="nav-logo-sub">DRIFT DETECTOR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            id="export-pdf-btn"
            className="export-btn"
            onClick={handleExportPDF}
            disabled={exporting}
            aria-label="Download PDF report"
          >
            {exporting ? '⏳ Exporting…' : '📥 Download Report'}
          </button>
          <div className="live-indicator">
            <span className="pulse-dot" />
            LIVE RADAR
          </div>
        </div>
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* KPI Cards */}
      <KPICards
        teams={teams}
        predictions={predictions}
        recommendations={recommendations}
      />

      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        {/* Main Column */}
        <div className="main-column">
          <TeamHeatmap teams={teams} onTeamClick={handleTeamClick} />
          <TrendChart trendData={trendData} />
          <HistogramChart riskData={predictions} />
          <RiskForecast predictions={predictions} />
        </div>

        {/* Side Column */}
        <div className="side-column">
          <RecommendationsPanel
            recommendations={recommendations}
            teams={teams}
            onApplyRecommendation={handleApplyRecommendation}
            applyingId={applyingId}
            appliedSmartIds={appliedSmartIds}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
