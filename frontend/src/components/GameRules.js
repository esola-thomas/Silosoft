import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './GameRules.css';

/**
 * GameRules component that displays comprehensive rules for Silosoft
 * in a modal overlay format with accessible design
 */
const GameRules = memo(({ isOpen, onClose }) => {
  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="game-rules-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div className="game-rules-modal">
        <div className="rules-header">
          <h2 id="rules-title" className="rules-title">
            How to Play Silosoft
          </h2>
          <button
            className="rules-close-button"
            onClick={onClose}
            aria-label="Close rules"
          >
            ✕
          </button>
        </div>

        <div className="rules-content">
          {/* Game Overview */}
          <section className="rules-section">
            <h3 className="section-title">Game Overview</h3>
            <div className="section-content">
              <p className="overview-text">
                <strong>Silosoft</strong> is a cooperative workplace simulation where 2-4 players work together
                to complete feature projects by strategically assigning team resources while navigating
                corporate disruptions like layoffs and reorganizations.
              </p>
              <div className="key-facts">
                <div className="fact-item">
                  <span className="fact-label">Players:</span> 2-4 people
                </div>
                <div className="fact-item">
                  <span className="fact-label">Time Limit:</span> 10 rounds maximum
                </div>
                <div className="fact-item">
                  <span className="fact-label">Goal:</span> Complete all features to win together
                </div>
              </div>
            </div>
          </section>

          {/* Setup */}
          <section className="rules-section">
            <h3 className="section-title">Game Setup</h3>
            <div className="section-content">
              <ol className="setup-steps">
                <li>Each player receives <strong>1 Feature Card</strong> and a pool of <strong>Resource Cards</strong></li>
                <li>Feature cards are placed in the center play area</li>
                <li>Each player keeps their resource cards in their hand</li>
                <li>The remaining deck contains more features and HR event cards</li>
              </ol>
            </div>
          </section>

          {/* How to Play */}
          <section className="rules-section">
            <h3 className="section-title">How to Play</h3>
            <div className="section-content">
              <div className="turn-sequence">
                <h4 className="subsection-title">Turn Sequence</h4>
                <ol className="turn-steps">
                  <li>
                    <strong>Draw Card:</strong> Draw one card from the deck
                    <ul>
                      <li>Feature Card: Adds a new project to complete</li>
                      <li>HR Event Card: Triggers immediate workplace disruption</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Assign Resources:</strong> Work with teammates to assign resources to features
                    <ul>
                      <li>Match resource types (Dev, PM, UX) to feature requirements</li>
                      <li>Resources can be shared between players</li>
                      <li>Complete features are removed and scored</li>
                    </ul>
                  </li>
                  <li>
                    <strong>End Turn:</strong> Pass turn to next player
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Card Types */}
          <section className="rules-section">
            <h3 className="section-title">Card Types</h3>
            <div className="section-content">
              <div className="card-types">
                <div className="card-type">
                  <h4 className="card-type-title">Feature Cards</h4>
                  <p>Project requirements that need to be completed to win.</p>
                  <ul>
                    <li>Show required resource types (Dev, PM, UX)</li>
                    <li>Specify skill levels needed (Entry +1, Junior +2, Senior +3)</li>
                    <li>Must be completed within 10 rounds</li>
                  </ul>
                </div>

                <div className="card-type">
                  <h4 className="card-type-title">Resource Cards</h4>
                  <p>Team members with different roles and skill levels.</p>
                  <ul>
                    <li><strong>Dev:</strong> Developers for technical implementation</li>
                    <li><strong>PM:</strong> Project Managers for coordination</li>
                    <li><strong>UX:</strong> User Experience designers</li>
                    <li><strong>Levels:</strong> Entry (+1), Junior (+2), Senior (+3)</li>
                    <li><strong>Contractors:</strong> Wildcard resources that can fulfill any role</li>
                  </ul>
                </div>

                <div className="card-type">
                  <h4 className="card-type-title">HR Event Cards</h4>
                  <p>Workplace disruptions that affect your team.</p>
                  <ul>
                    <li><strong>Layoffs:</strong> Remove random resources from players</li>
                    <li><strong>Reorganization:</strong> Reassign resources between teammates</li>
                    <li><strong>Contractor Hiring:</strong> Add wildcard resources</li>
                    <li><strong>PTO/PLM:</strong> Make resources temporarily unavailable</li>
                    <li><strong>Competition Deadline:</strong> Force immediate feature completion</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Resource Assignment */}
          <section className="rules-section">
            <h3 className="section-title">Resource Assignment</h3>
            <div className="section-content">
              <div className="assignment-rules">
                <h4 className="subsection-title">How Assignment Works</h4>
                <ul>
                  <li>Drag resource cards from your hand to feature requirements</li>
                  <li>Resource skill levels must meet or exceed feature requirements</li>
                  <li>Players can collaborate and share resources</li>
                  <li>Once assigned, resources are committed to that feature</li>
                  <li>Complete features when all requirements are met</li>
                </ul>

                <div className="example-box">
                  <h5 className="example-title">Example:</h5>
                  <p>
                    A feature requires &quot;Senior Dev +3&quot; and &quot;Junior PM +2&quot;. You can assign:
                  </p>
                  <ul>
                    <li>Senior Dev (+3) + Junior PM (+2) = Perfect match</li>
                    <li>Senior Dev (+3) + Senior PM (+3) = Over-qualified, but valid</li>
                    <li>Junior Dev (+2) + Junior PM (+2) = Invalid, Dev too junior</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Winning & Losing */}
          <section className="rules-section">
            <h3 className="section-title">Winning & Losing</h3>
            <div className="section-content">
              <div className="win-lose-conditions">
                <div className="win-condition">
                  <h4 className="condition-title win-title">Team Victory</h4>
                  <p>Complete <strong>all feature cards</strong> within 10 rounds</p>
                  <div className="scoring-info">
                    <h5>Scoring System:</h5>
                    <ul>
                      <li>1st Feature: 3 points</li>
                      <li>2nd Feature: 5 points</li>
                      <li>3rd+ Features: 8 points each</li>
                      <li>Bonus points for early completion</li>
                    </ul>
                  </div>
                </div>

                <div className="lose-condition">
                  <h4 className="condition-title lose-title">Team Defeat</h4>
                  <p>Fail to complete all features within 10 rounds</p>
                  <ul>
                    <li>Time runs out with incomplete features</li>
                    <li>Too many resources lost to HR events</li>
                    <li>Cannot meet competition deadlines</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Tips & Strategy */}
          <section className="rules-section">
            <h3 className="section-title">Tips & Strategy</h3>
            <div className="section-content">
              <div className="strategy-tips">
                <div className="tip-category">
                  <h4 className="tip-title">Resource Management</h4>
                  <ul>
                    <li>Save senior-level resources for complex features</li>
                    <li>Use contractors strategically as wildcards</li>
                    <li>Plan ahead for potential layoffs and disruptions</li>
                    <li>Communicate with teammates about resource allocation</li>
                  </ul>
                </div>

                <div className="tip-category">
                  <h4 className="tip-title">Team Coordination</h4>
                  <ul>
                    <li>Discuss feature priorities as a team</li>
                    <li>Share resources to optimize efficiency</li>
                    <li>Prepare backup plans for HR events</li>
                    <li>Focus on completing easier features first for momentum</li>
                  </ul>
                </div>

                <div className="tip-category">
                  <h4 className="tip-title">Risk Management</h4>
                  <ul>
                    <li>Don&apos;t put all resources on one feature</li>
                    <li>Keep some resources in hand for flexibility</li>
                    <li>Watch the round counter - time is limited!</li>
                    <li>Adapt quickly to unexpected HR events</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Reference */}
          <section className="rules-section">
            <h3 className="section-title">Quick Reference</h3>
            <div className="section-content">
              <div className="quick-ref">
                <div className="ref-column">
                  <h4 className="ref-title">Resource Levels</h4>
                  <ul className="ref-list">
                    <li>Entry: +1 skill</li>
                    <li>Junior: +2 skill</li>
                    <li>Senior: +3 skill</li>
                    <li>Contractor: Any role</li>
                  </ul>
                </div>

                <div className="ref-column">
                  <h4 className="ref-title">Turn Actions</h4>
                  <ul className="ref-list">
                    <li>1. Draw Card</li>
                    <li>2. Assign Resources</li>
                    <li>3. End Turn</li>
                  </ul>
                </div>

                <div className="ref-column">
                  <h4 className="ref-title">Game Limits</h4>
                  <ul className="ref-list">
                    <li>10 rounds maximum</li>
                    <li>2-4 players</li>
                    <li>All features must be completed</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="rules-footer">
          <button className="rules-close-button-footer" onClick={onClose}>
            Got it! Let&apos;s Play
          </button>
        </div>
      </div>
    </div>
  );
});

GameRules.displayName = 'GameRules';

GameRules.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default GameRules;