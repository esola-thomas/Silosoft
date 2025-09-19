import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameProvider, useGame } from '../../src/services/gameContext.tsx';
import { ToastProvider } from '../../src/services/toastContext.tsx';
import HandPanel from '../../src/components/HandPanel.tsx';

function InjectState({ snapshot }: { snapshot: any }) {
  const { dispatch } = useGame();
  React.useEffect(() => {
    dispatch({ type: 'SET_STATE', payload: snapshot });
  }, [snapshot]);
  return <HandPanel />;
}

describe('PTO lock rendering', () => {
  it('renders locked class when ptoLocks contain the card with future availability', () => {
    const cardId = 'card-1';
    const snapshot = {
      status: 'ACTIVE',
      turnNumber: 5,
      players: [{ id: 'P1', name: 'A', seat: 1, score: 0, completed: 0, active: true, ptoLocks: [{ cardId, availableOnTurn: 7 }] }],
      hand: [{ id: cardId, role: 'DEV', type: 'Developer', points: 3 }],
      candidates: [],
      target: 9,
      activePlayerId: 'P1',
      ptoLocks: [{ cardId, availableOnTurn: 7 }],
    };
    render(
      <ToastProvider>
        <GameProvider>
          <InjectState snapshot={snapshot} />
        </GameProvider>
      </ToastProvider>
    );
    const resource = screen.getByLabelText(/DEV 3 points/i);
    expect(resource).toHaveClass('locked');
  });
});
