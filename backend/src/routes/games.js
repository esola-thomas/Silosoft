const express = require('express');
const gameEngine = require('../services/GameEngineInstance');
const { serializeGameState } = require('../utils/serializeGameState');
const router = express.Router();

const sessionErrorMessages = new Set([
  'Invalid player session',
  'Player session does not match the requested player',
  'Player ID and session token are required',
]);

const conflictErrorMessages = new Set([
  'Game has not started yet',
  'All players must join before starting the game',
  'All players must be ready to start the game',
  'Game is over',
  'Not your turn',
]);

function handleGameError(res, error) {
  console.error('Game route error:', error);
  const message = error.message || 'Unexpected error';

  if (sessionErrorMessages.has(message)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message,
    });
  }

  if (message.includes('not found') || message === 'Invalid join code') {
    return res.status(404).json({
      error: 'Not Found',
      message,
    });
  }

  if (conflictErrorMessages.has(message)) {
    return res.status(409).json({
      error: 'Conflict',
      message,
    });
  }

  if (message.includes('required')) {
    return res.status(400).json({
      error: 'Bad Request',
      message,
    });
  }

  return res.status(500).json({
    error: 'Internal Server Error',
    message,
  });
}

// POST /api/v1/games - Create a new game
router.post('/', async (req, res) => {
  try {
    const { playerNames } = req.body;

    if (!playerNames || !Array.isArray(playerNames)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'playerNames must be an array'
      });
    }

    if (playerNames.length < 2 || playerNames.length > 4) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Must have 2-4 players'
      });
    }

    // Validate player names
    for (let i = 0; i < playerNames.length; i++) {
      const name = playerNames[i];
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Player ${i + 1} must have a valid name`
        });
      }
    }

    const gameState = gameEngine.createGame(playerNames);

    res.status(201).json(
      serializeGameState(gameState, {
        includeDeck: true,
        includeJoinCodes: true,
      })
    );

  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// GET /api/v1/games/:gameId - Get game state
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    const gameState = gameEngine.getGame(gameId);

    const includeJoinCodes = req.query.includeJoinCodes === 'true';

    res.status(200).json(
      serializeGameState(gameState, {
        includeDeck: true,
        includeJoinCodes,
      })
    );

  } catch (error) {
    handleGameError(res, error);
  }
});

// POST /api/v1/games/:gameId/join - Join game lobby or reconnect
router.post('/:gameId/join', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { joinCode, playerId, playerToken, includeJoinCodes } = req.body || {};

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    if ((!joinCode || String(joinCode).trim().length === 0) && !playerToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'joinCode or playerToken is required'
      });
    }

    const joinParams = {};
    if (typeof joinCode === 'string' && joinCode.trim().length > 0) {
      joinParams.joinCode = joinCode;
    }
    if (playerId) {
      joinParams.playerId = playerId;
    }
    if (playerToken) {
      joinParams.playerToken = playerToken;
    }

    const { gameState, player, playerToken: sessionToken } = gameEngine.joinGame(gameId, joinParams);

    res.status(200).json({
      playerId: player.id,
      playerName: player.name,
      playerToken: sessionToken,
      gameState: serializeGameState(gameState, {
        includeDeck: true,
        includeJoinCodes: Boolean(includeJoinCodes),
      }),
    });
  } catch (error) {
    handleGameError(res, error);
  }
});

// POST /api/v1/games/:gameId/ready - Toggle player ready state in lobby
router.post('/:gameId/ready', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, playerToken, isReady = true, includeJoinCodes } = req.body || {};

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    if (!playerId || !playerToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'playerId and playerToken are required'
      });
    }

    const gameState = gameEngine.setPlayerReady(gameId, playerId, playerToken, isReady);

    res.status(200).json(
      serializeGameState(gameState, {
        includeDeck: true,
        includeJoinCodes: Boolean(includeJoinCodes),
      })
    );
  } catch (error) {
    handleGameError(res, error);
  }
});

// POST /api/v1/games/:gameId/start - Force start game when all players ready
router.post('/:gameId/start', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, playerToken, includeJoinCodes } = req.body || {};

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    if (!playerId || !playerToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'playerId and playerToken are required'
      });
    }

    const gameState = gameEngine.startGame(gameId, playerId, playerToken);

    res.status(200).json(
      serializeGameState(gameState, {
        includeDeck: true,
        includeJoinCodes: Boolean(includeJoinCodes),
      })
    );
  } catch (error) {
    handleGameError(res, error);
  }
});

// GET /api/v1/games - List all games (optional, for debugging)
router.get('/', async (req, res) => {
  try {
    const games = gameEngine.getAllGames();
    res.status(200).json({
      games: games,
      count: games.length
    });
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// DELETE /api/v1/games/:gameId - Delete a game (optional, for cleanup)
router.delete('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    const deleted = gameEngine.deleteGame(gameId);

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: `Game ${gameId} not found`
      });
    }

  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
