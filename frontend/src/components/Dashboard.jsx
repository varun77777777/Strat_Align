import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICards from './KPICards';
import TeamHeatmap from './TeamHeatmap';
import RiskForecast from './RiskForecast';
import RecommendationsPanel from './RecommendationsPanel';
import { 
  getTeams, 
  getPredictions, 
  getRecommendations, 
  applyRecommendation 
} from '../api';

const Dashboard = () => {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch all dashboard data
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [teamsData, predictionsData, recsData] = await Promise.all([
        getTeams(),
        getPredictions(),
        getRecommendations()
      ]);

      if (teamsData.success) setTeams(teamsData.data);
      if (predictionsData.success) setPredictions(predictionsData.data);
      if (recsData.success) setRecommendations(recsData.data);
      
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Service connection degraded. Retrying...');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial fetch and 5s polling interval
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle recommendation application
  const handleApplyRecommendation = async (id) => {
    try {
      setApplyingId(id);
      const res = await applyRecommendation(id);
      if (res.success) {
        // Visual updates: immediately reflect application in dashboard data
        setRecommendations(prev => 
          prev.map(r => r.id === id ? { ...r, applied: true, appliedAt: new Date() } : r)
        );
        // Refresh other stats to show updated metrics
        fetchData(false);
      }
    } catch (err) {
      console.error('Error applying recommendation:', err);
      alert('Could not apply recommendation. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  // Open team detail page
  const handleTeamClick = (team) => {
    navigate(`/team/${team.id || team._id}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>Loading Strategic alignment dashboard...</p>
      </div>
    );
  }

  return (
    <div>
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
          <div className="live-indicator">
            <span className="pulse-dot"></span>
            LIVE RADAR
          </div>
        </div>
      </nav>

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

      {/* 4 KPI Cards */}
      <KPICards 
        teams={teams} 
        predictions={predictions} 
        recommendations={recommendations} 
      />

      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        
        {/* Main Column */}
        <div className="main-column">
          <TeamHeatmap 
            teams={teams} 
            onTeamClick={handleTeamClick} 
          />
          <RiskForecast 
            predictions={predictions} 
          />
        </div>

        {/* Side Column */}
        <div className="side-column">
          <RecommendationsPanel 
            recommendations={recommendations} 
            onApplyRecommendation={handleApplyRecommendation}
            applyingId={applyingId}
          />
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
