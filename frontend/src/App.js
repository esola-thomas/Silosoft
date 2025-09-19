import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { GameProvider, useGame } from './context/GameContext';
import GameBoard from './components/GameBoard';
import './App.css';

/**
 * Game Setup Component - Handles initial game configuration
 */
function GameSetup() {
  const { createGame, loading, error } = useGame();
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [errors, setErrors] = useState([]);

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

  return (
    <div className="game-setup">
      <div className="setup-container">
        <h1 className="game-title">
          <span className="title-icon">🎮</span>
          Silosoft Digital Card Game
        </h1>

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
      </div>
    </div>
  );
}

/**
 * Game Session Component - Wraps the active game with drag and drop
 */
function GameSession() {
  const { assignResource, error, myPlayer, featuresInPlay } = useGame();

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    // Debug logging to track drag operations
    console.log('Drag result:', {
      destination,
      source,
      draggableId,
      type,
      destinationId: destination?.droppableId,
      sourceId: source?.droppableId
    });

    // No destination or same position
    if (!destination ||
        (destination.droppableId === source.droppableId &&
         destination.index === source.index)) {
      console.log('Drag cancelled: no destination or same position');
      return;
    }

    // Only handle resource to feature assignments
    if (type !== 'RESOURCE' || !destination.droppableId.startsWith('feature-')) {
      console.log('Drag rejected: type mismatch or not dropping on feature', {
        type,
        expectedType: 'RESOURCE',
        destinationStartsWithFeature: destination.droppableId.startsWith('feature-'),
        destinationId: destination.droppableId
      });
      return;
    }

    // Validate that the source is a player hand
    if (!source.droppableId.startsWith('hand-')) {
      console.log('Drag rejected: source is not a player hand', {
        sourceId: source.droppableId,
        sourceStartsWithHand: source.droppableId.startsWith('hand-')
      });
      return;
    }

    try {
      const featureId = destination.droppableId.replace('feature-', '');
      const resourceId = draggableId;

      // Find the resource card being dragged
      const draggedResource = myPlayer?.hand?.find((card) => card.id === resourceId);

      // Find the target feature
      const targetFeature = featuresInPlay?.find((feature) => feature.id === featureId);

      if (!draggedResource || !targetFeature) {
        console.warn('Invalid drag operation: resource or feature not found');
        return;
      }

      // Basic client-side validation for better UX
      if (draggedResource.cardType !== 'resource') {
        console.warn('Only resource cards can be assigned to features');
        return;
      }

      if (targetFeature.isComplete || targetFeature.completed) {
        console.warn('Cannot assign resources to completed features');
        return;
      }

      // Log assignment attempt for debugging
      console.log('Attempting to assign resource:', {
        resourceId,
        featureId,
        resourceRole: draggedResource.role,
        resourceLevel: draggedResource.level,
        featureRequirements: targetFeature.requirements,
        source: source.droppableId,
        destination: destination.droppableId,
      });

      await assignResource(resourceId, featureId);
      console.log('Resource assignment successful');
    } catch (err) {
      console.error('Failed to assign resource:', err);
    }
  };

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