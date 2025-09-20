const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/games - Contract Tests', () => {
  describe('Create new game session', () => {
    it('should create a game with 2 players', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('players');
      expect(response.body.players).toHaveLength(2);
      expect(response.body.players[0]).toHaveProperty('name', 'Alice');
      expect(response.body.players[1]).toHaveProperty('name', 'Bob');
      expect(response.body).toHaveProperty('currentRound', 1);
      expect(response.body).toHaveProperty('currentPlayerIndex', 0);
      expect(response.body).toHaveProperty('gamePhase', 'lobby');
      expect(response.body).toHaveProperty('deck');
      expect(response.body.deck.length).toBeGreaterThan(0);
    });

    it('should create a game with 3 players', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie'],
        })
        .expect(201);

      expect(response.body.players).toHaveLength(3);
      expect(response.body.players[2]).toHaveProperty('name', 'Charlie');
    });

    it('should create a game with 4 players (maximum)', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie', 'Diana'],
        })
        .expect(201);

      expect(response.body.players).toHaveLength(4);
    });

    it('should reject game with 1 player (below minimum)', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice'],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/2-4 players/i);
    });

    it('should reject game with 5 players (above maximum)', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/2-4 players/i);
    });

    it('should reject empty player names array', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing playerNames field', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should deal initial cards to players', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201);

      response.body.players.forEach((player) => {
        expect(player).toHaveProperty('hand');
        expect(Array.isArray(player.hand)).toBe(true);
        expect(player.hand.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should initialize player scores to 0', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201);

      response.body.players.forEach((player) => {
        expect(player).toHaveProperty('score', 0);
      });
    });

    it('should have feature cards in play', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({
          playerNames: ['Alice', 'Bob'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('featuresInPlay');
      expect(Array.isArray(response.body.featuresInPlay)).toBe(true);
      expect(response.body.featuresInPlay.length).toBeGreaterThanOrEqual(2);
    });
  });
});
