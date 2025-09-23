const { v4: uuidv4 } = require('uuid');
const GameState = require('../models/GameState');
const CardFactory = require('../models/CardFactory');
const ResourceCard = require('../models/ResourceCard');

const MAX_FEATURES_IN_PLAY = 5;

class GameEngine {
  constructor() {
    this.cardFactory = new CardFactory();
    this.games = new Map(); // In-memory storage for active games
  }

  createGame(playerNames) {
    if (!Array.isArray(playerNames) || playerNames.length < 2 || playerNames.length > 4) {
      throw new Error('Must have 2-4 players');
    }

    // Validate player names
    const trimmedNames = playerNames.map((name) => (typeof name === 'string' ? name.trim() : name));

    trimmedNames.forEach((name, index) => {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error(`Player ${index + 1} must have a valid name`);
      }
    });

    const uniqueNames = new Set(trimmedNames.map((name) => name.toLowerCase()));
    if (uniqueNames.size !== trimmedNames.length) {
      throw new Error('Player names must be unique');
    }

    // Create game state
    const gameState = new GameState(trimmedNames);

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

    this.ensureGameActive(gameState, playerToken);

    const currentPlayer = gameState.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    if (gameState.deck.length === 0) {
      throw new Error('Deck is empty');
    }

    if (gameState.isGameOver()) {
      throw new Error('Game is over');
    }

    const drawnCard = gameState.drawCard(playerId);

    if (drawnCard.type !== undefined) {
      this.processEventCard(gameState, drawnCard, playerId);
      return drawnCard;
    }

    if (drawnCard.requirements !== undefined) {
      const cardIndex = player.hand.findIndex(card => card.id === drawnCard.id);
      if (cardIndex !== -1) {
        player.hand.splice(cardIndex, 1);
      }

      if (!Array.isArray(gameState.featureBacklog)) {
        gameState.featureBacklog = [];
      }

      if (gameState.featuresInPlay.length < MAX_FEATURES_IN_PLAY) {
        gameState.featuresInPlay.push(drawnCard);
      } else {
        gameState.featureBacklog.push(drawnCard);
      }
    }

