// EndGameModal: displayed when game status is WON or LOST
import { useGame } from '../services/gameContext.tsx';

const API_BASE = 'http://localhost:3000';

interface EndGameModalProps { onClose?: () => void; }

export default function EndGameModal({ onClose }: EndGameModalProps) {
  const { status, target, players, turnNumber, turnLimit, targetPerPlayer, dispatch } = useGame();
  const won = status === 'WON';
  const completedTotal = players.reduce((s,p)=> s + p.completed,0);
  const cfgSummary = `${targetPerPlayer ?? '?'} per player • Turn limit ${turnLimit ?? '?'}`;

  async function handleReplay() {
    // Reuse last player names & config values
    const names = players.map(p => p.name);
    await fetch(`${API_BASE}/game/reset`, { method:'POST' });
    await fetch(`${API_BASE}/game/start`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ playerNames: names, targetMultiplier: targetPerPlayer, maxTurns: turnLimit })
    });
    const full = await fetch(`${API_BASE}/game/full`);
    if (full.ok) {
      const json = await full.json();
      dispatch({ type:'SET_STATE', payload: {
        status: json.status,
        turnNumber: json.turn,
        turnLimit: json.config?.maxTurns,
        target: json.target,
        targetPerPlayer: json.config?.targetMultiplier,
        players: json.players,
        activePlayerId: json.activePlayer?.id,
        hand: json.activePlayer?.hand || [],
        candidates: json.activePlayer?.candidates || [],
      }});
    }
  }

  async function handleReturn() {
    await fetch(`${API_BASE}/game/reset`, { method:'POST' });
    dispatch({ type:'SET_STATE', payload:{ status:'NO_GAME', players:[], hand:[], candidates:[], turnNumber:0, activePlayerId:undefined } });
    onClose?.();
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Game Summary">
      <div className="endgame-modal">
        <h2 style={{ marginTop:0 }}>{won ? 'Team Victory' : 'Defeat'}</h2>
        <p style={{ fontSize:'.7rem', opacity:.75 }}>{cfgSummary}</p>
        <div className="summary-stats">
          <div><strong>Completed</strong>: {completedTotal}/{target}</div>
          <div><strong>Turns</strong>: {turnNumber}/{turnLimit ?? '?'} </div>
        </div>
        <table className="players-breakdown" style={{ width:'100%', fontSize:'.6rem', marginTop:8 }}>
          <thead><tr><th align="left">Player</th><th>Completed</th><th>Score</th></tr></thead>
          <tbody>
            {players.map(p => <tr key={p.id}><td>{p.name}</td><td style={{ textAlign:'center' }}>{p.completed}</td><td style={{ textAlign:'center' }}>{p.score}</td></tr>)}
          </tbody>
        </table>
        <div className="endgame-actions" style={{ display:'flex', gap:8, marginTop:12 }}>
          <button type="button" onClick={handleReplay}>Replay Same Config</button>
          <button type="button" onClick={handleReturn}>Return to Setup</button>
        </div>
      </div>
    </div>
  );
}
