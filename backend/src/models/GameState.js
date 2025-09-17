const { v4: uuidv4 } = require('uuid');

class GameState {
  constructor(playerNames = []) {
    if (!Array.isArray(playerNames) || playerNames.length < 2 || playerNames.length > 4) {
      throw new Error('GameState must have 2-4 players');
    }

    this.id = uuidv4();
    this.players = [];
    this.currentRound = 1;
    this.currentPlayerIndex = 0;
    this.deck = [];
    this.discardPile = [];
    this.featuresInPlay = [];
    this.gamePhase = 'setup';
    this.winCondition = false;
    this.createdAt = new Date().toISOString();
    this.lastAction = null;
    this.maxRounds = 10;

    // Initialize players
    playerNames.forEach((name, index) => {
      this.players.push({
        id: `player-${index + 1}`,
        name: name,
        hand: [],
        score: 0,
        temporarilyUnavailable: []
      });
    });
  }

  static validate(gameData) {
    if (!gameData.id) {
      throw new Error('GameState must have an id');
    }

    if (!Array.isArray(gameData.players) || gameData.players.length < 2 || gameData.players.length > 4) {
      throw new Error('GameState must have 2-4 players');
    }

    if (gameData.currentRound < 1 || gameData.currentRound > 10) {
      throw new Error('Current round must be between 1 and 10');
    }

    if (gameData.currentPlayerIndex < 0 || gameData.currentPlayerIndex >= gameData.players.length) {
      throw new Error('Current player index must be valid');
    }

    const validPhases = ['setup', 'playing', 'ended'];
    if (!validPhases.includes(gameData.gamePhase)) {
      throw new Error(`Game phase must be one of: ${validPhases.join(', ')}`);
    }

    return true;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getPlayerById(playerId) {
    return this.players.find(player => player.id === playerId);
  }

  advanceToNextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    // If we've cycled through all players, advance the round
    if (this.currentPlayerIndex === 0) {
      this.currentRound++;

      // Process round-based effects (restore resources, check deadlines, etc.)
      this.processRoundEffects();

      // Check for game end conditions
      if (this.currentRound > this.maxRounds) {
        this.endGame();
      }
    }
  }

  processRoundEffects() {
    // Restore temporarily unavailable resources
    this.players.forEach(player => {
      player.temporarilyUnavailable = player.temporarilyUnavailable.filter(resource => {
        if (resource.unavailableUntil <= this.currentRound) {
          resource.unavailableUntil = null;
          return false;
        }
        return true;
      });
    });
  }

  drawCard(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (player.id !== this.getCurrentPlayer().id) {
      throw new Error(`It's not ${player.name}'s turn`);
    }

    if (this.deck.length === 0) {
      throw new Error('Deck is empty');
    }

    if (player.hand.length >= 7) {
      throw new Error('Player hand is full');
    }

    const drawnCard = this.deck.pop();
    player.hand.push(drawnCard);

    this.lastAction = {
      type: 'draw',
      playerId: playerId,
      cardId: drawnCard.id,
      timestamp: new Date().toISOString()
    };

    return drawnCard;
  }

  assignResource(playerId, resourceId, featureId) {
    const player = this.getPlayerById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Find the resource card in player's hand
    const resourceIndex = player.hand.findIndex(card => card.id === resourceId);
    if (resourceIndex === -1) {
      throw new Error(`Resource ${resourceId} not found in player's hand`);
    }

    const resourceCard = player.hand[resourceIndex];

    // Find the feature card (could be in any player's hand or in play)
    let featureCard = null;
    let featureOwner = null;

    // Check features in play first
    featureCard = this.featuresInPlay.find(feature => feature.id === featureId);

    // If not in play, check all players' hands
    if (!featureCard) {
      for (const p of this.players) {
        const found = p.hand.find(card => card.id === featureId && card.requirements);
        if (found) {
          featureCard = found;
          featureOwner = p;
          break;
        }
      }
    }

    if (!featureCard) {
      throw new Error(`Feature ${featureId} not found`);
    }

    // Validate the assignment
    if (resourceCard.assignedTo && resourceCard.assignedTo !== featureId) {
      throw new Error(`Resource ${resourceId} is already assigned to another feature`);
    }

    if (resourceCard.unavailableUntil && resourceCard.unavailableUntil > this.currentRound) {
      throw new Error(`Resource ${resourceId} is unavailable until round ${resourceCard.unavailableUntil}`);
    }

    // Perform the assignment
    resourceCard.assignedTo = featureId;
    if (!featureCard.assignedResources) {
      featureCard.assignedResources = [];
    }
    featureCard.assignedResources.push(resourceCard);

    // Check if feature is now complete
    const isComplete = this.checkFeatureCompletion(featureCard);

    this.lastAction = {
      type: 'assign',
      playerId: playerId,
      resourceId: resourceId,
      featureId: featureId,
      completed: isComplete,
      timestamp: new Date().toISOString()
    };

    return isComplete;
  }

