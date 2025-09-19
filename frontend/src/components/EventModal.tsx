// EventModal (T062 placeholder)
import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from '../services/gameContext.tsx';

interface Props { open?: boolean; eventType?: string; onAcknowledge?: (payload?: { cardId?: string; targetPlayerId?: string }) => void; }

const EVENT_META: Record<string, { title: string; desc: string; accent: string }> = {
  LAYOFF: { title: 'Layoff', desc: 'A random resource will be removed from your hand.', accent: '#ff6b6b' },
  REORG: { title: 'Reorg', desc: 'Hands between two players will be swapped.', accent: '#ffa94d' },
  COMPETITION: { title: 'Competition', desc: 'A productivity penalty or pressure effect is applied.', accent: '#4dabf7' },
  PTO: { title: 'PTO', desc: 'One of your resources becomes temporarily unavailable.', accent: '#b197fc' },
};

export default function EventModal({ open, eventType, onAcknowledge }: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const meta = eventType ? EVENT_META[eventType] : undefined;
  const { hand, players, activePlayerId } = useGame();
  const isInteractive = eventType === 'LAYOFF' || eventType === 'REORG' || eventType === 'PTO';
  const selectableHand = hand.filter(c => (c as any).role); // resource cards only
  const [selectedCard, setSelectedCard] = useState<string | undefined>();
  const [targetPlayer, setTargetPlayer] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setSelectedCard(undefined);
      setTargetPlayer(undefined);
    }
  }, [open, eventType]);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => { btnRef.current?.focus(); }, 0);
    } else if (!open && prevFocusRef.current) {
      prevFocusRef.current.focus();
    }
  }, [open]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      onAcknowledge?.();
    }
  }, [open, onAcknowledge]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!open) return null;
  const descId = 'event-modal-desc';
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="event-modal-title" aria-describedby={descId} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div ref={dialogRef} style={{ background: 'var(--modal-surface)', border:'1px solid var(--color-border)', padding: '1.1rem 1.25rem 1.25rem', minWidth: 320, maxWidth: 480, borderRadius: 16, boxShadow:'0 10px 36px -6px rgba(0,0,0,.55)', animation:'pop-in .22s cubic-bezier(.34,1.4,.64,1)', transformOrigin:'center' }} onKeyDown={e => {
        if (e.key === 'Tab') {
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
          if (focusable && focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'.35rem' }}>
          <div style={{ width:40, height:40, borderRadius:12, background: meta?.accent || 'var(--color-accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:700, letterSpacing:'.5px', boxShadow:'0 0 0 1px rgba(255,255,255,0.12), 0 4px 10px -2px rgba(0,0,0,.5)' }}>{meta?.title?.slice(0,3).toUpperCase()}</div>
          <h3 id="event-modal-title" style={{ margin:0, fontSize:'1rem', letterSpacing:'.6px' }}>{meta?.title || 'Event'}</h3>
        </div>
        <p id={descId} style={{ fontSize:'.68rem', lineHeight:1.35, opacity:.85, margin:'.2rem 0 .6rem' }}>
          {meta?.desc || 'An event has occurred. Acknowledge to continue.'}
        </p>
        <p style={{ fontSize:'.55rem', margin:'0 0 .9rem', letterSpacing:'.4px', opacity:.55 }}>Press ESC or click the button to continue{isInteractive ? ' after making selections.' : '.'}</p>
        {isInteractive && (
          <div style={{ marginBottom:'.85rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
            {(eventType === 'LAYOFF' || eventType === 'PTO' || eventType === 'REORG') && (
              <div>
                <label style={{ display:'block', fontSize:'.6rem', fontWeight:600, marginBottom:4 }}>Select Resource Card</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {selectableHand.length === 0 && <div style={{ fontSize:'.55rem', opacity:.6 }}>No resource cards available.</div>}
                  {selectableHand.map(c => (
                    <button key={c.id} type="button" onClick={() => setSelectedCard(c.id)}
                      style={{ padding:'4px 6px', fontSize:'.55rem', borderRadius:6, border:'1px solid var(--color-border)', background: selectedCard === c.id ? 'var(--color-accent)' : 'var(--color-muted-bg)', color: selectedCard === c.id ? '#fff' : 'var(--color-text)' }}>
                      {(c as any).role} {(c as any).points}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {eventType === 'REORG' && (
              <div>
                <label style={{ display:'block', fontSize:'.6rem', fontWeight:600, marginBottom:4 }}>Select Target Player</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {players.filter(p => p.id !== activePlayerId).map(p => (
                    <button key={p.id} type="button" onClick={() => setTargetPlayer(p.id)}
                      style={{ padding:'4px 6px', fontSize:'.55rem', borderRadius:6, border:'1px solid var(--color-border)', background: targetPlayer === p.id ? '#ffa94d' : 'var(--color-muted-bg)', color: targetPlayer === p.id ? '#000' : 'var(--color-text)' }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'.5rem' }}>
          <button ref={btnRef} type="button" className="btn primary" disabled={isInteractive && (eventType === 'REORG' ? (!selectedCard || !targetPlayer) : !selectedCard && selectableHand.length>0)} onClick={() => {
            if (onAcknowledge) onAcknowledge({ cardId: selectedCard, targetPlayerId: targetPlayer });
          }}>Acknowledge</button>
        </div>
      </div>
    </div>
  );
}
