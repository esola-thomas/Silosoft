import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import apiService from '../services/ApiService';

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
  isMyTurn: false,
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

    case ACTIONS.SET_GAME_STATE:
      return {
        ...state,
        loading: false,
        error: null,
        gameId: action.payload.id,
        gameState: action.payload,
        players: action.payload.players || [],
        currentRound: action.payload.currentRound || 1,
        currentPlayerIndex: action.payload.currentPlayerIndex || 0,
        deck: action.payload.deck || [],
        featuresInPlay: action.payload.featuresInPlay || [],
        gamePhase: action.payload.gamePhase || 'setup',
        winCondition: action.payload.winCondition || false,
        isMyTurn: state.currentPlayerId && action.payload.players
          ? action.payload.players[action.payload.currentPlayerIndex]?.id === state.currentPlayerId
          : false,
      };

    case ACTIONS.UPDATE_GAME_STATE:
      const updatedState = { ...state.gameState, ...action.payload };
      return {
        ...state,
        gameState: updatedState,
        players: updatedState.players || state.players,
        currentRound: updatedState.currentRound || state.currentRound,
        currentPlayerIndex: updatedState.currentPlayerIndex !== undefined
          ? updatedState.currentPlayerIndex
          : state.currentPlayerIndex,
        deck: updatedState.deck || state.deck,
        featuresInPlay: updatedState.featuresInPlay || state.featuresInPlay,
        gamePhase: updatedState.gamePhase || state.gamePhase,
        winCondition: updatedState.winCondition !== undefined
          ? updatedState.winCondition
          : state.winCondition,
        isMyTurn: state.currentPlayerId && updatedState.players
          ? updatedState.players[updatedState.currentPlayerIndex || state.currentPlayerIndex]?.id === state.currentPlayerId
          : state.isMyTurn,
      };

    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        currentPlayerId: state.currentPlayerId, // Preserve player ID
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

      // Set current player as first player if not set
      if (!state.currentPlayerId && gameState.players?.length > 0) {
        dispatch({ type: ACTIONS.SET_CURRENT_PLAYER, payload: gameState.players[0].id });
      }

      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [state.currentPlayerId, handleError]);

  // Action: Load existing game state
  const loadGame = useCallback(async (gameId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const gameState = await apiService.getGameState(gameId);
      dispatch({ type: ACTIONS.SET_GAME_STATE, payload: gameState });

      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);

  // Action: Draw card
  const drawCard = useCallback(async () => {
    if (!state.gameId || !state.currentPlayerId) {
      handleError(new Error('Game ID and Player ID are required'));
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const result = await apiService.drawCard(state.gameId, state.currentPlayerId);

      // Update game state with the response
      if (result.gameState) {
        dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: result.gameState });
      }

      return result;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [state.gameId, state.currentPlayerId, handleError]);

  // Action: Assign resource to feature
  const assignResource = useCallback(async (resourceId, featureId) => {
    if (!state.gameId || !state.currentPlayerId) {
      handleError(new Error('Game ID and Player ID are required'));
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const result = await apiService.assignResource(
        state.gameId,
        state.currentPlayerId,
        resourceId,
        featureId
      );

      // Update game state with the response
      if (result.gameState) {
        dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: result.gameState });
      }

      return result;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [state.gameId, state.currentPlayerId, handleError]);

  // Action: End turn
  const endTurn = useCallback(async () => {
    if (!state.gameId || !state.currentPlayerId) {
      handleError(new Error('Game ID and Player ID are required'));
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const gameState = await apiService.endTurn(state.gameId, state.currentPlayerId);
      dispatch({ type: ACTIONS.UPDATE_GAME_STATE, payload: gameState });

      return gameState;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [state.gameId, state.currentPlayerId, handleError]);

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

  // Derived state
  const currentPlayer = state.players[state.currentPlayerIndex] || null;
  const myPlayer = state.players.find(p => p.id === state.currentPlayerId) || null;
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

    // Actions
    createGame,
    loadGame,
    drawCard,
    assignResource,
    endTurn,
    resetGame,
    setCurrentPlayer,
    setSelectedCard,
    setDraggedCard,
    clearError,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export default GameContext;