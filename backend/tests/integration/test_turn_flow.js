const request = require('supertest');
const app = require('../../src/app');

describe('Turn-based Gameplay Flow Integration Tests', () => {
  let gameId;
  let players;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/games')
      .send({
        playerNames: ['Alice', 'Bob', 'Charlie'],
      })
      .expect(201);

    gameId = response.body.id;
    players = response.body.players;
  });

  describe('Turn order and progression', () => {
    it('should enforce correct turn order', async () => {
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(gameState.body.currentPlayerIndex).toBe(0);

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({ playerId: players[1].id })
        .expect(400);

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({ playerId: players[0].id })
        .expect(200);
    });

    it('should cycle through all players in order', async () => {
      for (let i = 0; i < players.length; i++) {
        const gameState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        expect(gameState.body.currentPlayerIndex).toBe(i);

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: players[i].id })
          .expect(200);
      }

      const finalState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(finalState.body.currentPlayerIndex).toBe(0);
      expect(finalState.body.currentRound).toBe(2);
    });

    it('should track round progression correctly', async () => {
      for (let round = 1; round <= 3; round++) {
        const roundStartState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        expect(roundStartState.body.currentRound).toBe(round);

        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: players[playerIndex].id })
            .expect(200);
        }
      }

      const state = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(state.body.currentRound).toBe(4);
    });

    it('should allow draw-assign-end turn sequence', async () => {
      const drawResponse = await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({ playerId: players[0].id })
        .expect(200);

      const drawnCard = drawResponse.body.card;
      const updatedPlayer = drawResponse.body.gameState.players[0];

      if (drawnCard.cardType === 'resource') {
        const feature = drawResponse.body.gameState.featuresInPlay[0];

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/assign`)
          .send({
            playerId: players[0].id,
            resourceId: drawnCard.id,
            featureId: feature.id,
          })
          .expect(200);
      }

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({ playerId: players[0].id })
        .expect(200);

      const nextState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(nextState.body.currentPlayerIndex).toBe(1);
    });

    it('should maintain game state consistency across turns', async () => {
      const initialState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const initialFeatures = initialState.body.featuresInPlay.length;
      const initialDeckSize = initialState.body.deck.length;

      for (let i = 0; i < players.length; i++) {
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: players[i].id })
          .expect(200);

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: players[i].id })
          .expect(200);
      }

      const afterRoundState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(afterRoundState.body.featuresInPlay.length).toBeGreaterThanOrEqual(initialFeatures);
      expect(afterRoundState.body.deck.length).toBe(initialDeckSize - players.length);
    });

    it('should prevent actions out of turn', async () => {
      await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({ playerId: players[2].id })
        .expect(400);

      const player0Resource = players[0].hand.find(c => c.cardType === 'resource');
      if (player0Resource) {
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/assign`)
          .send({
            playerId: players[1].id,
            resourceId: player0Resource.id,
            featureId: 'some-feature',
          })
          .expect(400);
      }

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({ playerId: players[1].id })
        .expect(400);
    });

    it('should handle multiple actions per turn correctly', async () => {
      for (let turnCount = 0; turnCount < 3; turnCount++) {
        const currentState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = currentState.body.currentPlayerIndex;
        const currentPlayer = currentState.body.players[currentPlayerIndex];

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        const updatedState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const updatedPlayer = updatedState.body.players[currentPlayerIndex];
        const resources = updatedPlayer.hand.filter(c => c.cardType === 'resource');

        for (const resource of resources.slice(0, 2)) {
          const features = updatedState.body.featuresInPlay.filter(f => !f.completed);
          if (features.length > 0) {
            await request(app)
              .post(`/api/v1/games/${gameId}/actions/assign`)
              .send({
                playerId: currentPlayer.id,
                resourceId: resource.id,
                featureId: features[0].id,
              });
          }
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });

    it('should end game after 10 rounds maximum', async () => {
      for (let round = 1; round <= 10; round++) {
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: players[playerIndex].id })
            .expect(200);
        }
      }

      const finalState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(finalState.body.currentRound).toBe(10);
      expect(finalState.body.gamePhase).toBe('ended');
    });

    it('should track player actions within a turn', async () => {
      const initialState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const currentPlayer = initialState.body.players[0];
      const initialHandSize = currentPlayer.hand.length;

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({ playerId: currentPlayer.id })
        .expect(200);

      const afterDrawState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(afterDrawState.body.players[0].hand.length).toBe(initialHandSize + 1);
      expect(afterDrawState.body.currentPlayerIndex).toBe(0);

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({ playerId: currentPlayer.id })
        .expect(200);

      const afterTurnState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(afterTurnState.body.currentPlayerIndex).toBe(1);
    });

    it('should validate turn ownership for all actions', async () => {
      const actions = [
        {
          endpoint: `/api/v1/games/${gameId}/actions/draw`,
          body: { playerId: players[1].id },
        },
        {
          endpoint: `/api/v1/games/${gameId}/actions/assign`,
          body: {
            playerId: players[2].id,
            resourceId: 'some-resource',
            featureId: 'some-feature',
          },
        },
        {
          endpoint: `/api/v1/games/${gameId}/actions/end-turn`,
          body: { playerId: players[1].id },
        },
      ];

      for (const action of actions) {
        const response = await request(app)
          .post(action.endpoint)
          .send(action.body)
          .expect(400);

        expect(response.body.code).toBe('INVALID_TURN');
      }
    });
  });
});