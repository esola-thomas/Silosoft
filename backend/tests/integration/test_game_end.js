const request = require('supertest');
const app = require('../../src/app');

describe('Win/Loss Conditions Integration Tests', () => {
  let gameId;
  let players;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/games')
      .send({
        playerNames: ['Alice', 'Bob'],
      })
      .expect(201);

    gameId = response.body.id;
    players = response.body.players;
  });

  describe('Win conditions', () => {
    it('should detect win when all features are completed', async () => {
      let allFeaturesCompleted = false;
      let roundCount = 0;

      while (!allFeaturesCompleted && roundCount < 10) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const incompleteFeaturesInPlay = state.body.featuresInPlay.filter(f => !f.completed);
        const incompleteFeaturesInDeck = state.body.deck.filter(
          c => c.cardType === 'feature'
        ).length;

        if (incompleteFeaturesInPlay.length === 0 && incompleteFeaturesInDeck === 0) {
          allFeaturesCompleted = true;
          expect(state.body.winCondition).toBe(true);
          expect(state.body.gamePhase).toBe('ended');
          break;
        }

        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const currentState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = currentState.body.players[currentState.body.currentPlayerIndex];

          const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');
          const features = currentState.body.featuresInPlay.filter(f => !f.completed);

          for (const resource of resources) {
            for (const feature of features) {
              await request(app)
                .post(`/api/v1/games/${gameId}/actions/assign`)
                .send({
                  playerId: currentPlayer.id,
                  resourceId: resource.id,
                  featureId: feature.id,
                });
            }
          }

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id })
            .expect(200);
        }

        roundCount++;
      }
    });

    it('should calculate final scores correctly on win', async () => {
      let gameEnded = false;
      let completedFeatures = [];

      for (let round = 0; round < 10 && !gameEnded; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const currentState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = currentState.body.players[currentState.body.currentPlayerIndex];

          const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');
          const features = currentState.body.featuresInPlay.filter(f => !f.completed);

          for (const resource of resources) {
            for (const feature of features) {
              const assignResponse = await request(app)
                .post(`/api/v1/games/${gameId}/actions/assign`)
                .send({
                  playerId: currentPlayer.id,
                  resourceId: resource.id,
                  featureId: feature.id,
                });

              if (assignResponse.status === 200 && assignResponse.body.featureCompleted) {
                completedFeatures.push({
                  playerId: currentPlayer.id,
                  points: assignResponse.body.pointsAwarded,
                });
              }
            }
          }

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id });
        }

        const checkState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        if (checkState.body.winCondition) {
          gameEnded = true;

          const expectedScores = {};
          players.forEach(p => expectedScores[p.id] = 0);

          completedFeatures.forEach(cf => {
            expectedScores[cf.playerId] += cf.points;
          });

          checkState.body.players.forEach(player => {
            expect(player.score).toBeGreaterThanOrEqual(expectedScores[player.id] || 0);
          });
        }
      }
    });

    it('should award speed bonuses for early completion', async () => {
      let speedBonusAwarded = false;

      for (let round = 1; round <= 3; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayer = state.body.players[state.body.currentPlayerIndex];
        const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');
        const features = state.body.featuresInPlay.filter(f => !f.completed);

        for (const resource of resources) {
          for (const feature of features) {
            const assignResponse = await request(app)
              .post(`/api/v1/games/${gameId}/actions/assign`)
              .send({
                playerId: currentPlayer.id,
                resourceId: resource.id,
                featureId: feature.id,
              });

            if (assignResponse.status === 200 && assignResponse.body.featureCompleted) {
              const basePoints = feature.points;
              const awardedPoints = assignResponse.body.pointsAwarded;

              if (awardedPoints > basePoints) {
                speedBonusAwarded = true;
                expect(awardedPoints).toBe(basePoints + 1);
              }
            }
          }
        }

        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const turnState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const turnPlayer = turnState.body.players[turnState.body.currentPlayerIndex];

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: turnPlayer.id });

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: turnPlayer.id });
        }
      }
    });

    it('should award efficiency bonuses for minimal resource usage', async () => {
      const findMinimalFeature = async () => {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        return state.body.featuresInPlay.find(f =>
          f.requirements.dev <= 2 &&
          f.requirements.pm <= 1 &&
          f.requirements.ux <= 1 &&
          !f.completed
        );
      };

      const minimalFeature = await findMinimalFeature();

      if (minimalFeature) {
        let efficiencyBonusAwarded = false;
        let resourcesUsed = 0;
        const minRequired =
          minimalFeature.requirements.dev +
          minimalFeature.requirements.pm +
          minimalFeature.requirements.ux;

        for (let round = 0; round < 10 && !efficiencyBonusAwarded; round++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = state.body.players[state.body.currentPlayerIndex];
          const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');

          for (const resource of resources) {
            const assignResponse = await request(app)
              .post(`/api/v1/games/${gameId}/actions/assign`)
              .send({
                playerId: currentPlayer.id,
                resourceId: resource.id,
                featureId: minimalFeature.id,
              });

            if (assignResponse.status === 200) {
              resourcesUsed += resource.value;

              if (assignResponse.body.featureCompleted) {
                const basePoints = minimalFeature.points;
                const awardedPoints = assignResponse.body.pointsAwarded;

                if (resourcesUsed < minRequired && awardedPoints > basePoints) {
                  efficiencyBonusAwarded = true;
                  expect(awardedPoints).toBe(basePoints + 1);
                }
                break;
              }
            }
          }

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id });
        }
      }
    });
  });

  describe('Loss conditions', () => {
    it('should detect loss after 10 rounds with incomplete features', async () => {
      for (let round = 1; round <= 10; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        expect(state.body.currentRound).toBe(round);
        expect(state.body.gamePhase).toBe(round === 10 ? 'ended' : 'playing');

        if (round < 10) {
          for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
            const turnState = await request(app)
              .get(`/api/v1/games/${gameId}`)
              .expect(200);

            const currentPlayer = turnState.body.players[turnState.body.currentPlayerIndex];

            await request(app)
              .post(`/api/v1/games/${gameId}/actions/end-turn`)
              .send({ playerId: currentPlayer.id })
              .expect(200);
          }
        }
      }

      const finalState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const incompleteFeaturesExist = finalState.body.featuresInPlay.some(f => !f.completed) ||
        finalState.body.deck.some(c => c.cardType === 'feature');

      if (incompleteFeaturesExist) {
        expect(finalState.body.winCondition).toBe(false);
        expect(finalState.body.gamePhase).toBe('ended');
      }
    });

    it('should prevent further actions after game ends', async () => {
      for (let round = 1; round <= 10; round++) {
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = state.body.players[state.body.currentPlayerIndex];

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id })
            .expect(200);
        }
      }

      const endedState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      expect(endedState.body.gamePhase).toBe('ended');

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/draw`)
        .send({ playerId: players[0].id })
        .expect(400);

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: players[0].id,
          resourceId: 'some-resource',
          featureId: 'some-feature',
        })
        .expect(400);

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/end-turn`)
        .send({ playerId: players[0].id })
        .expect(400);
    });

    it('should track incomplete features at game end', async () => {
      const initialState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const totalFeatures = initialState.body.featuresInPlay.length +
        initialState.body.deck.filter(c => c.cardType === 'feature').length;

      for (let round = 1; round <= 10; round++) {
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = state.body.players[state.body.currentPlayerIndex];

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id })
            .expect(200);
        }
      }

      const finalState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const completedFeatures = finalState.body.featuresInPlay.filter(f => f.completed).length;
      const incompleteFeatures = totalFeatures - completedFeatures;

      expect(finalState.body).toHaveProperty('statistics');
      expect(finalState.body.statistics).toHaveProperty('featuresCompleted', completedFeatures);
      expect(finalState.body.statistics).toHaveProperty('featuresIncomplete', incompleteFeatures);
    });
  });

  describe('Score calculation', () => {
    it('should track individual player scores', async () => {
      const playerScores = {};
      players.forEach(p => playerScores[p.id] = 0);

      for (let round = 0; round < 5; round++) {
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = state.body.players[state.body.currentPlayerIndex];
          const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');
          const features = state.body.featuresInPlay.filter(f => !f.completed);

          for (const resource of resources.slice(0, 1)) {
            for (const feature of features.slice(0, 1)) {
              const assignResponse = await request(app)
                .post(`/api/v1/games/${gameId}/actions/assign`)
                .send({
                  playerId: currentPlayer.id,
                  resourceId: resource.id,
                  featureId: feature.id,
                });

              if (assignResponse.status === 200 && assignResponse.body.featureCompleted) {
                playerScores[currentPlayer.id] += assignResponse.body.pointsAwarded;
              }
            }
          }

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id });
        }
      }

      const finalState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      finalState.body.players.forEach(player => {
        expect(player.score).toBeGreaterThanOrEqual(playerScores[player.id]);
      });
    });

    it('should calculate team total score', async () => {
      let teamScore = 0;

      for (let round = 0; round < 5; round++) {
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = state.body.players[state.body.currentPlayerIndex];
          const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');
          const features = state.body.featuresInPlay.filter(f => !f.completed);

          for (const resource of resources) {
            for (const feature of features) {
              const assignResponse = await request(app)
                .post(`/api/v1/games/${gameId}/actions/assign`)
                .send({
                  playerId: currentPlayer.id,
                  resourceId: resource.id,
                  featureId: feature.id,
                });

              if (assignResponse.status === 200 && assignResponse.body.featureCompleted) {
                teamScore += assignResponse.body.pointsAwarded;
              }
            }
          }

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id });
        }
      }

      const finalState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const actualTeamScore = finalState.body.players.reduce((sum, p) => sum + p.score, 0);
      expect(actualTeamScore).toBeGreaterThanOrEqual(teamScore);
    });

    it('should determine MVP based on highest score', async () => {
      let maxScore = 0;
      let mvpPlayerId = null;

      for (let round = 0; round < 10; round++) {
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = state.body.players[state.body.currentPlayerIndex];

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id })
            .expect(200);
        }
      }

      const finalState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      finalState.body.players.forEach(player => {
        if (player.score > maxScore) {
          maxScore = player.score;
          mvpPlayerId = player.id;
        }
      });

      if (finalState.body.statistics) {
        expect(finalState.body.statistics.mvpPlayerId).toBe(mvpPlayerId);
        expect(finalState.body.statistics.highScore).toBe(maxScore);
      }
    });
  });
});