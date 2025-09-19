import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import App from '../../src/pages/App.tsx';
import { GameProvider } from '../../src/services/gameContext.tsx';
import { ToastProvider } from '../../src/services/toastContext.tsx';

// Basic smoke test to open trade modal (UI only; backend not mocked here)
// Since existing tests are placeholders, we keep this lightweight.

describe('Trade Flow UI', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/game/start')) {
        return { ok: true, status: 200, json: async () => ({ ok: true }) } as any;
      }
      if (url.endsWith('/game/full')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ACTIVE',
            turn: 1,
            target: 6,
            players: [
              { id: 'p1', name: 'Alice', seat: 0, score: 0, completed: 0, active: true, feature: null },
              { id: 'p2', name: 'Bob', seat: 1, score: 0, completed: 0, active: false, feature: null }
            ],
            activePlayer: {
              id: 'p1',
              hand: [ { id: 'c1', role: 'Dev', type: 'Resource', points: 3 } ],
              candidates: []
            }
          })
        } as any;
      }
      if (url.endsWith('/turn/action/trade')) {
        return { ok: true, status: 200, json: async () => ({ success: true }) } as any;
      }
      return { ok: true, status: 200, json: async () => ({}) } as any;
    });
  });

  it('opens trade modal and shows player pills + resource list', async () => {
    render(<ToastProvider><GameProvider><App /></GameProvider></ToastProvider>);
    // Start game by submitting form
    const startBtn = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(startBtn);
    // Trade button should be enabled after state refresh
    const tradeBtn = await screen.findByRole('button', { name: /trade/i });
    fireEvent.click(tradeBtn);
    const dialog = await screen.findByRole('dialog', { name: /trade dialog/i });
    expect(dialog).toBeInTheDocument();
    // Player pills should contain Bob (not active player Alice)
    expect(within(dialog).getByRole('radio', { name: 'Bob' })).toBeInTheDocument();
    // Resource list should show Dev card and points
    expect(within(dialog).getByText(/dev/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/3 pts/i)).toBeInTheDocument();
  });
});
