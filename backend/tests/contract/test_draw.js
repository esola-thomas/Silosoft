const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/games/{gameId}/actions/draw - Contract Tests', () => {
  let gameId;
  let playerId;
  let secondPlayerId;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/games')
      .send({
        playerNames: ['Alice', 'Bob'],
      });
    gameId = response.body.id;
    playerId = response.body.players[0].id;
    secondPlayerId = response.body.players[1].id;
  });

  describe('Draw a card action', () => {
    it('should allow current player to draw a card', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({
          playerId: playerId,
        })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('card');
      expect(response.body.card).toHaveProperty('id');
      expect(response.body.card).toHaveProperty('cardType');
      expect(['feature', 'resource', 'event']).toContain(response.body.card.cardType);
      expect(response.body).toHaveProperty('gameState');
      expect(response.body.gameState).toHaveProperty('id', gameId);
    });

    it('should add drawn card to player hand', async () => {
      const beforeState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const initialHandSize = beforeState.body.players[0].hand.length;

      const drawResponse = await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({
          playerId: playerId,
        })
        .expect(200);

      const currentPlayer = drawResponse.body.gameState.players.find(
        (p) => p.id === playerId,
      );
      if (drawResponse.body.card.cardType === 'event') {
        expect(currentPlayer.hand.length).toBe(initialHandSize);
      } else {
        expect(currentPlayer.hand.length).toBe(initialHandSize + 1);
        expect(currentPlayer.hand.map((c) => c.id)).toContain(drawResponse.body.card.id);
      }
    });

    it('should remove card from deck', async () => {
      const beforeState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const initialDeckSize = beforeState.body.deck.length;

      const drawResponse = await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({
          playerId: playerId,
        })
        .expect(200);

      expect(drawResponse.body.gameState.deck.length).toBe(initialDeckSize - 1);
    });

    it('should prevent non-current player from drawing', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({
          playerId: secondPlayerId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/not your turn/i);
      expect(response.body).toHaveProperty('code', 'INVALID_TURN');
    });

    it('should handle empty deck scenario', async () => {
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({
            playerId: playerId,
          });
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({
            playerId: playerId,
          });
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({
            playerId: secondPlayerId,
          });
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({
            playerId: secondPlayerId,
          });
      }

      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({
          playerId: playerId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/deck.*empty/i);
    });

    it('should reject draw without playerId', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject draw for non-existent game', async () => {
      const response = await request(app)
        .post('/api/v1/games/non-existent-game/actions/draw')
        .send({
          playerId: 'some-player',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle feature card draw correctly', async () => {
      let drawnFeature = null;
      while (!drawnFeature) {
        const response = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({
            playerId: playerId,
          });

        if (response.body.card.cardType === 'feature') {
          drawnFeature = response.body.card;
          expect(drawnFeature).toHaveProperty('name');
          expect(drawnFeature).toHaveProperty('requirements');
          expect(drawnFeature).toHaveProperty('points');
          expect([3, 5, 8]).toContain(drawnFeature.points);
          break;
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({
            playerId: playerId,
          });
      }
    });

    it('should handle resource card draw correctly', async () => {
      let drawnResource = null;
      while (!drawnResource) {
        const response = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({
            playerId: playerId,
          });

        if (response.body.card.cardType === 'resource') {
          drawnResource = response.body.card;
          expect(drawnResource).toHaveProperty('role');
          expect(['dev', 'pm', 'ux']).toContain(drawnResource.role);
          expect(drawnResource).toHaveProperty('level');
          expect(['entry', 'junior', 'senior']).toContain(drawnResource.level);
          expect(drawnResource).toHaveProperty('value');
          expect([1, 2, 3]).toContain(drawnResource.value);
          break;
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({
            playerId: playerId,
          });
      }
    });

    it('should handle event card draw correctly', async () => {
      let drawnEvent = null;
      while (!drawnEvent) {
        const response = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({
            playerId: playerId,
          });

        if (response.body.card.cardType === 'event') {
          drawnEvent = response.body.card;
          expect(drawnEvent).toHaveProperty('type');
          expect(['layoff', 'reorg', 'contractor', 'competition', 'pto']).toContain(
            drawnEvent.type,
          );
          expect(drawnEvent).toHaveProperty('effect');
          break;
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({
            playerId: playerId,
          });
      }
    });
  });
});
