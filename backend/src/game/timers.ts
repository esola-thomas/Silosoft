// Timers management (T042)
// Decrements competition and PTO timers at end of round or appropriate cadence.

import type { Game } from '../models/types.ts';
import { pushLog } from './log.ts';

export function tickTimers(game: Game) {
  // Unlock PTO card locks that have matured (availableOnTurn <= current turn)
  game.players.forEach(p => {
    if (p.ptoCards && p.ptoCards.length) {
      const before = p.ptoCards.length;
      p.ptoCards = p.ptoCards.filter(lock => lock.availableOnTurn > game.turn);
      if (before !== p.ptoCards.length) {
        pushLog(game, { playerId: p.id, turn: game.turn, type: 'EVENT', message: 'PTO card(s) unlocked' });
      }
    }
  });
}
