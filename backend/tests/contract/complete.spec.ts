import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('POST /turn/action/complete (contract)', () => {
  it('attempts a feature completion with minimal payload', async () => {
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'complete-seed' });
    // We cannot know resource IDs yet; send an empty array to ensure validation rules appear later.
    const res = await request(app)
      .post('/turn/action/complete')
      .send({ playerId: 'P1', resourceIds: ['R1'], contractorRoles: {} });
    // Expectation: 200 per contract stub; later we may refine for validation errors.
    expect(res.status).toBe(200);
  });
});
