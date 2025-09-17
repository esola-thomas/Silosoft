const express = require('express');
const gameEngine = require('../services/GameEngineInstance');
const router = express.Router();

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

    res.status(201).json({
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
      gamePhase: gameState.gamePhase,
      currentRound: gameState.currentRound,
      currentPlayerIndex: gameState.currentPlayerIndex,
      currentPlayer: gameState.getCurrentPlayer(),
      featuresInPlay: gameState.featuresInPlay.map(card => ({
        ...card,
        cardType: 'feature'
      })),
      deck: gameState.deck.map(card => ({
        ...card,
        cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
      })),
      deckSize: gameState.deck.length,
      maxRounds: gameState.maxRounds,
      winCondition: gameState.winCondition,
      isGameOver: gameState.isGameOver(),
      lastAction: gameState.lastAction,
      createdAt: gameState.createdAt
    });

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
      gamePhase: gameState.gamePhase,
      currentRound: gameState.currentRound,
      currentPlayerIndex: gameState.currentPlayerIndex,
      currentPlayer: gameState.getCurrentPlayer(),
      featuresInPlay: gameState.featuresInPlay.map(card => ({
        ...card,
        cardType: 'feature'
      })),
      deck: gameState.deck.map(card => ({
        ...card,
        cardType: card.requirements ? 'feature' : card.role ? 'resource' : 'event'
      })),
      deckSize: gameState.deck.length,
      discardPileSize: gameState.discardPile.length,
      maxRounds: gameState.maxRounds,
      winCondition: gameState.winCondition,
      isGameOver: gameState.isGameOver(),
      lastAction: gameState.lastAction,
      createdAt: gameState.createdAt
    });

  } catch (error) {
    console.error('Error getting game:', error);

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