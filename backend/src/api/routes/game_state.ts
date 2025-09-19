// Route: GET /game/state (T045)
import { Router } from 'express';
import { runtime } from '../server.ts';

const router = Router();

router.get('/game/state', (_req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(404).json({ error: 'No active game' });
  return res.json({
    turnNumber: game.turn,
    turnLimit: game.config.maxTurns,
    completedFeaturesTotal: game.players.reduce((acc, p) => acc + p.completedFeatures.length, 0),
    status: game.status,
  });
});

export default router;