// EndGameModal: displayed when game status is WON or LOST
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../services/gameContext.tsx';

const API_BASE = 'http://localhost:3000';

interface EndGameModalProps { onClose?: () => void; }

export default function EndGameModal({ onClose }: EndGameModalProps) {
  const { status, target, players, turnNumber, turnLimit, targetPerPlayer, dispatch } = useGame();
  const won = status === 'WON';
  const completedTotal = players.reduce((s,p)=> s + p.completed,0);
  const cfgSummary = `${targetPerPlayer ?? '?'} per player • Turn limit ${turnLimit ?? '?'}`;
  const [confettiBits, setConfettiBits] = useState<Array<{ id:number; x:number; delay:number; size:number; hue:number; rot:number }>>([]);

  // Prepare lightweight confetti pieces (CSS driven) only for victory & when motion not disabled
  useEffect(() => {
    if (!won) return;
    if (typeof document !== 'undefined') {
      const motionOff = document.documentElement.getAttribute('data-motion') === 'off';
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches && !motionOff) return; // respect reduced motion
      const bits = Array.from({ length: 42 }).map((_,i) => ({
        id:i,
        x: Math.random()*100, // vw percentage
        delay: Math.random()*2,
        size: 6 + Math.random()*10,
        hue: 200 + Math.random()*160,
        rot: Math.random()*360,
      }));
      setConfettiBits(bits);
    }
  }, [won]);

  const topPerformerIds = useMemo(() => {
    if (!players.length) return new Set<string>();
    const maxCompleted = Math.max(...players.map(p => p.completed));
    const maxScore = Math.max(...players.map(p => p.score));
    // highlight those who either tied on completed OR achieved top score (both metrics) when >1 players
    return new Set(players.filter(p => p.completed === maxCompleted || p.score === maxScore).map(p => p.id));
  }, [players]);

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
    <div className="modal-backdrop endgame-backdrop" role="dialog" aria-modal="true" aria-label="Game Summary">
      <div className={"endgame-modal " + (won ? 'victory' : 'defeat')}>
        {won && (
          <div className="confetti-layer" aria-hidden="true">
            {confettiBits.map(bit => (
              <span
                key={bit.id}
                className="confetti-bit"
                style={{
                  left: bit.x + 'vw',
                  width: bit.size,
                  height: bit.size * 0.6,
                  animationDelay: bit.delay + 's',
                  background: `hsl(${bit.hue} 85% 60%)`,
                  transform: `rotate(${bit.rot}deg)`
                }}
              />
            ))}
          </div>
        )}
        <header className="endgame-header">
          <h2 className="endgame-title" data-outcome={won ? 'victory' : 'defeat'}>{won ? 'Team Victory' : 'Defeat'}</h2>
          <p className="endgame-config" aria-label="Configuration summary">{cfgSummary}</p>
        </header>
        <section className="endgame-metrics" aria-label="Game results">
          <div className="metric">
            <span className="metric-label">Completed</span>
            <span className="metric-value">{completedTotal}/{target}</span>
            <div className="metric-bar" aria-hidden="true">
              <div className="metric-bar-fill" style={{ width: target ? Math.min(100, (completedTotal/target)*100).toFixed(1) + '%' : '0%' }} />
            </div>
          </div>
          <div className="metric">
            <span className="metric-label">Turns</span>
            <span className="metric-value">{turnNumber}/{turnLimit ?? '?'}</span>
            {turnLimit && (
              <div className="metric-bar" aria-hidden="true">
                <div className="metric-bar-fill alt" style={{ width: Math.min(100,(turnNumber/turnLimit)*100).toFixed(1)+'%' }} />
              </div>
            )}
          </div>
        </section>
        <table className="players-breakdown" aria-label="Player performance table">
          <thead>
            <tr><th scope="col">Player</th><th scope="col">Completed</th><th scope="col">Score</th></tr>
          </thead>
          <tbody>
            {players.map(p => {
              const top = topPerformerIds.has(p.id);
              return (
                <tr key={p.id} className={top ? 'top-performer' : undefined}>
                  <td>{p.name}{top && <span className="badge" aria-label="Top performer" title="Top performer">★</span>}</td>
                  <td className="num">{p.completed}</td>
                  <td className="num">{p.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="endgame-actions">
          <button type="button" className="btn primary" onClick={handleReplay}>Replay Same Config</button>
          <button type="button" className="btn outline" onClick={handleReturn}>Return to Setup</button>
        </div>
      </div>
    </div>
  );
}
