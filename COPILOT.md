# GitHub Copilot Context: Silosoft Digital Card Game

**Project Name**: Silosoft Digital Cooperative Card Game
**Project Type**: Web Application (React + Express)
**Phase**: Implementation Planning Complete (Ready for Task Breakdown & Build)
**Version**: 1.0.0

---
## Purpose of This File
Operational guide for leveraging GitHub Copilot effectively on this codebase. Serves as:
- Quick context injection for new contributors
- Prompt patterns + guardrails for AI-assisted coding
- Alignment with game architecture, technical standards, and TDD workflow

Keep this file concise (<150 lines). Update only when architecture or process meaningfully changes.

---
## Core Stack (Authoritative Summary)
**Frontend**: React 18, Context API, Jest + RTL, Vite (preferred) or CRA fallback
**Backend**: Node.js 18+, Express, Jest (supertest), (Socket.io: stretch goal)
**Data**: JSON-stored card definitions; in-memory game state w/ periodic snapshot
**Contracts**: OpenAPI 3.0 (see `specs/feat/001-Silosoft-MVP/contracts/game-api.yaml`)

---
## Game Subsystems (Build Order Alignment)
1. Data Schemas (Cards, Players, GameState, Turn, Round, Actions)
2. Validation Layer (Runtime + contract parity)
3. Core Engine (turn progression, card resolution, scoring)
4. Persistence Adapter (JSON load/save snapshot)
5. REST API (create game, join, draw, play, assign, end turn)
6. Frontend State / Hooks (useGame, usePlayer, action dispatch)
7. UI Components (Card, Hand, Board, TurnPanel, ScoreSummary)
8. Integration + E2E Smoke (single-player flow)
9. (Optional) Real-time layer substitution via Socket.io events

---
## TDD Enforcement Workflow
Red → Green → Refactor at each granularity:
1. Contract Tests: Start with failing supertest-driven API contract assertions
2. Integration: Game engine sequence (setup → turns → win/lose)
3. Unit: Pure functions (scoring, validation, deck operations)
4. Refactor: Remove duplication & crystallize domain invariants

Copilot Prompt Pattern (Test First):
"Write a Jest test for the game engine that ensures a feature card requiring 2 resources decrements remaining required effort after assignment and marks completed when threshold reached. Use an in-memory mock deck."

---
## Domain Constraints (Hard Rules Copilot Must Respect)
- Max 10 rounds to win; failure triggers loss state
- Feature Cards: require role-matched resource cards (e.g., Dev Senior)
- Event Cards: disruptive modifiers (layoff removes resource, PTO pauses)
- Resource Cards: consumed per turn or persistent? (Assumption: persistent unless event removes) Update if spec changes.
- Scoring: Progressive (3 / 5 / 8) + completion bonuses
- Single-player mode: mandatory baseline
- Invalid moves must return 4xx with structured error: `{ code, message, details? }`

---
## Validation & Error Shape
All endpoint bodies validated against OpenAPI spec.
Error Envelope (authoritative):
```
{
  "error": {
    "code": "GAME.INVALID_ACTION",
    "message": "Cannot assign resource: role mismatch",
    "details": { "expectedRole": "DEV", "providedRole": "UX" }
  }
}
```
Never leak internal stack traces to client.

---
## File / Module Layout (Target)
```
backend/
  src/
    domain/          # Pure logic (no IO)
    engine/          # Turn + state transitions
    models/          # Type defs + validation
    adapters/        # JSON persistence, (future) socket
    api/             # Express routers
    infra/           # Server bootstrap
  tests/
frontend/
  src/
    components/
    hooks/
    state/
    api/
    types/
    pages/
shared/
  types/            # Cross-layer TS types (if using TS)
  data/             # Card JSON definitions
```
(Adjust once actual structure is created.)

---
## Copilot Prompt Recipes
Use short, directive prompts referencing domain language.
- Engine Function: "Implement a pure function resolveTurn(state, action) returning { nextState, events } with immutability and no side effects."
- Validation: "Create a zod schema for ResourceCard with role, level (junior|mid|senior), and skillTags: string[]."
- Test + Implementation Loop: "Generate Jest tests for scoring logic covering base, progressive bonus, and full completion bonus."
- Frontend Hook: "Write a React hook useGameActions that wraps fetch calls to /games/:id/actions with error normalization."

Avoid vague prompts ("Build game logic")—always specify domain object + operation + constraints.

---
## Quality Gates
PR must pass:
- All tests green (unit + integration)
- Contract test parity (no drift from OpenAPI)
- Lint & type check (if TS adopted) clean
- No introduction of global mutable state outside engine context

---
## Security / Safety Considerations
- Reject malformed JSON early
- Rate limiting (future) if public
- No dynamic eval or code injection surfaces
- Deterministic engine state updates (pure where possible)

---
## Lightweight Definition Stubs (For Initial Scaffolding)
Suggested minimal interfaces (TypeScript-style, adapt if JS):
```
interface ResourceCard { id: string; role: 'DEV' | 'PM' | 'UX'; level: 'jr'|'mid'|'sr'; }
interface FeatureCard { id: string; required: Array<{ role: string; count: number }>; points: number; status: 'pending'|'progress'|'done'; }
interface EventCard { id: string; effect: string; }
interface GameState { id: string; round: number; deck: string[]; discard: string[]; players: PlayerState[]; features: FeatureCard[]; status: 'active'|'won'|'lost'; }
```
Refine with actual spec before locking in.

---
## Refactor Signals
Trigger cleanup when you see:
- Conditionals repeating role+level matching logic
- Manual deep cloning of state objects (introduce structured helpers)
- Mixed validation + transition logic in same function
- Growing switch statements for card effects (introduce effect registry)

---
## Stretch Goal Hooks (Do Not Start Early)
- Socket event emission from engine transitions
- Replay log (append-only state change list)
- Deterministic seed-based deck shuffling for reproducibility

---
## When Copilot Output Should Be Rejected
Reject & regenerate if:
- Introduces external dependency not in plan
- Mutates input state directly
- Adds unused abstractions or premature patterns
- Omits tests when implementing new logic
- Provides placeholder logic ("TODO implement") beyond initial stub phase

---
## Quick Start (FUTURE once scaffolding exists)
1. Install deps
2. Run backend tests (expect initial failures)
3. Implement models → make first test pass
4. Iterate outward to API + UI

This section will be updated after initial scaffold commit.

---
## Update Log
2025-09-15: Initial Copilot context file created (mirrors baseline from `CLAUDE.md`, adds AI usage policies).

---
**Auto-generated**: 2025-09-15 | Maintain under 150 lines.
