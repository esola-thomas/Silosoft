# Tasks: Silosoft Game Core Mechanics

**Input**: Design documents from `/specs/001-title-silosoft-game/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Loaded plan.md, data-model.md, research.md, quickstart.md, contracts/openapi.yaml
2. Extracted entities (Game, Player, FeatureCard, ResourceCard, Event, ActionLogEntry, PtoLock)
3. Parsed endpoints from OpenAPI (start, state, draw, trade, complete, pass, log, admin/seed)
4. Generated tasks: setup, tests (contract & integration), models, services, endpoints, UI, polish
5. Applied TDD ordering: tests precede implementation
6. Marked parallel [P] tasks (independent files)
7. Ensured no [P] tasks share same file path
8. Validated coverage: all entities modeled, all endpoints tested & implemented
9. SUCCESS
```

## Format: `[ID] [P?] Description`

## Phase 3.1: Setup
- [x] T001 Create root project scaffolding: `package.json` (workspaces: backend, frontend), `.editorconfig`, `.gitignore`
- [x] T002 Initialize backend workspace: `backend/package.json` with deps (express, zod), devDeps (typescript, ts-node, jest, supertest, @types/*)
- [x] T003 Initialize frontend workspace: `frontend/package.json` with deps (react, react-dom), devDeps (vite, typescript, @types/react*)
- [x] T004 [P] Configure TypeScript base configs: `tsconfig.base.json`, `backend/tsconfig.json`, `frontend/tsconfig.json`
- [x] T005 [P] Add lint/format tooling: ESLint + Prettier configs (`.eslintrc.cjs`, `.prettierrc`)
- [x] T006 [P] Add Jest config for backend: `backend/jest.config.cjs` and test script
- [x] T007 [P] Create backend directory structure: `backend/src/{api,game,models,services}` and `backend/tests/{contract,integration,unit}`
- [x] T008 [P] Create frontend directory structure: `frontend/src/{components,pages,services}` and `frontend/tests`
- [x] T009 Add version file: `backend/src/version.ts` exporting `0.1.0`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
### Contract Tests (one per endpoint)
- [x] T010 [P] Contract test POST /game/start → `backend/tests/contract/game_start.spec.ts`
- [x] T011 [P] Contract test GET /game/state → `backend/tests/contract/game_state.spec.ts`
- [x] T012 [P] Contract test POST /turn/action/draw → `backend/tests/contract/draw.spec.ts`
- [x] T013 [P] Contract test POST /turn/action/trade → `backend/tests/contract/trade.spec.ts`
- [x] T014 [P] Contract test POST /turn/action/complete → `backend/tests/contract/complete.spec.ts`
- [x] T015 [P] Contract test POST /turn/action/pass → `backend/tests/contract/pass.spec.ts`
- [x] T016 [P] Contract test GET /log → `backend/tests/contract/log.spec.ts`
- [x] T017 [P] Contract test POST /admin/seed (pre-game only) → `backend/tests/contract/seed.spec.ts`

### Integration Tests (user stories & scenarios)
- [x] T018 [P] Integration test: Single-player seeded win path → `backend/tests/integration/win_path.spec.ts`
- [x] T019 [P] Integration test: Single-player loss after 10 turns → `backend/tests/integration/loss_path.spec.ts`
- [x] T020 [P] Integration test: PTO lock prevents early use → `backend/tests/integration/pto_lock.spec.ts`
- [x] T021 [P] Integration test: Competition event penalty → `backend/tests/integration/competition_penalty.spec.ts`
- [x] T022 [P] Integration test: Trade limits & single initiation → `backend/tests/integration/trade_limit.spec.ts`
- [x] T023 [P] Integration test: Multiple completions in one turn (default allowed) → `backend/tests/integration/multi_completion.spec.ts`
- [x] T024 [P] Integration test: Feature deck exhaustion handling → `backend/tests/integration/deck_exhaustion.spec.ts`
- [x] T025 [P] Integration test: Deterministic RNG replay consistency → `backend/tests/integration/rng_replay.spec.ts`

### Unit / Logic Tests (core mechanics before implementation)
- [x] T026 [P] Unit test: RNG deterministic sequence → `backend/tests/unit/rng.spec.ts`
- [x] T027 [P] Unit test: Feature completion validation (excess points ignored) → `backend/tests/unit/completion_validation.spec.ts`
- [x] T028 [P] Unit test: Event Layoff randomness uniformity (statistical minimal) → `backend/tests/unit/event_layoff.spec.ts`
- [x] T029 [P] Unit test: PTO timer release logic → `backend/tests/unit/pto_timer.spec.ts`
- [x] T030 [P] Unit test: Competition penalty resolution → `backend/tests/unit/competition_penalty.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
### Models & Types
- [x] T031 [P] Define core TypeScript types/interfaces in `backend/src/models/types.ts` (Game, Player, FeatureCard, ResourceCard, Event, ActionLogEntry, PtoLock)
- [x] T032 [P] Implement validation schemas with Zod in `backend/src/models/schemas.ts`

### Game Engine Services
- [x] T033 Implement RNG module (seed mgmt, next random) in `backend/src/game/rng.ts`
- [x] T034 Implement feature deck loader & shuffle in `backend/src/game/deck.ts`
- [x] T035 Implement state initializer `createGame` in `backend/src/game/state.ts`
- [x] T036 Implement draw logic (resource vs event weighting) in `backend/src/game/draw.ts`
- [x] T037 Implement event handlers (Layoff, Reorg, Competition, PTO) in `backend/src/game/events.ts`
- [x] T038 Implement completion logic (bundle validation, contractor role assignment) in `backend/src/game/complete.ts`
- [x] T039 Implement trade logic & constraints in `backend/src/game/trade.ts`
- [x] T040 Implement turn progression & end-of-turn resolution in `backend/src/game/turn.ts`
- [x] T041 Implement logging ring buffer in `backend/src/game/log.ts`
- [x] T042 Implement competition / PTO timers mgmt in `backend/src/game/timers.ts`

### API Layer
- [x] T043 Setup Express app & middleware in `backend/src/api/server.ts`
- [x] T044 Route: POST /game/start → `backend/src/api/routes/game_start.ts`
- [x] T045 Route: GET /game/state → `backend/src/api/routes/game_state.ts`
- [x] T046 Route: POST /turn/action/draw → `backend/src/api/routes/draw.ts`
- [x] T047 Route: POST /turn/action/trade → `backend/src/api/routes/trade.ts`
- [x] T048 Route: POST /turn/action/complete → `backend/src/api/routes/complete.ts`
- [x] T049 Route: POST /turn/action/pass → `backend/src/api/routes/pass.ts`
- [x] T050 Route: GET /log → `backend/src/api/routes/log.ts`
- [x] T051 Route: POST /admin/seed → `backend/src/api/routes/seed.ts`
- [x] T052 Wire routes into server & export start function in `backend/src/api/index.ts`
- [x] T053 Implement error handling & validation middleware in `backend/src/api/middleware.ts`

### Integration Support
- [x] T054 Implement test helper to simulate deterministic game flows in `backend/tests/integration/helpers/game_sim.ts`
- [x] T055 Implement OpenAPI schema validation helper (optional) in `backend/tests/contract/helpers/openapi_validate.ts`

## Phase 3.4: Frontend Implementation
### Foundation
- [x] T056 Initialize Vite React app entry `frontend/src/main.tsx` & root component
- [x] T057 Add global GameContext + reducer in `frontend/src/services/gameContext.tsx`
- [x] T058 API client module in `frontend/src/services/apiClient.ts` (fetch wrappers for endpoints)

### UI Components
- [x] T059 [P] Header bar (turn, progress, competition indicator) → `frontend/src/components/HeaderBar.tsx`
- [x] T060 [P] PlayerFeatureCard component → `frontend/src/components/PlayerFeatureCard.tsx`
- [x] T061 [P] HandPanel (card list + actions) → `frontend/src/components/HandPanel.tsx`
- [x] T062 [P] EventModal component → `frontend/src/components/EventModal.tsx`
- [x] T063 [P] TradeModal component → `frontend/src/components/TradeModal.tsx`
- [x] T064 [P] CompletionDialog component → `frontend/src/components/CompletionDialog.tsx`
- [x] T065 [P] LogPanel component → `frontend/src/components/LogPanel.tsx`
- [x] T066 [P] RoleIcon (color + icon + label) → `frontend/src/components/RoleIcon.tsx`

### Frontend Logic & Flows
- [x] T067 Implement state polling or action-driven updates in `frontend/src/services/gameSync.ts`
- [x] T068 Implement completion bundle selection logic in `frontend/src/services/completionLogic.ts`
- [x] T069 Implement accessibility audit (aria labels, focus order) doc `frontend/tests/a11y/a11y_checklist.md`
- [x] T070 Add minimal UI tests for critical components in `frontend/tests/components/core.spec.tsx`

## Phase 3.5: Polish & Documentation
- [x] T071 README update with run instructions & seed replay details → `README.md`
- [x] T072 Add end-to-end script (seeded simulation CLI) `backend/src/cli/simulate.ts`
- [x] T073 Performance sanity test (simulate 100 games) `backend/tests/perf/load.spec.ts`
- [x] T074 Refactor pass: remove duplication & tighten types across engine files
- [x] T075 Final documentation sync: ensure quickstart + contracts + plan reflect implementation changes

## Dependencies
- T001–T009 before any tests
- Contract tests (T010–T017) independent [P]
- Integration + unit tests (T018–T030) independent [P]
- All tests (T010–T030) must exist & fail before starting implementation (T031+)
- Models (T031–T032) precede engine services (T033–T042)
- Engine services precede routes (T043–T053)
- Backend core (through T053) precedes frontend sync & components (T056+)
- Frontend foundation (T056–T058) precedes components (T059–T066)
- Components precede frontend logic tasks (T067–T070) except gameSync depends on API stability
- Polish (T071–T075) after core & UI stable

## Parallel Execution Examples
```
# Example 1: Run all contract tests authoring in parallel
T010 T011 T012 T013 T014 T015 T016 T017

# Example 2: Parallel model + validation
T031 T032

# Example 3: Parallel UI components batch
T059 T060 T061 T062 T063 T064 T065 T066

# Example 4: Parallel early unit mechanic tests
T026 T027 T028 T029 T030
```

## Validation Checklist
- [x] All contracts have contract test tasks
- [x] All entities have model tasks (types + schemas)
- [x] Tests precede implementation tasks
- [x] Parallel tasks confined to unique files
- [x] Each task specifies exact file path
- [x] Endpoints fully mapped to tasks

## Notes
- Ensure each test initially fails (missing implementation) before coding logic.
- Keep engine functions pure where possible to simplify testing.
- Avoid premature optimization until performance test (T073).
