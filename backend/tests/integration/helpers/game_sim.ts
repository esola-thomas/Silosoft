// Integration helper (T054): deterministic game simulation utilities
// Provides thin wrappers around API calls (or direct engine usage later) to script flows.
import request from 'supertest';
import { app } from '../../../src/api/index.js';

export interface StartOptions { playerCount: number; seed?: string; resourceWeight?: number; }

export async function startGame(opts: StartOptions) {
  const res = await request(app).post('/game/start').send({ playerCount: opts.playerCount, seed: opts.seed, resourceWeight: opts.resourceWeight });
  if (res.status !== 200) throw new Error('Failed to start game');
  return res.body;
}

export async function drawOnce() {
  return request(app).post('/turn/action/draw');
}

export async function passTurn() {
  return request(app).post('/turn/action/pass');
}

export async function gameState() {
  return request(app).get('/game/state');
}

export async function completeAttempt(payload: any) {
  return request(app).post('/turn/action/complete').send(payload);
}

export async function tradeAttempt(payload: any) {
  return request(app).post('/turn/action/trade').send(payload);
}

export async function getLog() {
  return request(app).get('/log');
}

// Example scripted sequence (returns minimal trace)
export async function simpleSeededRound(seed: string) {
  await startGame({ playerCount: 1, seed });
  const d = await drawOnce();
  const p = await passTurn();
  const s = await gameState();
  return { draw: d.body, pass: p.body, state: s.body };
}