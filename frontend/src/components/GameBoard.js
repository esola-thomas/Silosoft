import React, { memo, useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useGame } from '../context/GameContext';
import Card from './Card';
import FeatureDisplay from './FeatureDisplay';
import GameRules from './GameRules';
import './GameBoard.css';

/**
 * Main GameBoard component that displays the complete game state
 * including player hands, current turn indicator, and game controls
 */
const GameBoard = memo(() => {
  const {
    gameState,
    players,
    currentPlayer,
    myPlayer,
    currentRound,
    deckSize,
    featuresInPlay,
    gamePhase,
    winCondition,
    isMyTurn,
    loading,
    error,
    playerToken,
    currentPlayerId,
    lastDrawnCard,
    // Actions
    drawCard,
    endTurn,
    clearError,
    joinGame,
    leaveGameSession,
    acknowledgeLastDrawnCard,
  } = useGame();

  const [showAllHands, setShowAllHands] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [latestDraw, setLatestDraw] = useState(null);

  // Auto-select current player when it changes
  React.useEffect(() => {
    if (myPlayer && !selectedPlayer) {
      setSelectedPlayer(myPlayer.id);
    } else if (!myPlayer && !selectedPlayer && players.length > 0) {
      setSelectedPlayer(players[0].id);
    }
  }, [myPlayer, selectedPlayer, players]);

  React.useEffect(() => {
    if (lastDrawnCard?.card) {
      setLatestDraw(lastDrawnCard.card);
      setDrawModalOpen(true);
    }
  }, [lastDrawnCard]);

  const closeDrawModal = React.useCallback(() => {
    setDrawModalOpen(false);
    acknowledgeLastDrawnCard();
  }, [acknowledgeLastDrawnCard]);


  // Handle draw card action
  const handleDrawCard = async () => {
    if (!isMyTurn || loading) {
      return;
    }

    try {
      await drawCard();
    } catch (error) {
      console.error('Failed to draw card:', error);
    }
  };

  // Handle end turn action
  const handleEndTurn = async () => {
    if (!isMyTurn || loading) {
      return;
    }

    try {
      await endTurn();
    } catch (error) {
      console.error('Failed to end turn:', error);
    }
  };

  // Get player hand to display
  const getDisplayedPlayerHand = () => {
    if (showAllHands) {
      return players;
    }
    const targetPlayer = selectedPlayer
      ? players.find((p) => p.id === selectedPlayer)
      : myPlayer;
    return targetPlayer ? [targetPlayer] : [];
  };

  // Render game header with status info
  const renderGameHeader = () => (
    <div className="game-header">
      <div className="game-status">
        <div className="game-info">
          <div className="round-info">
            Round {currentRound}/10
          </div>
          <div className="deck-info">
            {deckSize} cards left
          </div>
          <div className="phase-info">
            Phase: {gamePhase}
          </div>
        </div>

        {currentPlayer && (
          <div className="current-turn">
            <div className="turn-indicator">
              Current Turn: <strong>{currentPlayer.name}</strong>
              {isMyTurn && <span className="my-turn-badge">Your Turn</span>}
            </div>
          </div>
        )}

        {winCondition && (
          <div className="win-condition">
            🎉 All features completed! Game won!
          </div>
        )}
      </div>

      {/* Game controls */}
      <div className="game-controls">
        <button
          className="control-button rules-button"
          onClick={() => setShowRules(true)}
          aria-label="Show game rules"
        >
          📋 Rules
        </button>
        {isMyTurn && gamePhase === 'playing' && (
          <>
            <button
              className="control-button draw-button"
              onClick={handleDrawCard}
              disabled={loading || deckSize === 0}
            >
              {loading ? 'Drawing...' : 'Draw Card'}
            </button>
            <button
              className="control-button end-turn-button"
              onClick={handleEndTurn}
              disabled={loading}
            >
              {loading ? 'Ending...' : 'End Turn'}
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Render player scoreboard
  const renderScoreboard = () => (
    <div className="scoreboard">
      <h3 className="scoreboard-title">Players</h3>
      <div className="player-list">
        {players.map((player) => {
          const isCurrent = currentPlayer?.id === player.id;
          const isMine = currentPlayerId === player.id;
          const canJoinSeat = !player.isConnected && Boolean(player.joinCode);

          return (
            <div
              key={player.id}
              className={`player-card ${
                isCurrent ? 'current-player' : ''
              } ${isMine ? 'my-player' : ''} ${player.isConnected ? 'player-connected' : 'player-open'}`}
            >
              <div className="player-info">
                <div className="player-name-row">
                  <span className="player-name">{player.name}</span>
                  {isMine && <span className="player-you-badge">You</span>}
                </div>
                <div className="player-score">{player.score} points</div>
                <div className="player-hand-size">{player.hand?.length || 0} cards</div>
              </div>

              <div className="player-status-row">
                <span className={`player-status-chip ${player.isConnected ? 'player-status-connected' : 'player-status-open'}`}>
                  {player.isConnected ? 'Connected' : 'Open Seat'}
                </span>
                {gamePhase === 'lobby' && (
                  <span className={`player-status-chip ${player.isReady ? 'player-status-ready' : 'player-status-not-ready'}`}>
                    {player.isReady ? 'Ready' : 'Not Ready'}
                  </span>
                )}
              </div>

              {player.joinCode && (
                <div className="player-join-code">
                  <span className="join-code-label">Join Code:</span>
                  <code>{player.joinCode}</code>
                </div>
              )}

              {player.temporarilyUnavailable?.length > 0 && (
                <div className="unavailable-resources">
                  <div className="unavailable-label">Unavailable:</div>
                  <div className="unavailable-count">
                    {player.temporarilyUnavailable.length} resources
                  </div>
                </div>
              )}

              <div className="player-actions-row">
                <button
                  className={`view-hand-button ${
                    selectedPlayer === player.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedPlayer(
                    selectedPlayer === player.id ? null : player.id,
                  )}
                >
                  {selectedPlayer === player.id ? 'Hide Hand' : 'View Hand'}
                </button>

                {isMine ? (
                  <button
                    className="seat-action-button leave-seat"
                    onClick={leaveGameSession}
                    disabled={loading}
                  >
                    Leave Seat
                  </button>
                ) : canJoinSeat ? (
                  <button
                    className="seat-action-button join-seat"
                    onClick={async () => {
                      await joinGame({ joinCode: player.joinCode, includeJoinCodes: true });
                    }}
                    disabled={loading}
                  >
                    Join Seat
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hand-controls">
        <button
          className={`toggle-hands-button ${showAllHands ? 'active' : ''}`}
          onClick={() => setShowAllHands(!showAllHands)}
        >
          {showAllHands ? 'Show Individual' : 'Show All Hands'}
        </button>
      </div>
    </div>
  );

  const renderSpectatorNotice = () => {
    if (playerToken) {
      return null;
    }

    return (
      <div className="spectator-notice">
        You are currently spectating. Join an open seat to take turns with the team.
      </div>
    );
  };

  const renderRequirementsList = (requirements = {}) => {
    const items = Object.entries(requirements)
      .filter(([, value]) => value && value > 0)
      .map(([role, value]) => (
        <li key={role}>
          <span className={`req-badge req-${role}`}>{role.toUpperCase()}</span> {value}
        </li>
      ));

    if (items.length === 0) {
      return <li>No specific requirements</li>;
    }

    return items;
  };

  const renderEventEffectList = (effect = {}) => {
    return Object.entries(effect).map(([key, value]) => (
      <li key={key}>
        <span className="effect-key">{key}</span>: <span className="effect-value">{String(value)}</span>
      </li>
    ));
  };

  const renderDrawModal = () => {
    if (!drawModalOpen || !latestDraw) {
      return null;
    }

    const card = latestDraw;
    const cardTypeLabel = (card.cardType || card.type || 'card').toUpperCase();

    return (
      <div className="draw-modal-overlay" role="dialog" aria-modal="true" aria-label="Card drawn">
        <div className={`draw-modal draw-type-${card.cardType || card.type || 'unknown'}`}>
          <div className="draw-modal-header">
            <div>
              <span className="draw-modal-label">Card Drawn</span>
              <h3 className="draw-modal-title">{card.name || card.role || card.id}</h3>
              <span className="draw-modal-type">{cardTypeLabel}</span>
            </div>
            <button className="draw-modal-close" onClick={closeDrawModal} aria-label="Close card details">
              ✕
            </button>
          </div>

          <div className="draw-modal-content">
            {card.cardType === 'feature' && (
              <>
                <p className="draw-modal-subtext">Worth {card.points} points</p>
                {card.description && <p className="draw-modal-description">{card.description}</p>}
                <h4>Requirements</h4>
                <ul className="draw-modal-list">
                  {renderRequirementsList(card.requirements)}
                </ul>
              </>
            )}

            {card.cardType === 'resource' && (
              <>
                <p className="draw-modal-subtext">
                  {card.role?.toUpperCase()} &bull; {card.level?.toUpperCase()} &bull; Value {card.value}
                </p>
                {card.unavailableUntil && (
                  <p className="draw-modal-warning">Unavailable until round {card.unavailableUntil}</p>
                )}
              </>
            )}

            {card.cardType === 'event' && (
              <>
                {card.description && <p className="draw-modal-description">{card.description}</p>}
                <h4>Effect</h4>
                <ul className="draw-modal-list">
                  {renderEventEffectList(card.effect)}
                </ul>
                <p className="draw-modal-info">This event resolves immediately.</p>
              </>
            )}

            {!['feature', 'resource', 'event'].includes(card.cardType) && (
              <p className="draw-modal-description">
                {card.description || 'This card has been added to your hand.'}
              </p>
            )}
          </div>

          <div className="draw-modal-actions">
            <button className="draw-modal-close-button" onClick={closeDrawModal}>
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render player hands
  const renderPlayerHands = () => {
    const displayedPlayers = getDisplayedPlayerHand();

    if (displayedPlayers.length === 0) {
      return (
        <div className="no-hand-selected">
          Select a player to view their hand
        </div>
      );
    }

    return (
      <div className="player-hands">
        {displayedPlayers.map((player) => (
          <div key={player.id} className="player-hand-section">
            <div className="hand-header">
              <h4 className="hand-title">
                {player.name}&apos;s Hand ({player.hand?.length || 0} cards)
                {myPlayer?.id === player.id && <span className="my-hand-badge">You</span>}
              </h4>
            </div>

            <Droppable droppableId={`hand-${player.id}`} direction="horizontal" type="RESOURCE">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`hand-container ${
                    snapshot.isDraggingOver ? 'hand-drag-over' : ''
                  }`}
                >
                  {player.hand && player.hand.length > 0 ? (
                    player.hand.map((card, index) => {
                      const isDraggableCondition = isMyTurn &&
                        myPlayer?.id === player.id &&
                        card.cardType === 'resource' &&
                        !card.unavailableUntil;

                      return (
                        <Card
                          key={card.id}
                          card={card}
                          index={index}
                          isDraggable={isDraggableCondition}
                          isInHand={true}
                          isUnavailable={!!card.unavailableUntil}
                          size="normal"
                        />
                      );
                    })
                  ) : (
                    <div className="empty-hand">No cards in hand</div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Show temporarily unavailable resources */}
            {player.temporarilyUnavailable?.length > 0 && (
              <div className="unavailable-section">
                <h5 className="unavailable-title">Temporarily Unavailable</h5>
                <div className="unavailable-cards">
                  {player.temporarilyUnavailable.map((resource, index) => (
                    <Card
                      key={resource.id || index}
                      card={resource}
                      size="small"
                      isDraggable={false}
                      isUnavailable={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render error message
  const renderError = () => {
    if (!error) {
      return null;
    }

    return (
      <div className="game-error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-dismiss" onClick={clearError}>
            ✕
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !gameState) {
    return (
      <div className="game-board game-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div className="loading-text">Loading game...</div>
        </div>
      </div>
    );
  }

  // No game state
  if (!gameState) {
    return (
      <div className="game-board game-empty">
        <div className="empty-game">
          <div className="empty-icon">🎮</div>
          <div className="empty-message">No game in progress</div>
          <div className="empty-description">
            Create a new game to start playing
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-board">
      {renderError()}
      {renderGameHeader()}

      <div className="game-content">
        {/* Left column: Scoreboard and controls */}
        <div className="game-sidebar">
          {renderSpectatorNotice()}
          {renderScoreboard()}
        </div>

        {/* Center column: Features in play */}
        <div className="game-main">
          <FeatureDisplay
            features={featuresInPlay}
            showAssignmentZones={true}
            interactive={true}
            layout="grid"
          />
        </div>
      </div>

      {/* Player hands section */}
      <div className="game-hands">
        {renderPlayerHands()}
      </div>

      {/* Game Rules Modal */}
      <GameRules
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />

      {renderDrawModal()}
    </div>
  );
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;
