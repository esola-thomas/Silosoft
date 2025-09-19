import request from 'supertest';
import { app } from '../../src/api/index.ts';

describe('Event acknowledgment flow', () => {
  it('draws an event and requires acknowledgment before further actions', async () => {
    // Start game with low resourceWeight to force events likely
    const start = await request(app).post('/game/start').send({ playerNames:['A','B'], resourceWeight: 0.0, seed:'event-seed' });
    expect(start.status).toBe(200);
    // Draw (should become pending event)
    const draw = await request(app).post('/turn/action/draw').send({});
    expect(draw.status).toBe(200);
    // Attempt pass should fail while pending
    const pass = await request(app).post('/turn/action/pass').send({});
    expect(pass.status).toBe(400);
    expect(pass.body.error).toMatch(/Pending event/);
    // Acknowledge
    const ack = await request(app).post('/event/ack').send({});
    expect(ack.status).toBe(200);
    expect(ack.body.acknowledged).toBe(true);
    // Now pass should succeed
    const pass2 = await request(app).post('/turn/action/pass').send({});
    expect(pass2.status).toBe(200);
  });
});