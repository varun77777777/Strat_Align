import React from 'react';
import PropTypes from 'prop-types';

const MessageDegradationFlow = ({ degradationPath = [] }) => {
  if (!degradationPath || degradationPath.length === 0) return null;

  return (
    <div className="message-degradation-flow-container">
      <h4 className="section-small-title" style={{ color: '#00c6ff', marginBottom: '12px' }}>
        Strategic Message Corruption Pathway
      </h4>
      <div className="degradation-flow-wrapper">
        {degradationPath.map((step, idx) => {
          const score = step.degradationScore || 0;
          const color = score >= 70 ? 'var(--status-critical)' : score >= 40 ? 'var(--status-at-risk)' : 'var(--status-good)';
          const bg = score >= 70 ? 'rgba(244,67,54,0.06)' : score >= 40 ? 'rgba(255,193,7,0.06)' : 'rgba(76,175,80,0.06)';

          return (
            <div key={idx} className="degradation-flow-step" style={{ background: bg, borderLeft: `4px solid ${color}` }}>
              <div className="degradation-step-meta">
                <span className="level-badge" style={{ background: color }}>Level {step.level}</span>
                <span className="role">{step.role}</span>
                <span className="score" style={{ color }}>{score}% degraded</span>
              </div>
              <div className="degradation-message-comparison">
                {idx > 0 && (
                  <div className="original">
                    <span className="label">Sent:</span>
                    <span className="text">"{step.originalMessage}"</span>
                  </div>
                )}
                <div className="received">
                  <span className="label">{idx === 0 ? 'Original Strategy:' : 'Understood as:'}</span>
                  <span className="text" style={{ fontStyle: idx > 0 ? 'italic' : 'normal', fontWeight: idx === 0 ? '600' : 'normal' }}>
                    "{step.receivedMessage}"
                  </span>
                </div>
              </div>
              {idx < degradationPath.length - 1 && (
                <div className="degradation-arrow-connector" style={{ color }}>
                  ▼
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

MessageDegradationFlow.propTypes = {
  degradationPath: PropTypes.arrayOf(PropTypes.shape({
    level: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    originalMessage: PropTypes.string.isRequired,
    receivedMessage: PropTypes.string.isRequired,
    degradationScore: PropTypes.number
  }))
};

export default MessageDegradationFlow;
