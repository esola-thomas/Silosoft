import request from 'supertest';
import { app } from '../../src/api/index.ts';

/**
 * Integration Test: Multiple completions in one turn (default allowed per spec unless singleCompletionPerTurn true)
 * Placeholder: Attempt two completion calls; later we will assert second actually increases tally.
 */

describe('Integration: multiple completions in one turn', () => {
  it('allows multiple completion attempts (placeholder)', async () => {
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'multi-complete-seed', resourceWeight: 1 });
    await request(app).post('/turn/action/draw');
    const ackTry = await request(app).post('/event/ack');
    if (ackTry.status === 200) {
      // event acknowledged
    }
    const first = await request(app)
      .post('/turn/action/complete')
      .send({ playerId: 'P1', resourceIds: ['R1'], contractorRoles: {} });
    expect(first.status).toBe(200);
    const second = await request(app)
      .post('/turn/action/complete')
      .send({ playerId: 'P1', resourceIds: ['R2'], contractorRoles: {} });
    expect(second.status).toBe(200);
    await request(app).post('/turn/action/pass');
  });
});
