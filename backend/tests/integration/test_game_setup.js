const request = require('supertest');
const app = require('../../src/app');

describe('Game Setup Integration Tests', () => {
  describe('Initial game setup and card dealing', () => {
    it('should create game with proper deck composition', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie'],
        })
        .expect(201);

      const game = response.body;

      const totalCards = game.deck.length +
        game.players.reduce((sum, p) => sum + p.hand.length, 0) +
        game.featuresInPlay.length;

      expect(totalCards).toBeLessThanOrEqual(50);

      const allCards = [
        ...game.deck,
        ...game.players.flatMap(p => p.hand),
        ...game.featuresInPlay
      ];

      const featureCards = allCards.filter(c => c.cardType === 'feature');
      const resourceCards = allCards.filter(c => c.cardType === 'resource');
      const eventCards = allCards.filter(c => c.cardType === 'event');

      expect(featureCards.length).toBeLessThanOrEqual(15);
      expect(resourceCards.length).toBeLessThanOrEqual(27);
      expect(eventCards.length).toBeLessThanOrEqual(8);
    });

    it('should deal initial hands to all players', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201);

      const game = response.body;

      game.players.forEach(player => {
        expect(player.hand).toBeDefined();
        expect(player.hand.length).toBeGreaterThanOrEqual(3);
        expect(player.hand.length).toBeLessThanOrEqual(5);

        player.hand.forEach(card => {
          expect(['resource', 'feature', 'event']).toContain(card.cardType);
        });
      });
    });

    it('should place initial feature cards in play', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie', 'Diana'],
        })
        .expect(201);

      const game = response.body;

      expect(game.featuresInPlay).toBeDefined();
      expect(game.featuresInPlay.length).toBeGreaterThanOrEqual(2);
      expect(game.featuresInPlay.length).toBeLessThanOrEqual(4);

      game.featuresInPlay.forEach(feature => {
        expect(feature.cardType).toBe('feature');
        expect(feature.completed).toBe(false);
        expect(feature.assignedResources).toEqual([]);
        expect(feature.requirements).toBeDefined();
        expect(feature.points).toBeDefined();
      });
    });

    it('should shuffle deck before dealing', async () => {
      const games = [];

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/v1/games')
          .send({
            playerNames: ['Player1', 'Player2'],
          })
          .expect(201);

        games.push(response.body);
      }

      const firstHandCards = games.map(g =>
        g.players[0].hand.map(c => c.id).sort().join(',')
      );

      const allSame = firstHandCards.every(hand => hand === firstHandCards[0]);
      expect(allSame).toBe(false);
    });

    it('should initialize game state correctly', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie'],
        })
        .expect(201);

      const game = response.body;

      expect(game.id).toBeDefined();
      expect(game.currentRound).toBe(1);
      expect(game.currentPlayerIndex).toBe(0);
      expect(game.gamePhase).toBe('playing');
      expect(game.winCondition).toBe(false);

      game.players.forEach((player, index) => {
        expect(player.id).toBeDefined();
        expect(player.name).toBeDefined();
        expect(player.score).toBe(0);
        expect(player.temporarilyUnavailable).toEqual([]);
      });
    });

    it('should validate resource card distribution', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201);

      const game = response.body;
      const allCards = [
        ...game.deck,
        ...game.players.flatMap(p => p.hand)
      ];

      const resourceCards = allCards.filter(c => c.cardType === 'resource');

      const devCards = resourceCards.filter(r => r.role === 'dev');
      const pmCards = resourceCards.filter(r => r.role === 'pm');
      const uxCards = resourceCards.filter(r => r.role === 'ux');

      expect(devCards.length).toBeLessThanOrEqual(9);
      expect(pmCards.length).toBeLessThanOrEqual(9);
      expect(uxCards.length).toBeLessThanOrEqual(9);

      const entryLevel = resourceCards.filter(r => r.level === 'entry' && r.value === 1);
      const juniorLevel = resourceCards.filter(r => r.level === 'junior' && r.value === 2);
      const seniorLevel = resourceCards.filter(r => r.level === 'senior' && r.value === 3);

      expect(entryLevel.length).toBeLessThanOrEqual(9);
      expect(juniorLevel.length).toBeLessThanOrEqual(9);
      expect(seniorLevel.length).toBeLessThanOrEqual(9);
    });

    it('should validate feature card complexity distribution', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201);

      const game = response.body;
      const allFeatures = [
        ...game.featuresInPlay,
        ...game.deck.filter(c => c.cardType === 'feature'),
        ...game.players.flatMap(p => p.hand.filter(c => c.cardType === 'feature'))
      ];

      const basicFeatures = allFeatures.filter(f => f.points === 3);
      const complexFeatures = allFeatures.filter(f => f.points === 5);
      const epicFeatures = allFeatures.filter(f => f.points === 8);

      expect(basicFeatures.length).toBeGreaterThan(0);
      expect(complexFeatures.length).toBeGreaterThan(0);
      expect(epicFeatures.length).toBeGreaterThan(0);

      expect(basicFeatures.length + complexFeatures.length + epicFeatures.length)
        .toBeLessThanOrEqual(15);
    });

    it('should ensure no duplicate cards in game', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie'],
        })
        .expect(201);

      const game = response.body;
      const allCards = [
        ...game.deck,
        ...game.players.flatMap(p => p.hand),
        ...game.featuresInPlay
      ];

      const cardIds = allCards.map(c => c.id);
      const uniqueIds = new Set(cardIds);

      expect(cardIds.length).toBe(uniqueIds.size);
    });

    it('should handle 2-player game setup correctly', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201);

      const game = response.body;

      expect(game.players).toHaveLength(2);
      expect(game.players[0].hand.length).toBeGreaterThanOrEqual(4);
      expect(game.players[1].hand.length).toBeGreaterThanOrEqual(4);
      expect(game.featuresInPlay.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle 4-player game setup correctly', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie', 'Diana'],
        })
        .expect(201);

      const game = response.body;

      expect(game.players).toHaveLength(4);

      game.players.forEach(player => {
        expect(player.hand.length).toBeGreaterThanOrEqual(3);
      });

      expect(game.featuresInPlay.length).toBeGreaterThanOrEqual(3);

      const totalInitialCards =
        game.players.reduce((sum, p) => sum + p.hand.length, 0) +
        game.featuresInPlay.length;

      expect(totalInitialCards).toBeLessThanOrEqual(25);
    });
  });
});