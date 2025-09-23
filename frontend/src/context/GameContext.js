import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import apiService from '../services/ApiService';

const SESSION_STORAGE_KEY = 'silosoft:playerSessions';
const isBrowser = typeof window !== 'undefined';

const readStoredSessions = () => {
  if (!isBrowser) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Failed to read stored sessions:', error);
    return {};
  }
};

const writeStoredSessions = (sessions) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.warn('Failed to persist session information:', error);
  }
};

const savePlayerSessionToStorage = (gameId, session) => {
  if (!gameId || !session) {
    return;
  }

  const sessions = readStoredSessions();
  sessions[gameId] = session;
  writeStoredSessions(sessions);
};

const removePlayerSessionFromStorage = (gameId) => {
  if (!gameId) {
    return;
  }

  const sessions = readStoredSessions();
  if (sessions[gameId]) {
    delete sessions[gameId];
    writeStoredSessions(sessions);
  }
};

const getStoredSession = (gameId) => {
  if (!gameId) {
    return null;
  }

  const sessions = readStoredSessions();
  return sessions[gameId] || null;
};

const mergePlayerLists = (existingPlayers = [], incomingPlayers = []) => {
  if (!incomingPlayers || incomingPlayers.length === 0) {
    return existingPlayers;
  }

  const existingMap = new Map(existingPlayers.map((player) => [player.id, player]));

  return incomingPlayers.map((player) => {
    const previous = existingMap.get(player.id) || {};
    return {
      ...previous,
      ...player,
    };
  });
};

/**
 * Game Context for managing global game state
 * Provides state management and actions for the Silosoft Card Game
 */

// Initial state
const initialState = {
  // Game data
  gameId: null,
  gameState: null,
  players: [],
  currentRound: 1,
  currentPlayerIndex: 0,
  deck: [],
  featuresInPlay: [],
  gamePhase: 'setup', // setup, playing, ended
  winCondition: false,

  // UI state
  loading: false,
  error: null,
  selectedCard: null,
  draggedCard: null,

  // Player-specific
  currentPlayerId: null,
  playerToken: null,
  isMyTurn: false,
<<<<<<< Updated upstream
  lastDrawnCard: null,
=======
  // Trade state
  tradeState: null,
>>>>>>> Stashed changes
};

// Action types
const ACTIONS = {
  // Game actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_GAME_STATE: 'SET_GAME_STATE',
  UPDATE_GAME_STATE: 'UPDATE_GAME_STATE',
  RESET_GAME: 'RESET_GAME',

  // UI actions
  SET_SELECTED_CARD: 'SET_SELECTED_CARD',
  SET_DRAGGED_CARD: 'SET_DRAGGED_CARD',
  SET_CURRENT_PLAYER: 'SET_CURRENT_PLAYER',
  SET_PLAYER_SESSION: 'SET_PLAYER_SESSION',
  CLEAR_PLAYER_SESSION: 'CLEAR_PLAYER_SESSION',
<<<<<<< Updated upstream
  SET_LAST_DRAWN_CARD: 'SET_LAST_DRAWN_CARD',
  CLEAR_LAST_DRAWN_CARD: 'CLEAR_LAST_DRAWN_CARD',
=======
  SET_TRADE_STATE: 'SET_TRADE_STATE',
>>>>>>> Stashed changes
};

