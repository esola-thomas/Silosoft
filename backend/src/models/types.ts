// Core TypeScript domain model types for Silosoft game (T031)
// These are pure type/interface definitions with no runtime logic.

// Core roles reduced to game spec: DEV, PM, UX plus CONTRACTOR wildcard (used as any one role in a bundle)
export type Role = 'DEV' | 'PM' | 'UX' | 'CONTRACTOR';

export interface FeatureRoleRequirement {
  role: Role;            // required role
  minPoints: number;     // minimum summed points for this role to satisfy requirement
}

export interface FeatureCard {
  id: string;            // unique feature identifier
  name: string;          // display name
  totalPoints: number;   // aggregate effort (sum of minPoints or separate difficulty score)
  requirements: FeatureRoleRequirement[]; // per-role point thresholds
  category?: string;     // optional category for future expansions
  description?: string;  // short flavor / contextual description (added for thematic decks)
}

export interface ResourceCard {
  id: string;            // unique resource card id
  role: Role;            // role represented
  level: 'SENIOR' | 'JUNIOR' | 'ENTRY' | 'CONTRACT'; // CONTRACT used for contractor wildcard
  points: number;        // 3 senior, 2 junior/contract, 1 entry
}

export type EventType = 'LAYOFF' | 'REORG' | 'COMPETITION' | 'PTO';

export interface EventCard {
  id: string;            // event instance id (draw occurrences each get an id)
  type: EventType;
  // payload will vary by event type; kept loose here and validated by schema layer
  payload?: Record<string, unknown>;
}

export interface ActionLogEntry {
  id: string;            // unique log id
  turn: number;          // turn number when logged
  playerId: string;      // actor (or target for passive events)
  type: 'DRAW' | 'TRADE' | 'COMPLETE' | 'PASS' | 'EVENT' | 'START' | 'SEED';
  message: string;       // human-readable summary
  data?: Record<string, unknown>; // structured details for UI
  ts: number;            // epoch ms timestamp
}

export interface PtoLock {
  playerId: string;
  remainingTurns: number; // number of full turns remaining that player is locked
}

export interface CardPtoLock { cardId: string; availableOnTurn: number; }

export interface CompetitionChallenge { mustCompleteByTurn: number; appliedTurn: number; }


export interface Player {
  id: string;
  name: string;
  seat: number;                 // seat order
  hand: (ResourceCard | EventCard)[]; // player hand
  activeFeature?: FeatureCard;  // current feature assigned to this player
  completedFeatures: string[];  // feature ids completed
  pto?: PtoLock;                // active PTO lock if any
  ptoCards?: CardPtoLock[];     // specific card locks
  challenge?: CompetitionChallenge; // pending competition challenge
  score: number;                // cumulative points delivered
}

export interface GameConfig {
  seed?: string;                 // RNG seed
  singleCompletionPerTurn?: boolean; // config flag
  resourceWeight?: number;       // ratio weighting resources vs events when drawing
  logRetention?: number;         // max log entries retained (ring buffer size)
  targetMultiplier?: number;     // game target = players * targetMultiplier (default 3)
  maxTurns?: number;             // default 10
}

export interface Game {
  id: string;                   // game id
  createdAt: number;            // epoch ms
  turn: number;                 // current turn number (1-based)
  activePlayer: string;         // player id whose turn it is
  players: Player[];            // players
  featureDeck: FeatureCard[];   // remaining feature deck (top = front index 0 or end based on implementation)
  discardPile: FeatureCard[];   // completed or removed features (if any)
  eventsInEffect: EventCard[];  // active events with lingering effect
  // competition field deprecated; per-player challenge now used
  // competition?: CompetitionPenalty;
  config: Required<GameConfig>; // normalized config with defaults applied
  log: ActionLogEntry[];        // ring buffer (may be truncated)
  status: 'LOBBY' | 'ACTIVE' | 'WON' | 'LOST';
  targetFeatures: number;       // computed target
  drawnThisTurn?: boolean;      // whether active player has drawn a card this turn (enforces single draw)
  pendingEvent?: EventCard;     // event awaiting player acknowledgment (blocks further actions)
}

export interface SeedState {
  seed: string;
  position: number; // how many rng calls consumed
}

export interface Rng {
  next(): number;        // returns float [0,1)
  int(maxExclusive: number): number; // helper int
  state(): SeedState;    // introspect state for replay
}

// Utility discriminated union for cards if needed later at runtime
export type AnyCard = FeatureCard | ResourceCard | EventCard;

// Action request payload shapes (for API layer typing)
export interface DrawActionRequest { gameId: string; playerId: string; }
export interface TradeActionRequest { gameId: string; fromPlayerId: string; toPlayerId: string; cardId: string; }
export interface CompleteActionRequest { gameId: string; playerId: string; featureIds: string[]; resourceCardIds: string[]; }
export interface PassActionRequest { gameId: string; playerId: string; }

export interface StartGameRequest { playerNames: string[]; config?: GameConfig; }

export interface GameStateResponse { game: Game; }

// Error shape contract (simple)
export interface ApiError { error: string; code?: string; }
