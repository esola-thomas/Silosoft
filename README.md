# Silosoft Game

Deterministic, test-driven simulation of a feature delivery game with events (Layoff, Reorg, Competition, PTO), resource draws, trades, and multi‑role feature completion scoring.

## Monorepo Structure

```
backend/   # Express + TypeScript game engine + API
frontend/  # Vite + React UI (incremental playable UI)
specs/     # Design, plan, tasks, contracts
```

## Quick Start

Prerequisites: Node 18+

Install dependencies:
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Run backend (development):
```bash
npm run dev:backend
```

Run frontend (development):
```bash
npm run dev:frontend
```

Run both concurrently (root script uses `concurrently`):
```bash
npm run dev
```

Backend will start on http://localhost:3000 by default; frontend (Vite) on http://localhost:5173.

Health check endpoint:
```bash
curl http://localhost:3000/health
```
Returns `{ ok: true, status: 'ACTIVE' | 'NO_GAME' | 'WON' | 'LOST' }`.

Replay export endpoint (seed + log snapshot):
```bash
curl http://localhost:3000/game/replay
```
Also accessible via the UI Export button in the header (downloads JSON).

CORS: Development server enables CORS for `http://localhost:5173` only. Adjust `server.ts` if hosting frontend elsewhere.

### Landing / Setup Screen
When no active game exists the frontend shows a dedicated setup screen.

Capabilities:
* Add / remove players (1–4)
* Rename players (trimmed, max 20 chars; blanks auto-default server-side)
* Duplicate / blank name validation (Start disabled until fixed)
* Randomize all player names
* Optional seed input (deterministic replay)
* Resource Weight slider (50%–95%, default 80%)
* Single Completion Per Turn toggle
* Turn Limit (3–50, default 10)
* Target / Player (1–12, default 3; win target = players × target per player)
* Start Game button (creates game via `POST /game/start`)
* Local persistence of lobby config (names, seed, weight, toggle)

Example payload (with advanced config):
```json
{
	"playerNames": ["Alice","Bob","Charlie"],
	"seed": "seed1",
	"resourceWeight": 0.8,
	"singleCompletionPerTurn": true,
	"maxTurns": 15,
	"targetMultiplier": 4
}
```

After starting, status becomes ACTIVE and gameplay UI mounts. Use the header Reset button (calls `POST /game/reset`) to return to setup.

### Playable UI (Loop + Multi‑Role Completion)
1. Start both processes (`npm run dev`)
2. Open http://localhost:5173
3. (If no game) Use setup screen to configure players & start.
4. Use `Draw` to draw a card (resource/event) – hand and log update
5. Use `Pass` to end the turn – turn counter increments
6. Click `Complete...` to open the completion dialog (shows your active feature with per‑role point thresholds and a derived candidate)
7. Review auto-picked resources (greedy minimal covering set) and press `Complete` to attempt the feature (contractors can cover remaining point deficits at 2 pts each, with a small scoring penalty if used)

Current constraints:
- Trade & event modals still not wired (focus remains on draw / pass / completion)
- Log shows raw JSON entries (debug style)
- Polling refreshes state every 4s while ACTIVE plus after each action
- A temporary `jsx-fallback.d.ts` shim exists to mute strict intrinsic element diagnostics pending final type cleanup

Recent improvements:
- Real-time WebSocket state push (polling auto-suspends when socket healthy)
- Theme cycling (dark / light / high-contrast) with persistence
- Reduced motion preference (system / on / off) controlling animations
- Orientation hint overlay for narrow portrait viewports
- Feature Focus Mode toggle (dims non-active player cards)
- Action Dock pin toggle (hand/action panel stays fixed across widths)
- Container-query responsive density for player cards & role chips
- Multi‑role feature requirements + `totalPoints` field
- Contractor wildcard: 2 points toward any role deficits (minor score penalty)
- Single draw per turn enforcement (`drawnThisTurn` guard)
- Completion dialog with per-role Need/Have/Deficit table & greedy auto-selection
- Updated `/game/full` & `/game/active` endpoint payloads (candidates enriched)
- End-game summary modal (victory/defeat) with stats & replay same configuration
- Event draw now produces a blocking pending event modal requiring explicit acknowledgment (/event/ack) before further actions (turn/pass/complete/trade). This foregrounds event impact and ensures players notice state changes.
	- Enhanced: Instant pop-in animation (faster 220ms), event-specific icon & description, ESC key to acknowledge, header EVENT pill, and screen-reader aria-live announcement.
	- Added improved focus management & keyboard trap for accessibility.

- Per-player Competition challenge countdown chips (CH:PlayerId:Remaining) and PTO lock per-card countdown overlays.
- Replay JSON export for deterministic analysis / external tooling.

