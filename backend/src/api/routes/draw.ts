// Route: POST /turn/action/draw (T046)
import { Router } from 'express';
import { runtime } from '../server.ts';
import { drawForPlayer } from '../../game/draw.ts';
import { broadcastState } from '../websocket.ts';

const router = Router();

router.post('/turn/action/draw', (_req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(400).json({ error: 'No active game' });
  if (!runtime.rng) return res.status(500).json({ error: 'RNG not initialized' });
  if (game.pendingEvent) return res.status(400).json({ error: 'Pending event must be acknowledged' });
  try {
    const result = drawForPlayer(game, game.activePlayer, runtime.rng);
    runtime.rngState = runtime.rng.state();
    setImmediate(() => broadcastState('draw'));
    return res.json({ result, handSize: game.players.find(p => p.id === game.activePlayer)?.hand.length, rng: runtime.rngState });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;