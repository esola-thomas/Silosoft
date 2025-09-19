import request from 'supertest';
import { app } from '../../src/api/index.ts';
import { runtime } from '../../src/api/server.ts';

describe('Contract: POST /event/ack interactive selection (direct injection)', () => {
  beforeEach(async () => {
    await request(app).post('/game/reset');
    await request(app).post('/game/start').send({ playerNames: ['A','B'], config: { resourceWeight: 1 } }); // start with resources for easier setup
  });

  it('acknowledges PTO with specified card', async () => {
    const game = runtime.currentGame!;
    const active = game.players.find(p => p.id === game.activePlayer)!;
    // Ensure one resource card
    if (!active.hand.some(c => (c as any).role)) {
      active.hand.push({ id: 'R-PTO', role: 'DEV', level: 'ENTRY', points: 1 } as any);
    }
    const targetCard = active.hand.find(c => (c as any).role)!;
    game.pendingEvent = { id: 'ev-pto', type: 'PTO' } as any;
    const res = await request(app).post('/event/ack').send({ cardId: targetCard.id });
    expect(res.status).toBe(200);
    const updated = runtime.currentGame!.players.find(p => p.id === active.id)!;
    expect(updated.ptoCards?.some(l => l.cardId === targetCard.id)).toBe(true);
  });

  it('acknowledges Reorg with specified card and target', async () => {
    const game = runtime.currentGame!;
    const active = game.players.find(p => p.id === game.activePlayer)!;
    const other = game.players.find(p => p.id !== active.id)!;
    active.hand.push({ id: 'R-MOVE', role: 'PM', level: 'ENTRY', points: 1 } as any);
    game.pendingEvent = { id: 'ev-reorg', type: 'REORG' } as any;
    const res = await request(app).post('/event/ack').send({ cardId: 'R-MOVE', targetPlayerId: other.id });
    expect(res.status).toBe(200);
    expect(other.hand.find(c => c.id === 'R-MOVE')).toBeTruthy();
  });

  it('rejects invalid card selection for Layoff', async () => {
    const game = runtime.currentGame!;
    const active = game.players.find(p => p.id === game.activePlayer)!;
    active.hand.push({ id: 'R-KEEP', role: 'UX', level: 'ENTRY', points: 1 } as any);
    game.pendingEvent = { id: 'ev-layoff', type: 'LAYOFF' } as any;
    const res = await request(app).post('/event/ack').send({ cardId: 'NOT_REAL' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Selected card/);
  });
});
