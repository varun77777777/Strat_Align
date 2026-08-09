import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MessageDegradationFlow from './MessageDegradationFlow';

const NetworkIntelligenceGraph = ({ networkData, onNodeClick }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [animationActive, setAnimationActive] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);
  const svgRef = useRef(null);

  if (!networkData) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Loading network intelligence graph…</p>
      </div>
    );
  }

  const { nodes = [], edges = [], silos = [], opinionLeaders = [], degradationExamples = [], networkSummary = {} } = networkData;

  // Simple static circular layout calculation for SVG rendering
  const width = 600;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 140;

  const nodePositions = {};
  nodes.forEach((node, i) => {
    const angle = node.angle !== undefined ? node.angle : (i / nodes.length) * 2 * Math.PI;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    nodePositions[node.id] = { x, y };
  });

  const getStatusColor = (score) => {
    if (score >= 80) return 'var(--status-good)';
    if (score >= 65) return '#81c784';
    if (score >= 50) return 'var(--status-at-risk)';
    return 'var(--status-critical)';
  };

  const getSiloPulseClass = (node) => {
    if (node.informationSilo || node.siloScore > 60) {
      return 'silo-pulse';
    }
    return '';
  };

  // Run strategy message degradation animation loop
  useEffect(() => {
    if (!animationActive) return;
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, [animationActive]);

  const demoCorruption = networkData.messageCorrruptionDemo || {
    title: 'IBM Strategy: "Expand in Asia"',
    steps: [
      { actor: 'CEO', message: 'Aggressively expand watsonx in Asia-Pacific by Q4' },
      { actor: 'Regional VP', message: 'Grow Asia-Pacific partnerships in cloud and AI' },
      { actor: 'Country Manager', message: 'Build partnerships with local tech companies' },
      { actor: 'BD Lead', message: 'Reduce cost dependency on US market' },
      { actor: 'Sales Reps', message: 'Focus on relationship-building and local vendors' }
    ]
  };

  return (
    <div className="network-intelligence-container">
      {/* Overview stats */}
      <div className="glass-card network-header-card" style={{ marginBottom: '20px' }}>
        <div className="section-title-bar">
          <h2 className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Organizational Network Intelligence
          </h2>
          <span className="section-subtitle">Informal Collaboration & Message Integrity</span>
        </div>

        <div className="causal-org-kpis">
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#00c6ff' }}>{networkSummary.totalNodes}</div>
            <div className="causal-kpi-label">Active Nodes (Teams)</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#764ba2' }}>{networkSummary.totalEdges}</div>
            <div className="causal-kpi-label">Collaboration Edges</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#ff5252' }}>{networkSummary.informationSilos}</div>
            <div className="causal-kpi-label">Information Silos</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#FFC107' }}>{networkSummary.misalignedInfluencers}</div>
            <div className="causal-kpi-label">Misaligned Opinion Leaders</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#ff8a80' }}>{networkSummary.avgSiloScore}%</div>
            <div className="causal-kpi-label">Avg Isolation Index</div>
          </div>
        </div>
      </div>

      <div className="network-main-grid">
        {/* Network Graph Visualizer */}
        <div className="glass-card network-graph-card">
          <h3 className="card-inner-title">Collaboration Map (Informal Networks)</h3>
          <p className="card-subtitle">Nodes color-coded by strategic alignment. Pulsing outlines indicate information silos.</p>
          
          <div className="network-svg-wrapper">
            <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
              {/* Draw Edges */}
              {edges.map((edge) => {
                const sourcePos = nodePositions[edge.source];
                const targetPos = nodePositions[edge.target];
                if (!sourcePos || !targetPos) return null;
                const isSelected = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);
                const strokeColor = edge.strength === 'strong' ? 'rgba(0, 198, 255, 0.4)' : edge.strength === 'moderate' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
                const strokeWidth = edge.strength === 'strong' ? 3 : edge.strength === 'moderate' ? 2 : 1;

                return (
                  <g key={edge.id}>
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isSelected ? '#00c6ff' : strokeColor}
                      strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />
                    {isSelected && (
                      <circle
                        cx={(sourcePos.x + targetPos.x) / 2}
                        cy={(sourcePos.y + targetPos.y) / 2}
                        r="3"
                        fill="#00c6ff"
                        className="pulse-dot"
                      />
                    )}
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {nodes.map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;
                const isSelected = selectedNode && selectedNode.id === node.id;
                const color = getStatusColor(node.alignmentScore);
                const isSilo = node.informationSilo || node.siloScore > 60;

                return (
                  <g
                    key={node.id}
                    className="network-node"
                    onClick={() => {
                      setSelectedNode(node);
                      if (onNodeClick) onNodeClick(node);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {isSilo && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="25"
                        fill="none"
                        stroke="#ff5252"
                        strokeWidth="1.5"
                        className="silo-pulse-circle"
                      />
                    )}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="16"
                      fill="#0b0e14"
                      stroke={isSelected ? '#ffffff' : color}
                      strokeWidth={isSelected ? 3 : 2.5}
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {node.label.split(' ').map(w => w[0]).join('')}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 28}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {node.label}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 39}
                      textAnchor="middle"
                      fill={color}
                      fontSize="9"
                      fontWeight="500"
                    >
                      {node.alignmentScore}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Node / Opinion Leaders / Silos Sidebar */}
        <div className="network-sidebar-cards">
          {selectedNode ? (
            <div className="glass-card node-detail-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 className="node-title">{selectedNode.label}</h4>
                <button className="close-btn" onClick={() => setSelectedNode(null)}>✕</button>
              </div>
              <p className="node-meta">{selectedNode.department} · Lead: {selectedNode.leader}</p>

              <div className="node-stats">
                <div className="node-stat-item">
                  <span className="label">Alignment</span>
                  <strong className="value" style={{ color: getStatusColor(selectedNode.alignmentScore) }}>
                    {selectedNode.alignmentScore}%
                  </strong>
                </div>
                <div className="node-stat-item">
                  <span className="label">Risk Index</span>
                  <strong className="value" style={{ color: '#ff8a80' }}>${selectedNode.financialRisk}M</strong>
                </div>
                <div className="node-stat-item">
                  <span className="label">Isolation Score</span>
                  <strong className="value" style={{ color: selectedNode.siloScore > 60 ? '#ff5252' : '#ffffff' }}>
                    {selectedNode.siloScore}%
                  </strong>
                </div>
              </div>

              {selectedNode.rootCauseSummary && (
                <div className="node-summary-box">
                  <strong>Drift Root Cause:</strong>
                  <p>{selectedNode.rootCauseSummary}</p>
                </div>
              )}

              {/* Opinion Leaders in this team */}
              {selectedNode.opinionLeaders && selectedNode.opinionLeaders.length > 0 && (
                <div className="opinion-leaders-section" style={{ marginTop: '12px' }}>
                  <h5 className="section-small-title">Opinion Leaders (Influencers)</h5>
                  {selectedNode.opinionLeaders.map((leader, i) => (
                    <div key={i} className="leader-row">
                      <div>
                        <strong>{leader.name}</strong>
                        <span>{leader.role}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`bias-badge ${leader.alignmentBias}`}>
                          {leader.alignmentBias}
                        </span>
                        <small className="reach">Influence: {leader.influenceScore}%</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card key-insights-card">
              <h4 className="node-title">Network Highlights</h4>
              
              <div className="network-insight-group">
                <span className="insight-section-label">📢 SILOS DETECTED ({silos.length})</span>
                {silos.map((silo, i) => (
                  <div key={i} className="insight-item-row" style={{ borderLeft: '3px solid #ff5252' }}>
                    <strong>{silo.teamName}</strong>
                    <span className="desc">{silo.reason}</span>
                    <span className="badge-silo">{silo.siloScore}% Isolated</span>
                  </div>
                ))}
              </div>

              <div className="network-insight-group" style={{ marginTop: '16px' }}>
                <span className="insight-section-label">⭐ KEY INFLUENCERS (TOP OPINION LEADERS)</span>
                {opinionLeaders.slice(0, 3).map((leader, i) => (
                  <div key={i} className="insight-item-row" style={{ borderLeft: leader.alignmentBias === 'misaligned' ? '3px solid #FF9800' : '3px solid #4CAF50' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{leader.name} ({leader.teamName})</strong>
                      <span className={`bias-badge ${leader.alignmentBias}`}>{leader.alignmentBias}</span>
                    </div>
                    <span className="desc">{leader.role} · Reach: {leader.reachCount} employees</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strategic Translation Layers & Message Degradation Live Simulation */}
      <div className="glass-card message-degradation-section" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="card-inner-title" style={{ margin: 0 }}>Strategic Translation degradation simulator</h3>
            <p className="card-subtitle" style={{ margin: 0 }}>How the strategic message decays and corrupts as it propagates through formal hierarchies.</p>
          </div>
          <button
            className={`btn-play-animation ${animationActive ? 'active' : ''}`}
            onClick={() => setAnimationActive(prev => !prev)}
          >
            {animationActive ? '⏸ Pause Simulation' : '▶ Play Simulation'}
          </button>
        </div>

        <div className="animation-timeline-grid">
          <div className="degradation-simulator-demo">
            <h4 className="node-title">{demoCorruption.title}</h4>
            <div className="corruption-path-timeline">
              {demoCorruption.steps.map((step, idx) => {
                const isActive = animationStep === idx;
                const corruptionColor = idx === 0 ? '#4CAF50' : idx === 1 ? '#81c784' : idx === 2 ? '#FFC107' : idx === 3 ? '#FF9800' : '#ff5252';

                return (
                  <div key={idx} className={`corruption-step-row ${isActive ? 'active' : ''}`}>
                    <div className="corruption-indicator">
                      <div className="corruption-dot" style={{ background: corruptionColor, boxShadow: isActive ? `0 0 10px ${corruptionColor}` : 'none' }} />
                      {idx < demoCorruption.steps.length - 1 && <div className="corruption-line" />}
                    </div>
                    <div className="corruption-content-box">
                      <div className="meta">
                        <span className="actor">Level {idx}: {step.actor}</span>
                        {idx > 0 && <span className="pct" style={{ color: corruptionColor }}>+{idx * 24}% Degradation</span>}
                      </div>
                      <p className="message">"{step.message}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Org Level Degradation List */}
          <div className="degradation-comparisons">
            <h4 className="node-title">Message Degradation by Department</h4>
            <div className="degradation-list">
              {degradationExamples.map((ex, i) => (
                <div key={i} className="degradation-list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{ex.teamName}</strong>
                    <span className="degr-score" style={{ color: ex.maxDegradation > 60 ? 'var(--status-critical)' : 'var(--status-at-risk)' }}>
                      Max degradation: {ex.maxDegradation}%
                    </span>
                  </div>
                  {/* Miniature flow representation */}
                  <div className="degradation-flow-preview">
                    {ex.degradationPath.map((path, idx) => (
                      <div key={idx} className="preview-bubble" title={`${path.role}: ${path.receivedMessage}`} style={{ background: getStatusColor(100 - path.degradationScore) }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

NetworkIntelligenceGraph.propTypes = {
  networkData: PropTypes.shape({
    nodes: PropTypes.array,
    edges: PropTypes.array,
    silos: PropTypes.array,
    opinionLeaders: PropTypes.array,
    degradationExamples: PropTypes.array,
    networkSummary: PropTypes.object,
    messageCorrruptionDemo: PropTypes.object
  }),
  onNodeClick: PropTypes.func
};

export default NetworkIntelligenceGraph;
