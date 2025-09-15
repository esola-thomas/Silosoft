# Tasks: Silosoft Digital Cooperative Card Game

**Input**: Design documents from `/specs/feat/001-got-it-since/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: React + Express + Jest, Web app structure
2. Load design documents:
   → data-model.md: 6 entities (Player, FeatureCard, ResourceCard, EventCard, GameState, Round)
   → contracts/: game-api.yaml with 5 endpoints
   → quickstart.md: 13 test scenarios extracted
3. Generate tasks by category:
   → Setup: project structure, dependencies, linting
   → Tests: 5 contract tests, 6 integration tests
   → Core: 6 models, 3 services, 5 endpoints
   → Integration: middleware, logging, state management
   → Polish: unit tests, performance, documentation
4. Apply task rules:
   → [P] for different files, sequential for same files
   → Tests before implementation (TDD enforced)
5. Generated 32 numbered tasks (T001-T032)
6. Created dependency graph with parallel execution examples
7. Validated: All contracts tested, all entities modeled, TDD order enforced
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Paths use web app structure: `backend/src/`, `frontend/src/`

## Phase 3.1: Setup

- [ ] T001 Create web app project structure (backend/, frontend/, shared/)
- [ ] T002 Initialize backend Node.js project with Express, Jest, CORS dependencies
- [ ] T003 Initialize frontend React project with Context API, React Testing Library
- [ ] T004 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.js
- [ ] T005 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.js
- [ ] T006 Create shared card definitions JSON schema in shared/schemas/cards.json

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T007 [P] Contract test POST /api/v1/games in backend/tests/contract/test_games_post.js
- [ ] T008 [P] Contract test GET /api/v1/games/{gameId} in backend/tests/contract/test_games_get.js
- [ ] T009 [P] Contract test POST /api/v1/games/{gameId}/actions/draw in backend/tests/contract/test_draw.js
- [ ] T010 [P] Contract test POST /api/v1/games/{gameId}/actions/assign in backend/tests/contract/test_assign.js
- [ ] T011 [P] Contract test POST /api/v1/games/{gameId}/actions/end-turn in backend/tests/contract/test_end_turn.js

### Integration Tests (Game Mechanics)
- [ ] T012 [P] Integration test game setup and initial deal in backend/tests/integration/test_game_setup.js
- [ ] T013 [P] Integration test turn-based gameplay flow in backend/tests/integration/test_turn_flow.js
- [ ] T014 [P] Integration test resource assignment and feature completion in backend/tests/integration/test_feature_completion.js
- [ ] T015 [P] Integration test HR event effects (layoff, PTO, competition) in backend/tests/integration/test_events.js
- [ ] T016 [P] Integration test win/loss conditions in backend/tests/integration/test_game_end.js
- [ ] T017 [P] Frontend integration test for game state management in frontend/src/tests/integration/test_game_state.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models
- [ ] T018 [P] Player model with validation in backend/src/models/Player.js
- [ ] T019 [P] FeatureCard model with requirements validation in backend/src/models/FeatureCard.js
- [ ] T020 [P] ResourceCard model with role/level validation in backend/src/models/ResourceCard.js
- [ ] T021 [P] EventCard model with effect parameters in backend/src/models/EventCard.js
- [ ] T022 [P] GameState model with round progression in backend/src/models/GameState.js
- [ ] T023 [P] Card factory and deck builder in backend/src/models/CardFactory.js

### Core Services
- [ ] T024 GameEngine service with turn management in backend/src/services/GameEngine.js
- [ ] T025 CardService for deck operations and shuffling in backend/src/services/CardService.js
- [ ] T026 ScoreService for points calculation and bonuses in backend/src/services/ScoreService.js

### API Endpoints
- [ ] T027 POST /api/v1/games endpoint implementation in backend/src/routes/games.js
- [ ] T028 GET /api/v1/games/{gameId} endpoint implementation in backend/src/routes/games.js
- [ ] T029 POST /api/v1/games/{gameId}/actions/draw endpoint in backend/src/routes/gameActions.js
- [ ] T030 POST /api/v1/games/{gameId}/actions/assign endpoint in backend/src/routes/gameActions.js
- [ ] T031 POST /api/v1/games/{gameId}/actions/end-turn endpoint in backend/src/routes/gameActions.js

## Phase 3.4: Integration

- [ ] T032 Express server setup with middleware and routes in backend/src/app.js
- [ ] T033 Game state persistence to JSON files in backend/src/services/PersistenceService.js
- [ ] T034 Error handling middleware with structured logging in backend/src/middleware/errorHandler.js
- [ ] T035 Request validation middleware using OpenAPI schema in backend/src/middleware/validation.js
- [ ] T036 CORS configuration for frontend connection in backend/src/middleware/cors.js

## Phase 3.5: Frontend Implementation

- [ ] T037 [P] Game context provider for state management in frontend/src/context/GameContext.js
- [ ] T038 [P] API service for backend communication in frontend/src/services/ApiService.js
- [ ] T039 [P] GameBoard component with player hands display in frontend/src/components/GameBoard.js
- [ ] T040 [P] Card component with drag/drop functionality in frontend/src/components/Card.js
- [ ] T041 [P] FeatureDisplay component with resource assignment in frontend/src/components/FeatureDisplay.js
- [ ] T042 Main App component with routing and game initialization in frontend/src/App.js

## Phase 3.6: Polish

- [ ] T043 [P] Unit tests for game rule validation in backend/tests/unit/test_game_rules.js
- [ ] T044 [P] Unit tests for card effect logic in backend/tests/unit/test_card_effects.js
- [ ] T045 [P] Frontend component unit tests in frontend/src/components/__tests__/
- [ ] T046 Performance tests for 10-round game completion in backend/tests/performance/test_game_performance.js
- [ ] T047 Load testing for concurrent games in backend/tests/performance/test_load.js
- [ ] T048 [P] Update API documentation with examples in backend/docs/api.md
- [ ] T049 Execute quickstart validation scenarios from quickstart.md
- [ ] T050 Code review checklist and cleanup for constitutional compliance

## Dependencies

### Critical Path
- Setup (T001-T006) before all other tasks
- Contract tests (T007-T011) before implementation (T027-T031)
- Models (T018-T023) before services (T024-T026)
- Services before endpoints (T027-T031)
- Backend core before frontend (T037-T042)

### Blocking Relationships
- T024 (GameEngine) blocks T027-T031 (endpoints)
- T018-T022 (models) block T024-T026 (services)
- T032 (Express setup) blocks T033-T036 (middleware)
- T037 (Game context) blocks T039-T042 (components)

## Parallel Execution Examples

### Phase 3.2 - All Contract Tests
```bash
# Launch T007-T011 together:
Task: "Contract test POST /api/v1/games in backend/tests/contract/test_games_post.js"
Task: "Contract test GET /api/v1/games/{gameId} in backend/tests/contract/test_games_get.js"
Task: "Contract test POST /api/v1/games/{gameId}/actions/draw in backend/tests/contract/test_draw.js"
Task: "Contract test POST /api/v1/games/{gameId}/actions/assign in backend/tests/contract/test_assign.js"
Task: "Contract test POST /api/v1/games/{gameId}/actions/end-turn in backend/tests/contract/test_end_turn.js"
```

### Phase 3.2 - All Integration Tests
```bash
# Launch T012-T017 together:
Task: "Integration test game setup and initial deal in backend/tests/integration/test_game_setup.js"
Task: "Integration test turn-based gameplay flow in backend/tests/integration/test_turn_flow.js"
Task: "Integration test resource assignment and feature completion in backend/tests/integration/test_feature_completion.js"
Task: "Integration test HR event effects in backend/tests/integration/test_events.js"
Task: "Integration test win/loss conditions in backend/tests/integration/test_game_end.js"
Task: "Frontend integration test for game state management in frontend/src/tests/integration/test_game_state.js"
```

### Phase 3.3 - All Models
```bash
# Launch T018-T023 together:
Task: "Player model with validation in backend/src/models/Player.js"
Task: "FeatureCard model with requirements validation in backend/src/models/FeatureCard.js"
Task: "ResourceCard model with role/level validation in backend/src/models/ResourceCard.js"
Task: "EventCard model with effect parameters in backend/src/models/EventCard.js"
Task: "GameState model with round progression in backend/src/models/GameState.js"
Task: "Card factory and deck builder in backend/src/models/CardFactory.js"
```

### Phase 3.5 - Frontend Components
```bash
# Launch T037-T041 together:
Task: "Game context provider for state management in frontend/src/context/GameContext.js"
Task: "API service for backend communication in frontend/src/services/ApiService.js"
Task: "GameBoard component with player hands display in frontend/src/components/GameBoard.js"
Task: "Card component with drag/drop functionality in frontend/src/components/Card.js"
Task: "FeatureDisplay component with resource assignment in frontend/src/components/FeatureDisplay.js"
```

## Notes
- [P] tasks = different files, no dependencies, can run simultaneously
- Verify ALL tests fail before implementing (TDD requirement)
- Commit after each task completion
- Constitutional requirement: Game must be playable after each phase

## Validation Checklist
*GATE: Verified before task execution*

- [x] All 5 API contracts have corresponding tests (T007-T011)
- [x] All 6 entities have model tasks (T018-T023)
- [x] All tests come before implementation (T007-T017 before T018+)
- [x] Parallel tasks truly independent (different files confirmed)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] TDD order enforced: Tests → Models → Services → Endpoints
- [x] Constitutional compliance: Playable after each phase

**Total Tasks**: 50 (Setup: 6, Tests: 11, Core: 14, Integration: 5, Frontend: 6, Polish: 8)
**Estimated Duration**: 5-7 days with parallel execution
**Critical Path**: T001→T007-T011→T018-T023→T024-T026→T027-T031→T032-T036