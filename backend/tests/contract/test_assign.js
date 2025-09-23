const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/games/{gameId}/actions/assign - Contract Tests', () => {
  let gameId;
  let playerId;
  let secondPlayerId;
  let featureId;
  let resourceId;

  beforeEach(async () => {
    const gameResponse = await request(app)
      .post('/api/v1/games')
      .send({
        playerNames: ['Alice', 'Bob'],
      });
    gameId = gameResponse.body.id;
    playerId = gameResponse.body.players[0].id;
    secondPlayerId = gameResponse.body.players[1].id;
    featureId = gameResponse.body.featuresInPlay[0].id;

    const player = gameResponse.body.players[0];
    const resourceCard = player.hand.find((card) => card.cardType === 'resource');
    if (!resourceCard) {
      let attempts = 0;
      while (attempts < 10) {
        const drawResponse = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId });

        if (drawResponse.body.card?.cardType === 'resource') {
          resourceId = drawResponse.body.card.id;
          break;
        }
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId });

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: secondPlayerId });
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: secondPlayerId });
        attempts++;
      }
    } else {
      resourceId = resourceCard.id;
    }
  });

  describe('Assign resource to feature', () => {
    it('should assign resource to feature successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          resourceId: resourceId,
          featureId: featureId,
        })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('featureCompleted');
      expect(response.body).toHaveProperty('pointsAwarded');
      expect(response.body).toHaveProperty('gameState');
      expect(response.body.gameState).toHaveProperty('id', gameId);
    });

    it('should remove resource from player hand after assignment', async () => {
      const beforeState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const beforeHand = beforeState.body.players[0].hand;
      const initialHandSize = beforeHand.length;

      await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          resourceId: resourceId,
          featureId: featureId,
        })
        .expect(200);

      const afterState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const afterHand = afterState.body.players[0].hand;
      expect(afterHand.length).toBe(initialHandSize - 1);
      expect(afterHand.map((c) => c.id)).not.toContain(resourceId);
    });

    it('should add resource to feature assignedResources', async () => {
      await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          resourceId: resourceId,
          featureId: featureId,
        })
        .expect(200);

      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const feature = gameState.body.featuresInPlay.find((f) => f.id === featureId);
      expect(feature.assignedResources).toBeDefined();
      expect(feature.assignedResources.map((r) => r.id)).toContain(resourceId);
    });

    it('should prevent non-current player from assigning resources', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: secondPlayerId,
          resourceId: resourceId,
          featureId: featureId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/not your turn/i);
      expect(response.body).toHaveProperty('code', 'INVALID_TURN');
    });

    it('should prevent assigning resource not in hand', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          resourceId: 'non-existent-resource',
          featureId: featureId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/resource not.*hand/i);
    });

    it('should prevent assigning to non-existent feature', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          resourceId: resourceId,
          featureId: 'non-existent-feature',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/feature not found/i);
    });

    it('should complete feature when requirements are met', async () => {
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const simpleFeature = gameState.body.featuresInPlay.find(
        (f) => f.requirements.dev <= 2 && f.requirements.pm <= 1 && f.requirements.ux <= 1,
      );

      if (simpleFeature) {
        let devAssigned = 0;
        let pmAssigned = 0;
        let uxAssigned = 0;

        for (let round = 0; round < 10; round++) {
          const currentState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const currentPlayerIndex = currentState.body.currentPlayerIndex;
          const currentPlayer = currentState.body.players[currentPlayerIndex];

          const resourceCards = currentPlayer.hand.filter((c) => c.cardType === 'resource');

          for (const resource of resourceCards) {
            const needsDev = simpleFeature.requirements.dev > devAssigned;
            const needsPm = simpleFeature.requirements.pm > pmAssigned;
            const needsUx = simpleFeature.requirements.ux > uxAssigned;

            if (
              (resource.role === 'dev' && needsDev) ||
              (resource.role === 'pm' && needsPm) ||
              (resource.role === 'ux' && needsUx)
            ) {
              const assignResponse = await request(app)
                .post(`/api/v1/games/${gameId}/actions/assign`)
                .send({
                  playerId: currentPlayer.id,
                  resourceId: resource.id,
                  featureId: simpleFeature.id,
                });

              if (assignResponse.status === 200) {
                if (resource.role === 'dev') {
                  devAssigned += resource.value;
                } else if (resource.role === 'pm') {
                  pmAssigned += resource.value;
                } else if (resource.role === 'ux') {
                  uxAssigned += resource.value;
                }

                if (
                  devAssigned >= simpleFeature.requirements.dev &&
                  pmAssigned >= simpleFeature.requirements.pm &&
                  uxAssigned >= simpleFeature.requirements.ux
                ) {
                  expect(assignResponse.body.featureCompleted).toBe(true);
                  expect(assignResponse.body.pointsAwarded).toBeGreaterThan(0);
                  return;
                }
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

    it('should award points when feature is completed', async () => {
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const simpleFeature = gameState.body.featuresInPlay[0];
      const expectedPoints = simpleFeature.points;

      let pointsAwarded = 0;
      for (let i = 0; i < 10; i++) {
        const currentState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = currentState.body.currentPlayerIndex;
        const currentPlayer = currentState.body.players[currentPlayerIndex];
        const resourceCard = currentPlayer.hand.find((c) => c.cardType === 'resource');

        if (resourceCard) {
          const assignResponse = await request(app)
            .post(`/api/v1/games/${gameId}/actions/assign`)
            .send({
              playerId: currentPlayer.id,
              resourceId: resourceCard.id,
              featureId: simpleFeature.id,
            });

          if (assignResponse.status === 200 && assignResponse.body.featureCompleted) {
            pointsAwarded = assignResponse.body.pointsAwarded;
            expect(pointsAwarded).toBe(expectedPoints);
            break;
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

    it('should reject assignment with missing parameters', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          featureId: featureId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject assignment to completed feature', async () => {
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const feature = gameState.body.featuresInPlay[0];
      feature.completed = true;

      const response = await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          resourceId: resourceId,
          featureId: feature.id,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/already completed/i);
    });

    it('should track resource assignment to features', async () => {
      await request(app)
        .post(`/api/v1/games/${gameId}/actions/assign`)
        .send({
          playerId: playerId,
          resourceId: resourceId,
          featureId: featureId,
        })
        .expect(200);

      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const feature = gameState.body.featuresInPlay.find((f) => f.id === featureId);
      const assignedResource = feature.assignedResources.find((r) => r.id === resourceId);
      expect(assignedResource).toBeDefined();
      expect(assignedResource.assignedTo).toBe(featureId);
    });
  });
});