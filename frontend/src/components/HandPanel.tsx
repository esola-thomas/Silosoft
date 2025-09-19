// HandPanel (renders active player's resource hand)
import { useGame } from '../services/gameContext.tsx';
import { useToasts } from '../services/toastContext.tsx';
import { useState } from 'react';
import CompletionDialog from './CompletionDialog.tsx';
import TradeModal from './TradeModal.tsx';
import { refreshFullState } from '../services/stateRefresh.ts';
import { remainingPtoTurns } from '../services/ptoUtil.ts';

const API_BASE = 'http://localhost:3000';

export default function HandPanel() {
  const { hand, status, dispatch, pendingEvent, ptoLocks, turnNumber } = useGame();
  const { push } = useToasts();
  const disabled = status !== 'ACTIVE' || !!pendingEvent;
  const [showComplete, setShowComplete] = useState(false);
  const [showTrade, setShowTrade] = useState(false);

  async function refreshState() { await refreshFullState(dispatch); }

  async function draw() {
    if (disabled) return;
    try {
      const res = await fetch(`${API_BASE}/turn/action/draw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) push('info', 'Drew a card'); else push('error', 'Draw failed');
    } catch { push('error', 'Network error'); }
    await refreshState();
  }
  async function pass() {
    if (disabled) return;
    try {
      const res = await fetch(`${API_BASE}/turn/action/pass`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) push('info', 'Passed turn'); else push('error', 'Pass failed');
    } catch { push('error', 'Network error'); }
    await refreshState();
  }
  return (
    <div className="hand-panel">
      <h4 style={{ margin:0, fontSize:'.8rem', letterSpacing:'.5px', fontWeight:600 }}>Hand</h4>
      {status !== 'ACTIVE' && hand.length === 0 && (
        <div style={{ fontSize: '.65rem', color: 'var(--color-text-dim)' }}>Start a game to see your cards.</div>
      )}
      {status === 'ACTIVE' && hand.length === 0 && (
        <div style={{ fontSize: '.65rem', color: 'var(--color-text-dim)' }}>No cards yet. Draw to get started.</div>
      )}
      <div className="hand-cards">
        {hand.filter(Boolean).map(card => {
          // Distinguish resource vs event: events won't have role/points in same shape
          const isResource = (card as any).role && typeof (card as any).role === 'string' && 'points' in (card as any);
          if (!isResource) {
            return (
              <div key={card.id} className={'event-card'}>
                <div className="resource-role">Event</div>
                <div className="resource-points" style={{ textTransform:'capitalize' }}>{(card as any).type?.toLowerCase?.() || 'event'}</div>
                <div style={{ fontSize:'.55rem', opacity:.7 }}>Event</div>
              </div>
            );
          }
          const role = (card as any).role as string;
          const lockEntry = ptoLocks?.find(l => l.cardId === card.id && l.availableOnTurn > turnNumber);
          const locked = !!lockEntry;
          const turnsLeft = lockEntry ? remainingPtoTurns(turnNumber, lockEntry.availableOnTurn) : 0;
          const baseClass = 'resource-card ' + role.toLowerCase();
          const ariaLabel = locked ? `${role} ${card.points} points (Locked for ${turnsLeft} more turn${turnsLeft===1?'':'s'})` : `${role} ${card.points} points`;
          return (
            <div
              key={card.id}
              className={baseClass + (locked ? ' locked' : '')}
              style={locked ? { position:'relative', outline:'2px solid var(--color-warning)', outlineOffset:0, filter:'grayscale(0.25) brightness(0.85)' } : undefined}
              title={locked ? `PTO Locked: unlocks in ${turnsLeft} turn${turnsLeft===1?'':'s'}` : undefined}
              aria-label={ariaLabel}
              aria-disabled={locked ? 'true' : undefined}
              role="listitem"
              data-pto-locked={locked || undefined}
            >
              <div className="resource-role" style={locked ? { textDecoration:'line-through', opacity:.9 } : undefined}>{role}</div>
              <div className="resource-points">{(card as any).points} pts</div>
              <div style={{ fontSize:'.55rem', opacity:.7 }}>{(card as any).type || 'Resource'}</div>
              {locked && (
                <>
                  <div
                    className="pto-lock-overlay"
                    style={{
                      position:'absolute',
                      inset:0,
                      background:'repeating-linear-gradient(135deg, rgba(255,180,0,0.08) 0 8px, rgba(255,180,0,0.16) 8px 16px)',
                      borderRadius:6,
                      pointerEvents:'none'
                    }}
                  />
                  <div
                    className="pto-lock-badge"
                    style={{
                      position:'absolute',
                      top:-6,
                      left:-6,
                      background:'var(--color-warning)',
                      color:'#000',
                      fontSize:'.55rem',
                      fontWeight:700,
                      padding:'.2rem .35rem',
                      borderRadius:6,
                      boxShadow:'0 1px 3px rgba(0,0,0,.25)'
                    }}
                  >
                    🔒 PTO{turnsLeft>0?` ${turnsLeft}`:''}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="actions-row">
    <button className="btn primary" type="button" onClick={draw} disabled={disabled}>Draw</button>
    <button className="btn outline" type="button" onClick={()=> setShowComplete(true)} disabled={disabled}>Complete...</button>
    <button className="btn" type="button" onClick={()=> setShowTrade(true)} disabled={disabled}>Trade</button>
    <button className="btn danger" type="button" onClick={pass} disabled={disabled}>Pass</button>
      </div>
      <CompletionDialog open={showComplete} onClose={() => setShowComplete(false)} />
      <TradeModal open={showTrade} onClose={()=> setShowTrade(false)} />
    </div>
  );
}
