import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('GET /game/replay (contract)', () => {
  it('returns 404 with no game', async () => {
    const res = await request(app).get('/game/replay');
    expect(res.status).toBe(404);
  });
  it('returns seed + log after game start', async () => {
    await request(app).post('/game/start').send({ playerNames: ['A'] });
    const res = await request(app).get('/game/replay');
    expect(res.status).toBe(200);
    expect(res.body.seed).toBeDefined();
    expect(Array.isArray(res.body.log)).toBe(true);
    expect(res.body.players[0].id).toBeDefined();
  });
});