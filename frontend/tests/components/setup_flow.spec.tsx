import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/pages/App.tsx';
import { GameProvider } from '../../src/services/gameContext.tsx';
import { ToastProvider } from '../../src/services/toastContext.tsx';

const originalFetch = global.fetch;

function buildResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('Setup Flow UI', () => {
  afterEach(() => { global.fetch = originalFetch; });

  it('allows adding player and starting game', async () => {
    let started = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/game/start')) {
        const body = JSON.parse(init!.body as string);
        expect(body.playerNames.length).toBe(3); // after adding one
        started = true;
        return buildResponse({ ok: true });
      }
      if (url.endsWith('/game/full')) {
        if (!started) return new Response(JSON.stringify({ error:'No active game' }), { status:404, headers:{'Content-Type':'application/json'} });
  return buildResponse({ status:'ACTIVE', turn:1, target:9, config:{ maxTurns:15, targetMultiplier:3 }, players:[{ id:'P1', name:'Alice', score:0, completed:0, active:true, feature:{ name:'F1', totalPoints:3, requirements:[] } }], activePlayer:{ id:'P1', hand:[], candidates:[] } });
      }
      if (url.endsWith('/log')) return buildResponse([]);
      return buildResponse({});
    });
    global.fetch = fetchMock as any;

    render(<GameProvider><ToastProvider><App /></ToastProvider></GameProvider>);

    // Landing page visible
    await screen.findByText(/Silosoft/i);
    const addBtn = screen.getByRole('button', { name: /add player/i });
    fireEvent.click(addBtn);
    // Third input appears
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    // Change name of new player
    fireEvent.change(inputs[2], { target: { value: 'Charlie' } });
    const startBtn = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      // After start, setup screen should be gone (players strip appears or header visible)
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it('disables start for duplicate names until fixed and sends advanced config flags', async () => {
    let receivedBody: any = null;
    let started = false;
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/game/start')) {
        receivedBody = JSON.parse(init!.body as string);
        started = true;
        return buildResponse({ ok:true });
      }
      if (url.endsWith('/game/full')) {
        if (!started) return new Response(JSON.stringify({ error:'No active game' }), { status:404, headers:{'Content-Type':'application/json'} });
  return buildResponse({ status:'ACTIVE', turn:1, target:3, config:{ maxTurns:10, targetMultiplier: receivedBody.targetMultiplier || 3 }, players:[{ id:'P1', name:receivedBody.playerNames[0], score:0, completed:0, active:true, feature:{ name:'F1', totalPoints:3, requirements:[] } }], activePlayer:{ id:'P1', hand:[], candidates:[] } });
      }
      if (url.endsWith('/log')) return buildResponse([]);
      return buildResponse({});
    }) as any;

    render(<GameProvider><ToastProvider><App /></ToastProvider></GameProvider>);
    await screen.findByText(/Silosoft/);
    const nameInputs = screen.getAllByRole('textbox');
    // Make duplicate
    fireEvent.change(nameInputs[1], { target: { value: nameInputs[0].getAttribute('value') || 'Alice' } });
    const startBtn = screen.getByRole('button', { name:/start game/i });
    expect(startBtn).toBeDisabled();
    // Fix duplicate
    fireEvent.change(nameInputs[1], { target: { value: 'Delta' } });
    // Enable single completion toggle
    const singleToggle = screen.getByRole('checkbox', { name:/single completion per turn/i });
    fireEvent.click(singleToggle);
    await waitFor(()=> expect(startBtn).not.toBeDisabled());
    fireEvent.click(startBtn);
    await waitFor(()=> expect(receivedBody).not.toBeNull());
    expect(receivedBody.singleCompletionPerTurn).toBe(true);
    // Advanced config defaults / inputs present
    expect(receivedBody.maxTurns).toBeDefined();
    expect(receivedBody.targetMultiplier).toBeDefined();
  });
});
