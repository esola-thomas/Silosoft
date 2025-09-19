import request from 'supertest';
import { app } from '../../src/api/index.ts';

/**
 * Integration Test: Trade limits & single initiation per player per turn
 * Placeholder: Without implementation we only define the flow; later we assert rejection of second trade attempt.
 */

describe('Integration: trade limits', () => {
  it('allows a single trade initiation per player per turn (placeholder)', async () => {
    await request(app).post('/game/start').send({ playerCount: 2, seed: 'trade-limit-seed-1' });

    // First trade attempt should succeed (placeholder 200)
    const first = await request(app)
      .post('/turn/action/trade')
      .send({ fromPlayer: 'P1', toPlayer: 'P2', give: [], receive: [] });
    expect(first.status).toBe(200);

    // Second trade same turn: eventually should fail (e.g., 400 or 409). For now we only note expectation.
    const second = await request(app)
      .post('/turn/action/trade')
      .send({ fromPlayer: 'P1', toPlayer: 'P2', give: [], receive: [] });
    expect([200, 400, 409]).toContain(second.status); // Will tighten once logic exists.

    await request(app).post('/turn/action/pass');
  });
});
