import axios from 'axios';

/**
 * API service for communicating with the Silosoft Card Game backend
 * Handles all HTTP requests with proper error handling and validation
 */
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.apiClient = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(this.formatError(error));
      },
    );
  }

  /**
   * Format API errors into consistent structure
   * @param {Error} error - Axios error object
   * @returns {Object} Formatted error
   */
  formatError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        message: error.response.data?.message || error.response.data?.error || 'Server error',
        code: error.response.data?.code || 'SERVER_ERROR',
        data: error.response.data,
      };
    } else if (error.request) {
      // Network error
      return {
        status: 0,
        message: 'Network error - unable to connect to server',
        code: 'NETWORK_ERROR',
        data: null,
      };
    } else {
      // Client error
      return {
        status: 0,
        message: error.message || 'Unknown error occurred',
        code: 'CLIENT_ERROR',
        data: null,
      };
    }
  }

  /**
   * Create a new game session
   * @param {string[]} playerNames - Array of player names (2-4 players)
   * @returns {Promise<Object>} Game state object
   */
  async createGame(playerNames) {
    if (!Array.isArray(playerNames) || playerNames.length < 2 || playerNames.length > 4) {
      throw new Error('Player names must be an array of 2-4 names');
    }

    const response = await this.apiClient.post('/games', {
      playerNames,
    });

    return response.data;
  }

  /**
   * Get current game state
   * @param {string} gameId - Game session ID
   * @returns {Promise<Object>} Game state object
   */
  async getGameState(gameId, { includeJoinCodes = false } = {}) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const query = includeJoinCodes ? '?includeJoinCodes=true' : '';
    const response = await this.apiClient.get(`/games/${gameId}${query}`);
    return response.data;
  }

  /**
   * Draw a card from the deck
   * @param {string} gameId - Game session ID
   * @param {string} playerId - Player ID drawing the card
   * @returns {Promise<Object>} Response with card and updated game state
   */
  async drawCard(gameId, playerId, playerToken) {
    if (!gameId || !playerId || !playerToken) {
      throw new Error('Game ID, Player ID, and Player Token are required');
    }

    const response = await this.apiClient.post(`/games/${gameId}/actions/draw`, {
      playerId,
      playerToken,
    });

    return response.data;
  }

  /**
   * Assign a resource card to a feature card
   * @param {string} gameId - Game session ID
   * @param {string} playerId - Player ID making the assignment
   * @param {string} resourceId - Resource card ID to assign
   * @param {string} featureId - Feature card ID to assign to
   * @returns {Promise<Object>} Response with assignment result and updated game state
   */
  async assignResource(gameId, playerId, resourceId, featureId, playerToken) {
    if (!gameId || !playerId || !resourceId || !featureId || !playerToken) {
      throw new Error('Game ID, Player ID, Resource ID, Feature ID, and Player Token are all required');
    }

    const response = await this.apiClient.post(`/games/${gameId}/actions/assign`, {
      playerId,
      resourceId,
      featureId,
      playerToken,
    });

    return response.data;
  }

  /**
   * End the current player's turn
   * @param {string} gameId - Game session ID
   * @param {string} playerId - Player ID ending their turn
   * @returns {Promise<Object>} Updated game state
   */
  async endTurn(gameId, playerId, playerToken) {
    if (!gameId || !playerId || !playerToken) {
      throw new Error('Game ID, Player ID, and Player Token are required');
    }

    const response = await this.apiClient.post(`/games/${gameId}/actions/end-turn`, {
      playerId,
      playerToken,
    });

    return response.data;
  }

  async initiateTrade(gameId, playerId, targetPlayerId, offeredCardId, playerToken) {
    if (!gameId || !playerId || !targetPlayerId || !offeredCardId || !playerToken) {
      throw new Error('All parameters are required to initiate trade');
    }
    const response = await this.apiClient.post(`/games/${gameId}/actions/trade/initiate`, {
      playerId,
      targetPlayerId,
      offeredCardId,
      playerToken,
    });
    return response.data;
  }

  async completeTrade(gameId, playerId, counterCardId, playerToken) {
    if (!gameId || !playerId || !counterCardId || !playerToken) {
      throw new Error('All parameters are required to complete trade');
    }
    const response = await this.apiClient.post(`/games/${gameId}/actions/trade/complete`, {
      playerId,
      counterCardId,
      playerToken,
    });
    return response.data;
  }

  async joinGame(gameId, { joinCode, playerId, playerToken, includeJoinCodes = false } = {}) {
    if (!gameId) {
      throw new Error('Game ID is required to join');
    }

    if ((!joinCode || joinCode.trim().length === 0) && !playerToken) {
      throw new Error('Join code or player token is required to join a game');
    }

    const response = await this.apiClient.post(`/games/${gameId}/join`, {
      joinCode,
      playerId,
      playerToken,
      includeJoinCodes,
    });

    return response.data;
  }

  async setPlayerReady(gameId, playerId, playerToken, isReady = true, { includeJoinCodes = false } = {}) {
    if (!gameId || !playerId || !playerToken) {
      throw new Error('Game ID, Player ID, and Player Token are required');
    }

    const response = await this.apiClient.post(`/games/${gameId}/ready`, {
      playerId,
      playerToken,
      isReady,
      includeJoinCodes,
    });

    return response.data;
  }

  async startGame(gameId, playerId, playerToken, { includeJoinCodes = false } = {}) {
    if (!gameId || !playerId || !playerToken) {
      throw new Error('Game ID, Player ID, and Player Token are required');
    }

    const response = await this.apiClient.post(`/games/${gameId}/start`, {
      playerId,
      playerToken,
      includeJoinCodes,
    });

    return response.data;
  }

  /**
   * Health check endpoint to verify API connectivity
   * @returns {Promise<boolean>} True if API is accessible
   */
  async healthCheck() {
    try {
      // Try to make a simple request to check connectivity
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn('API health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

// Named exports for testing
export { ApiService };
