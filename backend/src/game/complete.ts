// Completion logic (T038)
// Validates feature completion bundles, applies scoring with competition penalty & optional contractor rule.

import type { Game, ResourceCard, Role } from '../models/types.ts';
import { pushLog } from './log.ts';

interface CompletionResult {
  pointsAwarded: number;
  completed: string[];
  win: boolean;
}

export interface CompletionCandidate {
  featureId: string;
  name: string;
  totalPoints: number;
  requirements: { role: Role; minPoints: number; have: number; deficit: number }[];
  missingRoles: Role[]; // roles with any deficit > 0 but zero points available
  canComplete: boolean; // true if all deficits resolved or can be satisfied via contractors (each contractor = 2 pts wildcard)
}

export function deriveCompletionCandidates(game: Game, playerId: string): CompletionCandidate[] {
  const player = game.players.find(p => p.id === playerId);
  if (!player || !player.activeFeature) return [];
  const feature = player.activeFeature;
  const contractorCount = player.hand.filter(c => (c as any).role === 'CONTRACTOR').length;
  const pointsByRole = player.hand.reduce<Record<Role, number>>((acc, c: any) => {
    if (c.role && c.points && c.role !== 'CONTRACTOR') acc[c.role as Role] = (acc[c.role as Role] || 0) + c.points;
    return acc;
  }, {} as Record<Role, number>);
  const requirements = feature.requirements.map(req => {
    const have = pointsByRole[req.role] || 0;
    const deficit = Math.max(0, req.minPoints - have);
    return { role: req.role as Role, minPoints: req.minPoints, have, deficit };
  });
  // Determine if contractors can cover combined deficits (each contractor = 2 points)
  const totalDeficitPoints = requirements.reduce((a, r) => a + r.deficit, 0);
  const canCoverWithContractors = totalDeficitPoints > 0 ? (contractorCount * 2) >= totalDeficitPoints : true;
  const missingRoles = requirements.filter(r => r.have === 0 && r.deficit > 0).map(r => r.role);
  const canComplete = totalDeficitPoints === 0 || canCoverWithContractors;
  return [{
    featureId: feature.id,
    name: feature.name,
    totalPoints: feature.totalPoints,
    requirements,
    missingRoles,
    canComplete,
  }];
}

function getPlayer(game: Game, playerId: string) {
  const p = game.players.find(pl => pl.id === playerId);
  if (!p) throw new Error('Player not found');
  return p;
}

function extractCards<T extends { id: string }>(ids: string[], pool: T[]): T[] {
  const found: T[] = [];
  ids.forEach(id => {
    const idx = pool.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Card not found: ${id}`);
    found.push(pool[idx]);
  });
  return found;
}


export function attemptComplete(
  game: Game,
  playerId: string,
  featureIds: string[],
  resourceCardIds: string[],
): CompletionResult {
  if (featureIds.length === 0) throw new Error('No features specified');
  const player = getPlayer(game, playerId);
  // Card-level PTO: ensure at least one selected resource card isn't locked (or reject locked usage)
  if (player.ptoCards && player.ptoCards.length) {
    const lockedIds = player.ptoCards.filter(l => l.availableOnTurn > game.turn).map(l => l.cardId);
    // Disallow selecting locked cards
    if (resourceCardIds.some(id => lockedIds.includes(id))) {
      throw new Error('Attempted to use locked PTO card');
    }
  }

  const playerFeature = player.activeFeature;
  if (!playerFeature) throw new Error('No active feature');
  if (featureIds.some(id => id !== playerFeature.id)) throw new Error('Can only complete active feature');
  const features = [playerFeature];
  const resourceCards = extractCards<ResourceCard>(resourceCardIds, player.hand as ResourceCard[]);

  // Sum points per role (contractor can fill exactly one missing role with its points)
  // Validate per-role point thresholds allowing contractors (2 pts each) to fill deficits.
  const featureReqs = playerFeature.requirements;
  const nonContractorCards = resourceCards.filter(r => r.role !== 'CONTRACTOR');
  const contractorCards = resourceCards.filter(r => r.role === 'CONTRACTOR');
  const pointsByRole: Record<Role, number> = nonContractorCards.reduce((a, c: any) => {
    a[c.role as Role] = (a[c.role as Role] || 0) + c.points;
    return a;
  }, {} as Record<Role, number>);
  let remainingContractorPoints = contractorCards.length * 2; // each contractor worth 2 pts
  for (const req of featureReqs) {
    const have = pointsByRole[req.role as Role] || 0;
    if (have < req.minPoints) {
      const need = req.minPoints - have;
      remainingContractorPoints -= need;
      if (remainingContractorPoints < 0) {
        throw new Error('Insufficient points for requirements');
      }
    }
  }

  let basePoints = features.reduce((acc, f) => acc + f.totalPoints, 0);
  // Contractor penalty if used (one missing role)
  if (contractorCards.length) {
    basePoints = Math.floor(basePoints * 0.95); // small penalty for any contractor usage
  }

  // Update player
  features.forEach(f => player.completedFeatures.push(f.id));
  // Move active feature to discard and assign a new one if available
  const activeId = playerFeature.id;
  const deckIdx = game.featureDeck.findIndex(fc => fc.id === activeId);
  if (deckIdx !== -1) {
    const [rem] = game.featureDeck.splice(deckIdx, 1);
    game.discardPile.push(rem);
  } else {
    // active may have been removed earlier; just ensure discard contains it once
    if (!game.discardPile.find(f => f.id === activeId)) game.discardPile.push(playerFeature);
  }
  player.activeFeature = game.featureDeck.shift();
  player.score += basePoints;

  // handled above for active feature

  // Remove used resource cards from hand
  resourceCards.forEach(rc => {
    const i = player.hand.findIndex(c => c.id === rc.id);
    if (i !== -1) player.hand.splice(i, 1);
  });

  pushLog(game, { playerId, turn: game.turn, type: 'COMPLETE', message: `Completed ${features.length} feature(s) for ${basePoints} points` });
  // Completing any feature satisfies competition challenge if present
  if (player.challenge) {
    pushLog(game, { playerId, turn: game.turn, type: 'EVENT', message: 'Competition challenge satisfied' });
    player.challenge = undefined;
  }

  let win = false;
  const totalCompleted = player.completedFeatures.length;
  if (totalCompleted >= game.targetFeatures) {
    game.status = 'WON';
    win = true;
    pushLog(game, { playerId, turn: game.turn, type: 'COMPLETE', message: 'Win condition reached' });
  }

  return { pointsAwarded: basePoints, completed: features.map(f => f.id), win };
}
