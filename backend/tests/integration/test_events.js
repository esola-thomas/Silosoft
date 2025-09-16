const request = require('supertest');
const app = require('../../src/app');

describe('HR Event Effects Integration Tests', () => {
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

  describe('Layoff event handling', () => {
    it('should discard resources when layoff event is drawn', async () => {
      let layoffTriggered = false;

      for (let round = 0; round < 20 && !layoffTriggered; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];
        const initialHandSize = currentPlayer.hand.length;

        const drawResponse = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        if (drawResponse.body.card.cardType === 'event' &&
            drawResponse.body.card.type === 'layoff') {
          layoffTriggered = true;

          const afterEventState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const updatedPlayer = afterEventState.body.players[currentPlayerIndex];
          const expectedDiscardCount = drawResponse.body.card.parameters?.count || 1;

          expect(updatedPlayer.hand.length).toBeLessThanOrEqual(
            initialHandSize + 1 - expectedDiscardCount
          );
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });

    it('should randomly select resources to discard for layoff', async () => {
      let layoffResults = [];

      for (let gameIteration = 0; gameIteration < 3; gameIteration++) {
        const newGameResponse = await request(app)
          .post('/api/v1/games')
          .send({
            playerNames: ['Player1', 'Player2'],
          })
          .expect(201);

        const newGameId = newGameResponse.body.id;
        const newPlayers = newGameResponse.body.players;

        for (let round = 0; round < 20; round++) {
          const state = await request(app)
            .get(`/api/v1/games/${newGameId}`)
            .expect(200);

          const currentPlayerIndex = state.body.currentPlayerIndex;
          const currentPlayer = state.body.players[currentPlayerIndex];

          const drawResponse = await request(app)
            .post(`/api/v1/games/${newGameId}/actions/draw`)
            .send({ playerId: currentPlayer.id })
            .expect(200);

          if (drawResponse.body.card.cardType === 'event' &&
              drawResponse.body.card.type === 'layoff') {
            const beforeHand = currentPlayer.hand.map(c => c.id);

            const afterState = await request(app)
              .get(`/api/v1/games/${newGameId}`)
              .expect(200);

            const afterHand = afterState.body.players[currentPlayerIndex].hand.map(c => c.id);
            const discardedCards = beforeHand.filter(id => !afterHand.includes(id));

            layoffResults.push(discardedCards);
            break;
          }

          await request(app)
            .post(`/api/v1/games/${newGameId}/actions/end-turn`)
            .send({ playerId: currentPlayer.id })
            .expect(200);
        }
      }

      if (layoffResults.length >= 2) {
        const allSame = layoffResults.every(
          result => JSON.stringify(result) === JSON.stringify(layoffResults[0])
        );
        expect(allSame).toBe(false);
      }
    });
  });

  describe('PTO/PLM event handling', () => {
    it('should lock resource for 2 rounds when PTO event is drawn', async () => {
      let ptoTriggered = false;
      let lockedResource = null;
      let lockRound = 0;

      for (let round = 0; round < 20 && !ptoTriggered; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        const drawResponse = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        if (drawResponse.body.card.cardType === 'event' &&
            drawResponse.body.card.type === 'pto') {
          ptoTriggered = true;
          lockRound = state.body.currentRound;

          const afterEventState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const updatedPlayer = afterEventState.body.players[currentPlayerIndex];

          if (updatedPlayer.temporarilyUnavailable.length > 0) {
            lockedResource = updatedPlayer.temporarilyUnavailable[0];
            expect(lockedResource.unavailableUntil).toBe(lockRound + 2);
          }
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }

      if (lockedResource) {
        for (let i = 0; i < players.length * 2; i++) {
          const state = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const playerIndex = state.body.currentPlayerIndex;
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: players[playerIndex].id })
            .expect(200);
        }

        const finalState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const playerWithLock = finalState.body.players.find(
          p => p.temporarilyUnavailable.some(r => r.id === lockedResource.id)
        );

        if (finalState.body.currentRound >= lockRound + 2) {
          expect(playerWithLock).toBeUndefined();
        }
      }
    });

    it('should allow player to choose which resource to lock', async () => {
      let plmTriggered = false;

      for (let round = 0; round < 20 && !plmTriggered; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        const resourcesBeforeDraw = currentPlayer.hand.filter(c => c.cardType === 'resource');

        if (resourcesBeforeDraw.length > 1) {
          const drawResponse = await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id })
            .expect(200);

          if (drawResponse.body.card.cardType === 'event' &&
              drawResponse.body.card.type === 'plm') {
            plmTriggered = true;

            const afterEventState = await request(app)
              .get(`/api/v1/games/${gameId}`)
              .expect(200);

            const updatedPlayer = afterEventState.body.players[currentPlayerIndex];

            expect(updatedPlayer.temporarilyUnavailable.length).toBe(1);

            const lockedResource = updatedPlayer.temporarilyUnavailable[0];
            expect(resourcesBeforeDraw.map(r => r.id)).toContain(lockedResource.id);
          }
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });

    it('should prevent locked resources from being assigned', async () => {
      let lockedResourceId = null;
      let playerWithLock = null;

      for (let round = 0; round < 20 && !lockedResourceId; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        const drawResponse = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        if (drawResponse.body.card.cardType === 'event' &&
            (drawResponse.body.card.type === 'pto' || drawResponse.body.card.type === 'plm')) {
          const afterEventState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const updatedPlayer = afterEventState.body.players[currentPlayerIndex];

          if (updatedPlayer.temporarilyUnavailable.length > 0) {
            lockedResourceId = updatedPlayer.temporarilyUnavailable[0].id;
            playerWithLock = updatedPlayer.id;
            break;
          }
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }

      if (lockedResourceId && playerWithLock) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const feature = state.body.featuresInPlay[0];

        const response = await request(app)
          .post(`/api/v1/games/${gameId}/actions/assign`)
          .send({
            playerId: playerWithLock,
            resourceId: lockedResourceId,
            featureId: feature.id,
          })
          .expect(400);

        expect(response.body.message).toMatch(/unavailable|locked/i);
      }
    });
  });

  describe('Competition event handling', () => {
    it('should set deadline when competition event is drawn', async () => {
      let competitionTriggered = false;
      let deadlineRound = 0;

      for (let round = 0; round < 20 && !competitionTriggered; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        const drawResponse = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        if (drawResponse.body.card.cardType === 'event' &&
            drawResponse.body.card.type === 'competition') {
          competitionTriggered = true;
          deadlineRound = state.body.currentRound + 1.5;

          const afterEventState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          expect(afterEventState.body).toHaveProperty('competitionDeadline');
          expect(afterEventState.body.competitionDeadline).toBe(deadlineRound);
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });

    it('should award bonus points for meeting competition deadline', async () => {
      let competitionActive = false;
      let initialScore = 0;
      let playerWithCompetition = null;

      for (let round = 0; round < 20; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        if (!competitionActive) {
          const drawResponse = await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id })
            .expect(200);

          if (drawResponse.body.card.cardType === 'event' &&
              drawResponse.body.card.type === 'competition') {
            competitionActive = true;
            initialScore = currentPlayer.score;
            playerWithCompetition = currentPlayer.id;
          }
        } else if (playerWithCompetition === currentPlayer.id) {
          const resource = currentPlayer.hand.find(c => c.cardType === 'resource');
          const feature = state.body.featuresInPlay[0];

          if (resource && feature) {
            const assignResponse = await request(app)
              .post(`/api/v1/games/${gameId}/actions/assign`)
              .send({
                playerId: currentPlayer.id,
                resourceId: resource.id,
                featureId: feature.id,
              });

            if (assignResponse.status === 200 && assignResponse.body.featureCompleted) {
              const finalState = await request(app)
                .get(`/api/v1/games/${gameId}`)
                .expect(200);

              const finalPlayer = finalState.body.players.find(p => p.id === playerWithCompetition);
              const expectedBonus = assignResponse.body.pointsAwarded + 2;
              expect(finalPlayer.score).toBeGreaterThanOrEqual(initialScore + expectedBonus);
              break;
            }
          }
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });

    it('should apply penalty for missing competition deadline', async () => {
      let competitionActive = false;
      let deadlineRound = 0;
      let playerWithCompetition = null;
      let initialScore = 0;

      for (let round = 0; round < 20; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        if (!competitionActive) {
          const drawResponse = await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: currentPlayer.id })
            .expect(200);

          if (drawResponse.body.card.cardType === 'event' &&
              drawResponse.body.card.type === 'competition') {
            competitionActive = true;
            deadlineRound = state.body.currentRound + 1.5;
            playerWithCompetition = currentPlayer.id;
            initialScore = currentPlayer.score;
          }
        }

        if (competitionActive && state.body.currentRound > deadlineRound) {
          const finalState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const finalPlayer = finalState.body.players.find(p => p.id === playerWithCompetition);
          expect(finalPlayer.score).toBe(Math.max(0, initialScore - 3));
          break;
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });
  });

  describe('Bonus event handling', () => {
    it('should draw extra cards when bonus event is triggered', async () => {
      let bonusTriggered = false;

      for (let round = 0; round < 20 && !bonusTriggered; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];
        const initialHandSize = currentPlayer.hand.length;

        const drawResponse = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        if (drawResponse.body.card.cardType === 'event' &&
            drawResponse.body.card.type === 'bonus') {
          bonusTriggered = true;

          const afterEventState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const updatedPlayer = afterEventState.body.players[currentPlayerIndex];
          const bonusDrawCount = drawResponse.body.card.parameters?.count || 2;

          expect(updatedPlayer.hand.length).toBe(initialHandSize + 1 + bonusDrawCount);
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });
  });

  describe('Multiple event interactions', () => {
    it('should handle multiple events in same game', async () => {
      const eventsSeen = new Set();

      for (let round = 0; round < 30; round++) {
        const state = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = state.body.currentPlayerIndex;
        const currentPlayer = state.body.players[currentPlayerIndex];

        const drawResponse = await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        if (drawResponse.body.card.cardType === 'event') {
          eventsSeen.add(drawResponse.body.card.type);
        }

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }

      expect(eventsSeen.size).toBeGreaterThan(0);
    });

    it('should maintain game state consistency through events', async () => {
      for (let round = 0; round < 10; round++) {
        const beforeState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        const currentPlayerIndex = beforeState.body.currentPlayerIndex;
        const currentPlayer = beforeState.body.players[currentPlayerIndex];

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/draw`)
          .send({ playerId: currentPlayer.id })
          .expect(200);

        const afterState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        expect(afterState.body.id).toBe(gameId);
        expect(afterState.body.players.length).toBe(players.length);
        expect(afterState.body.currentRound).toBeGreaterThanOrEqual(beforeState.body.currentRound);

        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: currentPlayer.id })
          .expect(200);
      }
    });
  });
});