    return drawnCard;
  }

  assignResource(gameId, playerId, resourceId, featureId, playerToken) {
    const gameState = this.getGame(gameId);
    const player = this.validatePlayerSession(gameState, playerId, playerToken);

    this.ensureGameActive(gameState, playerToken);

    if (gameState.isGameOver()) {
      throw new Error('Game is over');
    }

    // Check if it's the player's turn
    const currentPlayer = gameState.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    // Find resource in player's hand
    let resourceCard = player.hand.find(card => card.id === resourceId);
    if (!resourceCard) {
      const assignedResource = this.findAssignedResource(gameState, resourceId);
      if (assignedResource) {
        throw new Error('Resource is already assigned');
      }
      throw new Error('Resource card not found in player hand');
    }

    if (resourceCard.role === undefined) {
      throw new Error(`Card ${resourceId} is not a resource card`);
    }

    // Find feature card
    let featureCard = gameState.featuresInPlay.find(card => card.id === featureId);
    if (!featureCard) {
      throw new Error('Feature card not found');
    }

    if (featureCard.completed) {
      throw new Error('Feature is already completed');
    }

    // Check if resource can be assigned
    if (resourceCard.assignedTo && resourceCard.assignedTo !== featureId) {
      throw new Error('Resource is already assigned');
    }

    if (resourceCard.unavailableUntil && resourceCard.unavailableUntil > gameState.currentRound) {
      throw new Error('Resource is temporarily unavailable');
    }

    const requiredAmount = featureCard.requirements?.[resourceCard.role];
    if (!requiredAmount) {
      throw new Error(`Resource role ${resourceCard.role} does not match feature requirements`);
    }

    // Perform assignment
    resourceCard.ownerId = playerId;
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

    this.ensureGameActive(gameState, playerToken);

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

  ensureGameActive(gameState, playerToken) {
    if (gameState.gamePhase === 'lobby') {
      if (!playerToken) {
        gameState.startGame();
      } else {
        throw new Error('Game has not started yet');
      }
    }
  }

  validatePlayerSession(gameState, playerId, playerToken) {
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    const player = gameState.getPlayerById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (!playerToken) {
      if (!player.sessionToken) {
        player.sessionToken = uuidv4();
      }
      this.touchPlayer(player);
      return player;
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

    if (player) {
      const handIndex = player.hand.findIndex(card => card.id === eventCard.id);
      if (handIndex !== -1) {
        player.hand.splice(handIndex, 1);
      }
    }

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

  processPTOEvent(gameState, eventCard, targetPlayer) {
    const count = Math.max(1, eventCard.effect.count || 1);
    const duration = Math.max(1, eventCard.effect.duration || 1);

    const eligibleResources = [];

    const considerPlayer = (player) => {
      player.hand.forEach(card => {
        if (card.role !== undefined && card.assignedTo === null && card.unavailableUntil === null) {
          eligibleResources.push({ player, card });
        }
      });
    };

    if (targetPlayer) {
      considerPlayer(targetPlayer);
    }

    gameState.players
      .filter(player => !targetPlayer || player.id !== targetPlayer.id)
      .forEach(considerPlayer);

    for (let i = 0; i < Math.min(count, eligibleResources.length); i++) {
      const index = Math.floor(Math.random() * eligibleResources.length);
      const { player, card } = eligibleResources.splice(index, 1)[0];
      card.unavailableUntil = gameState.currentRound + duration;
      card.ownerId = card.ownerId || player.id;
      if (!player.temporarilyUnavailable.includes(card)) {
        player.temporarilyUnavailable.push(card);
      }
    }
  }

  processCompetitionEvent(gameState, eventCard) {
    if (eventCard.effect.action === 'deadline_pressure') {
      gameState.featuresInPlay.forEach(feature => {
        if (!feature.completed) {
          feature.deadline = gameState.currentRound + (eventCard.effect.rounds || 1);
          feature.deadlinePenalty = eventCard.effect.failurePenalty;
          feature.deadlineBonus = eventCard.effect.successBonus || 0;
        }
      });
      return;
    }

    gameState.featuresInPlay.forEach(feature => {
      if (!feature.completed) {
        const role = eventCard.effect.role || 'dev';
        const additional = eventCard.effect.additional || 1;

        const currentValue = feature.requirements?.[role] || 0;
        feature.requirements = {
          ...feature.requirements,
          [role]: currentValue + additional,
        };
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

  processReorgEvent(gameState) {
    const hands = gameState.players.map(player => [...player.hand]);
    const allCards = hands.flat();

    if (allCards.length === 0) {
      return;
    }

    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    let offset = 0;
    gameState.players.forEach((player, index) => {
      const handSize = hands[index].length;
      player.hand = allCards.slice(offset, offset + handSize);
      offset += handSize;
    });
  }

  processContractorEvent(gameState, eventCard, player) {
    const role = eventCard.effect.role || 'dev';
    const level = eventCard.effect.level || 'senior';
    const duration = Math.max(1, eventCard.effect.duration || 2);
    const value = ResourceCard.getValueForLevel(level);

    const contractorId = `contractor-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const contractorCard = new ResourceCard(contractorId, role, level, value);
    contractorCard.name = `${level.charAt(0).toUpperCase()}${level.slice(1)} ${role.toUpperCase()}`;
    contractorCard.color = '#FF9800';
    contractorCard.unavailableUntil = gameState.currentRound + duration;
    contractorCard.contractorExpiresAt = gameState.currentRound + duration;
    contractorCard.ownerId = player.id;

    player.hand.push(contractorCard);
    if (!player.temporarilyUnavailable.includes(contractorCard)) {
      player.temporarilyUnavailable.push(contractorCard);
    }
  }

  replaceCompletedFeature(gameState, completedFeatureId) {
    if (this.promoteFeatureFromBacklog(gameState)) {
      return;
    }

    // Find a new feature card in the deck
    const featureCards = gameState.deck.filter(card => card.requirements !== undefined);

    if (featureCards.length > 0 && gameState.featuresInPlay.length < MAX_FEATURES_IN_PLAY) {
      const newFeature = featureCards[0];
      gameState.featuresInPlay.push(newFeature);

      // Remove from deck
      const deckIndex = gameState.deck.findIndex(card => card.id === newFeature.id);
      if (deckIndex !== -1) {
        gameState.deck.splice(deckIndex, 1);
      }
    }
  }

  promoteFeatureFromBacklog(gameState) {
    if (!Array.isArray(gameState.featureBacklog) || gameState.featureBacklog.length === 0) {
      return false;
    }

    if (gameState.featuresInPlay.length >= MAX_FEATURES_IN_PLAY) {
      return false;
    }

    const nextFeature = gameState.featureBacklog.shift();
    if (nextFeature) {
      gameState.featuresInPlay.push(nextFeature);
      return true;
    }

    return false;
  }

  findAssignedResource(gameState, resourceId) {
    const featureSets = [
      ...(gameState.featuresInPlay || []),
      ...(gameState.discardPile || []),
    ];

    return featureSets.some(feature =>
      feature?.assignedResources?.some(resource => resource.id === resourceId)
    );
  }

  applyEventEffect(gameId, eventCard, playerId = null) {
    const gameState = this.getGame(gameId);
    const targetPlayerId = playerId || gameState.getCurrentPlayer().id;
    this.processEventCard(gameState, eventCard, targetPlayerId);
    return gameState;
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
