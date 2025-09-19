import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('POST /game/start advanced config', () => {
  it('honors maxTurns and targetMultiplier bounds', async () => {
    const res = await request(app)
      .post('/game/start')
      .send({ playerNames: ['Alpha','Beta'], maxTurns: 15, targetMultiplier: 5, seed:'cfg-seed' });
    expect(res.status).toBe(200);
    expect(res.body.turnLimit).toBe(15);
    expect(res.body.targetPerPlayer).toBe(5);
    expect(res.body.target).toBe(10); // 2 players * 5
  });

  it('clamps out-of-range values', async () => {
    const res = await request(app)
      .post('/game/start')
      .send({ playerNames:['Solo'], maxTurns: 999, targetMultiplier: 0 });
    expect(res.status).toBe(200);
    // Turn limit should be clamped to <= 50
    expect(res.body.turnLimit).toBeLessThanOrEqual(50);
    // targetMultiplier min 1 so target should be players * at least 1
    expect(res.body.targetPerPlayer).toBeGreaterThanOrEqual(1);
  });
});
