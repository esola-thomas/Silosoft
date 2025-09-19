// HeaderBar (T059 placeholder)
import { useGame } from '../services/gameContext.tsx';
import { useState, useCallback } from 'react';
const API_BASE = 'http://localhost:3000';
import { cycleTheme, getCurrentTheme } from '../services/themeManager.ts';
import { cycleMotion, getMotion } from '../services/motionManager.ts';

export default function HeaderBar() {
  const { turnNumber, turnLimit, status, target, targetPerPlayer, players, dispatch, focusMode, pendingEvent } = useGame();
  const challengeDetails = players.filter(p => p.challenge).map(p => ({ id: p.id, turnsLeft: Math.max(0, p.challenge!.mustCompleteByTurn - turnNumber) }));
  const [theme, setTheme] = useState(getCurrentTheme());
  const [motion, setMotion] = useState(getMotion());
  const handleCycle = useCallback(() => { setTheme(cycleTheme(theme)); }, [theme]);
  const handleMotion = useCallback(() => { setMotion(cycleMotion(motion)); }, [motion]);
  const completedTotal = players.reduce((sum,p)=> sum + p.completed, 0);
  const progressPct = target ? Math.min(100, (completedTotal / target) * 100) : 0;
  return (
    <header className="header-bar">
      <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:160 }}>
        <div style={{ fontWeight:700, letterSpacing:'.6px', fontSize:'.95rem', background:'var(--gradient-accent)', WebkitBackgroundClip:'text', color:'transparent' }}>Silosoft</div>
        <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', alignItems:'center' }}>
          <div className={"turn-pill " + (status==='ACTIVE' ? 'active':'' )}>Turn {turnNumber}{turnLimit ? `/${turnLimit}`:''}</div>
          <div className="turn-pill" style={{ background:'var(--color-pill-bg)' }}>{status}</div>
          <div className="turn-pill" style={{ background:'var(--color-pill-bg)' }} title={targetPerPlayer ? `Target per player: ${targetPerPlayer}` : undefined}>{completedTotal}/{target}</div>
          {pendingEvent && (<div className="turn-pill" style={{ background:'#7d2d3d', color:'#fff', fontWeight:600 }} title="Pending event must be acknowledged">EVENT!</div>)}
          {challengeDetails.map(c => (
            <div key={c.id} className="turn-pill" style={{ background:'#2d4d7d', color:'#fff', fontWeight:600 }} title={`Player ${c.id} must complete within ${c.turnsLeft} turn(s)`}>
              CH:{c.id}:{c.turnsLeft}
            </div>
          ))}
        </div>
      </div>
      <div className="progress-wrapper">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: progressPct + '%' }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
        <button type="button" className="theme-toggle-btn" aria-label={`Switch theme (current ${theme})`} onClick={handleCycle}>
          {theme === 'dark' && 'Dark'}
          {theme === 'light' && 'Light'}
          {theme === 'hc' && 'High Contrast'}
        </button>
        <button type="button" className="motion-toggle-btn" aria-label={`Toggle motion preference (current ${motion})`} onClick={handleMotion}>
          {motion === 'system' && 'Motion:Sys'}
          {motion === 'on' && 'Motion:On'}
          {motion === 'off' && 'Motion:Off'}
        </button>
        <button type="button" className="focus-toggle-btn" aria-pressed={focusMode} aria-label="Toggle feature focus mode" onClick={()=> dispatch({ type:'TOGGLE_FOCUS_MODE' })}>
          {focusMode ? 'Focus On' : 'Focus Off'}
        </button>
        {status === 'ACTIVE' && (
          <button type="button" className="reset-btn" aria-label="Reset game" onClick={async () => {
            await fetch(`${API_BASE}/game/reset`, { method:'POST' });
            dispatch({ type:'SET_STATE', payload:{ status:'NO_GAME', players:[], hand:[], candidates:[], turnNumber:0, activePlayerId:undefined } });
          }}>Reset</button>
        )}
        {status === 'ACTIVE' && (
          <button type="button" className="focus-toggle-btn" aria-label="Export replay JSON" onClick={async () => {
            try {
              const res = await fetch(`${API_BASE}/game/replay`);
              if (!res.ok) return;
              const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `silosoft-replay-turn${turnNumber}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch {/* ignore */}
          }}>Export</button>
        )}
      </div>
    </header>
  );
}