  checkFeatureCompletion(featureCard) {
    const assigned = { dev: 0, pm: 0, ux: 0 };

    if (featureCard.assignedResources) {
      featureCard.assignedResources.forEach(resource => {
        assigned[resource.role] += resource.value;
      });
    }

    const isComplete =
      assigned.dev >= featureCard.requirements.dev &&
      assigned.pm >= featureCard.requirements.pm &&
      assigned.ux >= featureCard.requirements.ux;

    if (isComplete && !featureCard.completed) {
      featureCard.completed = true;

      // Award points to all players who contributed resources
      const contributors = new Set();
      featureCard.assignedResources.forEach(resource => {
        this.players.forEach(player => {
          if (player.hand.some(card => card.id === resource.id)) {
            contributors.add(player.id);
          }
        });
      });

      contributors.forEach(playerId => {
        const player = this.getPlayerById(playerId);
        player.score += featureCard.points;
      });

      // Move completed feature to discard pile
      this.discardPile.push(featureCard);

      // Remove from features in play
      this.featuresInPlay = this.featuresInPlay.filter(f => f.id !== featureCard.id);

      // Check win condition
      this.checkWinCondition();
    }

    return isComplete;
  }

  endTurn(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (player.id !== this.getCurrentPlayer().id) {
      throw new Error(`It's not ${player.name}'s turn`);
    }

    this.advanceToNextPlayer();

    this.lastAction = {
      type: 'end_turn',
      playerId: playerId,
      newCurrentPlayer: this.getCurrentPlayer().id,
      newRound: this.currentRound,
      timestamp: new Date().toISOString()
    };
  }

  checkWinCondition() {
    // Win if all features are completed
    const totalFeatures = this.featuresInPlay.length + this.discardPile.filter(card => card.requirements).length;
    const completedFeatures = this.discardPile.filter(card => card.completed).length;

    if (completedFeatures === totalFeatures) {
      this.winCondition = true;
      this.endGame();
    }
  }

  endGame() {
    this.gamePhase = 'ended';
    this.lastAction = {
      type: 'game_end',
      reason: this.winCondition ? 'all_features_completed' : 'max_rounds_reached',
      finalScores: this.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      timestamp: new Date().toISOString()
    };
  }

  isGameOver() {
    return this.gamePhase === 'ended' || this.currentRound > this.maxRounds || this.winCondition;
  }

  startGame() {
    if (this.gamePhase !== 'setup') {
      throw new Error('Game is not in setup phase');
    }

    this.gamePhase = 'playing';
    this.lastAction = {
      type: 'game_start',
      timestamp: new Date().toISOString()
    };
  }

  toJSON() {
    return {
      id: this.id,
      players: this.players,
      currentRound: this.currentRound,
      currentPlayerIndex: this.currentPlayerIndex,
      deck: this.deck,
      discardPile: this.discardPile,
      featuresInPlay: this.featuresInPlay,
      gamePhase: this.gamePhase,
      winCondition: this.winCondition,
      createdAt: this.createdAt,
      lastAction: this.lastAction,
      maxRounds: this.maxRounds
    };
  }

  static fromJSON(data) {
    // Create a new game state with dummy player names first
    const dummyNames = data.players.map(p => p.name);
    const gameState = new GameState(dummyNames);

    // Then override with the actual data
    Object.assign(gameState, data);

    return gameState;
  }
}

module.exports = GameState;