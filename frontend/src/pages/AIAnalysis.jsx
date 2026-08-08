import React from 'react';

const AIAnalysis = ({ 
  team = {}, 
  prediction = {}, 
  strategyDoc = '', 
  setStrategyDoc,
  communications = '', 
  setCommunications,
  onAnalyze, 
  analyzing, 
  analysisResult 
}) => {

  const driftSignals = prediction.driftSignals || (team.alignmentScore < 50 
    ? ['High terminology divergence in Slack chats', 'Key milestone delays due to project isolation', 'Communication sync frequencies below once a month']
    : ['Minor keyword mismatch in roadmap notes']);

  return (
    <div className="glass-card" style={{ flex: 1 }}>
      <div className="section-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00c6ff' }}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          Drift Signal Diagnostics
        </h2>
        <span className="section-subtitle" style={{ background: 'rgba(0, 198, 255, 0.1)', color: '#00c6ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>Granite Engine</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        
        {/* Drift Signals List */}
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textAlign: 'left' }}>Detected Drift Signals:</span>
          {driftSignals.map((sig, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: 'rgba(244, 67, 54, 0.05)', 
                border: '1px solid rgba(244, 67, 54, 0.1)', 
                color: '#ff8a80', 
                fontSize: '12.5px', 
                padding: '10px 14px', 
                borderRadius: '8px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}
            >
              <span style={{ color: '#F44336' }}>⚠️</span>
              {sig}
            </div>
          ))}
        </div>

        {/* Gemini Interactive Form */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', marginTop: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '10px', textAlign: 'left' }}>
            Test Strategy Alignment (Gemini Model)
          </span>
          <form onSubmit={onAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea 
              className="input-field"
              placeholder="Paste updated Strategic Goal doc..."
              rows="2"
              value={strategyDoc}
              onChange={e => setStrategyDoc(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
            <textarea 
              className="input-field"
              placeholder="Paste Team chat / standup logs..."
              rows="2"
              value={communications}
              onChange={e => setCommunications(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <button 
              type="submit" 
              className="submit-btn" 
              style={{ padding: '8px', fontSize: '12px', width: '100%' }}
              disabled={analyzing}
            >
              {analyzing ? 'Evaluating...' : 'Run Diagnostics'}
            </button>
          </form>

          {analysisResult && (
            <div style={{ marginTop: '14px', background: 'rgba(0, 198, 255, 0.05)', borderLeft: '4px solid #00c6ff', padding: '12px', borderRadius: '4px', textAlign: 'left' }}>
              <span style={{ fontSize: '11px', color: '#00c6ff', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Diagnostic Report:</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 8px 0' }}>{analysisResult.summary}</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                <span><strong>Alignment Score:</strong> {analysisResult.alignmentScore}%</span>
                <span><strong>Understanding:</strong> {analysisResult.understanding}%</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AIAnalysis;
