// Performance sanity test (T073) - lightweight (no strict timing assertion)
import { createGame } from '../../src/game/state.ts';
import { createRng } from '../../src/game/rng.ts';
import { drawForPlayer } from '../../src/game/draw.ts';
import { endPlayerTurn } from '../../src/game/turn.ts';
import { attemptComplete } from '../../src/game/complete.ts';

function tryAutoComplete(game: any) {
  const player = game.players.find((p: any) => p.id === game.activePlayer);
  if (!player) return;
  if (!game.featureDeck.length) return;
  const feature = game.featureDeck[0];
  const needed = new Set(feature.roles);
  const resources = player.hand.filter((c: any) => c.role && needed.has(c.role));
  if (resources.length === 0) return;
  const roleSet = new Set(resources.map((r: any) => r.role));
  const missing = feature.roles.filter((r: string) => !roleSet.has(r));
  if (missing.length > 1) return;
  try { attemptComplete(game, player.id, [feature.id], resources.map((r: any) => r.id), {}); } catch { /* ignore */ }
}

describe('Performance sanity (100 simulated games)', () => {
  it('runs 100 games under loose performance budget', () => {
    const start = Date.now();
    let wins = 0; let losses = 0;
    for (let i = 0; i < 100; i++) {
      const seed = `perf-${i}`;
      const { game } = createGame({ playerNames: ['A'], seed });
      const rng = createRng(seed);
      while (game.status === 'ACTIVE' && game.turn <= game.config.maxTurns) {
        try { drawForPlayer(game, game.activePlayer, rng); } catch {}
        tryAutoComplete(game);
        endPlayerTurn(game);
      }
      if (game.status === 'WON') wins++; else if (game.status === 'LOST') losses++;
    }
    const duration = Date.now() - start;
    // Soft assertion: must finish within 5 seconds on typical dev machine
    expect(duration).toBeLessThan(5000);
    expect(wins + losses).toBe(100); // all games concluded
  });
});
