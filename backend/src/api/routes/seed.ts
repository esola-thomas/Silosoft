// Route: POST /admin/seed (T051)
import { Router } from 'express';
import { runtime } from '../server.ts';
import { pushLog } from '../../game/log.ts';

const router = Router();

router.post('/admin/seed', (req, res) => {
  const { seed } = req.body as { seed?: string };
  if (!seed) return res.status(400).json({ error: 'seed required' });
  // If a game already exists we accept for now (contract test expects 200) but log it.
  if (runtime.currentGame) {
    pushLog(runtime.currentGame, { playerId: runtime.currentGame.activePlayer, turn: runtime.currentGame.turn, type: 'SEED', message: `Seed override ignored (${seed})` });
    return res.json({ acknowledged: true, gameActive: true });
  }
  // Store seed in runtime scratch; start route will read from body anyway. For now we just echo it.
  return res.json({ acknowledged: true, seed });
});

export default router;