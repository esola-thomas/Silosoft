import request from 'supertest';
import { app } from '../../src/api/index.ts';

/**
 * Integration Test: Feature deck exhaustion handling
 * Placeholder: We simulate many turns/draws; later we will assert graceful handling when feature deck empties.
 */

describe('Integration: feature deck exhaustion', () => {
  it('continues operation after drawing many times (placeholder)', async () => {
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'deck-exhaust-seed' });
    // Draw & pass for more turns than typical deck size assumption (e.g., 30)
    for (let i = 0; i < 35; i++) {
      await request(app).post('/turn/action/draw');
      await request(app).post('/turn/action/pass');
    }
    const state = await request(app).get('/game/state');
    expect(state.status).toBe(200);
    // Future: expect state.deck.remaining >= 0 and not negative.
  });
});
