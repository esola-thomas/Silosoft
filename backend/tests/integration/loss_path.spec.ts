import request from 'supertest';
import { app } from '../../src/api/index.ts';

/**
 * Integration Test: Single-player loss after 10 turns
 * Expectation (spec): If win condition not met by turn limit, game ends in loss.
 * Placeholder: We cannot yet assert explicit loss flag; will refine once state schema includes status.
 */

describe('Integration: single-player loss path', () => {
  it('reaches turn limit without meeting win condition (placeholder assertions)', async () => {
  await request(app).post('/game/start').send({ playerCount: 1, seed: 'loss-seed-1', resourceWeight: 1 });

    for (let i = 0; i < 10; i++) {
      await request(app).post('/turn/action/draw');
      // acknowledge if event (unlikely with weight 1)
      const ackTry = await request(app).post('/event/ack');
      if (ackTry.status === 200) {
        // event acknowledged
      }
      await request(app).post('/turn/action/pass');
    }

    const state = await request(app).get('/game/state');
    expect(state.status).toBe(200);
    // Placeholder: ensure turnNumber is >= 10; later will assert gameStatus === 'lost'
    expect(state.body.turnNumber).toBeGreaterThanOrEqual(10);
  });
});
