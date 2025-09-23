import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { GameProvider, useGame } from './context/GameContext';
import GameBoard from './components/GameBoard';
import GameLobby from './components/GameLobby';
import './App.css';

/**
 * Game Setup Component - Handles initial game configuration
 */
function GameSetup() {
  const { createGame, joinGame, loading, error } = useGame();
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [errors, setErrors] = useState([]);
  const [joinGameId, setJoinGameId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState(null);

  const addPlayer = () => {
    if (playerNames.length < 4) {
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (index) => {
    if (playerNames.length > 2) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
    }
  };

  const updatePlayerName = (index, name) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);

    // Clear errors when user types
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateAndCreateGame = async () => {
    const validationErrors = [];

    // Validate player names
    const trimmedNames = playerNames.map((name) => name.trim());

    trimmedNames.forEach((name, index) => {
      if (!name) {
        validationErrors.push(`Player ${index + 1} name is required`);
      } else if (name.length < 2) {
        validationErrors.push(`Player ${index + 1} name must be at least 2 characters`);
      } else if (name.length > 20) {
        validationErrors.push(`Player ${index + 1} name must be 20 characters or less`);
      }
    });

    // Check for duplicate names
    const uniqueNames = new Set(trimmedNames);
    if (uniqueNames.size !== trimmedNames.length) {
      validationErrors.push('Player names must be unique');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createGame(trimmedNames);
    } catch (err) {
      console.error('Failed to create game:', err);
    }
  };

  const handleJoinGame = async () => {
    const trimmedGameId = joinGameId.trim();
    const trimmedJoinCode = joinCode.trim();

    if (!trimmedGameId || !trimmedJoinCode) {
      setJoinError('Game ID and join code are required');
      return;
    }

    setJoinError(null);

    try {
      await joinGame({
        gameId: trimmedGameId,
        joinCode: trimmedJoinCode,
        includeJoinCodes: true,
      });
    } catch (err) {
      const message = err?.message || 'Unable to join the game. Please verify the details and try again.';
      setJoinError(message);
    }
  };

  return (
    <div className="game-setup">
      <div className="setup-container">
        <h1 className="game-title">
          <span className="title-icon">🎮</span>
          Silosoft Digital Card Game
        </h1>

        <div className="setup-grid">
          <div className="setup-card">
            <h2>Setup New Game</h2>
            <p className="setup-description">
              Create a new cooperative card game session. Work together to complete all features before time runs out!
            </p>

            <div className="players-section">
              <h3>Players ({playerNames.length}/4)</h3>

              {playerNames.map((name, index) => (
                <div key={index} className="player-input-group">
                  <label htmlFor={`player-${index}`}>
                    Player {index + 1}:
                  </label>
                  <div className="input-with-action">
                    <input
                      id={`player-${index}`}
                      type="text"
                      value={name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      placeholder={`Enter player ${index + 1} name`}
                      maxLength={20}
                      className={errors.some((err) => err.includes(`Player ${index + 1}`)) ? 'error' : ''}
                    />
                    {playerNames.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        className="btn-remove-player"
                        title={`Remove player ${index + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {playerNames.length < 4 && (
                <button
                  type="button"
                  onClick={addPlayer}
                  className="btn-add-player"
                >
                  ➕ Add Player
                </button>
              )}
            </div>

            {errors.length > 0 && (
              <div className="error-list">
                {errors.map((error, index) => (
                  <div key={index} className="error-message">
                    ⚠️ {error}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <div className="setup-actions">
              <button
                onClick={validateAndCreateGame}
                disabled={loading || playerNames.length < 2}
                className="btn-create-game"
              >
                {loading ? (
                  <>
                    <span className="spinner">⏳</span>
                    Creating Game...
                  </>
                ) : (
                  'Start Game'
                )}
              </button>
            </div>

            <div className="game-info">
              <h4>Game Rules:</h4>
              <ul>
                <li>🎯 <strong>Goal:</strong> Complete all features within 10 rounds</li>
                <li>🃏 <strong>Turns:</strong> Draw cards and assign resources to features</li>
                <li>⚡ <strong>HR Events:</strong> Watch out for disruptions!</li>
                <li>🏆 <strong>Scoring:</strong> Earn points by completing features (3, 5, or 8 points)</li>
                <li>🤝 <strong>Cooperation:</strong> Work together to manage resources efficiently</li>
              </ul>
            </div>
          </div>

          <div className="join-card">
            <h2>Join Existing Game</h2>
            <p className="join-description">
              Have a game code from your teammate? Enter it here to join the lobby.
            </p>

            <div className="join-form">
              <label htmlFor="join-game-id">Game ID</label>
              <input
                id="join-game-id"
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                placeholder="e.g. 123e4567"
                disabled={loading}
              />

              <label htmlFor="join-code">Join Code</label>
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="6-character code"
                maxLength={6}
                disabled={loading}
              />
            </div>

            {joinError && (
              <div className="error-message join-error">❌ {joinError}</div>
            )}

            {error && (
              <div className="error-message join-error">❌ {error}</div>
            )}

            <div className="join-actions">
              <button
                onClick={handleJoinGame}
                disabled={loading}
                className="btn-join-game"
              >
                {loading ? (
                  <>
                    <span className="spinner">⏳</span>
                    Joining...
                  </>
                ) : (
                  'Join Game'
                )}
              </button>
            </div>

            <div className="join-help">
              <p>
                Ask the host to share the lobby join codes. You can also reuse this form to switch devices or rejoin if you refresh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Game Session Component - Wraps the active game with drag and drop
 */
function GameSession() {
  const {
    assignResource,
    error,
    myPlayer,
    featuresInPlay,
    gamePhase,
    playerToken,
    tradeState,
    initiateTrade,
    completeTrade,
  } = useGame();

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (gamePhase !== 'playing' || !playerToken) {
      return;
    }

    if (!destination ||
        (destination.droppableId === source.droppableId &&
         destination.index === source.index)) {
      return;
    }

    if (type !== 'RESOURCE') {
      return;
    }

    const isHandSource = source.droppableId.startsWith('hand-');
    const isHandDest = destination.droppableId.startsWith('hand-');
    const isFeatureDest = destination.droppableId.startsWith('feature-');

    // Hand to feature assignment (existing behavior)
    if (isHandSource && isFeatureDest) {
      try {
        const featureId = destination.droppableId.replace('feature-', '');
        const resourceId = draggableId;
        const draggedResource = myPlayer?.hand?.find((card) => card.id === resourceId);
        const targetFeature = featuresInPlay?.find((feature) => feature.id === featureId);
        if (!draggedResource || !targetFeature) return;
        if (draggedResource.cardType !== 'resource') return;
        if (targetFeature.isComplete || targetFeature.completed) return;
        await assignResource(resourceId, featureId);
      } catch (err) {
        console.error('Failed to assign resource:', err);
      }
      return;
    }

    // Hand to hand trading logic
    if (isHandSource && isHandDest) {
      const sourcePlayerId = source.droppableId.replace('hand-', '');
      const destPlayerId = destination.droppableId.replace('hand-', '');
      const resourceId = draggableId;

      // Only consider if source is my hand
      if (myPlayer?.id !== sourcePlayerId) return;

      // Initiate trade: my card dragged onto another player's hand
      if (destPlayerId !== sourcePlayerId && !tradeState) {
        try {
          await initiateTrade(destPlayerId, resourceId);
        } catch (err) {
          console.error('Failed to initiate trade:', err);
        }
        return;
      }

      // Complete trade: I'm the target responding with my card
      if (tradeState &&
          tradeState.status === 'pending_counter' &&
          tradeState.target === myPlayer?.id &&
          destPlayerId === tradeState.initiator) {
        try {
          await completeTrade(resourceId);
        } catch (err) {
          console.error('Failed to complete trade:', err);
        }
        return;
      }
    }
  };

  if (gamePhase === 'lobby') {
    return (
      <div className="game-session">
        {error && (
          <div className="game-error">
            ❌ {error}
          </div>
        )}
        <GameLobby />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="game-session">
        {error && (
          <div className="game-error">
            ❌ {error}
          </div>
        )}
        <GameBoard />
      </div>
    </DragDropContext>
  );
}

/**
 * Main App Component - Handles routing between setup and game
 */
function AppContent() {
  const { gameState, loading } = useGame();

  // Show loading screen
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <h2>Loading Game...</h2>
          <p>Setting up your game session</p>
        </div>
      </div>
    );
  }

  // Show game session if game exists
  if (gameState) {
    return <GameSession />;
  }

  // Show game setup
  return <GameSetup />;
}

/**
 * App Root Component - Provides game context and error boundary
 */
function App() {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      setErrorInfo('An unexpected error occurred. Please refresh the page.');
      setHasError(true);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="app-error">
        <div className="error-container">
          <h1>🚨 Something went wrong</h1>
          <p>{errorInfo || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorInfo(null);
              window.location.reload();
            }}
            className="btn-reload"
          >
            🔄 Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <GameProvider>
        <AppContent />
      </GameProvider>
    </div>
  );
}

export default App;
