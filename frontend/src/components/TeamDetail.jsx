import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TeamHero from './TeamHero';
import TrendChart from './TrendChart';
import ProjectTable from './ProjectTable';
import AIAnalysis from './AIAnalysis';
import RecommendationsList from './RecommendationsList';
import { 
  getTeamById, 
  applyRecommendation, 
  analyzeStrategy 
} from '../api';

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Custom sub-views
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' | 'sentiment' | 'technical'

  // Diagnostic form state
  const [strategyDoc, setStrategyDoc] = useState('');
  const [communications, setCommunications] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [applyingId, setApplyingId] = useState(null);

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTeamById(teamId);
      if (res.success) {
        setTeam(res.data);
        setError(null);
      } else {
        setError('Failed to retrieve team detail.');
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Could not connect to service host.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Show visual toast notification helper
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleApplyRec = async (id) => {
    try {
      setApplyingId(id);
      const res = await applyRecommendation(id);
      if (res.success) {
        // Update local state immediately
        setTeam(prev => {
          if (!prev) return prev;
          const updatedRecs = prev.projects || []; // Safe fallback
          const newRecs = (prev.prediction?.recommendations || []).map(r => 
            (r._id === id || r.id === id) ? { ...r, applied: true, appliedAt: new Date() } : r
          );
          return {
            ...prev,
            prediction: {
              ...prev.prediction,
              recommendations: newRecs
            }
          };
        });
        showToast('Strategic intervention successfully applied! expected risk score updated.');
        // Refetch to pull latest prediction metrics
        const refresh = await getTeamById(teamId);
        if (refresh.success) {
          setTeam(refresh.data);
        }
      }
    } catch (err) {
      console.error('Error applying recommendation:', err);
      showToast('Could not apply recommendation.');
    } finally {
      setApplyingId(null);
    }
  };

  // Run Gemini analysis test inside component
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!strategyDoc.trim()) return;

    const commsList = communications
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    setAnalyzing(true);
    try {
      const res = await analyzeStrategy(
        teamId,
        strategyDoc,
        commsList.length ? commsList : ["No communication log provided."]
      );

      if (res.success) {
        setAnalysisResult(res.data);
        showToast('Gemini diagnostics completed successfully!');
        // Update team score
        const refresh = await getTeamById(teamId);
        if (refresh.success) {
          setTeam(refresh.data);
        }
      }
    } catch (err) {
      console.error('Error running AI diagnostics:', err);
      showToast('AI diagnostics failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Download team report as JSON
  const handleDownloadReport = () => {
    if (!team) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(team, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `strat-align-report-${team.name.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON report download initiated successfully!');
  };

  // Share report link helper
  const handleShareReport = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToast('Report URL successfully copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy link:', err);
        showToast('Failed to copy link.');
      });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>Retrieving team profile data...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div className="error-banner" style={{ display: 'inline-flex', margin: '0 auto' }}>
          <span>⚠️ {error || 'Team not found.'}</span>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Link to="/" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: 'rgba(10, 15, 36, 0.95)',
          border: '1px solid #00c6ff',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 198, 255, 0.2)',
          zIndex: 2000,
          fontSize: '13px',
          fontWeight: '600',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Detail header menu bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px' }}>
        <button 
          onClick={() => navigate('/')} 
          className="submit-btn"
          style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 16px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownloadReport} className="submit-btn" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            📥 Export Report
          </button>
          <button onClick={handleShareReport} className="submit-btn" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            🔗 Share Profile
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <TeamHero team={team} />

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('performance')} 
          style={{
            background: activeTab === 'performance' ? 'var(--primary-gradient)' : 'transparent',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
        >
          Strategic Performance
        </button>
        <button 
          onClick={() => setActiveTab('sentiment')} 
          style={{
            background: activeTab === 'sentiment' ? 'var(--primary-gradient)' : 'transparent',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
        >
          Sentiment Analysis
        </button>
        <button 
          onClick={() => setActiveTab('technical')} 
          style={{
            background: activeTab === 'technical' ? 'var(--primary-gradient)' : 'transparent',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
        >
          Technical Health Metrics
        </button>
      </div>

      {/* Performance view layout */}
      {activeTab === 'performance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <TrendChart trendData={team.alignmentTrend || []} />
            <ProjectTable projects={team.projects || []} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <AIAnalysis 
              team={team} 
              prediction={team.prediction || {}} 
              strategyDoc={strategyDoc}
              setStrategyDoc={setStrategyDoc}
              communications={communications}
              setCommunications={setCommunications}
              onAnalyze={handleAnalyze}
              analyzing={analyzing}
              analysisResult={analysisResult}
            />
            <RecommendationsList 
              recommendations={team.prediction?.recommendations || []} 
              onApplyRecommendation={handleApplyRec}
              applyingId={applyingId}
            />
          </div>
        </div>
      )}

      {/* Sentiment view layout */}
      {activeTab === 'sentiment' && (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'left', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Team Sentiment Analysis</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            Concepts extraction analytics show strategy mentions are present in <strong>{team.alignmentScore > 60 ? '78%' : '35%'}</strong> of team communications. Drift signals suggest stressed or misaligned tones in operational standup notes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Overall Tone Mood</span>
              <span style={{ fontSize: '24px', fontWeight: 800, display: 'block', marginTop: '6px', color: team.alignmentScore > 60 ? 'var(--status-good)' : 'var(--status-critical)' }}>
                {team.alignmentScore > 75 ? 'Engaged' : team.alignmentScore >= 55 ? 'Neutral / Stressed' : 'Stressed / Disengaged'}
              </span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Positive Ratio</span>
              <span style={{ fontSize: '24px', fontWeight: 800, display: 'block', marginTop: '6px' }}>
                {team.alignmentScore > 60 ? '0.72' : '0.24'}
              </span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Negative Ratio</span>
              <span style={{ fontSize: '24px', fontWeight: 800, display: 'block', marginTop: '6px' }}>
                {team.alignmentScore > 60 ? '0.08' : '0.45'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Technical view layout */}
      {activeTab === 'technical' && (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'left', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Technical Health Metric indicators</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            System audit of repository contributions and milestone ticket completions shows execution speed is at <strong>{team.projectVelocity}%</strong> of the historical baseline.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Commit Alignment Ratio</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <div className="score-bar-container" style={{ margin: 0, flex: 1, height: '8px' }}>
                  <div className="score-bar-fill" style={{ width: `${team.projectVelocity}%`, background: 'var(--primary-gradient)' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{team.projectVelocity}%</span>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PR Review Lead Time</span>
              <span style={{ fontSize: '20px', fontWeight: 800, display: 'block', marginTop: '6px' }}>14.2 Hours</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamDetail;
