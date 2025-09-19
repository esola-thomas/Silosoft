import { createGame } from '../../src/game/state.ts';
import { applyCompetition } from '../../src/game/events.ts';
import { endPlayerTurn } from '../../src/game/turn.ts';

/**
 * Updated T030: Competition challenge lifecycle
 */

describe('Competition Challenge', () => {
  it('clears on completion or penalizes on failure', () => {
    const { game } = createGame({ playerNames: ['P1'], config: { resourceWeight: 1, maxTurns: 10, targetMultiplier: 3, singleCompletionPerTurn: false, seed: 'comp-challenge' } });
    const player = game.players[0];
    // Seed a simple feature & resources for guaranteed completion
    player.activeFeature = { id: 'f1', name: 'Feat', totalPoints: 2, requirements: [{ role: 'DEV', minPoints: 2 }] } as any;
    player.hand.push({ id: 'r1', role: 'DEV', level: 'JUNIOR', points: 2 } as any);
    // Apply competition -> sets challenge mustCompleteByTurn = currentTurn + 1
    const res = applyCompetition(game, player.id);
    expect(res.applied).toBe(true);
    expect(player.challenge).toBeDefined();
    // Fail intentionally: simulate passing turns until after deadline via endPlayerTurn cycles (single player so each end increments turn)
    const deadline = player.challenge!.mustCompleteByTurn;
    while (game.turn <= deadline) {
      endPlayerTurn(game);
      if (!player.challenge) break; // cleared early due to penalty
    }
    expect(player.challenge).toBeUndefined();
  });
});
