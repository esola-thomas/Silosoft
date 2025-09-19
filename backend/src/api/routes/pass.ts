// Route: POST /turn/action/pass (T049)
import { Router } from 'express';
import { runtime } from '../server.ts';
import { endPlayerTurn } from '../../game/turn.ts';

const router = Router();

router.post('/turn/action/pass', (_req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(400).json({ error: 'No active game' });
  if (game.pendingEvent) return res.status(400).json({ error: 'Pending event must be acknowledged' });
  try {
    const result = endPlayerTurn(game);
    return res.json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;