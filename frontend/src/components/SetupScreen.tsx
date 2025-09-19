import React, { useState, useEffect } from 'react';
import { useGame } from '../services/gameContext.tsx';

const API_BASE = 'http://localhost:3000';

interface PendingPlayer { id: string; name: string; }

const DEFAULT_NAMES = ['Alice', 'Bob'];

function randomName(): string {
  const syllables = ['sol', 'tek', 'ion', 'tri', 'zen', 'lux', 'neo', 'plex', 'vex', 'quant', 'nova'];
  const pick = () => syllables[Math.floor(Math.random()*syllables.length)];
  return (pick() + pick()).slice(0,10).replace(/^(.)/, c => c.toUpperCase());
}

export default function SetupScreen() {
  const { dispatch } = useGame();
  const [players, setPlayers] = useState<PendingPlayer[]>(() => {
    const stored = localStorage.getItem('lobby.players');
    if (stored) {
      try { const parsed = JSON.parse(stored); if (Array.isArray(parsed) && parsed.length) return parsed; } catch {/* ignore */}
    }
    return DEFAULT_NAMES.map((n,i)=>({ id: `tmp-${i+1}`, name: n }));
  });
  const [seed, setSeed] = useState(() => localStorage.getItem('lobby.seed') || 'seed1');
  const [resourceWeight, setResourceWeight] = useState(() => {
    const v = localStorage.getItem('lobby.resourceWeight');
    return v ? parseFloat(v) : 0.8;
  });
  const [singleCompletionPerTurn, setSingleCompletionPerTurn] = useState(() => localStorage.getItem('lobby.single') === '1');
  const [maxTurns, setMaxTurns] = useState<number>(() => {
    const v = localStorage.getItem('lobby.maxTurns');
    return v ? parseInt(v, 10) : 10;
  });
  const [targetMultiplier, setTargetMultiplier] = useState<number>(() => {
    const v = localStorage.getItem('lobby.targetMultiplier');
    return v ? parseInt(v, 10) : 3;
  });
  const [error, setError] = useState<string | null>(null);
  const [nameIssues, setNameIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function updateName(id: string, name: string) {
    setPlayers(p => p.map(pl => pl.id === id ? { ...pl, name } : pl));
  }
  function addPlayer() {
    setPlayers(p => {
      if (p.length >= 4) return p; // max 4
      return [...p, { id: `tmp-${Date.now()}`, name: randomName() }];
    });
  }
  function removePlayer(id: string) {
    setPlayers(p => p.filter(pl => pl.id !== id));
  }
  function shuffleNames() {
    setPlayers(p => p.map(pl => ({ ...pl, name: randomName() })));
  }

  useEffect(() => {
    localStorage.setItem('lobby.players', JSON.stringify(players));
  }, [players]);
  useEffect(() => { localStorage.setItem('lobby.seed', seed); }, [seed]);
  useEffect(() => { localStorage.setItem('lobby.resourceWeight', resourceWeight.toString()); }, [resourceWeight]);
  useEffect(() => { localStorage.setItem('lobby.single', singleCompletionPerTurn ? '1':'0'); }, [singleCompletionPerTurn]);
  useEffect(() => { localStorage.setItem('lobby.maxTurns', String(maxTurns)); }, [maxTurns]);
  useEffect(() => { localStorage.setItem('lobby.targetMultiplier', String(targetMultiplier)); }, [targetMultiplier]);

  useEffect(() => {
    const raw = players.map(p => p.name.trim());
    const issues: string[] = [];
    if (raw.some(n => !n)) issues.push('Blank names');
    const lower = raw.filter(Boolean).map(n=>n.toLowerCase());
    const dup = lower.filter((n,i)=> lower.indexOf(n)!==i);
    if (dup.length) issues.push('Duplicate names');
    setNameIssues(issues);
  }, [players]);

  const valid = nameIssues.length === 0 && players.length > 0;

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const names = players.map(p => p.name.trim()).filter(Boolean);
    if (!names.length) { setError('At least one player required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/game/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerNames: names, seed, resourceWeight, singleCompletionPerTurn, maxTurns, targetMultiplier })
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        setError(j.error || 'Failed to start');
        return;
      }
      const stateRes = await fetch(`${API_BASE}/game/full`);
      if (stateRes.ok) {
        const json = await stateRes.json();
        dispatch({ type: 'SET_STATE', payload: {
          status: json.status,
          turnNumber: json.turn,
          players: json.players,
          hand: json.activePlayer?.hand || [],
          candidates: json.activePlayer?.candidates || [],
          target: json.target,
          activePlayerId: json.activePlayer?.id,
        }});
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="setup-screen vivid">
      <h1 className="game-title">Silosoft</h1>
      <p className="tagline">Cooperate to ship features before turn 10.</p>
      <form onSubmit={startGame} className="setup-form" aria-label="Game Setup">
        <fieldset className="players-config">
          <legend>Players</legend>
          {players.map((p, idx) => (
            <div key={p.id} className="player-row">
              <label>
                <span className="vis-label">Player {idx+1}</span>
                <input value={p.name} maxLength={20} required onChange={e=>updateName(p.id, e.target.value)} />
              </label>
              {players.length > 1 && (
                <button type="button" onClick={()=>removePlayer(p.id)} aria-label={`Remove player ${idx+1}`}>✕</button>
              )}
            </div>
          ))}
          <div className="player-actions">
            <button type="button" onClick={addPlayer} disabled={players.length>=4}>Add Player</button>
            <button type="button" onClick={shuffleNames}>Randomize Names</button>
          </div>
          {nameIssues.length > 0 && (
            <div className="validation-msg" role="alert">{nameIssues.join(' • ')}</div>
          )}
        </fieldset>
        <fieldset className="advanced-config">
          <legend>Advanced</legend>
          <label>Seed <input value={seed} onChange={e=>setSeed(e.target.value)} placeholder="(optional)" /></label>
          <label style={{ display:'flex', flexDirection:'column', gap:4 }}>Resource Weight
            <input type="range" min={0.5} max={0.95} step={0.01} value={resourceWeight} onChange={e=>setResourceWeight(parseFloat(e.target.value))} />
            <span style={{ fontSize:'.6rem', opacity:.7 }}>{(resourceWeight*100).toFixed(0)}% resource draw chance</span>
          </label>
          <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:'.65rem' }}>
            <input type="checkbox" checked={singleCompletionPerTurn} onChange={e=>setSingleCompletionPerTurn(e.target.checked)} />
            Single completion per turn
          </label>
          <div className="grid-adv" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:8 }}>
            <label style={{ fontSize:'.6rem', display:'flex', flexDirection:'column', gap:4 }}>Turn Limit
              <input type="number" min={3} max={50} value={maxTurns} onChange={e=> setMaxTurns(Math.min(50, Math.max(3, parseInt(e.target.value||'10',10))))} />
            </label>
            <label style={{ fontSize:'.6rem', display:'flex', flexDirection:'column', gap:4 }}>Target / Player
              <input type="number" min={1} max={12} value={targetMultiplier} onChange={e=> setTargetMultiplier(Math.min(12, Math.max(1, parseInt(e.target.value||'3',10))))} />
            </label>
          </div>
          <div style={{ fontSize:'.55rem', opacity:.65 }}>Win target = players × target per player (currently {players.length} × {targetMultiplier} = {players.length * targetMultiplier})</div>
        </fieldset>
        {error && <div role="alert" className="error-msg">{error}</div>}
        <div className="start-actions">
          <button type="submit" disabled={loading || !valid}>{loading ? 'Starting...' : 'Start Game'}</button>
        </div>
      </form>
      <div className="setup-footer">Max 4 players • Names trimmed • Seed enables reproducible runs</div>
    </div>
  );
}
