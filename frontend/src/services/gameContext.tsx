// GameContext (T057) - will be expanded with reducer/actions
import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

export interface PlayerSummary { id: string; name: string; seat: number; score: number; completed: number; active: boolean; challenge?: { mustCompleteByTurn: number } | null; }
export interface HandCard { id: string; role: string; type: string; points: number; }
export interface RequirementProgress { role: string; minPoints: number; have: number; deficit: number }
export interface Candidate { featureId: string; name: string; totalPoints: number; requirements: RequirementProgress[]; canComplete: boolean; }

interface GameState {
  status: string;
  turnNumber: number;
  turnLimit?: number;
  log: any[];
  players: PlayerSummary[];
  hand: HandCard[]; // local player's hand (from activePlayer snapshot)
  candidates: Candidate[];
  target: number;
  targetPerPlayer?: number;
  activePlayerId?: string;
  wsConnected: boolean;
  focusMode: boolean; // dim non-active players when true
  pendingEvent?: { id: string; type: string } | null;
  ptoLocks?: { cardId: string; availableOnTurn: number }[] | null;
}

const initialState: GameState = { status: 'INIT', turnNumber: 0, turnLimit: undefined, log: [], players: [], hand: [], candidates: [], target: 0, targetPerPlayer: undefined, activePlayerId: undefined, wsConnected: false, focusMode: false, pendingEvent: null, ptoLocks: null };

type Action =
  | { type: 'SET_STATE'; payload: Partial<GameState> }
  | { type: 'APPEND_LOG'; entry: any }
  | { type: 'RESET_LOG'; }
  | { type: 'WS_STATE'; payload: any }
  | { type: 'WS_STATUS'; connected: boolean }
  | { type: 'TOGGLE_FOCUS_MODE' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'APPEND_LOG':
      return { ...state, log: [...state.log, action.entry] };
    case 'RESET_LOG':
      return { ...state, log: [] };
    case 'WS_STATE': {
      const snapshot = action.payload;
      return {
        ...state,
  status: snapshot.status,
  turnNumber: snapshot.turn,
  turnLimit: snapshot.config?.maxTurns ?? state.turnLimit,
  target: snapshot.target ?? state.target,
  targetPerPlayer: snapshot.config?.targetMultiplier ?? state.targetPerPlayer,
        players: snapshot.players || state.players,
        activePlayerId: snapshot.activePlayer?.id || state.activePlayerId,
        hand: snapshot.activePlayer?.hand || state.hand,
        candidates: snapshot.activePlayer?.candidates || state.candidates,
        pendingEvent: snapshot.pendingEvent || null,
        ptoLocks: snapshot.players?.find((p: any) => p.id === snapshot.activePlayer?.id)?.ptoLocks || null,
      };
    }
    case 'WS_STATUS':
      return { ...state, wsConnected: action.connected };
    case 'TOGGLE_FOCUS_MODE':
      return { ...state, focusMode: !state.focusMode };
    default:
      return state;
  }
}

interface GameContextValue extends GameState { dispatch: React.Dispatch<Action>; }

const GameContext = createContext<GameContextValue | undefined>(undefined as any);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ ...state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
