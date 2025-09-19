// API client (T058) - thin wrappers around backend endpoints
export interface StartGamePayload { playerCount: number; seed?: string; resourceWeight?: number; }
const BASE = '';

async function json<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export interface GameStateApi { turnNumber: number; status: string; completedFeaturesTotal: number; turnLimit: number; }
export type ActionLogEntry = any; // refine later

export async function startGame(payload: StartGamePayload) {
  return json<GameStateApi>(fetch(`${BASE}/game/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
}
export async function gameState() { return json<GameStateApi>(fetch(`${BASE}/game/state`)); }
export async function draw() { return json<any>(fetch(`${BASE}/turn/action/draw`, { method: 'POST' })); }
export async function passTurn() { return json<any>(fetch(`${BASE}/turn/action/pass`, { method: 'POST' })); }
export async function gameLog() { return json<ActionLogEntry[]>(fetch(`${BASE}/log`)); }
