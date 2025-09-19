#!/usr/bin/env node
// Simulation CLI (T072): run N games with specified seed or seed prefix; prints summary stats.
import { createGame } from '../game/state.ts';
import { createRng } from '../game/rng.ts';
import { drawForPlayer } from '../game/draw.ts';
import { endPlayerTurn } from '../game/turn.ts';
import { attemptComplete } from '../game/complete.ts';

interface Args { players: number; games: number; seed?: string; }

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: any = { players: 1, games: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--players') args.players = parseInt(argv[++i], 10);
    else if (a === '--games') args.games = parseInt(argv[++i], 10);
    else if (a === '--seed') args.seed = argv[++i];
  }
  return args as Args;
}

function randomFeatures(game: any, count: number) {
  return game.featureDeck.slice(0, count).map((f: any) => f.id);
}

function tryAutoComplete(game: any) {
  // naive: attempt completion with first feature using any resources that match roles
  const player = game.players.find((p: any) => p.id === game.activePlayer);
  if (!player) return;
  if (!game.featureDeck.length) return;
  const feature = game.featureDeck[0];
  const needed = new Set(feature.roles);
  const resources = player.hand.filter((c: any) => c.role && needed.has(c.role));
  if (resources.length === 0) return;
  const roleSet = new Set(resources.map((r: any) => r.role));
  const missing = feature.roles.filter((r: string) => !roleSet.has(r));
  if (missing.length > 1) return; // allow contractor rule for 1 missing
  try {
    attemptComplete(game, player.id, [feature.id], resources.map((r: any) => r.id), {});
  } catch { /* ignore */ }
}

function runSingle(seed: string, players: number) {
  const playerNames = Array.from({ length: players }, (_, i) => `Player${i + 1}`);
  const { game } = createGame({ playerNames, seed });
  const rng = createRng(seed);
  while (game.status === 'ACTIVE' && game.turn <= game.config.maxTurns) {
    // each player draws once then tries completion then passes
    try { drawForPlayer(game, game.activePlayer, rng); } catch { /* ignore */ }
    tryAutoComplete(game);
    endPlayerTurn(game);
    // win condition check inside attemptComplete may update status
    if (game.status !== 'ACTIVE') break;
  }
  return game;
}

function main() {
  const { seed, players, games } = parseArgs();
  const baseSeed = seed || `sim-${Date.now().toString(36)}`;
  const results = [] as any[];
  for (let i = 0; i < games; i++) {
    const s = games === 1 ? baseSeed : `${baseSeed}-${i}`;
    results.push(runSingle(s, players));
  }
  const wins = results.filter(g => g.status === 'WON').length;
  const losses = results.filter(g => g.status === 'LOST').length;
  const avgScore = results.reduce((acc, g) => acc + g.players.reduce((pa: number, p: any) => pa + p.score, 0), 0) / results.length;
  console.log(JSON.stringify({ games, wins, losses, avgScore, seedBase: baseSeed }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
