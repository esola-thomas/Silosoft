// gameSync (T067) - polling logic placeholder
import { gameState, gameLog } from './apiClient.ts';
import { useEffect } from 'react';
import { useGame } from './gameContext.js';
import { useGameWebSocket } from './gameSyncSocket.ts';

export function useGameSync(intervalMs = 4000) {
  const { dispatch, wsConnected } = useGame();
  useGameWebSocket();
  useEffect(() => {
    if (wsConnected) return; // suspend polling while websocket active
    let cancelled = false; let handle: any;
    async function tick() {
      try {
        const [st, lg] = await Promise.all([gameState(), gameLog()]);
        if (!cancelled) dispatch({ type: 'SET_STATE', payload: { turnNumber: st.turnNumber, status: st.status, log: lg } });
      } catch {/* ignore */}
      finally { if (!cancelled) handle = setTimeout(tick, intervalMs); }
    }
    tick();
    return () => { cancelled = true; if (handle) clearTimeout(handle); };
  }, [dispatch, intervalMs, wsConnected]);
}
