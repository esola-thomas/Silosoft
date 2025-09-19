import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('Replay serialization shape', () => {
  it('includes seed position and players array', async () => {
    await request(app).post('/game/start').send({ playerNames: ['Alpha','Beta'] });
    const res = await request(app).get('/game/replay');
    expect(res.status).toBe(200);
    expect(res.body.seed).toBeDefined();
    expect(typeof res.body.seed.position).toBe('number');
    expect(Array.isArray(res.body.players)).toBe(true);
    expect(res.body.players.length).toBe(2);
  });
});