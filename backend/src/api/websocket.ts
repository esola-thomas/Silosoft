// WebSocket server setup for real-time game state broadcasting
// Provides init function to attach to existing HTTP server and broadcast helper
import type { Server as HttpServer } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { runtime } from './server.ts';
import { buildFullState } from './state_serializer.ts';

interface ClientMeta {
  id: string;
  ws: WebSocket;
}

let wss: WebSocketServer | null = null;
const clients: ClientMeta[] = [];

export function initWebSocket(server: HttpServer) {
  if (wss) return wss; // already initialized
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws: WebSocket) => {
    const id = `C-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    clients.push({ id, ws });
    // Send an initial snapshot if a game exists
    if (runtime.currentGame) {
      try {
        ws.send(JSON.stringify({ type: 'snapshot', state: buildFullState(runtime.currentGame) }));
      } catch {/* ignore */}
    }
    ws.on('close', () => {
      const idx = clients.findIndex(c => c.id === id);
      if (idx >= 0) clients.splice(idx, 1);
    });
    ws.on('message', msg => {
      // For now we only support simple ping messages from client
      try {
        const data = JSON.parse(String(msg));
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', t: Date.now() }));
        }
      } catch {/* ignore malformed */}
    });
  });
  return wss;
}

export function broadcastState(reason: string) {
  if (!wss || clients.length === 0) return;
  const game = runtime.currentGame;
  if (!game) return;
  const payload = JSON.stringify({ type: 'update', reason, state: buildFullState(game) });
  clients.forEach(c => {
    if (c.ws.readyState === c.ws.OPEN) {
      try { c.ws.send(payload); } catch {/* ignore individual send errors */}
    }
  });
}

export function clientCount() { return clients.length; }
