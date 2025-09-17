const GameEngine = require('../../src/services/GameEngine');
const EventCard = require('../../src/models/EventCard');
const ResourceCard = require('../../src/models/ResourceCard');
const FeatureCard = require('../../src/models/FeatureCard');

describe('Card Effect Logic - Unit Tests', () => {
  let gameEngine;
  let gameState;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameState = gameEngine.createGame(['Alice', 'Bob', 'Charlie']);

    // Add some resources to player hands for testing
    gameState.players.forEach((player, index) => {
      const devResource = new ResourceCard(`dev-${index}`, 'dev', 'senior', 3);
      const pmResource = new ResourceCard(`pm-${index}`, 'pm', 'junior', 1);
      const uxResource = new ResourceCard(`ux-${index}`, 'ux', 'entry', 1);
      player.hand.push(devResource, pmResource, uxResource);
    });
  });

  describe('Feature Card Effects', () => {
    test('should correctly calculate feature completion requirements', () => {
      const feature = new FeatureCard('complex-feature', 'Complex Feature', {
        dev: 2,
        pm: 1,
        ux: 1
      }, 8);

      expect(feature.isCompleted()).toBe(false);
      expect(feature.getRemainingRequirements()).toEqual({
        dev: 2,
        pm: 1,
        ux: 1
      });
    });

    test('should track assigned resources correctly', () => {
      const feature = new FeatureCard('test-feature', 'Test Feature', {
        dev: 2,
        pm: 1
      }, 5);

      const devResource1 = new ResourceCard('dev1', 'dev', 'senior', 3);
      const devResource2 = new ResourceCard('dev2', 'dev', 'junior', 1);
      const pmResource = new ResourceCard('pm1', 'pm', 'senior', 3);

      // Assign resources
      feature.assignResource(devResource1);
      expect(feature.assignedResources).toHaveLength(1);
      expect(feature.isCompleted()).toBe(false);

      feature.assignResource(pmResource);
      expect(feature.assignedResources).toHaveLength(2);
      expect(feature.isCompleted()).toBe(false); // Still need 1 more dev

      feature.assignResource(devResource2);
      expect(feature.assignedResources).toHaveLength(3);
      expect(feature.isCompleted()).toBe(true);
    });

    test('should calculate completion percentage', () => {
      const feature = new FeatureCard('progress-feature', 'Progress Feature', {
        dev: 3,
        pm: 2,
        ux: 1
      }, 8);

      // Total requirement value: 3 + 2 + 1 = 6
      expect(feature.getCompletionPercentage()).toBe(0);

      // Assign 1 dev (value 1)
      const devResource = new ResourceCard('dev1', 'dev', 'entry', 1);
      feature.assignResource(devResource);
      expect(feature.getCompletionPercentage()).toBeCloseTo(16.67, 1); // 1/6 ≈ 16.67%

      // Assign 1 pm (value 2)
      const pmResource = new ResourceCard('pm1', 'pm', 'junior', 2);
      feature.assignResource(pmResource);
      expect(feature.getCompletionPercentage()).toBe(50); // 3/6 = 50%
    });

    test('should prevent over-assignment of resources', () => {
      const feature = new FeatureCard('small-feature', 'Small Feature', {
        dev: 1
      }, 3);

      const devResource1 = new ResourceCard('dev1', 'dev', 'senior', 3);
      const devResource2 = new ResourceCard('dev2', 'dev', 'junior', 1);

      // First assignment should work
      feature.assignResource(devResource1);
      expect(feature.isCompleted()).toBe(true);

      // Second assignment should be rejected
      expect(() => feature.assignResource(devResource2))
        .toThrow('Feature is already completed');
    });
  });

  describe('Resource Card Effects', () => {
    test('should validate resource availability based on round', () => {
      const resource = new ResourceCard('temp-dev', 'dev', 'senior', 3);

      // Available initially
      expect(resource.isAvailable(1)).toBe(true);
      expect(resource.isAvailable(5)).toBe(true);

      // Make unavailable until round 3
      resource.unavailableUntil = 3;

      expect(resource.isAvailable(1)).toBe(false);
      expect(resource.isAvailable(2)).toBe(false);
      expect(resource.isAvailable(3)).toBe(true);
      expect(resource.isAvailable(4)).toBe(true);
    });

    test('should handle resource value calculation by level', () => {
      const entryDev = new ResourceCard('entry-dev', 'dev', 'entry', 1);
      const juniorDev = new ResourceCard('junior-dev', 'dev', 'junior', 2);
      const seniorDev = new ResourceCard('senior-dev', 'dev', 'senior', 3);

      expect(entryDev.value).toBe(1);
      expect(juniorDev.value).toBe(2);
      expect(seniorDev.value).toBe(3);

      // Value should match skill level
      expect(entryDev.getSkillValue()).toBe(1);
      expect(juniorDev.getSkillValue()).toBe(2);
      expect(seniorDev.getSkillValue()).toBe(3);
    });

    test('should track assignment status', () => {
      const resource = new ResourceCard('test-dev', 'dev', 'senior', 3);
      const feature = new FeatureCard('test-feature', 'Test Feature', { dev: 1 }, 3);

      expect(resource.isAssigned()).toBe(false);
      expect(resource.assignedTo).toBeNull();

      resource.assignedTo = feature.id;

      expect(resource.isAssigned()).toBe(true);
      expect(resource.assignedTo).toBe(feature.id);
    });
  });

  describe('Event Card Effects', () => {
    describe('Layoff Event', () => {
      test('should remove specified number of resources randomly', () => {
        const layoffEvent = new EventCard('layoff-1', 'layoff', 'Remove 2 random resources', { count: 2 });

        // Count initial resources
        const initialResourceCount = gameState.players.reduce((total, player) => {
          return total + player.hand.filter(card => card.role).length;
        }, 0);

        // Apply layoff effect
        gameEngine.applyEventEffect(gameState.id, layoffEvent);

        // Count resources after layoff
        const finalResourceCount = gameState.players.reduce((total, player) => {
          return total + player.hand.filter(card => card.role).length;
        }, 0);

        expect(finalResourceCount).toBe(initialResourceCount - 2);
      });

      test('should handle layoff when insufficient resources', () => {
        // Remove most resources first
        gameState.players.forEach(player => {
          player.hand = player.hand.filter(card => !card.role).slice(0, 1);
        });

        const layoffEvent = new EventCard('big-layoff', 'layoff', 'Remove 10 resources', { count: 10 });

        expect(() => gameEngine.applyEventEffect(gameState.id, layoffEvent))
          .not.toThrow(); // Should handle gracefully

        // Should remove all available resources
        const finalResourceCount = gameState.players.reduce((total, player) => {
          return total + player.hand.filter(card => card.role).length;
        }, 0);

        expect(finalResourceCount).toBe(0);
      });
    });

    describe('PTO Event', () => {
      test('should make resources temporarily unavailable', () => {
        const ptoEvent = new EventCard('pto-1', 'pto', 'Resources unavailable for 2 rounds', {
          count: 2,
          duration: 2
        });

        const player = gameState.players[0];
        const resourcesBefore = player.hand.filter(card => card.role).length;

        // Apply PTO effect
        gameEngine.applyEventEffect(gameState.id, ptoEvent);

        // Check that resources are marked as unavailable
        const unavailableResources = player.hand.filter(card =>
          card.role && card.unavailableUntil > gameState.currentRound
        );

        expect(unavailableResources.length).toBe(Math.min(2, resourcesBefore));

        // Verify unavailability duration
        unavailableResources.forEach(resource => {
          expect(resource.unavailableUntil).toBe(gameState.currentRound + 2);
        });
      });

      test('should restore resources after PTO duration', () => {
        const ptoEvent = new EventCard('short-pto', 'pto', 'Resource unavailable for 1 round', {
          count: 1,
          duration: 1
        });

        const player = gameState.players[0];
        const devResource = player.hand.find(card => card.role === 'dev');

        // Apply PTO
        gameEngine.applyEventEffect(gameState.id, ptoEvent);

        // Resource should be unavailable in current round
        expect(devResource.isAvailable(gameState.currentRound)).toBe(false);

        // Resource should be available after duration
        expect(devResource.isAvailable(gameState.currentRound + 2)).toBe(true);
      });
    });

    describe('Competition Event', () => {
      test('should delay feature completion', () => {
        const competitionEvent = new EventCard('competition-1', 'competition',
          'All features require 1 additional dev', { role: 'dev', additional: 1 });

        const feature = new FeatureCard('test-feature', 'Test Feature', { dev: 1, pm: 1 }, 5);
        gameState.featuresInPlay.push(feature);

        // Apply competition effect
        gameEngine.applyEventEffect(gameState.id, competitionEvent);

        // Feature requirements should be increased
        expect(feature.requirements.dev).toBe(2); // Was 1, now 2
        expect(feature.requirements.pm).toBe(1); // Unchanged
      });

      test('should handle multiple competition events', () => {
        const feature = new FeatureCard('big-feature', 'Big Feature', { dev: 2, pm: 1, ux: 1 }, 8);
        gameState.featuresInPlay.push(feature);

        const comp1 = new EventCard('comp-1', 'competition', 'Dev +1', { role: 'dev', additional: 1 });
        const comp2 = new EventCard('comp-2', 'competition', 'PM +1', { role: 'pm', additional: 1 });

        gameEngine.applyEventEffect(gameState.id, comp1);
        gameEngine.applyEventEffect(gameState.id, comp2);

        expect(feature.requirements.dev).toBe(3); // 2 + 1
        expect(feature.requirements.pm).toBe(2); // 1 + 1
        expect(feature.requirements.ux).toBe(1); // Unchanged
      });
    });

    describe('Contractor Event', () => {
      test('should provide temporary high-value resource', () => {
        const contractorEvent = new EventCard('contractor-1', 'contractor',
          'Add senior dev for 3 rounds', { role: 'dev', level: 'senior', duration: 3 });

        const player = gameState.players[0];
        const initialHandSize = player.hand.length;

        // Apply contractor effect
        gameEngine.applyEventEffect(gameState.id, contractorEvent);

        // Player should have new contractor resource
        expect(player.hand.length).toBe(initialHandSize + 1);

        const contractorResource = player.hand.find(card =>
          card.role === 'dev' && card.level === 'senior' && card.unavailableUntil
        );

        expect(contractorResource).toBeDefined();
        expect(contractorResource.value).toBe(3); // Senior level
        expect(contractorResource.unavailableUntil).toBe(gameState.currentRound + 3);
      });

      test('should remove contractor after duration', () => {
        const shortContractorEvent = new EventCard('short-contractor', 'contractor',
          'Add junior PM for 1 round', { role: 'pm', level: 'junior', duration: 1 });

        const player = gameState.players[0];

        gameEngine.applyEventEffect(gameState.id, shortContractorEvent);

        // Find contractor
        const contractor = player.hand.find(card =>
          card.role === 'pm' && card.level === 'junior' && card.unavailableUntil
        );

        expect(contractor).toBeDefined();

        // Advance rounds to expire contractor
        gameState.currentRound += 2;

        // Contractor should be marked as expired/removed
        expect(contractor.isAvailable(gameState.currentRound)).toBe(false);
      });
    });

    describe('Reorg Event', () => {
      test('should shuffle player hands', () => {
        const reorgEvent = new EventCard('reorg-1', 'reorg', 'Shuffle all player hands');

        // Capture initial hand compositions
        const initialHands = gameState.players.map(player => [...player.hand]);

        // Apply reorg effect
        gameEngine.applyEventEffect(gameState.id, reorgEvent);

        // Verify hands were shuffled (at least some difference)
        let handsChanged = false;
        for (let i = 0; i < gameState.players.length; i++) {
          const initialHand = initialHands[i];
          const currentHand = gameState.players[i].hand;

          // Check if order or composition changed
          if (initialHand.length !== currentHand.length ||
              !initialHand.every((card, index) => card.id === currentHand[index]?.id)) {
            handsChanged = true;
            break;
          }
        }

        expect(handsChanged).toBe(true);

        // Verify total card count remains same
        const totalCardsBefore = initialHands.reduce((sum, hand) => sum + hand.length, 0);
        const totalCardsAfter = gameState.players.reduce((sum, player) => sum + player.hand.length, 0);
        expect(totalCardsAfter).toBe(totalCardsBefore);
      });
    });
  });

  describe('Card Interaction Effects', () => {
    test('should handle resource assignment to features with event modifications', () => {
      const feature = new FeatureCard('modified-feature', 'Modified Feature', { dev: 1 }, 3);
      gameState.featuresInPlay.push(feature);

      // Apply competition event to increase requirements
      const competition = new EventCard('comp', 'competition', 'Dev +1', { role: 'dev', additional: 1 });
      gameEngine.applyEventEffect(gameState.id, competition);

      // Now feature requires 2 dev instead of 1
      expect(feature.requirements.dev).toBe(2);

      const player = gameState.players[0];
      const devResource = player.hand.find(card => card.role === 'dev');

      // Assign one dev resource
      gameEngine.assignResource(gameState.id, player.id, devResource.id, feature.id);

      // Feature should not be completed yet
      expect(feature.isCompleted()).toBe(false);

      // Need another dev resource
      const anotherDev = new ResourceCard('dev-extra', 'dev', 'junior', 2);
      player.hand.push(anotherDev);

      gameEngine.assignResource(gameState.id, player.id, anotherDev.id, feature.id);

      // Now feature should be completed
      expect(feature.isCompleted()).toBe(true);
    });

    test('should prevent assignment of unavailable resources from PTO', () => {
      const player = gameState.players[0];
      const devResource = player.hand.find(card => card.role === 'dev');
      const feature = gameState.featuresInPlay[0];

      // Apply PTO to make resource unavailable
      const ptoEvent = new EventCard('pto', 'pto', 'Dev unavailable', { count: 1, duration: 2 });
      gameEngine.applyEventEffect(gameState.id, ptoEvent);

      // Try to assign unavailable resource
      expect(() => gameEngine.assignResource(gameState.id, player.id, devResource.id, feature.id))
        .toThrow('Resource is temporarily unavailable');
    });

    test('should handle contractor resource assignments', () => {
      const player = gameState.players[0];
      const feature = new FeatureCard('contractor-feature', 'Contractor Feature', { ux: 1 }, 3);
      gameState.featuresInPlay.push(feature);

      // Add contractor
      const contractorEvent = new EventCard('contractor', 'contractor', 'Add UX contractor',
        { role: 'ux', level: 'senior', duration: 2 });
      gameEngine.applyEventEffect(gameState.id, contractorEvent);

      const contractor = player.hand.find(card =>
        card.role === 'ux' && card.level === 'senior'
      );

      expect(contractor).toBeDefined();

      // Should be able to assign contractor to feature
      const completed = gameEngine.assignResource(gameState.id, player.id, contractor.id, feature.id);

      expect(completed).toBe(true);
      expect(player.score).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null or undefined event parameters', () => {
      const malformedEvent = new EventCard('bad-event', 'layoff', 'Bad event', {});

      expect(() => gameEngine.applyEventEffect(gameState.id, malformedEvent))
        .not.toThrow(); // Should handle gracefully
    });

    test('should handle events with invalid roles', () => {
      const invalidEvent = new EventCard('invalid', 'competition', 'Invalid role',
        { role: 'invalid-role', additional: 1 });

      expect(() => gameEngine.applyEventEffect(gameState.id, invalidEvent))
        .not.toThrow(); // Should ignore invalid roles
    });

    test('should maintain card state consistency after complex effects', () => {
      const player = gameState.players[0];

      // Apply multiple events
      const events = [
        new EventCard('layoff', 'layoff', 'Remove 1 resource', { count: 1 }),
        new EventCard('pto', 'pto', 'PTO 1 resource', { count: 1, duration: 1 }),
        new EventCard('contractor', 'contractor', 'Add contractor',
          { role: 'dev', level: 'senior', duration: 2 })
      ];

      events.forEach(event => {
        gameEngine.applyEventEffect(gameState.id, event);
      });

      // Verify game state is still valid
      expect(player.hand.length).toBeGreaterThanOrEqual(0);
      player.hand.forEach(card => {
        expect(card.id).toBeDefined();
        if (card.role) {
          expect(['dev', 'pm', 'ux']).toContain(card.role);
          expect(['entry', 'junior', 'senior']).toContain(card.level);
          expect([1, 2, 3]).toContain(card.value);
        }
      });
    });
  });
});