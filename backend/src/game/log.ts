// Logging ring buffer utilities (T041)
import type { Game, ActionLogEntry } from '../models/types.ts';

export function pushLog(game: Game, entry: Omit<ActionLogEntry, 'id' | 'ts'> & { ts?: number }): void {
  const id = `log-${game.log.length + 1}`;
  const full: ActionLogEntry = { id, ts: entry.ts ?? Date.now(), ...entry };
  game.log.push(full);
  const max = game.config.logRetention;
  if (game.log.length > max) {
    game.log.splice(0, game.log.length - max);
  }
}

export function cloneLog(game: Game): ActionLogEntry[] { return [...game.log]; }