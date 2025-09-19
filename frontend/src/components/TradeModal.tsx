import { useState, useMemo } from 'react';
import { useGame } from '../services/gameContext.tsx';
import { refreshFullState } from '../services/stateRefresh.ts';
import { useToasts } from '../services/toastContext.tsx';

const API_BASE = 'http://localhost:3000';

interface Props { open?: boolean; onClose?: () => void; }

export default function TradeModal({ open, onClose }: Props) {
  const { players, activePlayerId, hand, dispatch } = useGame();
  const { push } = useToasts();
  const [targetPlayer, setTargetPlayer] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherPlayers = useMemo(() => players.filter(p => p.id !== activePlayerId), [players, activePlayerId]);
  const resourceHand = useMemo(() => hand.filter(c => (c as any).role), [hand]);

  // derive nicer labels for roles / card metadata (basic heuristic from type/points)
  function roleColor(role: string) {
    switch (role?.toLowerCase()) {
      case 'dev': return 'var(--color-dev, #2563eb)';
      case 'pm': return 'var(--color-pm, #059669)';
      case 'ux': return 'var(--color-ux, #7c3aed)';
      case 'contractor': return 'var(--color-contractor, #b45309)';
      default: return 'var(--color-text)';
    }
  }

  function levelLabel(points: number, type?: string) {
    if (type === 'Contractor') return 'Contractor';
    if (points >= 3) return 'Senior';
    if (points === 2) return 'Junior';
    return 'Entry';
  }

  if (!open) return null;

  async function submitTrade(e: React.FormEvent) {
    e.preventDefault();
    if (!targetPlayer || !selectedCard) { setError('Select a player & a card'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/turn/action/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPlayer: activePlayerId, toPlayer: targetPlayer, cardId: selectedCard })
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Trade failed');
      } else {
        push('success', 'Trade completed');
        await refreshFullState(dispatch);
        onClose?.();
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Trade dialog" style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'var(--modal-surface)', border:'1px solid var(--color-border)', padding: '1rem 1.25rem', minWidth: 360, maxWidth: 480, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.25)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '.75rem' }}>Trade a Card</h3>
        <form onSubmit={submitTrade}>
          <div style={{ marginBottom: '.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'block', fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.05em', opacity: .75 }}>Target Player</label>
              {targetPlayer && <button type="button" onClick={() => setTargetPlayer('')} style={{ background:'none', border:'none', color:'var(--color-accent)', cursor:'pointer', fontSize:'.55rem' }}>Clear</button>}
            </div>
            <div role="radiogroup" aria-label="Choose a target player" style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.4rem' }}>
              {otherPlayers.length === 0 && <div style={{ fontSize: '.65rem', opacity:.65 }}>No other players.</div>}
              {otherPlayers.map(p => {
                const active = p.id === targetPlayer;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTargetPlayer(p.id)}
                    className={'player-pill' + (active ? ' active' : '')}
                    style={{
                      padding: '.45rem .7rem',
                      borderRadius: 999,
                      border: active ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      background: active ? 'var(--color-accent-tint)' : 'var(--color-select-bg)',
                      cursor: 'pointer',
                      fontSize: '.65rem',
                      fontWeight: 600,
                      letterSpacing: '.5px',
                      color: active ? 'var(--color-text)' : 'var(--color-text-dim)'
                    }}
                  >{p.name || p.id}</button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ display: 'block', fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.05em', opacity: .75 }}>Your Card</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 160, overflowY: 'auto', marginTop: '.35rem', paddingRight: '.25rem' }}>
              {resourceHand.length === 0 && <div style={{ fontSize: '.7rem', opacity: .6 }}>No cards to trade.</div>}
              {resourceHand.map(c => {
                const active = c.id === selectedCard;
                const role = (c as any).role;
                const pts = (c as any).points;
                const type = (c as any).type;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCard(c.id)}
                    role="radio"
                    aria-checked={active}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '.75rem',
                      padding: '.5rem .6rem',
                      borderRadius: 8,
                      border: active ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      background: active ? 'var(--color-accent-tint)' : 'var(--color-select-bg)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '.7rem', fontWeight: 600, color: roleColor(role) }}>{role}</span>
                      <span style={{ fontSize: '.55rem', opacity: .75 }}>{levelLabel(pts, type)} · {type || 'Resource'}</span>
                    </span>
                    <span style={{ fontSize: '.75rem', fontWeight: 600 }}>{pts} pts</span>
                    <span aria-hidden="true" style={{ fontSize: '.65rem', opacity: .5 }}>{active ? '✔' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '.65rem', marginBottom: '.5rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn primary" disabled={submitting || !targetPlayer || !selectedCard}>Confirm Trade</button>
          </div>
        </form>
      </div>
    </div>
  );
}
