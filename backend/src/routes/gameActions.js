const express = require('express');
const gameEngine = require('../services/GameEngineInstance');
const router = express.Router();

// POST /api/v1/games/:gameId/actions/draw - Draw a card
router.post('/:gameId/actions/draw', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

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

    const drawnCard = gameEngine.drawCard(gameId, playerId);
    const gameState = gameEngine.getGame(gameId);

    res.status(200).json({
      card: {
        ...drawnCard,
        cardType: drawnCard.requirements ? 'feature' : drawnCard.role ? 'resource' : 'event'
      },
      gameState: {
        id: gameState.id,
        players: gameState.players.map(player => ({
          id: player.id,
          name: player.name,
          hand: player.hand.map(card => ({
            ...card,
            cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
          })),
          score: player.score,
          temporarilyUnavailable: player.temporarilyUnavailable
        })),
        currentRound: gameState.currentRound,
        currentPlayerIndex: gameState.currentPlayerIndex,
        deck: gameState.deck.map(card => ({
          ...card,
          cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
        })),
        featuresInPlay: gameState.featuresInPlay.map(card => ({
          ...card,
          cardType: 'feature'
        })),
        gamePhase: gameState.gamePhase,
        winCondition: gameState.winCondition
      }
    });

  } catch (error) {
    console.error('Error drawing card:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    } else if (error.message.includes("Not your turn") ||
               error.message.includes('Game is over') ||
               error.message.includes('Deck is empty') ||
               error.message.includes('hand is full')) {
      res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: error.message.includes("Not your turn") ? 'INVALID_TURN' :
              error.message.includes('Game is over') ? 'GAME_OVER' :
              error.message.includes('Deck is empty') ? 'EMPTY_DECK' :
              error.message.includes('hand is full') ? 'HAND_FULL' : 'BAD_REQUEST'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

// POST /api/v1/games/:gameId/actions/assign - Assign a resource to a feature
router.post('/:gameId/actions/assign', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, resourceId, featureId } = req.body;

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

    const wasCompleted = gameEngine.assignResource(gameId, playerId, resourceId, featureId);
    const gameState = gameEngine.getGame(gameId);
    const player = gameState.getPlayerById(playerId);

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
      pointsAwarded: pointsAwarded,
      gameState: {
        id: gameState.id,
        players: gameState.players.map(player => ({
          id: player.id,
          name: player.name,
          hand: player.hand.map(card => ({
            ...card,
            cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
          })),
          score: player.score,
          temporarilyUnavailable: player.temporarilyUnavailable
        })),
        currentRound: gameState.currentRound,
        currentPlayerIndex: gameState.currentPlayerIndex,
        deck: gameState.deck.map(card => ({
          ...card,
          cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
        })),
        featuresInPlay: gameState.featuresInPlay.map(card => ({
          ...card,
          cardType: 'feature'
        })),
        gamePhase: gameState.gamePhase,
        winCondition: gameState.winCondition
      }
    });

  } catch (error) {
    console.error('Error assigning resource:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    } else if (error.message.includes('already assigned') ||
               error.message.includes('unavailable') ||
               error.message.includes('completed') ||
               error.message.includes('Game is over') ||
               error.message.includes('Not your turn')) {
      res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: error.message.includes('Not your turn') ? 'INVALID_TURN' : 'BAD_REQUEST'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

// POST /api/v1/games/:gameId/actions/end-turn - End current player's turn
router.post('/:gameId/actions/end-turn', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

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

    const gameState = gameEngine.endTurn(gameId, playerId);

    res.status(200).json({
      id: gameState.id,
      players: gameState.players.map(player => ({
        id: player.id,
        name: player.name,
        hand: player.hand.map(card => ({
          ...card,
          cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
        })),
        score: player.score,
        temporarilyUnavailable: player.temporarilyUnavailable
      })),
      currentRound: gameState.currentRound,
      currentPlayerIndex: gameState.currentPlayerIndex,
      deck: gameState.deck.map(card => ({
        ...card,
        cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
      })),
      featuresInPlay: gameState.featuresInPlay.map(card => ({
        ...card,
        cardType: 'feature'
      })),
      gamePhase: gameState.gamePhase,
      winCondition: gameState.winCondition
    });

  } catch (error) {
    console.error('Error ending turn:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    } else if (error.message.includes("Not your turn") ||
               error.message.includes('Game is over')) {
      res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: error.message.includes("Not your turn") ? 'INVALID_TURN' : 'GAME_OVER'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
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