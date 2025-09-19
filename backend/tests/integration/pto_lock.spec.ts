import request from 'supertest';
import { app } from '../../src/api/index.ts';
import { runtime } from '../../src/api/server.ts';

/**
 * Integration Test: PTO locks a specific card for current + next turn.
 */

describe('Integration: PTO card lock', () => {
  it('locks one card and then unlocks after next turn', async () => {
    await request(app).post('/game/start').send({ playerNames: ['P1'], config: { resourceWeight: 1, maxTurns: 10, targetMultiplier: 3 } });
    const game = runtime.currentGame!;
    const player = game.players[0];
    // Ensure at least one resource card exists in hand
    if (!player.hand.some(c => (c as any).role)) {
      player.hand.push({ id: 'res-lock', role: 'DEV', level: 'JUNIOR', points: 2 } as any);
    }
    const firstResource = player.hand.find(c => (c as any).role) as any;
    game.pendingEvent = { id: 'pto-test', type: 'PTO' } as any;
    await request(app).post('/event/ack'); // apply lock
    const stateAfterAck = await request(app).get('/game/full');
    const ptoLocks = stateAfterAck.body.players[0].ptoLocks;
    expect(ptoLocks && ptoLocks.length).toBeGreaterThan(0);
    const lock = ptoLocks[0];
    // Attempt to use locked card
    const featureId = stateAfterAck.body.activePlayer.feature?.id;
    if (featureId) {
      const resp = await request(app).post('/turn/action/complete').send({ featureIds: [featureId], resourceCardIds: [lock.cardId] });
      expect(resp.status).not.toBe(200);
    }
    // End current + next turn to unlock
    await request(app).post('/turn/action/pass');
    await request(app).post('/turn/action/draw');
    await request(app).post('/turn/action/pass');
    const after = await request(app).get('/game/full');
    const locksAfter = after.body.players[0].ptoLocks;
    // Should be unlocked (serializer may drop list -> undefined/null)
    if (locksAfter) {
      expect(locksAfter.every((l: any) => l.cardId !== lock.cardId || l.availableOnTurn <= after.body.turn)).toBe(true);
    }

  }, 20000);
});
