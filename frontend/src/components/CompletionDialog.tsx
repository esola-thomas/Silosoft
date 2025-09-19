import { useEffect, useMemo, useState } from 'react';
import { useGame, type Candidate } from '../services/gameContext.tsx';
import { selectResourcesForCandidate } from '../services/completionLogic.ts';
import { remainingPtoTurns } from '../services/ptoUtil.ts';
import { refreshFullState, fetchActiveCandidates } from '../services/stateRefresh.ts';

const API_BASE = 'http://localhost:3000';

export default function CompletionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch, hand, activePlayerId, ptoLocks, turnNumber } = useGame();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [chosenResourceIds, setChosenResourceIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const list: Candidate[] = await fetchActiveCandidates();
        const first = list[0] || null;
        setCandidate(first);
        if (first && !selected) setSelected(first.featureId);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [open]);

  // Derive auto-selected resources when candidate or hand changes
  const autoResources = useMemo(() => {
    if (!candidate || !selected || candidate.featureId !== selected) return [];
    try {
      return selectResourcesForCandidate(hand as any, candidate);
    } catch {
      return [];
    }
  }, [candidate, selected, hand]);

  useEffect(() => {
    setChosenResourceIds(autoResources);
  }, [autoResources]);

  function toggleResource(id: string) {
    setChosenResourceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function attempt() {
  if (!selected || !candidate) return;
    if (!activePlayerId) { setError('No active player.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/turn/action/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: activePlayerId, featureIds: [selected], resourceIds: chosenResourceIds })
      });
      const json = await res.json();
      if (json.error) setError(json.error);
      await refreshFullState(dispatch);
      // Re-fetch candidate for possible additional completion in same turn
      const list: Candidate[] = await fetchActiveCandidates();
      const first = list[0] || null;
      setCandidate(first);
      if (first) {
        setSelected(first.featureId);
      } else {
        // No further feature to complete; close dialog automatically
        onClose();
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Attempt Completion</h3>
        {loading && <div style={{ fontSize:'.65rem' }}>Loading...</div>}
        {error && <div style={{ color:'var(--color-danger)', fontSize:'.65rem' }}>{error}</div>}
        {!loading && !candidate && <div style={{ fontSize:'.65rem', opacity:.7 }}>No feature ready for completion.</div>}
        {candidate && (
          <div>
            <div style={{ fontSize:'.7rem', fontWeight:600, letterSpacing:'.5px' }}>
              {candidate.name} <span style={{ opacity:.5 }}>#{candidate.featureId}</span>
            </div>
            <table className="requirements-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Need</th>
                  <th>Have</th>
                  <th>Deficit</th>
                </tr>
              </thead>
              <tbody>
                {candidate.requirements.map(r => (
                  <tr key={r.role}>
                    <td>{r.role}</td>
                    <td>{r.minPoints}</td>
                    <td>{r.have}</td>
                    <td className={'deficit ' + (r.deficit>0 ? 'bad':'good')}>{r.deficit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {candidate && (
          <div style={{ marginBottom:'.75rem' }}>
            <strong style={{ fontSize:'.65rem', letterSpacing:'.5px' }}>Select Resources</strong>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.45rem', marginTop:'.4rem' }}>
              {hand.map(card => {
                const checked = chosenResourceIds.includes(card.id);
                const lockEntry = ptoLocks?.find(l => l.cardId === card.id && l.availableOnTurn > turnNumber);
                const locked = !!lockEntry;
                const turnsLeft = lockEntry ? remainingPtoTurns(turnNumber, lockEntry.availableOnTurn) : 0;
                const disabledReason = locked ? `Locked (PTO) - available in ${turnsLeft} turn${turnsLeft===1?'':'s'}` : '';
                return (
                  <label
                    key={card.id}
                    style={{
                      border:'1px solid var(--color-border)',
                      background: locked ? 'repeating-linear-gradient(135deg, rgba(255,180,0,0.15) 0 6px, rgba(255,180,0,0.05) 6px 12px)' : (checked ? 'var(--color-select-bg-active)' : 'var(--color-select-bg)'),
                      padding:'.45rem .6rem',
                      borderRadius:6,
                      fontSize:'.55rem',
                      cursor: locked ? 'not-allowed' : 'pointer',
                      boxShadow: checked? '0 0 0 1px var(--color-accent)':'none',
                      opacity: locked ? .55 : 1,
                      position:'relative'
                    }}
                    title={disabledReason || undefined}
                    aria-label={locked ? `${card.role} ${card.points} points locked for ${turnsLeft} more` : `${card.role} ${card.points} points`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => !locked && toggleResource(card.id)}
                      style={{ marginRight:4 }}
                    />
                    {card.role} ({card.points})
                    {locked && (
                      <span className="pto-lock-badge" style={{ position:'absolute', top:2, right:4, fontSize:'.5rem', fontWeight:600, background:'var(--color-warning)', color:'#000', padding:'2px 4px', borderRadius:4 }}>🔒 {turnsLeft}</span>
                    )}
                  </label>
                );
              })}
            </div>
            <div style={{ marginTop:'.4rem', fontSize:'.55rem', opacity:.65 }}>
              Auto-picked: {autoResources.length ? autoResources.join(', ') : 'none'}
            </div>
          </div>
        )}
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
          <button className="btn primary" type="button" onClick={attempt} disabled={!selected || loading || !candidate}>Complete</button>
          <button className="btn outline" type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
