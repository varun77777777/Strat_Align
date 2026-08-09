import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const getStatusStyles = (score) => {
  if (score >= 80) return { color: 'var(--status-good)' };
  if (score >= 60) return { color: '#81c784' };
  if (score >= 45) return { color: 'var(--status-at-risk)' };
  return { color: 'var(--status-critical)' };
};

const getMicroCorrectionNudge = (teamName) => {
  const nudges = {
    'Watson AI': 'Marketing/Sales: align watsonx capability claims. Tech leads: accelerate AI governance integrations.',
    'Cloud Platform': 'VPs of Engineering & Product: clarify AWS vs. IBM Cloud multi-cloud support timelines to resolve ambiguity.',
    'IBM Consulting': 'Finance: adjust consultant incentive targets. Practice Leads: standardize AI transformational deck methodology.',
    'Security Division': 'HR: exception to Q3 hiring freeze to onboard 4 security architects. Team: rebalance compliance and Zero Trust.',
    'Research Division': 'Product Management: review publication milestones vs. watsonx feature roadmap dependencies weekly.',
    'Enterprise Sales': 'HR: immediate watsonx sales training bootcamp. Sales Ops: update quota metrics to weight strategic ARR at 1.5x.',
    'Finance & Operations': 'CFO: create ARR-linked cost metrics exceptions to remove legacy technology deprecation biases.',
    'HR & Talent': 'Board: increase AI recruiting budgets by 40% and align compensation bands with competitive benchmarks.',
  };
  return nudges[teamName] || 'Schedule leadership sync alignment meetings and review strategic KPIs vs. local metrics.';
};

