const API_BASE = 'http://localhost:3000';

export async function refreshFullState(dispatch: any) {
  const res = await fetch(`${API_BASE}/game/full`);
  if (!res.ok) return;
  const json = await res.json();
  dispatch({ type: 'SET_STATE', payload: {
    status: json.status,
    turnNumber: json.turn,
    players: json.players,
    hand: json.activePlayer?.hand || [],
    candidates: json.activePlayer?.candidates || [],
    target: json.target,
    activePlayerId: json.activePlayer?.id,
    pendingEvent: json.pendingEvent || null,
    ptoLocks: json.players?.find((p: any) => p.id === json.activePlayer?.id)?.ptoLocks || null,
  }});
  const logRes = await fetch(`${API_BASE}/log`);
  if (logRes.ok) {
    const log = await logRes.json();
    if (Array.isArray(log)) {
      dispatch({ type: 'RESET_LOG' });
      log.forEach((entry: any) => dispatch({ type: 'APPEND_LOG', entry }));
    }
  }
}

export async function fetchActiveCandidates(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/game/active`);
  if (!res.ok) return [];
  const json = await res.json();
  return json?.active?.candidates || [];
}