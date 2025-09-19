# Phase 0 Research: Silosoft Game Core Mechanics

## Goals
Establish validated technology choices, resolve any remaining unknowns, and document rationale aligned with the Constitution's simplicity and game-first principles.

## Decisions & Rationale

### Frontend Stack
- Decision: React with functional components + minimal state (Context + reducer for game state; avoid heavy state libs initially).
- Rationale: Rapid prototyping, wide familiarity, easy componentization for cards/board.
- Alternatives: Vue (similar speed), Svelte (lighter), kept React due to team familiarity.

### Backend Stack
- Decision: Node.js with lightweight HTTP (Express or native HTTP + small router). Start as in-process state machine (single instance) to simplify.
- Rationale: Fast iteration, aligns with JS front-end, low ceremony.
- Alternatives: Python FastAPI; rejected for extra language overhead.

### Data Storage
- Decision: In-memory state + JSON seed files for feature card definitions; no database in MVP.
- Rationale: Hackathon speed; persistence not required for core loop demonstration.
- Alternatives: SQLite or file persistence; deferred until post-MVP.

### Communication Pattern
- Decision: Single-player local first; backend exposed via simple REST endpoints for actions (draw, trade, complete, pass). WebSocket deferred.
- Rationale: Constitution mandates playable loop quickly; real-time multiplayer is stretch.

### Randomness
- Decision: Seeded RNG (Mulberry32 or similar deterministic algorithm) with seed logged in end summary.
- Rationale: Reproducibility for debugging & fairness.

### Logging & Observability
- Decision: Structured JSON-like log entries stored in circular buffer (size 100 configurable) surfaced via `/state/log` endpoint and UI log panel.
- Rationale: Quick insight without persistence complexity.

### Accessibility
- Decision: Role color + icon + text label; use semantic buttons, ARIA labels for interactive regions.
- Rationale: Inclusive design with minimal overhead.

### Performance Expectations
- Single 10-turn game must resolve under 5 minutes with negligible backend latency (<50ms per action locally). Frontend load < 5s.

### Testing Strategy
- Contract tests for each REST action endpoint (request validation, response schema, state change). Integration test simulating full deterministic seeded game path to both win and loss scenarios. Unit tests for event resolution + feature completion logic.

### Unknowns Resolved
All previously marked ambiguities resolved in spec; no remaining clarifications.

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep (multiplayer early) | Delays MVP | Enforce single-player first, modularize state for future session mgmt |
| RNG fairness | Perceived bias | Expose seed; allow replays |
| UI complexity (drag/drop) | Time sink | Use click-select for MVP, maybe add drag later |
| Event balancing | Unfun volatility | Configurable draw weighting; playtest adjust |
| Feature deck exhaustion early | Stalled player | Continue game; others still progress |

### Deferred Items
- Persistent storage
- Authentication / multi-user sessions
- Live concurrency (WebSockets)
- Advanced analytics dashboards

## Alternatives Considered (Summary)
| Area | Chosen | Alternatives | Reason |
|------|--------|-------------|--------|
| Frontend | React | Vue, Svelte | Familiar & robust ecosystem |
| Backend | Node.js | FastAPI | Single language, faster iteration |
| State Storage | In-memory | SQLite | Reduced complexity |
| Transport | REST JSON | WebSocket | Simpler for MVP |
| RNG | Seeded PRNG | Crypto RNG | Deterministic replays |

## Constitution Alignment
- Game-first: Focused on core loop only.
- Simplicity: Single backend process, no DB.
- Test-first: Clear test layering defined.
- Observability: Log buffer + state endpoints.

## Phase 0 Outcome
READY for Phase 1 design. All NEEDS CLARIFICATION resolved.
