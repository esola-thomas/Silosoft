// Route: GET /game/active - enriched active player state & completion candidates
import { Router } from 'express';
import { runtime } from '../server.ts';
import { deriveCompletionCandidates } from '../../game/complete.ts';

const router = Router();

router.get('/game/active', (_req, res) => {
  const game = runtime.currentGame;
  if (!game) return res.status(404).json({ error: 'No active game' });
  const player = game.players.find(p => p.id === game.activePlayer);
  if (!player) return res.status(500).json({ error: 'Active player missing' });
  return res.json({
    game: {
      id: game.id,
      status: game.status,
      turn: game.turn,
      target: game.targetFeatures,
    },
    active: {
      id: player.id,
      name: player.name,
      hand: player.hand,
  feature: player.activeFeature ? { id: player.activeFeature.id, name: player.activeFeature.name, description: player.activeFeature.description, totalPoints: player.activeFeature.totalPoints, requirements: player.activeFeature.requirements } : null,
      score: player.score,
      completed: player.completedFeatures.length,
      candidates: deriveCompletionCandidates(game, player.id),
    }
  });
});

export default router;