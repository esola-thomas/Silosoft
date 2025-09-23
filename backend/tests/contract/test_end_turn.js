const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/games/{gameId}/actions/end-turn - Contract Tests', () => {
  let gameId;
  let playerId;
  let secondPlayerId;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/games')
      .send({
        playerNames: ['Alice', 'Bob', 'Charlie'],
      });
    gameId = response.body.id;
    playerId = response.body.players[0].id;
    secondPlayerId = response.body.players[1].id;
  });

  describe('End turn action', () => {
    it('should end current player turn successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({
          playerId: playerId,
        })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id', gameId);
      expect(response.body).toHaveProperty('currentPlayerIndex', 1);
    });

    it('should advance to next player', async () => {
      const beforeState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(beforeState.body.currentPlayerIndex).toBe(0);

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({
          playerId: playerId,
        })
        .expect(200);

      const afterState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(afterState.body.currentPlayerIndex).toBe(1);
    });

    it('should wrap around to first player after last player', async () => {
      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({ playerId })
        .expect(200);

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({ playerId: secondPlayerId })
        .expect(200);

      const thirdPlayerId = (
        await request(app).get(`/api/v1/games/${gameId}`)
      ).body.players[2].id;

      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({ playerId: thirdPlayerId })
        .expect(200);

      expect(response.body.currentPlayerIndex).toBe(0);
    });

    it('should increment round after all players have taken turns', async () => {
      const initialState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(initialState.body.currentRound).toBe(1);

      const players = initialState.body.players;
      for (let i = 0; i < players.length; i++) {
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: players[i].id })
          .expect(200);
      }

      const afterRoundState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(afterRoundState.body.currentRound).toBe(2);
    });

    it('should prevent non-current player from ending turn', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({
          playerId: secondPlayerId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/not your turn/i);
      expect(response.body).toHaveProperty('code', 'INVALID_TURN');
    });

    it('should reject end turn without playerId', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject end turn for non-existent game', async () => {
      const response = await request(app)
        .post('/api/v1/games/non-existent-game/actions/end-turn')
        .send({
          playerId: 'some-player',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should maintain game state between turns', async () => {
      const beforeTurnState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const playerHands = beforeTurnState.body.players.map((p) => ({
        id: p.id,
        handSize: p.hand.length,
      }));

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({
          playerId: playerId,
        })
        .expect(200);

      const afterTurnState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      afterTurnState.body.players.forEach((player) => {
        const originalPlayer = playerHands.find((p) => p.id === player.id);
        expect(player.hand.length).toBe(originalPlayer.handSize);
      });
    });

    it('should end game after 10 rounds', async () => {
      for (let round = 1; round <= 10; round++) {
        const gameState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        expect(gameState.body.currentRound).toBe(round);

        for (let playerIndex = 0; playerIndex < gameState.body.players.length; playerIndex++) {
          const currentPlayerId = gameState.body.players[playerIndex].id;
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayerId })
            .expect(200);
        }

        if (round === 10) {
          const finalState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          expect(finalState.body.gamePhase).toBe('ended');
          expect(finalState.body.currentRound).toBe(10);
        }
      }
    });

    it('should check win condition after each turn', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({
          playerId: playerId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('winCondition');
      expect(typeof response.body.winCondition).toBe('boolean');
    });

    it('should update PTO/PLM resource availability', async () => {
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      if (gameState.body.players[0].temporarilyUnavailable.length > 0) {
        const unavailableResource = gameState.body.players[0].temporarilyUnavailable[0];
        const returnRound = unavailableResource.unavailableUntil;

        while (gameState.body.currentRound < returnRound) {
          for (const player of gameState.body.players) {
            await request(app)
              .post(`/api/v1/games/${gameId}/actions/end-turn`)
              .send({ playerId: player.id })
              .expect(200);
          }
        }

        const updatedState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const resourceStillUnavailable = updatedState.body.players[0].temporarilyUnavailable.find(
          (r) => r.id === unavailableResource.id,
        );

        if (updatedState.body.currentRound >= returnRound) {
          expect(resourceStillUnavailable).toBeUndefined();
        }
      }
    });

    it('should preserve feature assignments between turns', async () => {
      const beforeState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const featuresInPlay = beforeState.body.featuresInPlay;

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({
          playerId: playerId,
        })
        .expect(200);

      const afterState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(afterState.body.featuresInPlay).toEqual(featuresInPlay);
    });

    it('should maintain player scores between turns', async () => {
      const beforeState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const scores = beforeState.body.players.map((p) => ({
        id: p.id,
        score: p.score,
      }));

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({
          playerId: playerId,
        })
        .expect(200);

      const afterState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      afterState.body.players.forEach((player) => {
        const originalScore = scores.find((s) => s.id === player.id);
        expect(player.score).toBe(originalScore.score);
      });
    });
  });
});