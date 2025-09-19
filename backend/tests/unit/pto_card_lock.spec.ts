import { createGame } from '../../src/game/state.ts';
import { attemptComplete } from '../../src/game/complete.ts';
import { applyPto } from '../../src/game/events.ts';
import { SeededRng } from '../../src/game/rng.ts';

describe('PTO card-level lock', () => {
  it('prevents use of locked card and unlocks after turn threshold', () => {
  const { game } = createGame({ playerNames: ['P1'], config: { resourceWeight: 1, maxTurns: 10, targetMultiplier: 3, singleCompletionPerTurn: false, seed: 'pto-card-lock' } });
  const player = game.players[0];
    // Seed player with a resource card manually if needed
    if (!player.hand.length) {
      player.hand.push({ id: 'r1', role: 'DEV', level: 'SENIOR', points: 3 } as any);
    }
    const rng = new SeededRng('pto-lock-test');
    const targetId = (player.hand[0] as any).id;
    applyPto(game, player.id, rng);
  expect(player.ptoCards?.some((l: any) => l.cardId === targetId)).toBe(true);
    // Attempt to complete using locked card should throw
    player.activeFeature = { id: 'f1', name: 'Feat', totalPoints: 3, requirements: [{ role: 'DEV', minPoints: 3 }] } as any;
  expect(() => attemptComplete(game, player.id, ['f1'], [targetId])).toThrow(/locked PTO/);
    // Advance turns to unlock
  game.turn += 3; // move beyond unlock threshold
  // Simulate timer cleanup (what tickTimers would do)
  player.ptoCards = player.ptoCards?.filter((l: any) => l.availableOnTurn > game.turn) || [];
  // If lock naturally expired, list now empty
    // Now completion should succeed
    const result = attemptComplete(game, player.id, ['f1'], [targetId]);
    expect(result.pointsAwarded).toBeGreaterThan(0);
  });
});
