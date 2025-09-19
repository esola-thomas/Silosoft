// Deterministic seeded RNG (T033)
// Implementation: mulberry32-like algorithm for reproducibility.
// Contract exposed matches Rng interface from models/types.ts

import type { Rng, SeedState } from '../models/types.ts';

function hashSeed(seed: string): number {
  // Simple string hash to 32-bit integer
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 0x1; // ensure non-zero
}

export class SeededRng implements Rng {
  private _state: number;
  private _seed: string;
  private _count = 0;

  constructor(seed?: string) {
    this._seed = seed || Date.now().toString(36);
    this._state = hashSeed(this._seed);
  }

  next(): number {
    // mulberry32 variant
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    this._count++;
    return r;
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0) throw new Error('maxExclusive must be > 0');
    return Math.floor(this.next() * maxExclusive);
  }

  state(): SeedState {
    return { seed: this._seed, position: this._count };
  }
}

export function createRng(seed?: string): SeededRng { return new SeededRng(seed); }
