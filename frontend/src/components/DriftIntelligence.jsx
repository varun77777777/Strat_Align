import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

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
        <div><span>Drift hotspots</span><strong>{summary?.hotspotCount ?? 0} / {summary?.totalTeams ?? 0}</strong></div>
        <div><span>Financial risk</span><strong>${summary?.totalFinancialRisk ?? 0}M</strong></div>
        <div><span>Execution probability</span><strong>{current?.executionSuccess ?? 0}%</strong></div>
        <div><span>With correction</span><strong className="drift-positive">{corrected?.executionSuccess ?? 0}%</strong></div>
      </div>

      {hotspots.slice(0, 4).map((team) => (
        <div className="drift-row" key={team.id}>
          <div>
            <strong>{team.name}</strong>
            <span>{team.department} · {team.quadrant.replace('-', ' ')}</span>
          </div>
          <div className="drift-metrics">
            <span>{team.alignmentScore}% aligned</span>
            <span>{team.weeksToCritical} weeks to critical</span>
            <button
              className="apply-btn"
              disabled={correctingTeamId === team.id}
              onClick={() => onAutoCorrect?.(team.id)}
            >
              {correctingTeamId === team.id ? 'Correcting…' : 'Auto-correct'}
            </button>
          </div>
        </div>
      ))}

      <div className="scenario-lab" aria-label="Employee understanding simulation">
        <div>
          <strong>Understanding scenario lab</strong>
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
          <p className="scenario-result">
            {simulation.simulatedAlignment}% alignment · {simulation.executionProbability}% execution probability · ${simulation.financialRisk}M at risk. {simulation.interpretation}
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
