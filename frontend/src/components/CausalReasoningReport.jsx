import React, { useState } from 'react';
import PropTypes from 'prop-types';

// ── Confidence Arc Gauge ──────────────────────────────────────────────────────
const ConfidenceGauge = ({ value, size = 56 }) => {
  const r   = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const fill  = (value / 100) * circ;
  const color = value >= 88 ? '#4CAF50' : value >= 75 ? '#FFC107' : '#F44336';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.9s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fill="white"
        fontSize="11" fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {value}%
      </text>
    </svg>
  );
};

// ── Evidence type badge colours ───────────────────────────────────────────────
const CAUSE_COLORS = {
  resource:      { bg: 'rgba(244,67,54,0.12)',  border: 'rgba(244,67,54,0.35)',  color: '#ff8a80',  label: 'Resource Constraint' },
  talent:        { bg: 'rgba(156,39,176,0.12)', border: 'rgba(156,39,176,0.35)', color: '#ce93d8',  label: 'Talent Gap' },
  incentive:     { bg: 'rgba(255,152,0,0.12)',  border: 'rgba(255,152,0,0.35)',  color: '#ffcc80',  label: 'Incentive Misalignment' },
  communication: { bg: 'rgba(33,150,243,0.12)', border: 'rgba(33,150,243,0.35)', color: '#90caf9',  label: 'Communication Breakdown' },
  market:        { bg: 'rgba(0,188,212,0.12)',  border: 'rgba(0,188,212,0.35)',  color: '#80deea',  label: 'Market Signal' },
  external:      { bg: 'rgba(76,175,80,0.12)',  border: 'rgba(76,175,80,0.35)',  color: '#a5d6a7',  label: 'External Event' },
  unknown:       { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', color: '#a0aec0', label: 'Unknown' },
};

const CHANNEL_ICONS = { email: '✉', slack: '💬', meeting: '🗣', survey: '📋', report: '📊' };

const SEVERITY_STYLES = {
  critical: { color: '#ff5252', bg: 'rgba(244,67,54,0.12)', border: '1px solid rgba(244,67,54,0.35)', label: '🔴 Critical' },
  high:     { color: '#FF9800', bg: 'rgba(255,152,0,0.12)',  border: '1px solid rgba(255,152,0,0.35)',  label: '🟠 High Risk' },
  medium:   { color: '#FFC107', bg: 'rgba(255,193,7,0.12)',  border: '1px solid rgba(255,193,7,0.35)',  label: '🟡 Medium' },
  low:      { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)',  border: '1px solid rgba(76,175,80,0.35)',  label: '🟢 Low' },
};

// ── Causal Chain Timeline ─────────────────────────────────────────────────────
const CausalChain = ({ steps }) => {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="causal-chain-timeline">
      {steps.map((step, i) => {
        const c = CAUSE_COLORS[step.evidenceType] || CAUSE_COLORS.unknown;
        return (
          <div key={i} className="causal-step">
            <div className="causal-step-connector">
              <div className="causal-step-dot" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}88` }} />
              {i < steps.length - 1 && <div className="causal-step-line" />}
            </div>
            <div className="causal-step-content">
              <div className="causal-step-header">
                <span className="causal-step-num">Step {step.step}</span>
                <span className="causal-cause-badge" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
                  {c.label}
                </span>
                <span className="causal-confidence-pill">{step.confidence}% confidence</span>
              </div>
              <div className="causal-cause-text">⚡ <strong>Cause:</strong> {step.cause}</div>
              <div className="causal-effect-text">→ <strong>Effect:</strong> {step.effect}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Evidence Quote Block ──────────────────────────────────────────────────────
const EvidenceQuote = ({ quote }) => {
  const sentColor = { positive: '#4CAF50', neutral: '#a0aec0', negative: '#ff5252', mixed: '#FFC107' };
  return (
    <div className="evidence-quote-block">
      <div className="evidence-quote-meta">
        <span className="evidence-channel">{CHANNEL_ICONS[quote.channel] || '📝'} {quote.channel}</span>
        <span className="evidence-author">{quote.author}</span>
        <span className="evidence-role">{quote.role}</span>
        <span className="evidence-date">{quote.date}</span>
        <span className="evidence-sentiment-dot" style={{ background: sentColor[quote.sentiment] || '#a0aec0' }} title={quote.sentiment} />
      </div>
      <blockquote className="evidence-quote-text">"{quote.quote}"</blockquote>
      {quote.tags && quote.tags.length > 0 && (
        <div className="evidence-tags">
          {quote.tags.map(tag => <span key={tag} className="evidence-tag">#{tag}</span>)}
        </div>
      )}
    </div>
  );
};

// ── Impact Forecast Banner ────────────────────────────────────────────────────
const ImpactForecast = ({ report }) => (
  <div className="impact-forecast-banner">
    <div className="impact-scenario current">
      <div className="impact-label">Current trajectory</div>
      <div className="impact-value">${report.forecastRevenueMiss}M</div>
      <div className="impact-sub">revenue miss in {report.forecastTimeframeWeeks} weeks</div>
    </div>
    <div className="impact-arrow">→</div>
    <div className="impact-scenario fix">
      <div className="impact-label">With targeted fix</div>
      <div className="impact-value fix">${report.counterfactualWithFix}M</div>
      <div className="impact-sub">savings of ${(report.forecastRevenueMiss - report.counterfactualWithFix).toFixed(0)}M</div>
    </div>
    <div className="impact-arrow">→</div>
    <div className="impact-scenario worst">
      <div className="impact-label">Without intervention</div>
      <div className="impact-value worst">${report.counterfactualWorstCase}M</div>
      <div className="impact-sub">by Q4</div>
    </div>
  </div>
);

// ── Team Report Card ──────────────────────────────────────────────────────────
const TeamReasoningCard = ({ report }) => {
  const [expanded, setExpanded] = useState(false);
  const sevStyle = SEVERITY_STYLES[report.severity] || SEVERITY_STYLES.low;
  const causeStyle = CAUSE_COLORS[report.primaryCauseType] || CAUSE_COLORS.unknown;

  return (
    <div className={`reasoning-card ${expanded ? 'reasoning-card-expanded' : ''}`}
      style={{ borderLeft: `3px solid ${sevStyle.color}` }}>
      {/* Card Header */}
      <div className="reasoning-card-header" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        <div className="reasoning-card-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="reasoning-team-name">{report.teamName}</span>
            {report.needsEscalation && (
              <span className="escalation-badge">⚠ ESCALATE</span>
            )}
            <span className="severity-pill" style={{ background: sevStyle.bg, border: sevStyle.border, color: sevStyle.color }}>
              {sevStyle.label}
            </span>
          </div>
          <div className="reasoning-card-dept">{report.department} · {report.leader}</div>
        </div>

        <div className="reasoning-card-metrics">
          <div style={{ textAlign: 'center' }}>
            <ConfidenceGauge value={report.rootCauseConfidence} />
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>confidence</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: sevStyle.color }}>{report.alignmentScore}%</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>alignment</div>
            <div style={{ fontSize: '11px', color: '#ff8a80', marginTop: '2px' }}>${report.forecastRevenueMiss}M risk</div>
          </div>
          <div className="expand-arrow" style={{ color: 'var(--text-muted)', fontSize: '20px' }}>
            {expanded ? '▲' : '▼'}
          </div>
        </div>
      </div>

      {/* Deviation summary (always visible) */}
      <div className="reasoning-deviation-row">
        <span className="deviation-metric">{report.deviationMetric}</span>
        <span className="deviation-magnitude" style={{ color: '#ff8a80' }}>
          {report.deviationMagnitude > 0 ? '+' : ''}{report.deviationMagnitude}%
        </span>
      </div>

      <div className="reasoning-root-cause-summary">
        <span className="root-cause-label">ROOT CAUSE</span>
        <span>{report.rootCauseSummary}</span>
        <span className="root-cause-type-badge" style={{ background: causeStyle.bg, border: `1px solid ${causeStyle.border}`, color: causeStyle.color }}>
          {causeStyle.label}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="reasoning-expanded-content">
          {/* Causal Chain */}
          {report.causalChain && report.causalChain.length > 0 && (
            <div className="reasoning-section">
              <div className="reasoning-section-label">CAUSAL CHAIN</div>
              <CausalChain steps={report.causalChain} />
            </div>
          )}

          {/* Evidence Quotes */}
          {report.evidenceQuotes && report.evidenceQuotes.length > 0 && (
            <div className="reasoning-section">
              <div className="reasoning-section-label">EVIDENCE ({report.evidenceCount} sources)</div>
              {report.evidenceQuotes.map((q, i) => <EvidenceQuote key={i} quote={q} />)}
            </div>
          )}

          {/* Impact Forecast */}
          <div className="reasoning-section">
            <div className="reasoning-section-label">BUSINESS IMPACT FORECAST</div>
            <ImpactForecast report={report} />
          </div>

          {/* Intervention */}
          <div className="reasoning-section">
            <div className="reasoning-section-label">RECOMMENDED INTERVENTION</div>
            <div className="intervention-box">
              <div className="intervention-text">{report.interventionRecommendation}</div>
              <div className="intervention-meta">
                <span>⏱ Recovery: ~{report.estimatedRecoveryWeeks} weeks</span>
                <span>📊 Exec prob: {report.executionProbability}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main CausalReasoningReport Component ─────────────────────────────────────
const CausalReasoningReport = ({ causalData }) => {
  const [filter, setFilter] = useState('all');

  if (!causalData) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Loading causal reasoning data…</p>
      </div>
    );
  }

  const { reports = [], orgSummary = {} } = causalData;
  const filtered = filter === 'all' ? reports : reports.filter(r => r.severity === filter);

  return (
    <div className="causal-reasoning-container">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <div className="section-title-bar">
          <h2 className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ce93d8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Causal Reasoning Report
          </h2>
          <span className="section-subtitle">Evidence-Based Root Cause Analysis</span>
        </div>

        {/* Org summary KPIs */}
        <div className="causal-org-kpis">
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#ff5252' }}>{orgSummary.criticalTeams}</div>
            <div className="causal-kpi-label">Critical Teams</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#FF9800' }}>{orgSummary.highRiskTeams}</div>
            <div className="causal-kpi-label">High Risk</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#ff5252' }}>{orgSummary.teamsNeedingEscalation}</div>
            <div className="causal-kpi-label">Need Escalation</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#ff8a80' }}>${orgSummary.totalRevenueMiss}M</div>
            <div className="causal-kpi-label">Revenue at Risk</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#4CAF50' }}>${(orgSummary.totalRevenueMiss - orgSummary.withFixMiss).toFixed(0)}M</div>
            <div className="causal-kpi-label">Recoverable with Fixes</div>
          </div>
          <div className="causal-kpi">
            <div className="causal-kpi-value" style={{ color: '#ff5252' }}>${orgSummary.worstCaseMiss}M</div>
            <div className="causal-kpi-label">Worst Case Q4</div>
          </div>
        </div>

        {/* Top cause types */}
        {orgSummary.topCauseTypes && orgSummary.topCauseTypes.length > 0 && (
          <div className="top-cause-types">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '8px' }}>TOP ROOT CAUSE TYPES:</span>
            {orgSummary.topCauseTypes.map(tc => {
              const c = CAUSE_COLORS[tc.type] || CAUSE_COLORS.unknown;
              return (
                <span key={tc.type} className="cause-type-chip"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
                  {c.label} ({tc.count})
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="reasoning-filter-tabs">
        {['all', 'critical', 'high', 'medium', 'low'].map(f => (
          <button key={f} className={`reasoning-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? `All Teams (${reports.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Team Cards */}
      <div className="reasoning-cards-list">
        {filtered.map(report => (
          <TeamReasoningCard key={String(report.id)} report={report} />
        ))}
        {filtered.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            🎉 No teams in this severity level.
          </div>
        )}
      </div>
    </div>
  );
};

CausalReasoningReport.propTypes = {
  causalData: PropTypes.shape({
    reports: PropTypes.array,
    orgSummary: PropTypes.object,
  }),
};

export default CausalReasoningReport;
