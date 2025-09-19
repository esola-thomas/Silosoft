import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('GET /game/state (contract)', () => {
  it('returns current game state snapshot', async () => {
    // Precondition: start a game first
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'state-seed' });

    const res = await request(app).get('/game/state');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('turnNumber');
    expect(res.body).toHaveProperty('turnLimit');
    expect(res.body).toHaveProperty('completedFeaturesTotal');
  });
});
