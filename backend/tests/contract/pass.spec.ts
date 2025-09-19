import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('POST /turn/action/pass (contract)', () => {
  it('ends the current player\'s action phase', async () => {
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'pass-seed' });
    const res = await request(app).post('/turn/action/pass');
    expect(res.status).toBe(200);
    // Later we will assert turnNumber increments after pass & draw/complete phases.
  });
});
