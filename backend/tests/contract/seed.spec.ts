import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('POST /admin/seed (contract)', () => {
  it('sets RNG seed before game start', async () => {
    const res = await request(app).post('/admin/seed').send({ seed: 'pre-seed-1' });
    expect(res.status).toBe(200);
  });

  it('future: may reject after game start (placeholder)', async () => {
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'seed-set' });
    const res = await request(app).post('/admin/seed').send({ seed: 'late-seed' });
    // We tentatively expect 200 until logic enforces restriction; adjust when implemented.
    expect(res.status).toBe(200);
  });
});