const DriftIntelligence = ({ driftData, impactModel, onAutoCorrect, correctingTeamId, teams, simulation, simulating, onSimulate }) => {
  const hotspots = driftData?.hotspots ?? [];
  const summary = driftData?.summary;
  const current = impactModel?.scenarios?.current;
  const corrected = impactModel?.scenarios?.withIntervention;
  const [teamId, setTeamId] = useState('');
  const [informedPercent, setInformedPercent] = useState(50);

  useEffect(() => {
    if (!teamId && teams?.length) setTeamId(teams[0].id || teams[0]._id);
  }, [teamId, teams]);

  if (!summary && !current) return null;


  return (
    <section className="glass-card" aria-label="Strategic drift intelligence">
      <div className="section-title-bar">
        <h2 className="section-title">Strategic Drift Intelligence</h2>
        <span className="section-subtitle">Autonomous course correction</span>
      </div>

      <div className="drift-summary-grid">
        <div><span>Drift Hotspots</span><strong>{summary?.hotspotCount ?? 0} / {summary?.totalTeams ?? 0}</strong></div>
        <div><span>Financial Risk</span><strong style={{ color: '#ff8a80' }}>${summary?.totalFinancialRisk ?? 0}M</strong></div>
        <div><span>Current Success Rate</span><strong>{current?.strategySuccessRate ?? 0}%</strong></div>
        <div><span>Success with Correction</span><strong className="drift-positive" style={{ color: 'var(--status-good)' }}>{corrected?.strategySuccessRate ?? 0}%</strong></div>
      </div>

      {/* Scenario Comparisons Cards (Counterfactuals) */}
      <div className="counterfactual-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '16px 0' }}>
        <div className="glass-card counterfactual-card" style={{ borderLeft: '3px solid #ff5252' }}>
          <h4 style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IF WE DO NOTHING (12 WKS)</h4>
          <strong style={{ fontSize: '24px', color: '#ff5252' }}>${(summary?.totalFinancialRisk * 1.8 || 0).toFixed(1)}M Risk</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Alignment falls to {impactModel?.scenarios?.withoutIntervention?.alignment || 0}%. Strategy success rate drops to {impactModel?.scenarios?.withoutIntervention?.strategySuccessRate || 0}%.
          </p>
        </div>
        <div className="glass-card counterfactual-card" style={{ borderLeft: '3px solid var(--status-good)' }}>
          <h4 style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WITH AUTONOMOUS CORRECTION</h4>
          <strong style={{ fontSize: '24px', color: 'var(--status-good)' }}>${(summary?.totalFinancialRisk * 0.3 || 0).toFixed(1)}M Risk</strong>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Alignment recovers to {impactModel?.scenarios?.withIntervention?.alignment || 0}%. Strategy success rate reaches {impactModel?.scenarios?.withIntervention?.strategySuccessRate || 0}%.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Targeted Hotspot Interventions</h3>
        {hotspots.slice(0, 4).map((team) => {
          const needsEscalation = team.alignmentScore < 55 || team.driftVelocity < -2;
          
          return (
            <div className="drift-row" key={team.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', marginBottom: '12px', borderLeft: needsEscalation ? '3px solid #ff5252' : '3px solid var(--status-at-risk)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <strong>{team.name}</strong>
                  <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {team.department} · {team.quadrant.replace('-', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {needsEscalation && (
                    <span className="escalation-badge" style={{ background: 'rgba(244,67,54,0.12)', border: '1px solid rgba(244,67,54,0.35)', color: '#ff5252', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                      ⚠ ESCALATION TRIGGERED
                    </span>
                  )}
                  <span style={{ fontSize: '13px', color: getStatusStyles(team.alignmentScore).color }}>{team.alignmentScore}% aligned</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{team.weeksToCritical ? `${team.weeksToCritical} wks to critical` : 'Stable'}</span>
                  <button
                    className="apply-btn"
                    disabled={correctingTeamId === team.id}
                    onClick={() => onAutoCorrect?.(team.id)}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    {correctingTeamId === team.id ? 'Correcting…' : 'Auto-correct'}
                  </button>
                </div>
              </div>
              
              {/* Micro-correction nudge helper */}
              <div className="micro-correction-nudge" style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                💡 <strong>Targeted correction:</strong> {getMicroCorrectionNudge(team.name)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="scenario-lab" aria-label="Employee understanding simulation" style={{ marginTop: '20px' }}>
        <div>
          <strong>Understanding Scenario Lab</strong>
          <span>Test how role-targeted communication changes execution risk.</span>
        </div>
        <div className="scenario-controls">
          <select value={teamId} onChange={(event) => setTeamId(event.target.value)} aria-label="Team to simulate">
            {(teams ?? []).map((team) => <option key={team.id || team._id} value={team.id || team._id}>{team.name}</option>)}
          </select>
          <label>
            Informed: {informedPercent}%
            <input type="range" min="0" max="100" value={informedPercent} onChange={(event) => setInformedPercent(Number(event.target.value))} />
          </label>
          <button className="apply-btn" disabled={!teamId || simulating} onClick={() => onSimulate?.(teamId, informedPercent)}>
            {simulating ? 'Simulating…' : 'Model impact'}
          </button>
        </div>
        {simulation && (
          <p className="scenario-result" style={{ background: 'rgba(0,198,255,0.05)', border: '1px solid rgba(0,198,255,0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '12px' }}>
            📊 <strong>Simulated Alignment:</strong> {simulation.simulatedAlignment}% alignment · <strong>Exec Probability:</strong> {simulation.executionProbability}% · <strong>Risk:</strong> ${simulation.financialRisk}M. {simulation.interpretation}
          </p>
        )}
      </div>

    </section>
  );
};

DriftIntelligence.propTypes = {
  driftData: PropTypes.shape({
    hotspots: PropTypes.array,
    summary: PropTypes.object,
  }),
  impactModel: PropTypes.shape({ scenarios: PropTypes.object }),
  onAutoCorrect: PropTypes.func,
  correctingTeamId: PropTypes.string,
  teams: PropTypes.array,
  simulation: PropTypes.object,
  simulating: PropTypes.bool,
  onSimulate: PropTypes.func,
};

DriftIntelligence.defaultProps = {
  driftData: null,
  impactModel: null,
  onAutoCorrect: undefined,
  correctingTeamId: null,
  teams: [],
  simulation: null,
  simulating: false,
  onSimulate: undefined,
};

export default DriftIntelligence;