// Reducer function
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting new loading
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ACTIONS.SET_GAME_STATE: {
      const mergedPlayers = mergePlayerLists(state.players, action.payload.players || []);
      const currentPlayerIndex = typeof action.payload.currentPlayerIndex === 'number'
        ? action.payload.currentPlayerIndex
        : state.currentPlayerIndex;
      const nextGameState = {
        ...action.payload,
        players: mergedPlayers,
      };

      return {
        ...state,
        loading: false,
        error: null,
        gameId: action.payload.id,
        gameState: nextGameState,
        players: mergedPlayers,
        currentRound: action.payload.currentRound || 1,
        currentPlayerIndex,
        deck: action.payload.deck || [],
        featuresInPlay: action.payload.featuresInPlay || [],
        gamePhase: action.payload.gamePhase || 'setup',
        winCondition: action.payload.winCondition || false,
        playerToken: state.playerToken,
        isMyTurn: state.currentPlayerId && mergedPlayers.length > 0
          ? mergedPlayers[currentPlayerIndex]?.id === state.currentPlayerId
          : false,
      };
    }

    case ACTIONS.UPDATE_GAME_STATE: {
      const existingState = state.gameState || {};
      const mergedPlayers = mergePlayerLists(existingState.players || state.players, action.payload.players || []);
      const currentPlayerIndex = typeof action.payload.currentPlayerIndex === 'number'
        ? action.payload.currentPlayerIndex
        : (typeof existingState.currentPlayerIndex === 'number'
          ? existingState.currentPlayerIndex
          : state.currentPlayerIndex);
      const nextGameState = {
        ...existingState,
        ...action.payload,
        players: mergedPlayers,
      };

      return {
        ...state,
        gameState: nextGameState,
        players: mergedPlayers,
        currentRound: action.payload.currentRound || existingState.currentRound || state.currentRound,
        currentPlayerIndex,
        deck: action.payload.deck || existingState.deck || state.deck,
        featuresInPlay: action.payload.featuresInPlay || existingState.featuresInPlay || state.featuresInPlay,
        gamePhase: action.payload.gamePhase || existingState.gamePhase || state.gamePhase,
        winCondition: action.payload.winCondition !== undefined
          ? action.payload.winCondition
          : (existingState.winCondition !== undefined ? existingState.winCondition : state.winCondition),
        isMyTurn: state.currentPlayerId && mergedPlayers.length > 0
          ? mergedPlayers[currentPlayerIndex]?.id === state.currentPlayerId
          : false,
        tradeState: action.payload.tradeState !== undefined
          ? action.payload.tradeState
          : state.tradeState,
      };
    }

    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        currentPlayerId: state.currentPlayerId,
        playerToken: state.playerToken,
      };

    case ACTIONS.SET_SELECTED_CARD:
      return {
        ...state,
        selectedCard: action.payload,
      };

    case ACTIONS.SET_DRAGGED_CARD:
      return {
        ...state,
        draggedCard: action.payload,
      };

    case ACTIONS.SET_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayerId: action.payload,
        isMyTurn: state.players.length > 0 && state.players[state.currentPlayerIndex]?.id === action.payload,
      };

    case ACTIONS.SET_PLAYER_SESSION: {
      const { playerId, playerToken } = action.payload || {};
      return {
        ...state,
        currentPlayerId: playerId,
        playerToken,
        isMyTurn: state.players.length > 0 && state.players[state.currentPlayerIndex]?.id === playerId,
      };
    }

    case ACTIONS.CLEAR_PLAYER_SESSION:
      return {
        ...state,
        currentPlayerId: null,
        playerToken: null,
        isMyTurn: false,
        selectedCard: null,
        draggedCard: null,
<<<<<<< Updated upstream
        lastDrawnCard: null,
      };

    case ACTIONS.SET_LAST_DRAWN_CARD:
      return {
        ...state,
        lastDrawnCard: action.payload,
      };

    case ACTIONS.CLEAR_LAST_DRAWN_CARD:
      return {
        ...state,
        lastDrawnCard: null,
=======
        tradeState: null,
>>>>>>> Stashed changes
      };
    case ACTIONS.SET_TRADE_STATE:
      return { ...state, tradeState: action.payload };

    default:
      return state;
  }
}

// Create context
const GameContext = createContext();

