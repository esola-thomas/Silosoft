// App root component (T056)
import HeaderBar from '../components/HeaderBar.tsx';
import HandPanel from '../components/HandPanel.tsx';
import LogPanel from '../components/LogPanel.tsx';
import { useEffect, useState } from 'react';
import { useGame } from '../services/gameContext.tsx';
import PlayerFeatureCard from '../components/PlayerFeatureCard.tsx';
import OrientationHint from '../components/OrientationHint.tsx';
import SetupScreen from '../components/SetupScreen.tsx';
import EndGameModal from '../components/EndGameModal.tsx';
import EventModal from '../components/EventModal.tsx';

const API_BASE = 'http://localhost:3000';


async function refreshState(dispatch: ReturnType<typeof useGame>['dispatch']) {
  const res = await fetch(`${API_BASE}/game/full`);
  if (res.status === 404) {
    dispatch({ type: 'SET_STATE', payload: { status: 'NO_GAME', turnNumber: 0, players: [], hand: [], candidates: [], target: 0 } });
    return;
  }
  if (!res.ok) return;
  const json = await res.json();
  dispatch({ type: 'SET_STATE', payload: {
    status: json.status,
    turnNumber: json.turn,
    turnLimit: json.config?.maxTurns,
    players: json.players,
    hand: json.activePlayer?.hand || json.activePlayer?.hand || [],
    candidates: json.activePlayer?.candidates || [],
    target: json.target,
    targetPerPlayer: json.config?.targetMultiplier,
    activePlayerId: json.activePlayer?.id,
    pendingEvent: json.pendingEvent || null,
    ptoLocks: json.players?.find((p: any) => p.id === json.activePlayer?.id)?.ptoLocks || null,
  }});
  // Expose recent snapshot (dev/optimistic assist only)
  (window as any).__lastKnownTurnNumber = json.turn;
  (window as any).__lastKnownPtoLocks = json.players?.find((p: any) => p.id === json.activePlayer?.id)?.ptoLocks || [];
  // Refresh log separately for now
  const logRes = await fetch(`${API_BASE}/log`);
  if (logRes.ok) {
    const log = await logRes.json();
    if (Array.isArray(log)) {
      dispatch({ type: 'RESET_LOG' });
      log.forEach((entry: any) => dispatch({ type: 'APPEND_LOG', entry }));
    }
  }
}


function Poller() {
  const { dispatch, status } = useGame();
  useEffect(() => {
    const id = setInterval(() => { if (status === 'ACTIVE') refreshState(dispatch); }, 4000);
    return () => clearInterval(id);
  }, [dispatch, status]);
  return null;
}

export default function App() {
  const { dispatch, players, activePlayerId, focusMode, status, pendingEvent } = useGame();
  const [logCollapsed, setLogCollapsed] = useState<boolean>(false);
  useEffect(() => { refreshState(dispatch); }, [dispatch]);
  const showSetup = status !== 'ACTIVE' && status !== 'WON' && status !== 'LOST';
  if (showSetup) {
    return (
      <div className="setup-container">
        <OrientationHint />
        <SetupScreen />
      </div>
    );
  }
  return (
    <div className="game-layout">
      <OrientationHint />
      <HeaderBar />
      <Poller />
      <div aria-live="assertive" style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(1px,1px,1px,1px)' }}>
        {pendingEvent ? `Event: ${pendingEvent.type}` : ''}
      </div>
      {(status === 'WON' || status === 'LOST') && <EndGameModal />}
      <EventModal open={!!pendingEvent} eventType={pendingEvent?.type} onAcknowledge={async (payload) => {
  // Optimistic update for PTO: immediately mark the selected card as locked in client state
        if (pendingEvent?.type === 'PTO' && payload?.cardId) {
          // Approximate unlock turn: current turn + 2 (mirrors backend logic)
            dispatch({ type: 'SET_STATE', payload: { pendingEvent: null, ptoLocks: [ ...( ( ( (window as any).__gameStateSnapshot )?.ptoLocks) || []), { cardId: payload.cardId, availableOnTurn: ( (window as any).__lastKnownTurnNumber) ? ((window as any).__lastKnownTurnNumber + 2) : undefined } ].filter(l => !!l.availableOnTurn) } });
        } else {
          // Immediately clear modal while awaiting server
          dispatch({ type: 'SET_STATE', payload: { pendingEvent: null } });
        }
        try {
          await fetch(`${API_BASE}/event/ack`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload || {}) });
        } catch {
          // On failure, re-show event? Minimal: no-op.
        }
        await refreshState(dispatch);
      }} />
      <div className={"main-regions " + (logCollapsed? 'log-collapsed':'') }>
        <div className="board-area">
          {!!players.length && (
            <div className="players-strip">
              {players.map(p => {
                const feature = (p as any).feature;
                return (
                  <div key={p.id} className={"card " + (focusMode && p.id !== activePlayerId ? 'card-dim' : '')} style={{ minHeight:170 }}>
                    <div className="card-header">
                      <span>{p.name}</span>
                      <span style={{ fontSize:'.5rem', opacity:.65 }}>Score {p.score}</span>
                    </div>
                    <div style={{ fontSize:'.55rem', opacity:.6, marginBottom:4 }}>Completed {p.completed}</div>
                    {feature && <PlayerFeatureCard name={feature.name} description={feature.description} totalPoints={feature.totalPoints} requirements={feature.requirements} active={p.active} />}
                  </div>
                );
              })}
            </div>
          )}
          <HandPanel />
        </div>
        <div className="log-wrapper">
          <button type="button" className="log-toggle-btn" aria-expanded={!logCollapsed} aria-controls="game-log" onClick={()=> setLogCollapsed((c: boolean) => !c)}>
            {logCollapsed ? 'Expand Log' : 'Collapse Log'}
          </button>
          <LogPanel id="game-log" />
        </div>
      </div>
    </div>
  );
}