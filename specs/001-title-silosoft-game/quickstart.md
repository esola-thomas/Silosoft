# Quickstart: Silosoft Core Mechanics

## Objective
Play a single-player deterministic session to verify core loop.

## Steps
1. Start backend server (implementation TBD) listening on port 3000.
2. POST /game/start `{ "playerCount":1, "seed":"demo-seed" }`.
3. GET /game/state → verify `turnNumber=1`, one player present, active feature assigned.
4. POST /turn/action/draw → capture draw result.
5. (Repeat) For each turn: draw (if not yet), attempt completion when hand meets thresholds; else /turn/action/pass.
6. Continue until win (completedFeaturesTotal >= 3) or loss after passing turn 10.
7. GET /log to inspect events.

## Verification
- Deterministic replay: restarting with same seed & sequence yields identical draws.
- PTO event prevents use of locked cards until correct turn passes.
- Competition event penalty fires if unmet.

## Next
Extend to multi-player simulation tests, then UI integration.
