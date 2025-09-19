// Shared state serialization used by REST full state endpoint & WebSocket broadcasts
import { runtime } from './server.ts';
import type { Game, Player } from '../models/types.ts';
import { deriveCompletionCandidates } from '../game/complete.ts';

interface SerializedPlayer {
  id: string; name: string; seat: number; score: number; completed: number; active: boolean;
  feature: { id: string; name: string; description?: string; totalPoints: number; requirements: any[] } | null;
  challenge?: { mustCompleteByTurn: number } | null;
  ptoLocks?: { cardId: string; availableOnTurn: number }[] | null;
}

export interface FullStateSerialized {
  id: string; status: string; turn: number; target: number;
  players: SerializedPlayer[]; activePlayer: { id: string; feature: SerializedPlayer['feature']; hand: any[]; candidates: any };
  rng: any;
  config?: { maxTurns: number; targetMultiplier: number; singleCompletionPerTurn: boolean; resourceWeight: number };
  pendingEvent?: { id: string; type: string; payload?: any } | null;
}

export function buildFullState(game: Game): FullStateSerialized {
  const active = game.players.find(p => p.id === game.activePlayer);
  if (!active) throw new Error('Active player missing');
  return {
    id: game.id,
    status: game.status,
    turn: game.turn,
    target: game.targetFeatures,
  // competition removed in favor of per-player challenges
    players: game.players.map(serializePlayer(game.activePlayer)),
    activePlayer: {
      id: active.id,
  feature: active.activeFeature ? { id: active.activeFeature.id, name: active.activeFeature.name, description: active.activeFeature.description, totalPoints: active.activeFeature.totalPoints, requirements: active.activeFeature.requirements } : null,
      hand: active.hand,
      candidates: deriveCompletionCandidates(game, active.id),
    },
    rng: runtime.rngState,
    config: {
      maxTurns: game.config.maxTurns,
      targetMultiplier: game.config.targetMultiplier,
      singleCompletionPerTurn: game.config.singleCompletionPerTurn,
      resourceWeight: game.config.resourceWeight,
    },
    pendingEvent: game.pendingEvent ? { id: game.pendingEvent.id, type: game.pendingEvent.type, payload: game.pendingEvent.payload } : null,
  };
}

function serializePlayer(activeId: string) {
  return (p: Player): SerializedPlayer => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    score: p.score,
    completed: p.completedFeatures.length,
    active: p.id === activeId,
  feature: p.activeFeature ? { id: p.activeFeature.id, name: p.activeFeature.name, description: p.activeFeature.description, totalPoints: p.activeFeature.totalPoints, requirements: p.activeFeature.requirements } : null,
    challenge: p.challenge ? { mustCompleteByTurn: p.challenge.mustCompleteByTurn } : null,
    ptoLocks: p.ptoCards && p.ptoCards.length ? p.ptoCards : null,
  });
}