## API Summary
| Method | Path | Description |
|--------|------|-------------|
| POST | /game/start | Start a new game (playerCount/playerNames, seed, resourceWeight, singleCompletionPerTurn, maxTurns, targetMultiplier) |
| POST | /game/reset | Reset (clear current in-memory game) |
| GET  | /game/state | Current game state summary (legacy minimal) |
| GET  | /game/full | Full sanitized game state (players list, active player hand & candidates, target, rng snapshot) |
| GET  | /game/active | Active player focus: hand, score, active feature, completion candidate (with requirements) |
| POST | /turn/action/draw | Draw card for active player |
| POST | /turn/action/trade | Perform trade (simplified) |
| POST | /turn/action/complete | Attempt feature completion |
| POST | /turn/action/pass | End active player turn |
| POST | /event/ack | Acknowledge & resolve pending event (applies its effects) |
| GET  | /log | Recent action log entries |
| POST | /admin/seed | (Pre-game) register seed intention |

### Feature & Candidate Shape (Updated)

`FeatureCard` (API surface):
```json
{
	"id": "F12",
	"name": "Feature 12",
	"totalPoints": 7,
	"requirements": [
		{ "role": "DEV", "minPoints": 3 },
		{ "role": "PM",  "minPoints": 2 },
		{ "role": "UX",  "minPoints": 2 }
	]
}
```

Completion `candidate`:
```json
{
	"featureId": "F12",
	"name": "Feature 12",
	"totalPoints": 7,
	"requirements": [
		{ "role": "DEV", "minPoints": 3, "have": 3, "deficit": 0 },
		{ "role": "PM",  "minPoints": 2, "have": 1, "deficit": 1 },
		{ "role": "UX",  "minPoints": 2, "have": 0, "deficit": 2 }
	],
	"missingRoles": ["UX"],
	"canComplete": true
}
```
`canComplete` is true if the sum of deficits (in points) can be covered by available contractor cards (2 pts each).

### Deterministic Seeding & Replay

The RNG uses a seeded generator that is now persisted in-memory for the lifetime of the active game. Replaying a game with the same seed AND issuing the identical ordered sequence of actions (draw, trade, complete, pass) will reproduce the same sequence of draws/events because the RNG position advances deterministically. The current `runtime.rngState` (seed + position) is snapshotted after each draw and exposed in draw responses for potential external replay tooling. (Future persistence layer would allow mid-game restoration.)

## Running Tests
All tests (contract, integration, unit) live under `backend/tests`. They were authored first (TDD) then implementation performed.

```bash
npm --prefix backend test
```

Performance test (after T073) will simulate 100 games to provide a basic performance sanity check.

## Simulation CLI
Example (run directly with tsx):
```bash
npx tsx backend/src/cli/simulate.ts --seed seed123 --players 2 --games 5
```
Outputs aggregated wins, losses, and average score statistics. Use different seeds (or omit seed for time-based seed) to explore variance.

## Frontend Notes
The frontend evolved from a minimal loop to a responsive real-time UI with theming, accessibility (high contrast + reduced motion), orientation awareness, focus mode, and dock pinning.

See `ENHANCEMENTS.md` for a consolidated list of post-core UX & architecture improvements plus future extension ideas.

Data Sync Pattern:
- WebSocket broadcasts push full state snapshots after mutating actions (draw/complete/pass/etc.).
- Polling `/game/full` every 4s acts as fallback when socket disconnected.
- `/log` fetched independently (future: include logs in WS payload).
- `/game/active` fetched on-demand for the latest completion candidate just before attempting completion.

Completion Flow:
1. User opens dialog (`/game/active` refetched) – returns a single candidate for the active feature.
2. Table shows Need/Have/Deficit per role plus whether contractors can cover remaining deficits.
3. Greedy selector picks highest‑value matching role cards until each role's min satisfied, then adds contractors (2 pts ea) to cover leftover deficits.
4. User may toggle any cards to fine‑tune the bundle before submitting.
5. POST `/turn/action/complete` submits `{ featureIds:[id], resourceIds:[...] }`; backend recalculates and applies contractor penalty (~5% score reduction when any contractor used).
6. On success: used resources removed, new feature drawn, state & log refreshed.

Greedy Auto-Selection Summary:
- For each requirement: take highest point role cards until requirement met, else consume contractors (2 pts chunks).
- Aborts (returns empty) if any requirement cannot be satisfied even after using all contractor points.
- Returns minimal (not globally optimal) but sufficient set—prioritizing clarity over exhaustive search.

Potential Enhancements:
- Visual differentiation of events vs resources
- Trade modal integration and candidate scoring hints
- More nuanced contractor penalties (per contractor vs any usage)
- Feature difficulty scaling influenced by deck position
- Spectator / observer mode (read-only socket)
- Persist player UI preferences (focus, dock, theme) server-side for roaming

## Development Conventions
- Strict TypeScript (`strict: true` and NodeNext module resolution)
- Zod schemas planned for future runtime validation in routes (currently minimal validation)
- Single in-memory game instance (no persistence) stored in API runtime.

## Roadmap (Phase 3.5 Completed)
- T072: Simulation CLI (done)
- T073: Performance test (done)
- T074: Persistent RNG + validation refactor baseline (RNG persistence done)
- T075: Final documentation sync (this update)

Potential Next Steps (Beyond Scope):
- Persist multiple concurrent games with IDs
- Advanced feature deck semantics (thematic sets, weighted role mixes)
- Rich event resolution with immediate effects
- Enhanced validation (full Zod parsing on every request)
- AI assistant for optimal resource selection / trade suggestions
- Replay viewer & timeline scrubber

## License
Proprietary (adjust as needed).
