// Game state initializer (T035)
// Responsible for constructing a fresh Game object with normalized configuration and initial log.

import { createRng, SeededRng } from './rng.ts';
import { createFeatureDeck } from './deck.ts';
import type { ResourceCard } from '../models/types.ts';
import { pushLog } from './log.ts';
import type { Game, GameConfig, Player, FeatureCard } from '../models/types.ts';

interface CreateGameOptions {
  playerNames: string[];
  config?: GameConfig;
  seed?: string;
  featureDeck?: FeatureCard[]; // optional injected deck for tests
}

// Use empty string sentinel for seed in defaults; treat '' as absent when exposing
const DEFAULTS: Required<GameConfig> = {
  seed: '',
  singleCompletionPerTurn: false,
  resourceWeight: 0.8,
  logRetention: 200,
  targetMultiplier: 3,
  maxTurns: 10,
};

function normalizeConfig(cfg?: GameConfig): Required<GameConfig> {
  return {
    seed: cfg?.seed ?? DEFAULTS.seed, // empty string means no explicit seed provided
    singleCompletionPerTurn: cfg?.singleCompletionPerTurn ?? DEFAULTS.singleCompletionPerTurn,
    resourceWeight: cfg?.resourceWeight ?? DEFAULTS.resourceWeight,
    logRetention: cfg?.logRetention ?? DEFAULTS.logRetention,
    targetMultiplier: cfg?.targetMultiplier ?? DEFAULTS.targetMultiplier,
    maxTurns: cfg?.maxTurns ?? DEFAULTS.maxTurns,
  };
}

export interface CreateGameResult { game: Game; rng: SeededRng; }

export function createGame(options: CreateGameOptions): CreateGameResult {
  const { playerNames, config, seed, featureDeck } = options;
  if (!playerNames || playerNames.length === 0) throw new Error('At least one player required');
  if (playerNames.length > 4) throw new Error('Maximum 4 players supported');

  const normalized = normalizeConfig({ ...(config || {}), seed: seed ?? config?.seed });
  const rng = createRng(normalized.seed || undefined);

  const players: Player[] = playerNames.map((name, idx) => ({
    id: `P${idx + 1}`,
    name,
    seat: idx,
    hand: [],
    activeFeature: undefined,
    completedFeatures: [],
    score: 0,
  }));

  const { cards } = createFeatureDeck(rng, featureDeck);

  const targetFeatures = players.length * normalized.targetMultiplier;

  const game: Game = {
    id: `game-${Date.now().toString(36)}`,
    createdAt: Date.now(),
    turn: 1,
    activePlayer: players[0].id,
    players,
    featureDeck: cards,
    discardPile: [],
    eventsInEffect: [],
  competition: undefined, // deprecated global competition penalty; retained for backward compatibility (will stay undefined)
    config: normalized,
    log: [],
    status: 'ACTIVE',
    targetFeatures,
    drawnThisTurn: false,
  };

  // Initial assignment: one feature and 3 starting resources per player
  players.forEach(p => {
    const f = game.featureDeck.shift();
    if (f) p.activeFeature = f;
    for (let i = 0; i < 3; i++) {
      const levelRoll = rng.next();
      const level: ResourceCard['level'] = levelRoll < 0.33 ? 'ENTRY' : levelRoll < 0.66 ? 'JUNIOR' : 'SENIOR';
      // Distribute core roles round-robin
      const role = (['DEV','PM','UX'][ (p.seat + i) % 3 ]) as any;
      const points = level === 'SENIOR' ? 3 : level === 'JUNIOR' ? 2 : 1;
      p.hand.push({ id: `SR-${Date.now().toString(36)}-${rng.int(9999)}`, role, level, points });
    }
  });

  pushLog(game, { playerId: players[0].id, turn: 0, type: 'START', message: 'Game created' });

  return { game, rng };
}

// Helper to append a log entry respecting retention; ring buffer semantics
// pushLog moved to log.ts
