import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('POST /turn/action/draw (contract)', () => {
  it('allows the active player to draw once per turn', async () => {
    await request(app).post('/game/start').send({ playerCount: 1, seed: 'draw-seed' });

    const first = await request(app).post('/turn/action/draw');
    expect(first.status).toBe(200);
    expect(typeof first.body).toBe('object');

    const second = await request(app).post('/turn/action/draw');
    // Now enforced: only one draw per turn
    expect(second.status).toBe(400);
  });
});
