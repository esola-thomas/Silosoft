import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider, useGame } from '../../src/services/gameContext.tsx';
import { ToastProvider } from '../../src/services/toastContext.tsx';
import EventModal from '../../src/components/EventModal.tsx';

/**
 * Ensures that when acknowledging a PTO event with a selected card, the optimistic lock is applied immediately.
 * We simulate the onAcknowledge handler injecting the optimistic state update.
 */

describe('Immediate PTO lock optimistic visual', () => {
  it('applies locked visual immediately after acknowledge', () => {
    // Start with a game state snapshot manually (simplified)
    // We'll emulate context by dispatching a SET_STATE before rendering EventModal.
    const Wrapper: React.FC = () => {
      const { dispatch, hand, ptoLocks, pendingEvent } = useGame();
      React.useEffect(() => {
        dispatch({ type: 'SET_STATE', payload: {
          status: 'ACTIVE',
          turnNumber: 5,
          players: [{ id:'P1', name:'P1', seat:0, score:0, completed:0, active:true }],
          activePlayerId: 'P1',
          hand: [ { id:'R1', role:'DEV', type:'Resource', points:2 }, { id:'R2', role:'UX', type:'Resource', points:1 } ],
          pendingEvent: { id:'ev1', type:'PTO' },
          ptoLocks: null,
        }});
      }, [dispatch]);
      const handleAck = (payload?: { cardId?: string }) => {
        if (payload?.cardId) {
          dispatch({ type:'SET_STATE', payload: { pendingEvent: null, ptoLocks: [{ cardId: payload.cardId, availableOnTurn: 7 }] } });
        } else {
          dispatch({ type:'SET_STATE', payload: { pendingEvent: null } });
        }
      };
      return (
        <>
          <EventModal open={!!pendingEvent} eventType={pendingEvent?.type} onAcknowledge={handleAck} />
          <div data-testid="hand-state">{hand.map(c => c.id + (ptoLocks?.some(l => l.cardId === c.id && l.availableOnTurn > 5) ? ':locked' : '')).join(',')}</div>
        </>
      );
    };

    render(<ToastProvider><GameProvider><Wrapper /></GameProvider></ToastProvider>);

    // Select the first card button (DEV 2)
    const devBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('DEV 2'))!;
    fireEvent.click(devBtn);
    const ack = screen.getByRole('button', { name: /acknowledge/i });
    fireEvent.click(ack);

    const handState = screen.getByTestId('hand-state');
    expect(handState.textContent).toContain('R1:locked');
  });
});
