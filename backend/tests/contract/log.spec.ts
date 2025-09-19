import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('GET /log (contract)', () => {
  it('returns recent action log entries', async () => {
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'log-seed' });
    const res = await request(app).get('/log');
    expect(res.status).toBe(200);
    // Expect array or object with entries; we assert array for now (adjust if design changes)
    expect(Array.isArray(res.body)).toBe(true);
  });
});
