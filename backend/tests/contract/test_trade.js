const request = require('supertest');
const app = require('../../src/app');

describe('Trade Actions Contract Tests', () => {
  let gameId;
  let p1;
  let p2;

  beforeEach(async () => {
    const gameResponse = await request(app)
      .post('/api/v1/games')
      .send({ playerNames: ['Alice', 'Bob'] })
      .expect(201);
    gameId = gameResponse.body.id;
    p1 = gameResponse.body.players[0];
    p2 = gameResponse.body.players[1];

    // Ensure each player has at least one resource card for trading
    const ensureResource = async (player) => {
      let attempts = 0;
      while (attempts < 15) {
        const current = await request(app).get(`/api/v1/games/${gameId}`).expect(200);
        const freshPlayer = current.body.players.find((pl) => pl.id === player.id);
        const resource = freshPlayer.hand.find((c) => c.cardType === 'resource');
        if (resource) {
          return resource.id;
        }
        // If it's not this player's turn, end others turn
        if (current.body.players[current.body.currentPlayerIndex].id !== player.id) {
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/end-turn`)
            .send({ playerId: current.body.players[current.body.currentPlayerIndex].id });
        } else {
          await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId: player.id });
        }
        attempts++;
      }
      throw new Error('Could not obtain resource card for trade test');
    };

    p1.resourceId = await ensureResource(p1);
    // Progress turns until p1 (current player) can initiate trade; trade must happen on current player's turn
    // ensure it's p1's turn
    let state = await request(app).get(`/api/v1/games/${gameId}`).expect(200);
    if (state.body.players[state.body.currentPlayerIndex].id !== p1.id) {
      // end turns until p1 turn
      for (let i = 0; i < 4 && state.body.players[state.body.currentPlayerIndex].id !== p1.id; i++) {
        await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId: state.body.players[state.body.currentPlayerIndex].id });
        state = await request(app).get(`/api/v1/games/${gameId}`).expect(200);
      }
    }

    // Now make sure p2 has a resource (could have changed after turn cycling)
    p2.resourceId = await ensureResource(p2);
  });

  it('should initiate and complete a trade successfully', async () => {
    // Initiate trade from p1 to p2
    const initiateRes = await request(app)
      .post(`/api/v1/games/${gameId}/actions/trade/initiate`)
      .send({ playerId: p1.id, targetPlayerId: p2.id, offeredCardId: p1.resourceId })
      .expect(200);

    expect(initiateRes.body).toHaveProperty('gameState.tradeState');
    expect(initiateRes.body.gameState.tradeState.status).toBe('pending_counter');
    expect(initiateRes.body.gameState.tradeState.offeredCardId).toBe(p1.resourceId);
    expect(initiateRes.body.gameState.tradeState.initiator).toBe(p1.id);
    expect(initiateRes.body.gameState.tradeState.target).toBe(p2.id);

    // Complete trade as p2
    const completeRes = await request(app)
      .post(`/api/v1/games/${gameId}/actions/trade/complete`)
      .send({ playerId: p2.id, counterCardId: p2.resourceId })
      .expect(200);

    expect(completeRes.body.gameState.tradeState.status).toBe('completed');
    expect(completeRes.body.gameState.tradeState.counterCardId).toBe(p2.resourceId);

    // Verify card ownership swapped
    const after = await request(app).get(`/api/v1/games/${gameId}`).expect(200);
    const p1After = after.body.players.find((pl) => pl.id === p1.id);
    const p2After = after.body.players.find((pl) => pl.id === p2.id);
    expect(p1After.hand.map((c) => c.id)).toContain(p2.resourceId);
    expect(p2After.hand.map((c) => c.id)).toContain(p1.resourceId);
  });

  it('should prevent second trade in same turn', async () => {
    await request(app)
      .post(`/api/v1/games/${gameId}/actions/trade/initiate`)
      .send({ playerId: p1.id, targetPlayerId: p2.id, offeredCardId: p1.resourceId })
      .expect(200);

    const state = await request(app).get(`/api/v1/games/${gameId}`).expect(200);
    expect(state.body.tradeState.status).toBe('pending_counter');

    // Attempt another initiate by same player same turn
    const second = await request(app)
      .post(`/api/v1/games/${gameId}/actions/trade/initiate`)
      .send({ playerId: p1.id, targetPlayerId: p2.id, offeredCardId: p1.resourceId })
      .expect(400);
    expect(second.body).toHaveProperty('error');
  });

  it('should reject trade completion by non-target player', async () => {
    await request(app)
      .post(`/api/v1/games/${gameId}/actions/trade/initiate`)
      .send({ playerId: p1.id, targetPlayerId: p2.id, offeredCardId: p1.resourceId })
      .expect(200);

    const invalid = await request(app)
      .post(`/api/v1/games/${gameId}/actions/trade/complete`)
      .send({ playerId: p1.id, counterCardId: p1.resourceId })
      .expect(400);
    expect(invalid.body).toHaveProperty('error');
  });
});
