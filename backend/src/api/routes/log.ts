// Route: GET /log (T050)
import { Router } from 'express';
import { runtime } from '../server.ts';

const router = Router();

router.get('/log', (_req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(400).json({ error: 'No active game' });
  return res.json(game.log);
});

export default router;