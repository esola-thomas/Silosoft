// WebSocket client hook for live game updates
import { useEffect, useRef } from 'react';
import { useGame } from './gameContext.js';

interface WsMessage { type: 'snapshot' | 'update' | 'pong'; state?: any; reason?: string; }

export function useGameWebSocket() {
  const { dispatch } = useGame();
  const ref = useRef<WebSocket | null>(null);
  useEffect(() => {
    let cancelled = false;
    function connect() {
      if (cancelled) return;
      const url = inferUrl();
      try {
        const ws = new WebSocket(url);
        ref.current = ws;
        ws.onopen = () => dispatch({ type: 'WS_STATUS', connected: true });
        ws.onclose = () => {
          dispatch({ type: 'WS_STATUS', connected: false });
          if (!cancelled) setTimeout(connect, 4000);
        };
        ws.onerror = () => { ws.close(); };
        ws.onmessage = evt => {
          try {
            const msg: WsMessage = JSON.parse(evt.data);
            if ((msg.type === 'snapshot' || msg.type === 'update') && msg.state) {
              dispatch({ type: 'WS_STATE', payload: msg.state });
            }
          } catch {
            // ignore
          }
        };
      } catch {
        dispatch({ type: 'WS_STATUS', connected: false });
        setTimeout(connect, 5000);
      }
    }
    connect();
    return () => { cancelled = true; ref.current?.close(); };
  }, [dispatch]);
}

function inferUrl() {
  if (typeof window === 'undefined') return 'ws://localhost:3000/ws';
  const { protocol, hostname, port } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${hostname}:${port || (protocol === 'https:' ? '443' : '80')}/ws`;
}
