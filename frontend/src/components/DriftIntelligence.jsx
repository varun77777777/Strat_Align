import PropTypes from 'prop-types';

const DriftIntelligence = ({ driftData, impactModel, onAutoCorrect, correctingTeamId }) => {
  const hotspots = driftData?.hotspots ?? [];
  const summary = driftData?.summary;
  const current = impactModel?.scenarios?.current;
  const corrected = impactModel?.scenarios?.withIntervention;

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
};

DriftIntelligence.defaultProps = {
  driftData: null,
  impactModel: null,
  onAutoCorrect: undefined,
  correctingTeamId: null,
};

export default DriftIntelligence;
