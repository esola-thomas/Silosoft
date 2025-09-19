import { Router } from 'express';
import { runtime } from '../server.ts';

// Route: GET /game/replay - returns seed state + log for replay/export
const router = Router();

router.get('/game/replay', (_req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(404).json({ error: 'No active game' });
  return res.json({
    id: game.id,
    status: game.status,
    seed: runtime.rngState,
    turn: game.turn,
    target: game.targetFeatures,
    config: game.config,
    players: game.players.map(p => ({ id: p.id, name: p.name, completed: p.completedFeatures.length, score: p.score })),
    log: game.log,
  });
});

export default router;