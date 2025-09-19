const { v4: uuidv4 } = require('uuid');
const GameState = require('../models/GameState');
const CardFactory = require('../models/CardFactory');

class GameEngine {
  constructor() {
    this.cardFactory = new CardFactory();
    this.games = new Map(); // In-memory storage for active games
  }

  createGame(playerNames) {
    if (!Array.isArray(playerNames) || playerNames.length < 2 || playerNames.length > 4) {
      throw new Error('Must have 2-4 player names');
    }

    // Validate player names
    playerNames.forEach((name, index) => {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error(`Player ${index + 1} must have a valid name`);
      }
    });

    // Create game state
    const gameState = new GameState(playerNames);

    // Create and deal cards
    const deckResult = this.cardFactory.createGameDeck(gameState.players);
    gameState.deck = deckResult.deck;

    // Put initial features in play
    const featureCards = gameState.deck.filter(card => card.requirements !== undefined);
    gameState.featuresInPlay = featureCards.slice(0, Math.min(3, featureCards.length));

    // Remove features in play from deck
    gameState.featuresInPlay.forEach(feature => {
      const index = gameState.deck.findIndex(card => card.id === feature.id);
      if (index !== -1) {
        gameState.deck.splice(index, 1);
      }
    });

    // Store the game
    this.games.set(gameState.id, gameState);

