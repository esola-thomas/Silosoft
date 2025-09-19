import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/services/gameContext.tsx';
import { ToastProvider } from '../../src/services/toastContext.tsx';
import App from '../../src/pages/App.tsx';

function buildResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('EndGameModal', () => {
  it('shows victory modal and allows replay', async () => {
    let startCount = 0;
    let resetCount = 0;
    let phase = 0; // 0: initial full returns WON, 1: after replay returns ACTIVE
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/game/full')) {
        if (phase === 0) {
          return buildResponse({ status:'WON', turn:7, target:6, config:{ maxTurns:10, targetMultiplier:3 }, players:[{ id:'P1', name:'Alice', score:10, completed:3 }], activePlayer:{ id:'P1', hand:[], candidates:[] } });
        }
        return buildResponse({ status:'ACTIVE', turn:1, target:6, config:{ maxTurns:10, targetMultiplier:3 }, players:[{ id:'P1', name:'Alice', score:0, completed:0 }], activePlayer:{ id:'P1', hand:[], candidates:[] } });
      }
      if (url.endsWith('/game/start')) { startCount++; phase = 1; return buildResponse({}); }
      if (url.endsWith('/game/reset')) { resetCount++; return buildResponse({}); }
      if (url.endsWith('/log')) return buildResponse([]);
      return buildResponse({});
    }) as any;

    render(<GameProvider><ToastProvider><App /></ToastProvider></GameProvider>);
    await screen.findByRole('dialog', { name:/game summary/i });
    expect(screen.getByText(/team victory/i)).toBeInTheDocument();
    const replayBtn = screen.getByRole('button', { name:/replay same config/i });
    fireEvent.click(replayBtn);
    await waitFor(()=> expect(startCount).toBe(1));
  });
});
