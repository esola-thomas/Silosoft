import request from 'supertest';
import { app } from '../../src/api/index.ts';
import { runtime } from '../../src/api/server.ts';

/**
 * Updated Integration Test: Competition challenge flow (set -> satisfy -> no penalty)
 */

describe('Integration: competition challenge satisfied avoids penalty', () => {
  it('clears challenge by completing during challenged turn', async () => {
    await request(app).post('/game/start').send({ playerNames: ['A'], config: { resourceWeight: 1, maxTurns: 10, targetMultiplier: 3 } });
    const game = runtime.currentGame!;
    // Provide trivial feature & resources
    const player = game.players[0];
    player.activeFeature = { id: 'fx', name: 'FeatX', totalPoints: 2, requirements: [{ role: 'DEV', minPoints: 2 }] } as any;
    player.hand.push({ id: 'rd1', role: 'DEV', level: 'JUNIOR', points: 2 } as any);
  // Inject pending competition event and acknowledge to set challenge (deadline next turn end)
  game.pendingEvent = { id: 'comp-test', type: 'COMPETITION' } as any;
  await request(app).post('/event/ack');
    let st = await request(app).get('/game/full');
    expect(st.body.players[0].challenge).toBeDefined();
  // End current turn; challenge must be satisfied during the NEXT turn
  await request(app).post('/turn/action/pass');
  // New turn (deadline turn): draw then complete to satisfy
  await request(app).post('/turn/action/draw');
    // Refresh state to get current activePlayer id (single player but be explicit)
    st = await request(app).get('/game/full');
  const compRes = await request(app).post('/turn/action/complete').send({ playerId: st.body.activePlayer.id, featureIds: ['fx'], resourceCardIds: ['rd1'] });
  expect(compRes.body.error).toBeUndefined();
  st = await request(app).get('/game/full');
  // Challenge clears immediately upon successful completion per attemptComplete logic
  expect(st.body.players[0].challenge).toBeFalsy();
  });
});
