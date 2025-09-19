// Event handlers (T037)
// Provides logic to resolve drawn event cards: LAYOFF, REORG, COMPETITION, PTO.
// Placeholder implementations; refined once tests assert specifics.

import type { Game, EventCard, Player } from '../models/types.ts';
import { pushLog } from './log.ts';
import { SeededRng } from './rng.ts';

// Optional choices supplied by client when acknowledging an event that allows selection
export interface EventSelection {
  cardId?: string;           // For LAYOFF, PTO, REORG (resource card in source hand)
  targetPlayerId?: string;   // For REORG (destination player different from source)
}

export interface EventResolutionResult {
  applied: boolean;
  description: string;
}

function findPlayer(game: Game, playerId: string): Player {
  const p = game.players.find(pl => pl.id === playerId);
  if (!p) throw new Error('Player not found');
  return p;
}

export function applyLayoff(game: Game, playerId: string, rng: SeededRng, sel?: EventSelection): EventResolutionResult {
  const player = findPlayer(game, playerId);
  // Remove one random resource card if any
  const resourceIndexes = player.hand
    .map((c, idx) => ({ c, idx }))
    .filter(x => 'role' in x.c); // crude check distinguishing resource
  if (resourceIndexes.length === 0) {
    pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'Layoff hit but no resource to remove' });
    return { applied: false, description: 'No resource removed' };
  }
  let pick = resourceIndexes[rng.int(resourceIndexes.length)];
  if (sel?.cardId) {
    const specified = resourceIndexes.find(r => (r.c as any).id === sel.cardId);
    if (!specified) throw new Error('Selected card not found for Layoff');
    pick = specified;
  }
  const removed = player.hand.splice(pick.idx, 1)[0];
  pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'Layoff removed a resource card' });
  return { applied: true, description: `Removed ${'role' in removed ? removed.role : 'card'}` };
}

export function applyReorg(game: Game, playerId: string, rng: SeededRng, sel?: EventSelection): EventResolutionResult {
  if (game.players.length < 2) {
    pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'Reorg no-op (single player)' });
    return { applied: false, description: 'No-op single player' };
  }
  const source = findPlayer(game, playerId);
  const transferable = source.hand.filter(c => 'role' in c);
  if (transferable.length === 0) {
    pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'Reorg no resource to transfer' });
    return { applied: false, description: 'No resource to move' };
  }
  // Choose a target different from source
  const others = game.players.filter(p => p.id !== source.id);
  let target = others[rng.int(others.length)];
  if (sel?.targetPlayerId) {
    const specifiedTarget = others.find(o => o.id === sel.targetPlayerId);
    if (!specifiedTarget) throw new Error('Selected target player invalid for Reorg');
    target = specifiedTarget;
  }
  let pick = transferable[rng.int(transferable.length)];
  if (sel?.cardId) {
    const specifiedCard = transferable.find(c => (c as any).id === sel.cardId);
    if (!specifiedCard) throw new Error('Selected card invalid for Reorg');
    pick = specifiedCard;
  }
  // Remove from source
  const idx = source.hand.findIndex(c => c.id === pick.id);
  if (idx !== -1) source.hand.splice(idx, 1);
  target.hand.push(pick as any);
  pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: `Reorg moved 1 card to ${target.id}` });
  return { applied: true, description: `Moved card to ${target.id}` };
}

export function applyCompetition(game: Game, playerId: string): EventResolutionResult {
  const player = findPlayer(game, playerId);
  if (player.challenge) {
    pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'Competition challenge already pending' });
    return { applied: false, description: 'Challenge already pending' };
  }
  player.challenge = { mustCompleteByTurn: game.turn + 1, appliedTurn: game.turn };
  pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'Competition challenge set for next turn' });
  return { applied: true, description: 'Must complete next turn' };
}

export function applyPto(game: Game, playerId: string, rng?: SeededRng, sel?: EventSelection): EventResolutionResult {
  const player = findPlayer(game, playerId);
  const candidate = player.hand.filter(c => 'role' in c);
  if (candidate.length === 0) {
    pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'PTO no resource to lock' });
    return { applied: false, description: 'No card to lock' };
  }
  let pick = (rng ? candidate[rng.int(candidate.length)] : candidate[0]);
  if (sel?.cardId) {
    const specified = candidate.find(c => (c as any).id === sel.cardId);
    if (!specified) throw new Error('Selected card invalid for PTO');
    pick = specified;
  }
  if (!player.ptoCards) player.ptoCards = [];
  // Unlock after next turn ends -> available on turn +2
  const unlockTurn = game.turn + 2;
  player.ptoCards.push({ cardId: (pick as any).id, availableOnTurn: unlockTurn });
  pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: `PTO locked card ${ (pick as any).id } until turn ${unlockTurn}` });
  return { applied: true, description: 'Card locked' };
}

export function resolveEvent(game: Game, playerId: string, event: EventCard, rng: SeededRng, sel?: EventSelection): EventResolutionResult {
  switch (event.type) {
    case 'LAYOFF':
      return applyLayoff(game, playerId, rng, sel);
    case 'REORG':
      return applyReorg(game, playerId, rng, sel);
    case 'COMPETITION':
      return applyCompetition(game, playerId);
    case 'PTO':
      return applyPto(game, playerId, rng, sel);
    default:
      return { applied: false, description: 'Unknown event' };
  }
}
