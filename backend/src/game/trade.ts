// Trade logic (T039)
// Single-direction trade: active player gives a resource card to another player.
// Enforces one trade per player per turn.

import type { Game, ResourceCard } from '../models/types.ts';
import { pushLog } from './log.ts';

export interface TradeResult { cardId: string; from: string; to: string; }

function getPlayer(game: Game, id: string) {
  const p = game.players.find(pl => pl.id === id);
  if (!p) throw new Error('Player not found');
  return p;
}

export function tradeCard(game: Game, fromPlayerId: string, toPlayerId: string, cardId: string): TradeResult {
  if (game.activePlayer !== fromPlayerId) throw new Error('Not active player');
  if (fromPlayerId === toPlayerId) throw new Error('Cannot trade with self');
  const from = getPlayer(game, fromPlayerId);
  const to = getPlayer(game, toPlayerId);

  // Check if trade already occurred this turn by this player
  const already = game.log.some(l => l.turn === game.turn && l.playerId === fromPlayerId && l.type === 'TRADE');
  if (already) throw new Error('Trade already performed this turn');

  const idx = from.hand.findIndex(c => c.id === cardId);
  if (idx === -1) throw new Error('Card not in hand');
  const card = from.hand[idx];
  if (!('role' in card)) throw new Error('Only resource cards tradable for now');

  from.hand.splice(idx, 1);
  to.hand.push(card as ResourceCard);

  pushLog(game, { playerId: fromPlayerId, turn: game.turn, type: 'TRADE', message: `Traded card ${cardId} to ${toPlayerId}` });
  return { cardId, from: fromPlayerId, to: toPlayerId };
}
