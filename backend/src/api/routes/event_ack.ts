// Route: POST /event/ack - acknowledge and resolve a pending event
import { Router } from 'express';
import { runtime } from '../server.ts';
import { resolveEvent } from '../../game/events.ts';
import type { EventSelection } from '../../game/events.ts';
import { broadcastState } from '../websocket.ts';

const router = Router();

router.post('/event/ack', (req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(400).json({ error: 'No active game' });
  if (!runtime.rng) return res.status(500).json({ error: 'RNG not initialized' });
  if (!game.pendingEvent) return res.status(400).json({ error: 'No pending event' });
  try {
    const ev = game.pendingEvent;
    const sel: EventSelection | undefined = req.body && typeof req.body === 'object' ? {
      cardId: (req.body as any).cardId,
      targetPlayerId: (req.body as any).targetPlayerId,
    } : undefined;
    const resolution = resolveEvent(game, game.activePlayer, ev, runtime.rng, sel);
    // Clear pending event
    game.pendingEvent = undefined;
    runtime.rngState = runtime.rng.state();
    setImmediate(() => broadcastState('event_ack'));
    return res.json({ acknowledged: true, event: ev, resolution, rng: runtime.rngState });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;