import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('POST /turn/action/trade (contract)', () => {
  it('initiates a trade between players (shape only)', async () => {
    // Start a 2-player game to allow trading scenario
    await request(app).post('/game/start').send({ playerCount: 2, seed: 'trade-seed' });

    const res = await request(app)
      .post('/turn/action/trade')
      .send({ fromPlayer: 'P1', toPlayer: 'P2', give: [], receive: [] });
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
  });
});
