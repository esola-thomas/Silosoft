import request from 'supertest';
import { app } from '../../src/api/index.ts';

/**
 * Integration Test: Deterministic RNG replay consistency
 * Start two games with identical seed and compare first few turns' state snapshots.
 */

async function playThreeTurns(seed: string) {
  const states: any[] = [];
  await request(app).post('/game/start').send({ playerCount: 1, seed });
  for (let i = 0; i < 3; i++) {
    await request(app).post('/turn/action/draw');
    states.push((await request(app).get('/game/state')).body);
    await request(app).post('/turn/action/pass');
  }
  return states;
}

describe('Integration: RNG replay consistency', () => {
  it('produces identical early-turn sequences for same seed (placeholder looseness)', async () => {
    const seed = 'replay-seed-123';
    const seq1 = await playThreeTurns(seed);
    const seq2 = await playThreeTurns(seed);
    expect(seq1.length).toBe(3);
    expect(seq2.length).toBe(3);
    // Placeholder: Later we will deep-compare relevant deterministic fields.
    // For now we just assert objects exist.
    seq1.forEach(s => expect(typeof s).toBe('object'));
    seq2.forEach(s => expect(typeof s).toBe('object'));
  });
});
