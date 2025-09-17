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
      success: true,
      card: {
        ...drawnCard,
        cardType: drawnCard.requirements ? 'feature' : drawnCard.role ? 'resource' : 'event'
      },
      drawnCard: {
        ...drawnCard,
        cardType: drawnCard.requirements ? 'feature' : drawnCard.role ? 'resource' : 'event'
      },
      gameState: {
        id: gameState.id,
        currentRound: gameState.currentRound,
        currentPlayerIndex: gameState.currentPlayerIndex,
        currentPlayer: gameState.getCurrentPlayer(),
        deckSize: gameState.deck.length,
        lastAction: gameState.lastAction
      },
      player: {
        id: playerId,
        hand: gameState.getPlayerById(playerId).hand.map(card => ({
          ...card,
          cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
        })),
        handSize: gameState.getPlayerById(playerId).hand.length
      }
    });

  } catch (error) {
    console.error('Error drawing card:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    } else if (error.message.includes("It's not") ||
               error.message.includes('Game is over') ||
               error.message.includes('Deck is empty') ||
               error.message.includes('hand is full')) {
      res.status(400).json({
        error: 'Bad Request',
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

    res.status(200).json({
      success: true,
      assigned: true,
      completed: wasCompleted,
      completedFeature: completedFeature,
      gameState: {
        id: gameState.id,
        currentRound: gameState.currentRound,
        currentPlayerIndex: gameState.currentPlayerIndex,
        featuresInPlay: gameState.featuresInPlay,
        lastAction: gameState.lastAction,
        winCondition: gameState.winCondition,
        isGameOver: gameState.isGameOver()
      },
      player: {
        id: playerId,
        hand: player.hand,
        score: player.score
      },
      allPlayers: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score
      }))
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
               error.message.includes('Game is over')) {
      res.status(400).json({
        error: 'Bad Request',
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
      success: true,
      gameState: {
        id: gameState.id,
        currentRound: gameState.currentRound,
        currentPlayerIndex: gameState.currentPlayerIndex,
        currentPlayer: gameState.getCurrentPlayer(),
        gamePhase: gameState.gamePhase,
        winCondition: gameState.winCondition,
        isGameOver: gameState.isGameOver(),
        lastAction: gameState.lastAction
      },
      players: gameState.players.map(player => ({
        id: player.id,
        name: player.name,
        score: player.score,
        handSize: player.hand.length,
        temporarilyUnavailable: player.temporarilyUnavailable.length
      })),
      turnTransition: {
        previousPlayer: playerId,
        newCurrentPlayer: gameState.getCurrentPlayer().id,
        roundAdvanced: gameState.lastAction.newRound !== gameState.currentRound - 1
      }
    });

  } catch (error) {
    console.error('Error ending turn:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    } else if (error.message.includes("It's not") ||
               error.message.includes('Game is over')) {
      res.status(400).json({
        error: 'Bad Request',
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