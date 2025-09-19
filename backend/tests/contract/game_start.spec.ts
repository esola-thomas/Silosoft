import request from 'supertest';
import { app } from '../../src/api/index.ts';

// NOTE: Implementation not yet done; this test defines expected 200 status and minimal fields.
// It should fail initially (server lacks /game/start route and game creation logic).

describe('POST /game/start (contract)', () => {
  it('starts a game with required playerCount and returns 200 plus basic state', async () => {
    const res = await request(app)
      .post('/game/start')
      .send({ playerCount: 1, seed: 'seed-abc', resourceWeight: 70 });

    // Expect success status per contract
    expect(res.status).toBe(200);

    // Minimal shape assertions (expand later when models exist)
    expect(typeof res.body).toBe('object');
    expect(res.body.turnNumber).toBe(1);
    expect(res.body.turnLimit).toBeGreaterThan(0);
    expect(res.body.completedFeaturesTotal).toBe(0);
  });
});