    return gameState;
  }

  getGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    return game;
  }

  joinGame(gameId, { joinCode, playerId, playerToken } = {}) {
    const gameState = this.getGame(gameId);

    if (!joinCode && !playerToken) {
      throw new Error('Join code or existing session token is required');
    }

    let player = null;

    if (playerToken) {
      player = gameState.players.find(p => p.sessionToken === playerToken);
      if (!player) {
        throw new Error('Invalid player session');
      }

      if (playerId && player.id !== playerId) {
        throw new Error('Player session does not match the requested player');
      }

      this.touchPlayer(player);
      return { gameState, player, playerToken: player.sessionToken };
    }

    const normalizedCode = joinCode.trim().toUpperCase();
    player = gameState.players.find(p => p.joinCode === normalizedCode);

    if (!player) {
      throw new Error('Invalid join code');
    }

    const token = uuidv4();
    player.sessionToken = token;
    player.isConnected = true;
    player.isReady = false;
    this.touchPlayer(player);

    return { gameState, player, playerToken: token };
  }

  setPlayerReady(gameId, playerId, playerToken, isReady) {
    const gameState = this.getGame(gameId);
    const player = this.validatePlayerSession(gameState, playerId, playerToken);

    if (gameState.gamePhase === 'ended') {
      throw new Error('Game is over');
    }

    if (gameState.gamePhase === 'playing') {
      player.isReady = true;
      return gameState;
    }

    player.isReady = Boolean(isReady);
    this.touchPlayer(player);

    this.tryAutoStart(gameState);

    return gameState;
  }

  startGame(gameId, playerId, playerToken) {
    const gameState = this.getGame(gameId);
    const player = this.validatePlayerSession(gameState, playerId, playerToken);

    if (gameState.gamePhase === 'playing') {
      return gameState;
    }

    if (gameState.gamePhase === 'ended') {
      throw new Error('Game is over');
    }

    if (!this.allPlayersConnected(gameState)) {
      throw new Error('All players must join before starting the game');
    }

    if (!this.allPlayersReady(gameState)) {
      throw new Error('All players must be ready to start the game');
    }

    player.isReady = true;
    this.touchPlayer(player);

    gameState.startGame();

    return gameState;
  }

  drawCard(gameId, playerId, playerToken) {
    const gameState = this.getGame(gameId);
    const player = this.validatePlayerSession(gameState, playerId, playerToken);

    this.ensureGameActive(gameState);

    const currentPlayer = gameState.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    if (gameState.deck.length === 0) {
      throw new Error('Deck is empty');
    }

    const drawnCard = gameState.drawCard(playerId);

    // Handle special card types
    if (drawnCard.type !== undefined) {
      // Event card drawn
      this.processEventCard(gameState, drawnCard, playerId);
    } else if (drawnCard.requirements !== undefined) {
      // Feature card drawn - add to features in play if there's room
      if (gameState.featuresInPlay.length < 5) {
        gameState.featuresInPlay.push(drawnCard);
        // Remove from player's hand
        const cardIndex = player.hand.findIndex(card => card.id === drawnCard.id);
        if (cardIndex !== -1) {
          player.hand.splice(cardIndex, 1);
        }
      }
    }

    return drawnCard;
  }

  assignResource(gameId, playerId, resourceId, featureId, playerToken) {
    const gameState = this.getGame(gameId);
    const player = this.validatePlayerSession(gameState, playerId, playerToken);

    this.ensureGameActive(gameState);

    if (gameState.isGameOver()) {
      throw new Error('Game is over');
    }

    // Check if it's the player's turn
    const currentPlayer = gameState.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    // Find resource in player's hand
    const resourceCard = player.hand.find(card => card.id === resourceId);
    if (!resourceCard) {
      throw new Error(`Resource ${resourceId} not found in player's hand`);
    }

    if (resourceCard.role === undefined) {
      throw new Error(`Card ${resourceId} is not a resource card`);
    }

    // Find feature card
    let featureCard = gameState.featuresInPlay.find(card => card.id === featureId);
    if (!featureCard) {
      throw new Error(`Feature ${featureId} not found in play`);
    }

    if (featureCard.completed) {
      throw new Error(`Feature ${featureId} is already completed`);
    }

    // Check if resource can be assigned
    if (resourceCard.assignedTo && resourceCard.assignedTo !== featureId) {
      throw new Error(`Resource ${resourceId} is already assigned to another feature`);
    }

    if (resourceCard.unavailableUntil && resourceCard.unavailableUntil > gameState.currentRound) {
      throw new Error(`Resource ${resourceId} is unavailable until round ${resourceCard.unavailableUntil}`);
    }

    // Perform assignment
    const wasCompleted = gameState.assignResource(playerId, resourceId, featureId);

    if (wasCompleted) {
      // Feature completed - replace with new one from deck if available
      this.replaceCompletedFeature(gameState, featureId);
    }

    return wasCompleted;
  }

  endTurn(gameId, playerId, playerToken) {
    const gameState = this.getGame(gameId);
    this.validatePlayerSession(gameState, playerId, playerToken);

    this.ensureGameActive(gameState);

    if (gameState.isGameOver()) {
      throw new Error('Game is over');
    }

    const currentPlayer = gameState.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    gameState.endTurn(playerId);

    // Check for game end conditions
    if (gameState.currentRound > gameState.maxRounds) {
      gameState.endGame();
    }

    return gameState;
  }

  ensureGameActive(gameState) {
    if (gameState.gamePhase === 'lobby') {
      throw new Error('Game has not started yet');
    }
  }

  validatePlayerSession(gameState, playerId, playerToken) {
    if (!playerId || !playerToken) {
      throw new Error('Player ID and session token are required');
    }

    const player = gameState.getPlayerById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (!player.sessionToken || player.sessionToken !== playerToken) {
      throw new Error('Invalid player session');
    }

    this.touchPlayer(player);

    return player;
  }

  touchPlayer(player) {
    player.isConnected = true;
    player.lastSeen = new Date().toISOString();
  }

  allPlayersConnected(gameState) {
    return gameState.players.every(player => player.isConnected);
  }

  allPlayersReady(gameState) {
    return gameState.players.every(player => player.isReady);
  }

  tryAutoStart(gameState) {
    if (gameState.gamePhase !== 'lobby') {
      return false;
    }

    if (!this.allPlayersConnected(gameState)) {
      return false;
    }

    if (!this.allPlayersReady(gameState)) {
      return false;
    }

    gameState.startGame();
    return true;
  }

  processEventCard(gameState, eventCard, playerId) {
    eventCard.trigger();

    const player = gameState.getPlayerById(playerId);

    switch (eventCard.type) {
      case 'layoff':
        this.processLayoffEvent(gameState, eventCard, player);
        break;

      case 'pto':
      case 'plm':
        this.processPTOEvent(gameState, eventCard, player);
        break;

      case 'competition':
        this.processCompetitionEvent(gameState, eventCard);
        break;

      case 'bonus':
        this.processBonusEvent(gameState, eventCard, player);
        break;

      case 'reorg':
        this.processReorgEvent(gameState, eventCard);
        break;

      case 'contractor':
        this.processContractorEvent(gameState, eventCard, player);
        break;
    }

    eventCard.resolve();
    gameState.discardPile.push(eventCard);
  }

  processLayoffEvent(gameState, eventCard, player) {
    const resourceCards = player.hand.filter(card => card.role !== undefined && card.assignedTo === null);
    const discardCount = Math.min(eventCard.effect.count, resourceCards.length);

    for (let i = 0; i < discardCount; i++) {
      const randomIndex = Math.floor(Math.random() * resourceCards.length);
      const discardedCard = resourceCards.splice(randomIndex, 1)[0];

      // Remove from player's hand
      const handIndex = player.hand.findIndex(card => card.id === discardedCard.id);
      if (handIndex !== -1) {
        player.hand.splice(handIndex, 1);
      }

      gameState.discardPile.push(discardedCard);
    }
  }

  processPTOEvent(gameState, eventCard, player) {
    // For now, randomly select a resource to make unavailable
    const availableResources = player.hand.filter(card =>
      card.role !== undefined &&
      card.assignedTo === null &&
      card.unavailableUntil === null
    );

    if (availableResources.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableResources.length);
      const resourceCard = availableResources[randomIndex];
      resourceCard.unavailableUntil = gameState.currentRound + eventCard.effect.duration;
      player.temporarilyUnavailable.push(resourceCard);
    }
  }

  processCompetitionEvent(gameState, eventCard) {
    // Mark active features with deadline pressure
    gameState.featuresInPlay.forEach(feature => {
      if (!feature.completed) {
        feature.deadline = gameState.currentRound + eventCard.effect.rounds;
        feature.deadlinePenalty = eventCard.effect.failurePenalty;
        feature.deadlineBonus = eventCard.effect.successBonus || 0;
      }
    });
  }

  processBonusEvent(gameState, eventCard, player) {
    const resourceCards = gameState.deck.filter(card => card.role !== undefined);
    const drawCount = Math.min(eventCard.effect.count, resourceCards.length);

    for (let i = 0; i < drawCount; i++) {
      if (player.hand.length < 7 && resourceCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * resourceCards.length);
        const drawnCard = resourceCards.splice(randomIndex, 1)[0];

        // Remove from deck
        const deckIndex = gameState.deck.findIndex(card => card.id === drawnCard.id);
        if (deckIndex !== -1) {
          gameState.deck.splice(deckIndex, 1);
        }

        player.hand.push(drawnCard);
      }
    }
  }

  processReorgEvent(gameState, eventCard) {
    // Simple reorg: allow resources to be reassigned between players
    // For now, just mark it as processed - more complex logic would go here
    gameState.lastAction.reorgActive = true;
  }

  processContractorEvent(gameState, eventCard, player) {
    // Add a wildcard contractor resource
    const contractorCard = {
      id: `contractor-${Date.now()}`,
      role: 'contractor',
      level: 'wildcard',
      value: 2,
      name: 'Contractor',
      color: '#FF9800',
      assignedTo: null,
      unavailableUntil: null
    };

    if (player.hand.length < 7) {
      player.hand.push(contractorCard);
    }
  }

  replaceCompletedFeature(gameState, completedFeatureId) {
    // Find a new feature card in the deck
    const featureCards = gameState.deck.filter(card => card.requirements !== undefined);

    if (featureCards.length > 0 && gameState.featuresInPlay.length < 5) {
      const newFeature = featureCards[0];
      gameState.featuresInPlay.push(newFeature);

      // Remove from deck
      const deckIndex = gameState.deck.findIndex(card => card.id === newFeature.id);
      if (deckIndex !== -1) {
        gameState.deck.splice(deckIndex, 1);
      }
    }
  }

  getGameStats(gameId) {
    const gameState = this.getGame(gameId);

    return {
      id: gameState.id,
      phase: gameState.gamePhase,
      currentRound: gameState.currentRound,
      maxRounds: gameState.maxRounds,
      currentPlayer: gameState.getCurrentPlayer(),
      playerCount: gameState.players.length,
      deckSize: gameState.deck.length,
      featuresInPlay: gameState.featuresInPlay.length,
      completedFeatures: gameState.discardPile.filter(card => card.completed).length,
      totalScore: gameState.players.reduce((sum, player) => sum + player.score, 0),
      isGameOver: gameState.isGameOver(),
      winCondition: gameState.winCondition
    };
  }

  getAllGames() {
    return Array.from(this.games.values()).map(game => this.getGameStats(game.id));
  }

  deleteGame(gameId) {
    const existed = this.games.has(gameId);
    this.games.delete(gameId);
    return existed;
  }
}

module.exports = GameEngine;
