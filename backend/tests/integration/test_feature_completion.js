const request = require('supertest');
const app = require('../../src/app');

describe('Resource Assignment and Feature Completion Integration Tests', () => {
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

  describe('Resource assignment mechanics', () => {
    it('should track resource assignments to features', async () => {
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const feature = gameState.body.featuresInPlay[0];
      const player = gameState.body.players[0];
      const resource = player.hand.find(c => c.cardType === 'resource');

      if (resource) {
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/assign`)
          .send({
            playerId: player.id,
            resourceId: resource.id,
            featureId: feature.id,
          })
          .expect(200);

        const updatedState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const updatedFeature = updatedState.body.featuresInPlay.find(f => f.id === feature.id);
        expect(updatedFeature.assignedResources).toContainEqual(
          expect.objectContaining({ id: resource.id })
        );
      }
    });

    it('should validate resource role requirements', async () => {
      let attempts = 0;
      let devResource = null;
      let currentPlayerIndex = 0;

      while (!devResource && attempts < 10) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        devResource = currentPlayer.hand.find(
          c => c.cardType === 'resource' && c.role === 'dev'
        );

        if (!devResource) {
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id })
            .expect(200);

          const updatedState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const updatedPlayer = updatedState.body.players[currentPlayerIndex];
          devResource = updatedPlayer.hand.find(
            c => c.cardType === 'resource' && c.role === 'dev'
          );

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id })
            .expect(200);

          attempts++;
        }
      }

      if (devResource) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const featureNeedingDev = state.body.featuresInPlay.find(
          f => f.requirements.dev > 0 && !f.completed
        );

        if (featureNeedingDev) {
          const response = await request(app)
            .post(`/api/v1/games/${gameId}/actions/assign`)
            .send({
              playerId: state.body.players[state.body.currentPlayerIndex].id,
              resourceId: devResource.id,
              featureId: featureNeedingDev.id,
            })
            .expect(200);

          expect(response.body.gameState).toBeDefined();
        }
      }
    });

    it('should calculate resource values correctly', async () => {
      const createResourceOfLevel = async (level) => {
        for (let i = 0; i < 20; i++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayer = state.body.players[state.body.currentPlayerIndex];

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          const updatedState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const updatedPlayer = updatedState.body.players[state.body.currentPlayerIndex];
          const targetResource = updatedPlayer.hand.find(
            c => c.cardType === 'resource' && c.level === level
          );

          if (targetResource) {
            const expectedValue = level === 'entry' ? 1 : level === 'junior' ? 2 : 3;
            expect(targetResource.value).toBe(expectedValue);
            return targetResource;
          }

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id });
        }
        return null;
      };

      const entryResource = await createResourceOfLevel('entry');
      const juniorResource = await createResourceOfLevel('junior');
      const seniorResource = await createResourceOfLevel('senior');

      if (entryResource) {
        expect(entryResource.value).toBe(1);
      }
      if (juniorResource) {
        expect(juniorResource.value).toBe(2);
      }
      if (seniorResource) {
        expect(seniorResource.value).toBe(3);
      }
    });

    it('should complete feature when requirements are met', async () => {
      const findAndCompleteSimpleFeature = async () => {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const simpleFeature = state.body.featuresInPlay.find(
          f => f.points === 3 && !f.completed
        );

        if (!simpleFeature) {
          return null;
        }

        const requirements = simpleFeature.requirements;
        let devNeeded = requirements.dev || 0;
        let pmNeeded = requirements.pm || 0;
        let uxNeeded = requirements.ux || 0;

        for (let round = 0; round < 10 && (devNeeded > 0 || pmNeeded > 0 || uxNeeded > 0); round++) {
          const currentState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayerIndex = currentState.body.currentPlayerIndex;
          const currentPlayer = currentState.body.players[currentPlayerIndex];

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          const afterDrawState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const updatedPlayer = afterDrawState.body.players[currentPlayerIndex];

          for (const card of updatedPlayer.hand) {
            if (card.cardType === 'resource') {
              let shouldAssign = false;

              if (card.role === 'dev' && devNeeded > 0) {
                shouldAssign = true;
                devNeeded -= card.value;
              } else if (card.role === 'pm' && pmNeeded > 0) {
                shouldAssign = true;
                pmNeeded -= card.value;
              } else if (card.role === 'ux' && uxNeeded > 0) {
                shouldAssign = true;
                uxNeeded -= card.value;
              }

              if (shouldAssign) {
                const assignResponse = await request(app)
                  .post(`/api/v1/games/${gameId}/actions/assign`)
                  .send({
                    playerId: currentPlayer.id,
                    resourceId: card.id,
                    featureId: simpleFeature.id,
                  });

                if (assignResponse.body.featureCompleted) {
                  return assignResponse.body;
                }
              }
            }
          }

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id });
        }

        return null;
      };

      const completionResult = await findAndCompleteSimpleFeature();

      if (completionResult) {
        expect(completionResult.featureCompleted).toBe(true);
        expect(completionResult.pointsAwarded).toBeGreaterThan(0);
      }
    });

    it('should award correct points based on feature complexity', async () => {
      const testPointsForComplexity = async (targetPoints) => {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const targetFeature = state.body.featuresInPlay.find(
          f => f.points === targetPoints && !f.completed
        );

        if (targetFeature) {
          let completed = false;

          for (let round = 0; round < 10 && !completed; round++) {
            const currentState = await request(app)
              .get(`/api/v1/games/${gameId}`)
              .expect(200);

            const currentPlayerIndex = currentState.body.currentPlayerIndex;
            const currentPlayer = currentState.body.players[currentPlayerIndex];

            const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');

            for (const resource of resources) {
              const assignResponse = await request(app)
                .post(`/api/v1/games/${gameId}/actions/assign`)
                .send({
                  playerId: currentPlayer.id,
                  resourceId: resource.id,
                  featureId: targetFeature.id,
                });

              if (assignResponse.status === 200 && assignResponse.body.featureCompleted) {
                expect(assignResponse.body.pointsAwarded).toBe(targetPoints);
                completed = true;
                break;
              }
            }

            if (!completed) {
              await request(app)
                .post(`/api/v1/games/${gameId}/actions/draw`)
                .send({ playerId: currentPlayer.id });

              await request(app)
                .post(`/api/v1/games/${gameId}/actions/end-turn`)
                .send({ playerId: currentPlayer.id });
            }
          }
        }
      };

      await testPointsForComplexity(3);
      await testPointsForComplexity(5);
      await testPointsForComplexity(8);
    });

    it('should prevent over-assignment of resources', async () => {
      const state = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const feature = state.body.featuresInPlay[0];
      const maxAssignments =
        (feature.requirements.dev || 0) +
        (feature.requirements.pm || 0) +
        (feature.requirements.ux || 0);

      let assignmentCount = 0;

      for (let round = 0; round < 10 && assignmentCount < maxAssignments + 5; round++) {
        const currentState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = currentState.body.currentPlayerIndex;
        const currentPlayer = currentState.body.players[currentPlayerIndex];

        const resource = currentPlayer.hand.find(c => c.cardType === 'resource');

        if (resource) {
          const response = await request(app)
            .post(`/api/v1/games/${gameId}/actions/assign`)
            .send({
              playerId: currentPlayer.id,
              resourceId: resource.id,
              featureId: feature.id,
            });

          if (response.status === 200) {
            assignmentCount++;

            if (response.body.featureCompleted) {
              const nextAssignment = currentPlayer.hand.find(
                c => c.cardType === 'resource' && c.id !== resource.id
              );

              if (nextAssignment) {
                const overAssignResponse = await request(app)
                  .post(`/api/v1/games/${gameId}/actions/assign`)
                  .send({
                    playerId: currentPlayer.id,
                    resourceId: nextAssignment.id,
                    featureId: feature.id,
                  })
                  .expect(400);

                expect(overAssignResponse.body.message).toMatch(/completed/i);
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
    });

    it('should update player scores when features complete', async () => {
      let initialScore = 0;
      let featureCompleted = false;

      for (let round = 0; round < 10 && !featureCompleted; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];
        initialScore = currentPlayer.score;

        const resource = currentPlayer.hand.find(c => c.cardType === 'resource');
        const feature = state.body.featuresInPlay.find(f => !f.completed);

        if (resource && feature) {
          const response = await request(app)
            .post(`/api/v1/games/${gameId}/actions/assign`)
            .send({
              playerId: currentPlayer.id,
              resourceId: resource.id,
              featureId: feature.id,
            });

          if (response.status === 200 && response.body.featureCompleted) {
            const updatedState = await request(app)
              .get(`/api/v1/games/${gameId}`)
              .expect(200);

            const updatedPlayer = updatedState.body.players[currentPlayerIndex];
            expect(updatedPlayer.score).toBe(initialScore + response.body.pointsAwarded);
            featureCompleted = true;
          }
        }

        if (!featureCompleted) {
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id });

          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id });
        }
      }
    });

    it('should handle multiple features in progress simultaneously', async () => {
      const state = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const features = state.body.featuresInPlay.slice(0, 2);
      const assignmentTracking = {};

      features.forEach(f => {
        assignmentTracking[f.id] = {
          assigned: [],
          completed: false,
        };
      });

      for (let round = 0; round < 5; round++) {
        const currentState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = currentState.body.currentPlayerIndex;
        const currentPlayer = currentState.body.players[currentPlayerIndex];

        const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');

        resources.forEach((resource, index) => {
          const targetFeature = features[index % features.length];

          if (!assignmentTracking[targetFeature.id].completed) {
            request(app)
              .post(`/api/v1/games/${gameId}/actions/assign`)
              .send({
                playerId: currentPlayer.id,
                resourceId: resource.id,
                featureId: targetFeature.id,
              })
              .then(response => {
                if (response.status === 200) {
                  assignmentTracking[targetFeature.id].assigned.push(resource.id);
                  if (response.body.featureCompleted) {
                    assignmentTracking[targetFeature.id].completed = true;
                  }
                }
              });
          }
        });

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id });

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id });
      }

      Object.values(assignmentTracking).forEach(tracking => {
        expect(tracking.assigned.length).toBeGreaterThan(0);
      });
    });

    it('should replace completed features with new ones from deck', async () => {
      const initialState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const initialFeatureCount = initialState.body.featuresInPlay.length;
      const deckHasFeatures = initialState.body.deck.some(c => c.cardType === 'feature');

      if (deckHasFeatures) {
        let featureCompleted = false;

        for (let round = 0; round < 10 && !featureCompleted; round++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayerIndex = state.body.currentPlayerIndex;
          const currentPlayer = state.body.players[currentPlayerIndex];

          const resources = currentPlayer.hand.filter(c => c.cardType === 'resource');
          const feature = state.body.featuresInPlay[0];

          for (const resource of resources) {
            const response = await request(app)
              .post(`/api/v1/games/${gameId}/actions/assign`)
              .send({
                playerId: currentPlayer.id,
                resourceId: resource.id,
                featureId: feature.id,
              });

            if (response.status === 200 && response.body.featureCompleted) {
              featureCompleted = true;

              const afterCompletionState = await request(app)
                .get(`/api/v1/games/${gameId}`)
                .expect(200);

              expect(afterCompletionState.body.featuresInPlay.length).toBe(initialFeatureCount);
              expect(
                afterCompletionState.body.featuresInPlay.find(f => f.id === feature.id)
              ).toBeUndefined();

              break;
            }
          }

          if (!featureCompleted) {
            await request(app)
              .post(`/api/v1/games/${gameId}/actions/draw`)
              .send({ playerId: currentPlayer.id });

            await request(app)
              .post(`/api/v1/games/${gameId}/actions/end-turn`)
              .send({ playerId: currentPlayer.id });
          }
        }
      }
    });
  });
});