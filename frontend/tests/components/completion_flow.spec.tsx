import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/pages/App.tsx';
import { GameProvider } from '../../src/services/gameContext.tsx';
import { ToastProvider } from '../../src/services/toastContext.tsx';

// Simple fetch mock harness
const originalFetch = global.fetch;

function mockSequence(responses: Array<{ urlPart: string; json: any }>) {
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const match = responses.find(r => url.includes(r.urlPart));
    if (!match) {
      return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(match.json), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as any;
}

describe('Completion Flow UI', () => {
  beforeEach(() => {
    // No longer need fake timers since initial state fetch happens immediately on mount
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders completion candidates and forms request', async () => {
    mockSequence([
      { urlPart: '/game/full', json: { status: 'ACTIVE', turn: 1, players: [ { id:'P1', name:'Alice', score:0, completed:0, active:true, feature:{ name:'Azure AD Single Sign-On', description:'Enable SSO integration for enterprise tenants via OpenID Connect.', totalPoints:5, requirements:[{ role:'DEV', minPoints:3, have:3, deficit:0 }, { role:'PM', minPoints:2, have:2, deficit:0 }] } } ], activePlayer: { id: 'P1', hand: [ { id:'R1', role:'DEV', points:3 }, { id:'R2', role:'PM', points:2 } ], candidates: [ { featureId:'F1', name:'Azure AD Single Sign-On', totalPoints:5, requirements:[{ role:'DEV', minPoints:3, have:3, deficit:0 }, { role:'PM', minPoints:2, have:2, deficit:0 }], missingRoles:[], canComplete:true } ] }, target: 10 } },
      { urlPart: '/log', json: [] },
      { urlPart: '/game/active', json: { active: { candidates: [ { featureId:'F1', name:'Azure AD Single Sign-On', totalPoints:5, requirements:[{ role:'DEV', minPoints:3, have:3, deficit:0 }, { role:'PM', minPoints:2, have:2, deficit:0 }], missingRoles:[], canComplete:true } ] } } },
      { urlPart: '/turn/action/complete', json: { ok: true } },
      { urlPart: '/game/state', json: { status: 'ACTIVE', turnNumber: 1 } }
    ]);

  render(<GameProvider><ToastProvider><App /></ToastProvider></GameProvider>);

  // Initial fetch should occur immediately due to mount effect
  await waitFor(() => {
    const calls = (global.fetch as any).mock.calls;
    expect(calls.some((c: any[]) => String(c[0]).includes('/game/full'))).toBe(true);
  });

    // Open completion dialog
    const completeBtn = await screen.findByRole('button', { name: /complete/i });
    fireEvent.click(completeBtn);

  // Candidate appears with requirement row (DEV)
  await screen.findByText(/Azure AD Single Sign-On/i);
  const devMatches = await screen.findAllByText(/DEV/i);
  expect(devMatches.length).toBeGreaterThan(0);

    // Press Complete inside dialog
  const confirmBtn = screen.getAllByRole('button', { name: /complete/i }).find(btn => btn.textContent?.toLowerCase() === 'complete')!;
    fireEvent.click(confirmBtn);

    // Ensure POST complete called
    await waitFor(() => {
      const calls = (global.fetch as any).mock.calls.filter((c: any[]) => String(c[0]).includes('/turn/action/complete'));
      expect(calls.length).toBeGreaterThan(0);
      // Inspect payload
      const body = calls[0][1].body;
      const parsed = JSON.parse(body);
      expect(parsed.featureIds).toEqual(['F1']);
      expect(parsed.resourceIds.length).toBeGreaterThan(0);
      expect(parsed.playerId).toBe('P1');
    });
  });
});
