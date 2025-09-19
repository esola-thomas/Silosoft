# Implementation Plan: Silosoft Game Core Mechanics

**Branch**: `001-title-silosoft-game` | **Date**: 2025-09-17 | **Spec**: specs/001-title-silosoft-game/spec.md
**Input**: Feature specification from `/specs/001-title-silosoft-game/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path → SUCCESS
2. Fill Technical Context (React frontend + Node.js backend) → DONE
3. Evaluate Constitution Check (initial) → PASS (no violations)
4. Execute Phase 0 → research.md generated
5. Execute Phase 1 → data-model.md, contracts/openapi.yaml, quickstart.md generated
6. Re-evaluate Constitution Check post-design → PASS
7. Plan Phase 2 (describe task generation approach) → DONE
8. STOP (tasks.md to be produced by /tasks command)
```

## Summary
Implement Silosoft cooperative workplace feature-completion game core loop: player turns (draw, trade optional, complete features, pass), event resolution (Layoff, Reorg, Competition, PTO), win/loss (team completes target before turn limit), deterministic RNG, accessibility, and logging. Technical approach: single Node.js process exposing REST endpoints consumed by React UI. In-memory state with seeded feature deck and generated resource/event draws. Emphasis on test-first endpoints and reproducible simulations.

## Technical Context
**Language/Version**: Node.js (>=18 LTS), TypeScript (planned) & React 18
**Primary Dependencies**: Express (HTTP), Zod (validation), React + Vite (build)
**Storage**: In-memory (JSON seed for feature deck)
**Testing**: Jest + Supertest (contract/integration), React Testing Library (UI)
**Target Platform**: Browser (modern evergreen) + local Node server
**Project Type**: web (frontend + backend)
**Performance Goals**: <50ms action processing locally; game load <5s; 10-turn game <5 minutes (user pacing)
**Constraints**: Simplicity, deterministic RNG seed, single-session MVP
**Scale/Scope**: 1–4 players single session; single server instance

## Constitution Check
**Simplicity**:
- Projects: 2 (frontend, backend) within limit (<=3)
- Direct framework usage: YES (Express directly; no wrapper abstraction yet)
- Single data model: YES (shared conceptual model; no DTO duplication initially)
- Avoiding unnecessary patterns: YES (no Repository/UoW)

**Architecture**:
- Feature as libraries: Not required for MVP; core logic will be modular service modules inside backend src
- Libraries listed: (core game logic module) purpose: state transitions & validation
- CLI per library: Deferred (not needed MVP)
- Library docs llms.txt: Deferred; quickstart covers basics

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN cycle planned via contract tests before implementation
- Commit discipline to ensure failing tests precede implementation (process note)
- Order: Contract → Integration (seeded playthrough) → Unit (helpers) → UI tests
- Real dependencies: Yes (in-memory state considered real for MVP)
- Integration tests: Will cover endpoints & full deterministic game path
- Forbidden behaviors acknowledged and avoided

**Observability**:
- Structured log entries in ring buffer (JSON objects)
- Frontend may poll /log (no push for MVP)
- Error responses include code + message

**Versioning**:
- Initial version 0.1.0 planned (semantic) stored in package metadata
- Build increments not automated in plan phase
- Breaking changes irrelevant pre-1.0

Constitution Initial Check: PASS (no complexity deviations)

## Project Structure
Using Option 2 (web application) due to frontend+backend requirements.
```
backend/
	src/
		game/ (engine: state.ts, actions.ts, rng.ts, validators.ts)
		api/ (express routes mapping to game actions)
		models/ (TypeScript types, schemas)
	tests/
		contract/
		integration/
		unit/
frontend/
	src/
		components/
		pages/
		services/ (API client, seed replay helper)
	tests/
```

Structure Decision: Option 2 (web) selected.

## Phase 0: Outline & Research
Completed; see `research.md` (all unknowns resolved, no remaining NEEDS CLARIFICATION).

## Phase 1: Design & Contracts
Artifacts produced: `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`.
Approach: Derived endpoints from user actions (draw, trade, complete, pass, state, start). Data model mirrors spec invariants. OpenAPI file enumerates core endpoints; further schema enrichment deferred.

## Phase 2: Task Planning Approach
**Task Generation Strategy**:
- Each endpoint in OpenAPI → contract test task (P)
- Each entity (Game, Player, FeatureCard, ResourceCard, Event, LogEntry) → model + validation task (P)
- Each acceptance scenario → integration test scenario task
- Edge cases list → negative test tasks
- Implementation tasks: engine functions (drawResourceOrEvent, attemptCompletion, applyEvent, endTurn) after corresponding tests
- UI tasks: skeleton layout, component mocks, API client, state synchronization, action buttons, log panel, accessibility pass

**Ordering Strategy**:
1. Game start contract test
2. State retrieval contract test
3. Draw action contract test → implement minimal draw
4. Completion contract test → implement completion logic
5. Event resolution tests
6. Trade contract test
7. Pass/end-turn test
8. Integration: seeded full win path
9. Integration: loss path (no completions)
10. UI scaffolding tasks after backend core stable

Parallel [P]: Model/validation tasks, endpoint contract tests (non-dependent), UI component scaffolding after API shape fixed.

Estimated tasks count: ~28.

## Phase 3+: Future Implementation (Not executed here)
Outlined in template; will follow tasks.md generation.

## Complexity Tracking
No deviations; table omitted.

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
