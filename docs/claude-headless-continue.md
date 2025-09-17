# Claude Code Core Implementation Prompt
## Silosoft Digital Cooperative Card Game - Core Implementation Phase

### MISSION
You are continuing implementation of the Silosoft digital card game. **Setup phase (T001-T006) and Tests phase (T007-T017) are COMPLETE**. All contract and integration tests are written and properly failing. Now implement the core game logic to make those tests pass.

### CURRENT STATUS
✅ **Setup Complete (T001-T006)**: Project structure, dependencies, linting
✅ **Tests Complete (T007-T017)**: All contract and integration tests written and FAILING

🎯 **NEXT: Core Implementation (T018-T031)** - Make the failing tests pass

### CRITICAL SPECIFICATIONS TO READ FIRST
**MANDATORY**: Read these files in order before starting any implementation:

1. **`/specs/feat/001-Silosoft-MVP/spec.md`** - Core feature specification with 15 functional requirements
2. **`/specs/feat/001-Silosoft-MVP/plan.md`** - Technical architecture (React + Express + Jest)
3. **`/specs/feat/001-Silosoft-MVP/data-model.md`** - 6 core entities with validation rules and relationships
4. **`/specs/feat/001-Silosoft-MVP/contracts/game-api.yaml`** - Complete OpenAPI specification with 5 endpoints
5. **`/specs/feat/001-Silosoft-MVP/research.md`** - Resolved design decisions and card distributions
6. **`/specs/feat/001-Silosoft-MVP/tasks.md`** - **YOUR IMPLEMENTATION ROADMAP** (see remaining tasks T018-T050)

### IMMEDIATE IMPLEMENTATION PLAN

#### Phase 3.3: Core Implementation (T018-T031)
**GOAL**: Make all failing tests pass by implementing models, services, and API endpoints

##### Data Models (T018-T023) - CAN RUN IN PARALLEL
- [ ] T018 [P] Player model with validation in backend/src/models/Player.js
- [ ] T019 [P] FeatureCard model with requirements validation in backend/src/models/FeatureCard.js
- [ ] T020 [P] ResourceCard model with role/level validation in backend/src/models/ResourceCard.js
- [ ] T021 [P] EventCard model with effect parameters in backend/src/models/EventCard.js
- [ ] T022 [P] GameState model with round progression in backend/src/models/GameState.js
- [ ] T023 [P] Card factory and deck builder in backend/src/models/CardFactory.js

##### Core Services (T024-T026) - SEQUENTIAL (after models)
- [ ] T024 GameEngine service with turn management in backend/src/services/GameEngine.js
- [ ] T025 CardService for deck operations and shuffling in backend/src/services/CardService.js
- [ ] T026 ScoreService for points calculation and bonuses in backend/src/services/ScoreService.js

##### API Endpoints (T027-T031) - SEQUENTIAL (after services)
- [ ] T027 POST /api/v1/games endpoint implementation in backend/src/routes/games.js
- [ ] T028 GET /api/v1/games/{gameId} endpoint implementation in backend/src/routes/games.js
- [ ] T029 POST /api/v1/games/{gameId}/actions/draw endpoint in backend/src/routes/gameActions.js
- [ ] T030 POST /api/v1/games/{gameId}/actions/assign endpoint in backend/src/routes/gameActions.js
- [ ] T031 POST /api/v1/games/{gameId}/actions/end-turn endpoint in backend/src/routes/gameActions.js

### IMPLEMENTATION STRATEGY

#### Constitutional Requirements (NON-NEGOTIABLE)
- **Game-First**: Every decision supports building a playable game
- **Test-Driven**: Make the existing failing tests pass (T007-T017)
- **Simplicity**: Use frameworks directly, no complex patterns
- **Incremental**: Run tests frequently to track progress

#### Execution Order (STRICT)
1. **Models First**: Implement T018-T023 in parallel (different files)
2. **Services Next**: Implement T024-T026 sequentially (depend on models)
3. **Endpoints Last**: Implement T027-T031 sequentially (depend on services)
4. **Test After Each**: Run failing tests to see progress

#### Parallel Task Execution
Tasks marked **[P]** can run simultaneously since they're in different files:
- **All Models**: T018-T023 together
- **Contract Tests Already Written**: T007-T011 ready to validate endpoints
- **Integration Tests Already Written**: T012-T017 ready to validate game flow

### WORKFLOW PROTOCOLS

#### Test-Driven Development
1. **Run existing tests**: `npm test` to see current failures
2. **Implement models**: T018-T023 to fix basic data structure errors
3. **Check progress**: Some tests may start passing
4. **Implement services**: T024-T026 to fix business logic errors
5. **Check progress**: More tests should pass
6. **Implement endpoints**: T027-T031 to fix API contract errors
7. **Verify success**: All T007-T017 tests should pass

#### Commit Strategy
- **Commit after each task completion** with format:
  ```
  feat: T018 - Player model with validation

  - Implemented Player class with id, name, hand, resources
  - Added validation for player count (2-4)
  - Supports resource tracking and hand management
  - Fixes T012 test_game_setup.js player creation errors

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

#### Quality Gates
- **After Models (T018-T023)**: Basic object creation should work
- **After Services (T024-T026)**: Game logic should function
- **After Endpoints (T027-T031)**: All API tests should pass

### TECHNICAL IMPLEMENTATION DETAILS

#### Existing Test Coverage
**Contract Tests (T007-T011)** validate:
- POST /api/v1/games - Game creation with 2-4 players
- GET /api/v1/games/{gameId} - Game state retrieval
- POST /api/v1/games/{gameId}/actions/draw - Card drawing
- POST /api/v1/games/{gameId}/actions/assign - Resource assignment
- POST /api/v1/games/{gameId}/actions/end-turn - Turn progression

**Integration Tests (T012-T017)** validate:
- T012: Game setup and initial card dealing
- T013: Turn-based gameplay flow
- T014: Resource assignment and feature completion
- T015: HR event effects (layoff, PTO, competition)
- T016: Win/loss conditions
- T017: Frontend game state management

#### Game Mechanics Implementation
- **Card Loading**: Use shared/schemas/cards.json (already created)
- **Game State**: Track 10 rounds, player turns, deck state
- **Resource Assignment**: Validate role/level matching
- **Scoring**: Progressive points (3/5/8) with bonuses
- **HR Events**: Implement layoff, PTO, competition effects

#### Error Handling Requirements
- Validate all inputs against data model constraints
- Return proper HTTP status codes per OpenAPI spec
- Handle edge cases (empty deck, invalid moves)
- Maintain game state integrity

### SUCCESS CRITERIA

#### Phase 3.3 Complete When
- [ ] All 6 models implemented (T018-T023)
- [ ] All 3 services implemented (T024-T026)
- [ ] All 5 API endpoints implemented (T027-T031)
- [ ] All contract tests passing (T007-T011)
- [ ] All integration tests passing (T012-T017)
- [ ] Game mechanics fully functional
- [ ] Ready for integration phase (T032-T036)

#### Quality Validation
- Run `npm test` - all existing tests should pass
- Create test game via API - should succeed
- Complete full game round - should function
- Validate against quickstart scenarios

### START CORE IMPLEMENTATION
Begin with T018-T023 (models) and implement in parallel. Focus on making the existing failing tests pass. Remember: **The tests are your specification** - implement exactly what they expect. We need to complete all the requirements up to T50

🎯 **Make those tests green!** 🎯
