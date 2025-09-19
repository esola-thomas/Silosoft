// Route: GET /game/full - full (sanitized) game state for UI rendering
import { Router } from 'express';
import { runtime } from '../server.ts';
import { buildFullState } from '../state_serializer.ts';

const router = Router();

router.get('/game/full', (_req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(404).json({ error: 'No active game' });
  try {
    return res.json(buildFullState(game));
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;