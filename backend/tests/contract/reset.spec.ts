import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('POST /game/reset (contract)', () => {
  it('resets current game and subsequent /game/full returns 404', async () => {
    // start a game first
    await request(app).post('/game/start').send({ playerCount: 1 });
    const pre = await request(app).get('/game/full');
    expect(pre.status).toBe(200);
    const reset = await request(app).post('/game/reset');
    expect(reset.status).toBe(200);
    expect(reset.body.status).toBe('NO_GAME');
    const after = await request(app).get('/game/full');
    expect(after.status).toBe(404);
  });
});