// Express server setup (T043)
// Provides app instance used by tests. In-memory singleton game state managed here until
// persistence layer (future). Routes will be mounted via index.ts (T052); for now we only
// expose basic health and placeholder containers.

import express from 'express';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import type { Game } from '../models/types.ts';
import { SeededRng } from '../game/rng.ts';

export interface RuntimeState {
  currentGame: Game | null;
  rng: SeededRng | null; // persistent RNG instance per active game
  rngState?: ReturnType<SeededRng['state']>; // snapshot (seed + position)
}

export const runtime: RuntimeState = {
  currentGame: null,
  rng: null,
  rngState: undefined,
};

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: false }));
app.use(express.json());

// Note: Route mounting occurs in index.ts which imports this file. Tests now import index.ts directly,
// so we no longer perform a side-effect require here (removed to avoid circular loader quirks in dev).

// Basic health probe
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, status: runtime.currentGame?.status ?? 'NO_GAME' });
});

// Generic not-found handler (will be after route mounting finally)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path === '/health') return next();
  next();
});

export default app;
