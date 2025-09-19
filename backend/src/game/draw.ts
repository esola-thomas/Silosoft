// Draw logic (T036)
// Decides whether a player draws a resource card, triggers an event, or (future) other outcomes.
// For now: weighted choice between generating a ResourceCard or EventCard placeholder, and fallback to feature deck not implemented here.

import type { Game, Player, ResourceCard, EventCard, Role } from '../models/types.ts';
import { pushLog } from './log.ts';
import { SeededRng } from './rng.ts';

interface DrawResult {
  type: 'RESOURCE' | 'EVENT';
  card: ResourceCard | EventCard;
}

const ROLE_POOL: Role[] = ['DEV','PM','UX','CONTRACTOR'];
function createResourceCard(rng: SeededRng): ResourceCard {
  const role = ROLE_POOL[rng.int(ROLE_POOL.length)];
  // Map probability to levels (simple uniform for now)
  const levelRoll = rng.next();
  let level: ResourceCard['level'];
  if (role === 'CONTRACTOR') {
    level = 'CONTRACT';
  } else if (levelRoll < 0.33) level = 'ENTRY'; else if (levelRoll < 0.66) level = 'JUNIOR'; else level = 'SENIOR';
  const points = level === 'SENIOR' ? 3 : level === 'JUNIOR' ? 2 : level === 'ENTRY' ? 1 : 2; // contractor 2 points
  return { id: `R-${Date.now().toString(36)}-${rng.int(9999)}`, role, level, points };
}

function createEventCard(rng: SeededRng): EventCard {
  const events: EventCard['type'][] = ['LAYOFF','REORG','COMPETITION','PTO'];
  const type = events[rng.int(events.length)];
  return { id: `E-${Date.now().toString(36)}-${rng.int(9999)}`, type, payload: {} };
}

export function drawForPlayer(game: Game, playerId: string, rng: SeededRng): DrawResult {
  const player = game.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');
  if (game.activePlayer !== playerId) throw new Error('Not active player\'s turn');
  if (game.drawnThisTurn) throw new Error('Already drew this turn');

  const weight = game.config.resourceWeight; // probability threshold for resource vs event
  const roll = rng.next();
  let result: DrawResult;
  if (roll < weight) {
    const res = createResourceCard(rng);
    player.hand.push(res);
    result = { type: 'RESOURCE', card: res };
    pushLog(game, { playerId, turn: game.turn, type: 'DRAW', message: `Drew resource ${res.role}` });
  } else {
    // Create event and set as pending (defer resolution until /event/ack)
    if (game.pendingEvent) throw new Error('Pending event already awaiting acknowledgment');
    const ev = createEventCard(rng);
    game.pendingEvent = ev;
    pushLog(game, { playerId, turn: game.turn, type: 'DRAW', message: `Drew event ${ev.type} (pending)` });
    result = { type: 'EVENT', card: ev };
  }
  game.drawnThisTurn = true;
  return result;
}
