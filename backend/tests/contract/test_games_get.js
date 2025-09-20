const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/games/{gameId} - Contract Tests', () => {
  let gameId;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/games')
      .send({
        playerNames: ['Alice', 'Bob'],
      });
    gameId = response.body.id;
  });

  describe('Get current game state', () => {
    it('should retrieve game state by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id', gameId);
      expect(response.body).toHaveProperty('players');
      expect(response.body).toHaveProperty('currentRound');
      expect(response.body).toHaveProperty('currentPlayerIndex');
      expect(response.body).toHaveProperty('deck');
      expect(response.body).toHaveProperty('featuresInPlay');
      expect(response.body).toHaveProperty('gamePhase');
      expect(response.body).toHaveProperty('winCondition');
    });

    it('should return 404 for non-existent game ID', async () => {
      const response = await request(app)
        .get('/api/v1/games/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/not found/i);
    });

    it('should maintain game state between requests', async () => {
      const firstResponse = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const secondResponse = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(firstResponse.body).toEqual(secondResponse.body);
    });

    it('should show player hands', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      response.body.players.forEach((player) => {
        expect(player).toHaveProperty('hand');
        expect(Array.isArray(player.hand)).toBe(true);
        player.hand.forEach((card) => {
          expect(card).toHaveProperty('id');
          expect(card).toHaveProperty('cardType');
        });
      });
    });

    it('should show features in play', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(response.body.featuresInPlay).toBeDefined();
      response.body.featuresInPlay.forEach((feature) => {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('cardType', 'feature');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('requirements');
        expect(feature).toHaveProperty('points');
        expect(feature).toHaveProperty('assignedResources');
        expect(feature).toHaveProperty('completed');
      });
    });

    it('should show deck with remaining cards', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(response.body.deck).toBeDefined();
      expect(Array.isArray(response.body.deck)).toBe(true);
      expect(response.body.deck.length).toBeGreaterThan(0);
    });

    it('should show current game phase', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(response.body.gamePhase).toBeDefined();
      expect(['lobby', 'setup', 'playing', 'ended']).toContain(response.body.gamePhase);
    });

    it('should show win condition status', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(response.body.winCondition).toBeDefined();
      expect(typeof response.body.winCondition).toBe('boolean');
    });

    it('should show temporarily unavailable resources', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      response.body.players.forEach((player) => {
        expect(player).toHaveProperty('temporarilyUnavailable');
        expect(Array.isArray(player.temporarilyUnavailable)).toBe(true);
      });
    });

    it('should return consistent player IDs', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      response.body.players.forEach((player) => {
        expect(player).toHaveProperty('id');
        expect(typeof player.id).toBe('string');
        expect(player.id).toMatch(/^player-/);
      });
    });
  });
});
