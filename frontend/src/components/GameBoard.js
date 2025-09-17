import React, { memo, useEffect, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useGame } from '../context/GameContext';
import Card from './Card';
import FeatureDisplay from './FeatureDisplay';
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
    // Actions
    drawCard,
    assignResource,
    endTurn,
    clearError,
  } = useGame();

  const [showAllHands, setShowAllHands] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Auto-select current player when it changes
  useEffect(() => {
    if (myPlayer && !selectedPlayer) {
      setSelectedPlayer(myPlayer.id);
    }
  }, [myPlayer, selectedPlayer]);

  // Handle drag end for resource assignment
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside of a droppable area
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Only handle resource to feature assignments
    if (destination.droppableId.startsWith('feature-')) {
      const featureId = destination.droppableId.replace('feature-', '');
      const resourceId = draggableId;

      try {
        await assignResource(resourceId, featureId);
      } catch (error) {
        console.error('Failed to assign resource:', error);
        // Error is handled by the context
      }
    }
  };

  // Handle draw card action
  const handleDrawCard = async () => {
    if (!isMyTurn || loading) return;

    try {
      await drawCard();
    } catch (error) {
      console.error('Failed to draw card:', error);
    }
  };

  // Handle end turn action
  const handleEndTurn = async () => {
    if (!isMyTurn || loading) return;

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
      ? players.find(p => p.id === selectedPlayer)
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
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`player-card ${
              currentPlayer?.id === player.id ? 'current-player' : ''
            } ${myPlayer?.id === player.id ? 'my-player' : ''}`}
          >
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-score">{player.score} points</div>
              <div className="player-hand-size">{player.hand?.length || 0} cards</div>
            </div>

            {player.temporarilyUnavailable?.length > 0 && (
              <div className="unavailable-resources">
                <div className="unavailable-label">Unavailable:</div>
                <div className="unavailable-count">
                  {player.temporarilyUnavailable.length} resources
                </div>
              </div>
            )}

            <button
              className={`view-hand-button ${
                selectedPlayer === player.id ? 'selected' : ''
              }`}
              onClick={() => setSelectedPlayer(
                selectedPlayer === player.id ? null : player.id
              )}
            >
              {selectedPlayer === player.id ? 'Hide Hand' : 'View Hand'}
            </button>
          </div>
        ))}
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
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="player-hands">
          {displayedPlayers.map((player) => (
            <div key={player.id} className="player-hand-section">
              <div className="hand-header">
                <h4 className="hand-title">
                  {player.name}'s Hand ({player.hand?.length || 0} cards)
                  {myPlayer?.id === player.id && <span className="my-hand-badge">You</span>}
                </h4>
              </div>

              <Droppable droppableId={`hand-${player.id}`} direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`hand-container ${
                      snapshot.isDraggingOver ? 'hand-drag-over' : ''
                    }`}
                  >
                    {player.hand && player.hand.length > 0 ? (
                      player.hand.map((card, index) => (
                        <Card
                          key={card.id}
                          card={card}
                          index={index}
                          isDraggable={
                            isMyTurn &&
                            myPlayer?.id === player.id &&
                            card.cardType === 'resource' &&
                            !card.unavailableUntil
                          }
                          isInHand={true}
                          isUnavailable={!!card.unavailableUntil}
                          size="normal"
                        />
                      ))
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
      </DragDropContext>
    );
  };

  // Render error message
  const renderError = () => {
    if (!error) return null;

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
    </div>
  );
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;