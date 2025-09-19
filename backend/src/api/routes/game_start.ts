// Route: POST /game/start (T044)
import { Router } from 'express';
import { createGame } from '../../game/state.ts';
import { runtime } from '../server.ts';
import { broadcastState } from '../websocket.ts';

const router = Router();

interface StartBody { playerCount?: number; playerNames?: string[]; seed?: string; resourceWeight?: number; singleCompletionPerTurn?: boolean; maxTurns?: number; targetMultiplier?: number; }

router.post('/game/start', (req, res) => {
  const body = req.body as StartBody;
  const count = body.playerCount ?? body.playerNames?.length;
  if (!count || count < 1) return res.status(400).json({ error: 'playerCount required' });
  let names = body.playerNames ?? Array.from({ length: count }, (_, i) => `Player ${i + 1}`);
  names = names.map((n, i) => {
    const trimmed = (n ?? '').trim();
    if (!trimmed) return `Player ${i + 1}`;
    return trimmed.slice(0, 20); // enforce max length
  });
  // Sanitize advanced config (clamp within reasonable bounds to prevent runaway games)
  const maxTurns = body.maxTurns ? Math.min(50, Math.max(3, Math.floor(body.maxTurns))) : undefined; // allow shorter for quick tests
  const targetMultiplier = body.targetMultiplier ? Math.min(12, Math.max(1, Math.floor(body.targetMultiplier))) : undefined;
  const { game, rng } = createGame({
    playerNames: names,
    seed: body.seed,
    config: {
      resourceWeight: body.resourceWeight,
      singleCompletionPerTurn: body.singleCompletionPerTurn,
      maxTurns,
      targetMultiplier,
    }
  });
  runtime.currentGame = game;
  runtime.rng = rng;
  runtime.rngState = rng.state();
  const response = {
    id: game.id,
    turnNumber: game.turn,
    turnLimit: game.config.maxTurns,
    completedFeaturesTotal: 0,
    target: game.targetFeatures,
    targetPerPlayer: game.config.targetMultiplier,
    players: game.players.map(p => ({ id: p.id, name: p.name, handSize: p.hand.length })),
  };
  setImmediate(() => broadcastState('start'));
  return res.json(response);
});

export default router;