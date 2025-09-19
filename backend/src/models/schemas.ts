// Zod schemas for Silosoft core models (T032)
import { z } from 'zod';
// (Removed unused type imports to satisfy linter)

export const roleSchema = z.enum(['DEV','PM','UX','CONTRACTOR']);
export const featureCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number().int().positive(),
  roles: z.array(roleSchema).nonempty(),
  category: z.string().optional(),
  description: z.string().max(140).optional(),
});

export const resourceCardSchema = z.object({
  id: z.string(),
  role: roleSchema,
  level: z.enum(['SENIOR','JUNIOR','ENTRY','CONTRACT']),
  points: z.number().int().positive(),
});

export const eventTypeSchema = z.enum(['LAYOFF','REORG','COMPETITION','PTO']);

export const eventCardSchema = z.object({
  id: z.string(),
  type: eventTypeSchema,
  payload: z.record(z.any()).optional(),
});

export const actionLogEntrySchema = z.object({
  id: z.string(),
  turn: z.number().int().min(0),
  playerId: z.string(),
  type: z.enum(['DRAW','TRADE','COMPLETE','PASS','EVENT','START','SEED']),
  message: z.string(),
  data: z.record(z.any()).optional(),
  ts: z.number().int().positive(),
});

export const ptoLockSchema = z.object({
  playerId: z.string(),
  remainingTurns: z.number().int().nonnegative(),
});

export const competitionPenaltySchema = z.object({
  active: z.boolean(),
  remainingTurns: z.number().int().nonnegative(),
  multiplier: z.number().positive(),
});

export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  seat: z.number().int().nonnegative(),
  hand: z.array(z.union([resourceCardSchema, eventCardSchema])),
  activeFeature: featureCardSchema.optional(),
  completedFeatures: z.array(z.string()),
  pto: ptoLockSchema.optional(),
  score: z.number().int().nonnegative(),
});

export const gameConfigSchema = z.object({
  seed: z.string().optional(),
  singleCompletionPerTurn: z.boolean().optional(),
  resourceWeight: z.number().positive().optional(),
  logRetention: z.number().int().positive().optional(),
  targetMultiplier: z.number().int().positive().optional(),
  maxTurns: z.number().int().positive().optional(),
});

export const gameSchema = z.object({
  id: z.string(),
  createdAt: z.number().int().positive(),
  turn: z.number().int().nonnegative(),
  activePlayer: z.string(),
  players: z.array(playerSchema),
  featureDeck: z.array(featureCardSchema),
  discardPile: z.array(featureCardSchema),
  eventsInEffect: z.array(eventCardSchema),
  competition: competitionPenaltySchema.optional(),
  config: gameConfigSchema.required(),
  log: z.array(actionLogEntrySchema),
  status: z.enum(['LOBBY','ACTIVE','WON','LOST']),
  targetFeatures: z.number().int().positive(),
  drawnThisTurn: z.boolean().optional(),
});

// Re-export TypeScript inferred types for convenience
export type FeatureCard = z.infer<typeof featureCardSchema>;
export type ResourceCard = z.infer<typeof resourceCardSchema>;
export type EventCard = z.infer<typeof eventCardSchema>;
export type ActionLogEntry = z.infer<typeof actionLogEntrySchema>;
export type PtoLock = z.infer<typeof ptoLockSchema>;
export type CompetitionPenalty = z.infer<typeof competitionPenaltySchema>;
export type Player = z.infer<typeof playerSchema>;
export type GameConfig = z.infer<typeof gameConfigSchema>;
export type Game = z.infer<typeof gameSchema>;
