const GameEngine = require('../../src/services/GameEngine');
const GameState = require('../../src/models/GameState');
const Player = require('../../src/models/Player');
const FeatureCard = require('../../src/models/FeatureCard');
const ResourceCard = require('../../src/models/ResourceCard');
const EventCard = require('../../src/models/EventCard');

describe('Game Rules Validation - Unit Tests', () => {
  let gameEngine;
  let gameState;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameState = gameEngine.createGame(['Alice', 'Bob']);
  });

  describe('Game Creation Rules', () => {
    test('should require 2-4 players', () => {
      expect(() => gameEngine.createGame(['Solo'])).toThrow('Must have 2-4 players');
      expect(() => gameEngine.createGame(['P1', 'P2', 'P3', 'P4', 'P5'])).toThrow('Must have 2-4 players');
    });

    test('should require non-empty player names', () => {
      expect(() => gameEngine.createGame(['Alice', ''])).toThrow('Player 2 must have a valid name');
      expect(() => gameEngine.createGame(['Alice', null])).toThrow('Player 2 must have a valid name');
      expect(() => gameEngine.createGame(['Alice', undefined])).toThrow('Player 2 must have a valid name');
    });

    test('should require unique player names', () => {
      expect(() => gameEngine.createGame(['Alice', 'Alice'])).toThrow('Player names must be unique');
    });

    test('should initialize game with proper structure', () => {
      expect(gameState.players).toHaveLength(2);
      expect(gameState.currentRound).toBe(1);
      expect(gameState.maxRounds).toBe(10);
      expect(gameState.currentPlayerIndex).toBe(0);
      expect(gameState.gamePhase).toBe('lobby');
    });
  });

  describe('Turn Management Rules', () => {
    test('should validate current player turn', () => {
      const player1 = gameState.players[0];
      const player2 = gameState.players[1];

      // Player 1's turn
      expect(() => gameEngine.drawCard(gameState.id, player2.id))
        .toThrow('Not your turn');
    });

    test('should advance to next player after end turn', () => {
      const player1 = gameState.players[0];
      expect(gameState.currentPlayerIndex).toBe(0);

      gameEngine.endTurn(gameState.id, player1.id);
      expect(gameState.currentPlayerIndex).toBe(1);
    });

    test('should advance round after all players complete turns', () => {
      const player1 = gameState.players[0];
      const player2 = gameState.players[1];

      expect(gameState.currentRound).toBe(1);

      // Complete first round
      gameEngine.endTurn(gameState.id, player1.id);
      gameEngine.endTurn(gameState.id, player2.id);

      expect(gameState.currentRound).toBe(2);
      expect(gameState.currentPlayerIndex).toBe(0);
    });

    test('should prevent actions when game is over', () => {
      // Force game to end
      gameState.currentRound = 11;
      gameState.gamePhase = 'ended';

      const player1 = gameState.players[0];

      expect(() => gameEngine.drawCard(gameState.id, player1.id))
        .toThrow('Game is over');
      expect(() => gameEngine.endTurn(gameState.id, player1.id))
        .toThrow('Game is over');
    });
  });

  describe('Card Drawing Rules', () => {
    test('should prevent drawing when hand is full', () => {
      const player1 = gameState.players[0];

      // Fill hand to maximum (7 cards)
      while (player1.hand.length < 7) {
        gameEngine.drawCard(gameState.id, player1.id);
      }

      expect(() => gameEngine.drawCard(gameState.id, player1.id))
        .toThrow('hand is full');
    });

    test('should prevent drawing from empty deck', () => {
      const player1 = gameState.players[0];

      // Empty the deck
      gameState.deck = [];

      expect(() => gameEngine.drawCard(gameState.id, player1.id))
        .toThrow('Deck is empty');
    });

    test('should add card to player hand when drawing', () => {
      const player1 = gameState.players[0];
      const initialHandSize = player1.hand.length;

      const drawnCard = gameEngine.drawCard(gameState.id, player1.id);

      if (drawnCard.cardType !== 'resource') {
        expect(player1.hand).toHaveLength(initialHandSize);
      } else {
        expect(player1.hand).toHaveLength(initialHandSize + 1);
        expect(player1.hand).toContain(drawnCard);
      }
    });
  });

  describe('Resource Assignment Rules', () => {
    test('should validate resource exists in player hand', () => {
      const player1 = gameState.players[0];
      const feature = gameState.featuresInPlay[0];

      expect(() => gameEngine.assignResource(gameState.id, player1.id, 'non-existent-resource', feature.id))
        .toThrow('Resource card not found in player hand');
    });

    test('should validate feature exists in play', () => {
      const player1 = gameState.players[0];
      const resourceCard = player1.hand.find(card => card.role);

      if (resourceCard) {
        expect(() => gameEngine.assignResource(gameState.id, player1.id, resourceCard.id, 'non-existent-feature'))
          .toThrow('Feature card not found');
      }
    });

    test('should validate resource role matches feature requirement', () => {
      const player1 = gameState.players[0];

      // Create specific test cards
      const devResource = new ResourceCard('dev-test', 'dev', 'senior', 3);
      const pmFeature = new FeatureCard('pm-feature', 'PM Only Feature', { pm: 2 }, 5);

      player1.hand.push(devResource);
      gameState.featuresInPlay.push(pmFeature);

      expect(() => gameEngine.assignResource(gameState.id, player1.id, devResource.id, pmFeature.id))
        .toThrow('Resource role dev does not match feature requirements');
    });

    test('should prevent assignment to completed feature', () => {
      const player1 = gameState.players[0];

      // Create completed feature
      const feature = new FeatureCard('completed-feature', 'Completed Feature', { dev: 1 }, 3);
      feature.completed = true;
      gameState.featuresInPlay.push(feature);

      const devResource = new ResourceCard('dev-test', 'dev', 'senior', 3);
      player1.hand.push(devResource);

      expect(() => gameEngine.assignResource(gameState.id, player1.id, devResource.id, feature.id))
        .toThrow('Feature is already completed');
    });

    test('should prevent assignment of unavailable resource', () => {
      const player1 = gameState.players[0];

      // Create unavailable resource
      const unavailableResource = new ResourceCard('unavailable-test', 'dev', 'senior', 3);
      unavailableResource.unavailableUntil = 5; // Unavailable until round 5
      player1.hand.push(unavailableResource);

      const feature = gameState.featuresInPlay[0];

      expect(() => gameEngine.assignResource(gameState.id, player1.id, unavailableResource.id, feature.id))
        .toThrow('Resource is temporarily unavailable');
    });

    test('should prevent double assignment of same resource', () => {
      const player1 = gameState.players[0];

      // Create test cards
      const devResource = new ResourceCard('dev-test', 'dev', 'senior', 3);
      const feature1 = new FeatureCard('feature1', 'Feature 1', { dev: 1 }, 3);
      const feature2 = new FeatureCard('feature2', 'Feature 2', { dev: 1 }, 3);

      player1.hand.push(devResource);
      gameState.featuresInPlay.push(feature1, feature2);

      // First assignment should work
      gameEngine.assignResource(gameState.id, player1.id, devResource.id, feature1.id);

      // Second assignment should fail
      expect(() => gameEngine.assignResource(gameState.id, player1.id, devResource.id, feature2.id))
        .toThrow('Resource is already assigned');
    });

    test('should complete feature when all requirements are met', () => {
      const player1 = gameState.players[0];

      // Create feature that requires 1 dev
      const feature = new FeatureCard('simple-feature', 'Simple Feature', { dev: 1 }, 3);
      const devResource = new ResourceCard('dev-test', 'dev', 'junior', 1);

      player1.hand.push(devResource);
      gameState.featuresInPlay.push(feature);

      const completed = gameEngine.assignResource(gameState.id, player1.id, devResource.id, feature.id);

      expect(completed).toBe(true);
      expect(feature.completed).toBe(true);
      expect(player1.score).toBe(3); // Feature points awarded
    });
  });

  describe('Win Condition Rules', () => {
    test('should detect win when all features are completed', () => {
      // Complete all features in play
      gameState.featuresInPlay.forEach(feature => {
        feature.completed = true;
      });

      expect(gameState.isGameOver()).toBe(true);
      expect(gameState.winCondition).toBe(true);
    });

    test('should detect loss when max rounds exceeded', () => {
      gameState.currentRound = 11;

      expect(gameState.isGameOver()).toBe(true);
      expect(gameState.winCondition).toBe(false);
    });

    test('should continue game when conditions not met', () => {
      // Game should continue in normal state
      expect(gameState.isGameOver()).toBe(false);
      expect(gameState.winCondition).toBe(false);
    });
  });

  describe('Score Calculation Rules', () => {
    test('should award points for feature completion', () => {
      const player1 = gameState.players[0];
      const initialScore = player1.score;

      // Create simple feature worth 5 points
      const feature = new FeatureCard('test-feature', 'Test Feature', { dev: 1 }, 5);
      const devResource = new ResourceCard('dev-test', 'dev', 'junior', 1);

      player1.hand.push(devResource);
      gameState.featuresInPlay.push(feature);

      gameEngine.assignResource(gameState.id, player1.id, devResource.id, feature.id);

      expect(player1.score).toBe(initialScore + 5);
    });

    test('should track progressive scoring for multiple features', () => {
      const player1 = gameState.players[0];

      // Complete features worth different points
      const features = [
        new FeatureCard('f1', 'Feature 1', { dev: 1 }, 3),
        new FeatureCard('f2', 'Feature 2', { dev: 1 }, 5),
        new FeatureCard('f3', 'Feature 3', { dev: 1 }, 8)
      ];

      features.forEach((feature, index) => {
        const resource = new ResourceCard(`dev-${index}`, 'dev', 'junior', 1);
        player1.hand.push(resource);
        gameState.featuresInPlay.push(feature);
        gameEngine.assignResource(gameState.id, player1.id, resource.id, feature.id);
      });

      expect(player1.score).toBe(16); // 3 + 5 + 8
    });
  });

  describe('Deck Composition Rules', () => {
    test('should have correct number of each card type', () => {
      const newGame = gameEngine.createGame(['Player1', 'Player2']);
      const allCards = [...newGame.deck];

      // Add cards from hands and features in play
      newGame.players.forEach(player => allCards.push(...player.hand));
      allCards.push(...newGame.featuresInPlay);

      const featureCards = allCards.filter(card => card.requirements);
      const resourceCards = allCards.filter(card => card.role);
      const eventCards = allCards.filter(card => card.type && !card.role && !card.requirements);

      expect(featureCards).toHaveLength(15); // 15 feature cards
      expect(resourceCards).toHaveLength(27); // 27 resource cards
      expect(eventCards).toHaveLength(8); // 8 event cards
    });

    test('should validate resource distribution by role', () => {
      const newGame = gameEngine.createGame(['Player1', 'Player2']);
      const allCards = [...newGame.deck];

      newGame.players.forEach(player => allCards.push(...player.hand));
      allCards.push(...newGame.featuresInPlay);

      const resourceCards = allCards.filter(card => card.role);
      const devCards = resourceCards.filter(card => card.role === 'dev');
      const pmCards = resourceCards.filter(card => card.role === 'pm');
      const uxCards = resourceCards.filter(card => card.role === 'ux');

      expect(devCards).toHaveLength(9); // 9 dev cards
      expect(pmCards).toHaveLength(9); // 9 pm cards
      expect(uxCards).toHaveLength(9); // 9 ux cards
    });
  });

  describe('Event Card Rules', () => {
    test('should handle layoff event effects', () => {
      const player1 = gameState.players[0];
      const initialHandSize = player1.hand.length;

      // Create layoff event
      const layoffEvent = new EventCard('layoff-test', 'layoff', 'Remove one resource', { count: 1 });

      // Add some resource cards to hand
      const devResource = new ResourceCard('dev-test', 'dev', 'senior', 3);
      player1.hand.push(devResource);

      // Simulate layoff event
      gameEngine.applyEventEffect(gameState.id, layoffEvent);

      // Should remove one resource from a random player
      const totalResourcesAfter = gameState.players.reduce((sum, player) => {
        return sum + player.hand.filter(card => card.role).length;
      }, 0);

      // Verify resource was removed (exact count depends on random selection)
      expect(totalResourcesAfter).toBeLessThan(
        gameState.players.reduce((sum, player) => sum + initialHandSize, 0)
      );
    });
  });

  describe('Game State Validation', () => {
    test('should maintain valid game state after operations', () => {
      const player1 = gameState.players[0];

      // Perform various operations
      gameEngine.drawCard(gameState.id, player1.id);
      gameEngine.endTurn(gameState.id, player1.id);

      // Validate game state integrity
      expect(gameState.currentPlayerIndex).toBeGreaterThanOrEqual(0);
      expect(gameState.currentPlayerIndex).toBeLessThan(gameState.players.length);
      expect(gameState.currentRound).toBeGreaterThan(0);
      expect(gameState.currentRound).toBeLessThanOrEqual(gameState.maxRounds);

      // Validate player data
      gameState.players.forEach(player => {
        expect(player.hand.length).toBeLessThanOrEqual(7);
        expect(player.score).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle game state edge cases', () => {
      // Test with minimal deck
      gameState.deck = gameState.deck.slice(0, 2);

      const player1 = gameState.players[0];

      // Draw remaining cards
      gameEngine.drawCard(gameState.id, player1.id);
      gameEngine.endTurn(gameState.id, player1.id);

      const player2 = gameState.players[1];
      gameEngine.drawCard(gameState.id, player2.id);

      // Deck should be empty now
      expect(gameState.deck).toHaveLength(0);

      // Should handle empty deck gracefully
      expect(() => gameEngine.drawCard(gameState.id, player2.id))
        .toThrow('Deck is empty');
    });
  });
});
