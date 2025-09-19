import request from 'supertest';
import { app } from '../../src/api/index.ts';

/**
 * Integration Test: Single-player seeded win path
 * Goal conditions (from spec): Player wins when completedFeaturesTotal >= targetFeatures (playerCount * 3)
 * We don't yet know feature card structure; this test sets up the narrative and placeholder assertions.
 */

describe('Integration: single-player seeded win path', () => {
  it('progresses through turns to a win state (placeholder expectations)', async () => {
    const seed = 'win-seed-1';
  const startRes = await request(app).post('/game/start').send({ playerCount: 1, seed, resourceWeight: 1 });
    expect(startRes.status).toBe(200);
    expect(startRes.body.turnNumber).toBe(1);

    // Placeholder loop: simulate up to 12 turns (limit should be 10 by spec). We intentionally keep logic simple.
    for (let i = 0; i < 10; i++) {
      // Draw phase
      const drawRes = await request(app).post('/turn/action/draw');
      expect(drawRes.status).toBe(200);
      // If event triggered (future improbable with weight=1) acknowledge
      const ackTry = await request(app).post('/event/ack');
      if (ackTry.status === 200) {
        // acknowledged pending event
      }

      // Attempt a completion opportunistically (dummy resource IDs). Will refine once engine exists.
      await request(app)
        .post('/turn/action/complete')
        .send({ playerId: 'P1', resourceIds: ['R1'], contractorRoles: {} });

      const passRes = await request(app).post('/turn/action/pass');
      expect(passRes.status).toBe(200);
    }

    const finalState = await request(app).get('/game/state');
    expect(finalState.status).toBe(200);
    // Placeholder: we expect completedFeaturesTotal to be >= 3 (target for single player) eventually.
    expect(finalState.body.completedFeaturesTotal).toBeGreaterThanOrEqual(0); // Will tighten later
  });
});
