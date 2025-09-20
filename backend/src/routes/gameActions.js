const express = require('express');
const gameEngine = require('../services/GameEngineInstance');
const { serializeGameState, formatCard } = require('../utils/serializeGameState');
const router = express.Router();

const sessionErrorMessages = new Set([
  'Invalid player session',
  'Player session does not match the requested player',
  'Player ID and session token are required',
]);

const conflictMessages = [
  'Not your turn',
  'Game is over',
  'Game has not started yet',
  'Deck is empty',
  'hand is full',
  'already assigned',
  'unavailable',
  'completed',
];

function handleActionError(res, error) {
  console.error('Game action error:', error);
  const message = error.message || 'Unexpected error';

  if (sessionErrorMessages.has(message)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message,
    });
  }

  if (conflictMessages.some((conflictMessage) => message.includes(conflictMessage))) {
    return res.status(409).json({
      error: 'Conflict',
      message,
    });
  }

  if (message.includes('not found')) {
    return res.status(404).json({
      error: 'Not Found',
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

// POST /api/v1/games/:gameId/actions/draw - Draw a card
router.post('/:gameId/actions/draw', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, playerToken } = req.body || {};

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    if (!playerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'playerId is required'
      });
    }

    const drawnCard = gameEngine.drawCard(gameId, playerId, playerToken);
    const gameState = gameEngine.getGame(gameId);

    res.status(200).json({
      card: formatCard(drawnCard),
      gameState: serializeGameState(gameState, { includeDeck: true }),
    });

  } catch (error) {
    handleActionError(res, error);
  }
});

// POST /api/v1/games/:gameId/actions/assign - Assign a resource to a feature
router.post('/:gameId/actions/assign', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, resourceId, featureId, playerToken } = req.body || {};

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    if (!playerId || !resourceId || !featureId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'playerId, resourceId, and featureId are required'
      });
    }

    const wasCompleted = gameEngine.assignResource(
      gameId,
      playerId,
      resourceId,
      featureId,
      playerToken,
    );
    const gameState = gameEngine.getGame(gameId);
    let completedFeature = null;
    if (wasCompleted) {
      // Find the completed feature
      completedFeature = gameState.discardPile.find(card =>
        card.id === featureId && card.completed
      ) || gameState.featuresInPlay.find(card =>
        card.id === featureId && card.completed
      );
    }

    let pointsAwarded = 0;
    if (wasCompleted && completedFeature) {
      pointsAwarded = completedFeature.points;
    }

    res.status(200).json({
      featureCompleted: wasCompleted,
      pointsAwarded,
      gameState: serializeGameState(gameState, { includeDeck: true }),
    });

  } catch (error) {
    handleActionError(res, error);
  }
});

// POST /api/v1/games/:gameId/actions/end-turn - End current player's turn
router.post('/:gameId/actions/end-turn', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, playerToken } = req.body || {};

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    if (!playerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'playerId is required'
      });
    }

    const gameState = gameEngine.endTurn(gameId, playerId, playerToken);

    res.status(200).json(
      serializeGameState(gameState, { includeDeck: true })
    );

  } catch (error) {
    handleActionError(res, error);
  }
});

// GET /api/v1/games/:gameId/actions - Get available actions for current player (optional helper)
router.get('/:gameId/actions', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gameId is required'
      });
    }

    const gameState = gameEngine.getGame(gameId);
    const currentPlayer = gameState.getCurrentPlayer();

    const availableActions = {
      canDraw: !gameState.isGameOver() && gameState.deck.length > 0 && currentPlayer.hand.length < 7,
      canAssign: !gameState.isGameOver() && currentPlayer.hand.some(card =>
        card.role !== undefined && card.assignedTo === null
      ),
      canEndTurn: !gameState.isGameOver(),
      gameOver: gameState.isGameOver(),
      currentPlayer: currentPlayer.id
    };

    res.status(200).json(availableActions);

  } catch (error) {
    console.error('Error getting available actions:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

module.exports = router;