// Custom hook for using game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Game Provider component
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Helper function to handle API errors
  const handleError = useCallback((error) => {
    console.error('Game action error:', error);
    const errorMessage = error.message || 'An unexpected error occurred';
    dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
  }, []);

  // Action: Create new game
  const createGame = useCallback(async (playerNames) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const gameState = await apiService.createGame(playerNames);
      dispatch({ type: ACTIONS.SET_GAME_STATE, payload: gameState });
      dispatch({ type: ACTIONS.CLEAR_PLAYER_SESSION });
      removePlayerSessionFromStorage(gameState.id);

      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [handleError]);

  // Action: Load existing game state
  const loadGame = useCallback(async (gameId, { includeJoinCodes = false } = {}) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const gameState = await apiService.getGameState(gameId, { includeJoinCodes });
      dispatch({ type: ACTIONS.SET_GAME_STATE, payload: gameState });

      const storedSession = getStoredSession(gameId);

      if (storedSession?.playerToken) {
        try {
          const joinResult = await apiService.joinGame(gameId, {
            playerId: storedSession.playerId,
            playerToken: storedSession.playerToken,
          });

          dispatch({ type: ACTIONS.SET_GAME_STATE, payload: joinResult.gameState });
          dispatch({
            type: ACTIONS.SET_PLAYER_SESSION,
            payload: {
              playerId: joinResult.playerId,
              playerToken: joinResult.playerToken,
            },
          });

          savePlayerSessionToStorage(gameId, {
            playerId: joinResult.playerId,
            playerToken: joinResult.playerToken,
          });
        } catch (joinError) {
          console.warn('Failed to restore player session, clearing stored credentials.', joinError);
          removePlayerSessionFromStorage(gameId);
          dispatch({ type: ACTIONS.CLEAR_PLAYER_SESSION });
        }
      }

      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [handleError]);

  // Action: Draw card
  const drawCard = useCallback(async () => {
    if (!state.gameId || !state.currentPlayerId || !state.playerToken) {
      handleError(new Error('Active player session is required to draw a card'));
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const result = await apiService.drawCard(
        state.gameId,
        state.currentPlayerId,
        state.playerToken,
      );

      // Update game state with the response
      if (result.gameState) {
        dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: result.gameState });
      }

      if (result?.card) {
        dispatch({
          type: ACTIONS.SET_LAST_DRAWN_CARD,
          payload: {
            card: result.card,
            receivedAt: Date.now(),
          },
        });
      }

      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.gameId, state.currentPlayerId, state.playerToken, handleError]);

  // Action: Initiate trade
  const initiateTrade = useCallback(async (targetPlayerId, offeredCardId) => {
    if (!state.gameId || !state.currentPlayerId || !state.playerToken) {
      handleError(new Error('Active player session is required to initiate trade'));
      return null;
    }
    try {
      const result = await apiService.initiateTrade(
        state.gameId,
        state.currentPlayerId,
        targetPlayerId,
        offeredCardId,
        state.playerToken,
      );
      if (result.gameState) {
        dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: result.gameState });
      }
      if (result.gameState?.tradeState) {
        dispatch({ type: ACTIONS.SET_TRADE_STATE, payload: result.gameState.tradeState });
      }
      return result;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [state.gameId, state.currentPlayerId, state.playerToken, handleError]);

  // Action: Complete trade
  const completeTrade = useCallback(async (counterCardId) => {
    if (!state.gameId || !state.currentPlayerId || !state.playerToken) {
      handleError(new Error('Active player session is required to complete trade'));
      return null;
    }
    try {
      const result = await apiService.completeTrade(
        state.gameId,
        state.currentPlayerId,
        counterCardId,
        state.playerToken,
      );
      if (result.gameState) {
        dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: result.gameState });
      }
      if (result.gameState?.tradeState) {
        dispatch({ type: ACTIONS.SET_TRADE_STATE, payload: result.gameState.tradeState });
      }
      return result;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [state.gameId, state.currentPlayerId, state.playerToken, handleError]);

  // Effect: When trade completes, schedule auto-clear after short delay so initiator regains clean UI
  useEffect(() => {
    if (state.tradeState && state.tradeState.status === 'completed') {
      const timeout = setTimeout(() => {
        dispatch({ type: ACTIONS.SET_TRADE_STATE, payload: null });
      }, 3000); // 3s visibility window
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [state.tradeState]);

  // Action: Assign resource to feature
  const assignResource = useCallback(async (resourceId, featureId) => {
    if (!state.gameId || !state.currentPlayerId || !state.playerToken) {
      handleError(new Error('Active player session is required to assign resources'));
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const result = await apiService.assignResource(
        state.gameId,
        state.currentPlayerId,
        resourceId,
        featureId,
        state.playerToken,
      );

      // Update game state with the response
      if (result.gameState) {
        dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: result.gameState });
      }

      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.gameId, state.currentPlayerId, state.playerToken, handleError]);

  // Action: End turn
  const endTurn = useCallback(async () => {
    if (!state.gameId || !state.currentPlayerId || !state.playerToken) {
      handleError(new Error('Active player session is required to end a turn'));
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const gameState = await apiService.endTurn(
        state.gameId,
        state.currentPlayerId,
        state.playerToken,
      );
      dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: gameState });

      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.gameId, state.currentPlayerId, state.playerToken, handleError]);

  // Action: Join or reconnect to a game session
  const joinGameSession = useCallback(async ({
    gameId: targetGameId,
    joinCode,
    playerId,
    playerToken,
    includeJoinCodes = false,
  } = {}) => {
    const resolvedGameId = targetGameId || state.gameId;

    if (!resolvedGameId) {
      handleError(new Error('Game ID is required to join a session'));
      return null;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const result = await apiService.joinGame(resolvedGameId, {
        joinCode,
        playerId,
        playerToken,
        includeJoinCodes,
      });

      dispatch({ type: ACTIONS.SET_GAME_STATE, payload: result.gameState });
      dispatch({
        type: ACTIONS.SET_PLAYER_SESSION,
        payload: {
          playerId: result.playerId,
          playerToken: result.playerToken,
        },
      });

      savePlayerSessionToStorage(result.gameState.id, {
        playerId: result.playerId,
        playerToken: result.playerToken,
      });

      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.gameId, handleError]);

  // Action: Toggle ready state during lobby
  const setPlayerReadyStatus = useCallback(async (isReady = true, options = {}) => {
    if (!state.gameId || !state.currentPlayerId || !state.playerToken) {
      handleError(new Error('Active player session is required to update readiness'));
      return null;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const gameState = await apiService.setPlayerReady(
        state.gameId,
        state.currentPlayerId,
        state.playerToken,
        isReady,
        options,
      );

      dispatch({ type: ACTIONS.SET_GAME_STATE, payload: gameState });
      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.gameId, state.currentPlayerId, state.playerToken, handleError]);

  // Action: Start the game when all players are ready
  const startGameSession = useCallback(async (options = {}) => {
    if (!state.gameId || !state.currentPlayerId || !state.playerToken) {
      handleError(new Error('Active player session is required to start the game'));
      return null;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const gameState = await apiService.startGame(
        state.gameId,
        state.currentPlayerId,
        state.playerToken,
        options,
      );

      dispatch({ type: ACTIONS.SET_GAME_STATE, payload: gameState });
      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.gameId, state.currentPlayerId, state.playerToken, handleError]);

  // Action: Leave current session locally
  const leaveGameSession = useCallback(() => {
    if (state.gameId) {
      removePlayerSessionFromStorage(state.gameId);
    }
    dispatch({ type: ACTIONS.CLEAR_PLAYER_SESSION });
  }, [state.gameId]);

  const acknowledgeLastDrawnCard = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_LAST_DRAWN_CARD });
  }, []);

  // Action: Reset game
  const resetGame = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_GAME });
  }, []);

  // Action: Set current player
  const setCurrentPlayer = useCallback((playerId) => {
    dispatch({ type: ACTIONS.SET_CURRENT_PLAYER, payload: playerId });
  }, []);

  // UI Actions
  const setSelectedCard = useCallback((card) => {
    dispatch({ type: ACTIONS.SET_SELECTED_CARD, payload: card });
  }, []);

  const setDraggedCard = useCallback((card) => {
    dispatch({ type: ACTIONS.SET_DRAGGED_CARD, payload: card });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  useEffect(() => {
    if (!state.gameId || state.loading) {
      return undefined;
    }

    // We poll in these scenarios:
    // 1. Lobby phase (waiting for players)
    // 2. Playing phase when it's NOT my turn (to stay updated)
    // 3. Playing phase when a trade is pending counter (initiator waiting for target)
    const tradePending = state.tradeState && state.tradeState.status === 'pending_counter';
    const shouldPoll = state.gamePhase === 'lobby'
      || (state.gamePhase === 'playing' && (!state.isMyTurn || !state.playerToken))
      || (state.gamePhase === 'playing' && tradePending);

    if (!shouldPoll) {
      return undefined;
    }

    // Faster refresh while trade awaiting counter; otherwise existing intervals
    const pollInterval = tradePending
      ? 1500
      : (state.gamePhase === 'lobby' ? 3000 : 5000);

    const intervalId = setInterval(async () => {
      try {
        const gameState = await apiService.getGameState(state.gameId);
        dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: gameState });
      } catch (error) {
        console.warn('Failed to poll game state:', error);
      }
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [state.gameId, state.gamePhase, state.isMyTurn, state.playerToken, state.loading, state.tradeState]);

  // Derived state
  const currentPlayer = state.players[state.currentPlayerIndex] || null;
  const myPlayer = state.players.find((p) => p.id === state.currentPlayerId) || null;
  const deckSize = state.deck.length;
  const isGameActive = state.gamePhase === 'playing';
  const isGameEnded = state.gamePhase === 'ended';

  // Context value
  const contextValue = {
    // State
    ...state,
    currentPlayer,
    myPlayer,
    deckSize,
    isGameActive,
    isGameEnded,
    lastDrawnCard: state.lastDrawnCard,

    // Actions
    createGame,
    loadGame,
    drawCard,
    assignResource,
    endTurn,
    joinGame: joinGameSession,
    setPlayerReadyStatus,
    startGame: startGameSession,
    leaveGameSession,
    acknowledgeLastDrawnCard,
    resetGame,
    setCurrentPlayer,
    setSelectedCard,
    setDraggedCard,
    clearError,
    initiateTrade,
    completeTrade,
    tradeState: state.tradeState,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export default GameContext;
