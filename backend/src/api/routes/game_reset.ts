import { Router } from 'express';
import { runtime } from '../server.ts';
import { broadcastState } from '../websocket.ts';

const router = Router();

// POST /game/reset - clear current in-memory game (if any)
router.post('/game/reset', (_req, res) => {
  runtime.currentGame = null;
  runtime.rng = null;
  runtime.rngState = undefined;
  setImmediate(() => broadcastState('reset'));
  res.json({ ok: true, status: 'NO_GAME' });
});

export default router;
