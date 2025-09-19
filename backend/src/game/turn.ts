// Turn progression (T040)
// Handles ending a player's turn, rotating active player, incrementing turn counter, and loss condition.

import type { Game } from '../models/types.ts';
import { tickTimers } from './timers.ts';
import { pushLog } from './log.ts';

export interface TurnEndResult { nextPlayerId: string; turn: number; gameStatus: Game['status']; }

export function endPlayerTurn(game: Game): TurnEndResult {
  if (game.status !== 'ACTIVE') {
    return { nextPlayerId: game.activePlayer, turn: game.turn, gameStatus: game.status };
  }

  // Evaluate competition challenge for current active player BEFORE rotation if their deadline is this turn
  const current = game.players.find(p => p.id === game.activePlayer)!;
  if (current.challenge && game.turn >= current.challenge.mustCompleteByTurn) {
    // Player failed to complete this turn; apply penalty now (logic duplicated from timers for per-turn check)
    if (current.completedFeatures.length > 0) {
      const removedId = current.completedFeatures.pop();
      pushLog(game, { playerId: current.id, turn: game.turn, type: 'EVENT', message: `Competition penalty removed feature ${removedId}` });
    } else {
      const resourceIndexes = current.hand.filter(c => 'role' in c);
      for (let i = 0; i < 2 && resourceIndexes.length > 0; i++) {
        const card = resourceIndexes.pop();
        if (!card) break;
        const idx = current.hand.findIndex(h => h.id === (card as any).id);
        if (idx !== -1) current.hand.splice(idx, 1);
      }
      pushLog(game, { playerId: current.id, turn: game.turn, type: 'EVENT', message: 'Competition penalty discarded 2 resources (or fewer if not enough)' });
    }
    current.challenge = undefined;
  }

  // Advance active player index
  const idx = game.players.findIndex(p => p.id === game.activePlayer);
  const nextIdx = (idx + 1) % game.players.length;
  game.activePlayer = game.players[nextIdx].id;
  game.drawnThisTurn = false; // reset draw flag for next active player

  // If we wrapped to first player, increment global turn and tick timers
  if (nextIdx === 0) {
    game.turn += 1;
    tickTimers(game);
    pushLog(game, { playerId: game.activePlayer, turn: game.turn, type: 'PASS', message: 'New round commenced' });

    if (game.turn > game.config.maxTurns && game.status === 'ACTIVE') {
      game.status = 'LOST';
      pushLog(game, { playerId: game.activePlayer, turn: game.turn, type: 'PASS', message: 'Max turns exceeded - loss' });
    }
  }

  return { nextPlayerId: game.activePlayer, turn: game.turn, gameStatus: game.status };
}
