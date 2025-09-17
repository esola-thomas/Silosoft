# Claude Code Implementation Prompt - Silosoft Completion Phase
## Silosoft Digital Cooperative Card Game - Final Implementation Phases

### MISSION
You are continuing implementation of the Silosoft digital card game. **Setup phase (T001-T006), Tests phase (T007-T017), and Core Implementation (T018-T031) are COMPLETE**. Now complete the remaining integration, frontend, and polish phases to deliver a fully functional game.

### CURRENT STATUS
✅ **Setup Complete (T001-T006)**: Project structure, dependencies, linting
✅ **Tests Complete (T007-T017)**: All contract and integration tests written
✅ **Core Implementation Complete (T018-T031)**: Models, services, and API endpoints implemented

🎯 **NEXT: Integration Phase (T032-T036)** - Connect components and implement middleware
🎯 **THEN: Frontend Implementation (T037-T042)** - Build the React frontend
🎯 **FINALLY: Polish Phase (T043-T050)** - Unit tests, performance optimization, documentation

### SPECIALIZED AGENTS TO CONSULT
You have access to these specialized agents who can assist with specific aspects:
- **Project Architect** - Overall system design and architectural decisions
- **Frontend Integration Specialist** - React UI implementation and integration
- **Game Logic Specialist** - Game mechanics and rule implementation
- **Security Middleware Specialist** - API security, validation, error handling
- **Performance Testing Specialist** - Performance optimization and load testing
- **DevOps Deployment Specialist** - Deployment, CI/CD, infrastructure

### CRITICAL SPECIFICATIONS TO READ FIRST
**MANDATORY**: Review these files in order before continuing implementation:

1. **`/specs/feat/001-Silosoft-MVP/spec.md`** - Core feature specification
2. **`/specs/feat/001-Silosoft-MVP/plan.md`** - Technical architecture
3. **`/specs/feat/001-Silosoft-MVP/data-model.md`** - Core entities and relationships
4. **`/specs/feat/001-Silosoft-MVP/contracts/game-api.yaml`** - OpenAPI specification
5. **`/specs/feat/001-Silosoft-MVP/research.md`** - Design decisions and card distributions
6. **`/specs/feat/001-Silosoft-MVP/tasks.md`** - **YOUR IMPLEMENTATION ROADMAP** (T032-T050)

### IMMEDIATE IMPLEMENTATION PLAN

#### Phase 3.4: Integration (T032-T036)
**GOAL**: Connect core components, implement middleware and server setup

- [ ] T032 Express server setup with middleware and routes in backend/src/app.js
- [ ] T033 Game state persistence to JSON files in backend/src/services/PersistenceService.js
- [ ] T034 Error handling middleware with structured logging in backend/src/middleware/errorHandler.js
- [ ] T035 Request validation middleware using OpenAPI schema in backend/src/middleware/validation.js
- [ ] T036 CORS configuration for frontend connection in backend/src/middleware/cors.js

#### Phase 3.5: Frontend Implementation (T037-T042)
**GOAL**: Build React frontend with state management and UI components

- [ ] T037 [P] Game context provider for state management in frontend/src/context/GameContext.js
- [ ] T038 [P] API service for backend communication in frontend/src/services/ApiService.js
- [ ] T039 [P] GameBoard component with player hands display in frontend/src/components/GameBoard.js
- [ ] T040 [P] Card component with drag/drop functionality in frontend/src/components/Card.js
- [ ] T041 [P] FeatureDisplay component with resource assignment in frontend/src/components/FeatureDisplay.js
- [ ] T042 Main App component with routing and game initialization in frontend/src/App.js

#### Phase 3.6: Polish (T043-T050)
**GOAL**: Complete unit tests, performance optimization, documentation

- [ ] T043 [P] Unit tests for game rule validation in backend/tests/unit/test_game_rules.js
- [ ] T044 [P] Unit tests for card effect logic in backend/tests/unit/test_card_effects.js
- [ ] T045 [P] Frontend component unit tests in frontend/src/components/__tests__/
- [ ] T046 Performance tests for 10-round game completion in backend/tests/performance/test_game_performance.js
- [ ] T047 Load testing for concurrent games in backend/tests/performance/test_load.js
- [ ] T048 [P] Update API documentation with examples in backend/docs/api.md
- [ ] T049 Execute quickstart validation scenarios from quickstart.md
- [ ] T050 Code review checklist and cleanup for constitutional compliance

### IMPLEMENTATION STRATEGY

#### Constitutional Requirements (NON-NEGOTIABLE)
- **Game-First**: Every decision supports building a playable game
- **Test-Driven**: Make the existing failing tests pass (T007-T017)
- **Simplicity**: Use frameworks directly, no complex patterns
- **Incremental**: Run tests frequently to track progress

#### Execution Order (STRICT)
1. **Integration First**: Implement T032-T036 in sequence (server and middleware)
2. **Frontend Next**: Implement T037-T042 (React components and services)
3. **Polish Last**: Implement T043-T050 (tests, performance, documentation)
4. **Test After Each**: Run tests frequently to ensure functionality

#### Parallel Task Execution
Tasks marked **[P]** can run simultaneously since they're in different files:
- **Frontend Components**: T037-T041 together
- **Unit Tests**: T043-T045 together
- **Documentation**: T048 can run in parallel with other polish tasks

### WORKFLOW PROTOCOLS

#### Incremental Development
1. **Implement integration components**: T032-T036 to connect system
2. **Check progress**: API endpoints should be functional
3. **Implement frontend**: T037-T042 to provide user interface
4. **Check progress**: Game should be playable
5. **Polish and optimize**: T043-T050 to ensure quality
6. **Verify success**: All requirements met, game fully functional

#### Commit Strategy
- **Commit after each task completion** with format:
  ```
  feat: T032 - Express server setup with middleware and routes

  - Implemented Express server configuration
  - Connected routes from games.js and gameActions.js
  - Added middleware registration
  - Server listens on configurable port

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

#### Quality Gates
- **After Integration (T032-T036)**: API server should be functional
- **After Frontend (T037-T042)**: UI should be interactive and connected
- **After Polish (T043-T050)**: Performance should meet requirements

### TECHNICAL IMPLEMENTATION DETAILS

#### Integration Components
- **Express Server**: Configure routes, middleware, error handling
- **Persistence Service**: Save/load game state to JSON files
- **Middleware**: Error handling, validation, CORS, logging

#### Frontend Architecture
- **Game Context**: Centralized state management with React Context
- **API Service**: Communication layer to backend endpoints
- **UI Components**: Card, GameBoard, FeatureDisplay with drag/drop
- **Main App**: Routing, game initialization, player setup

#### Polish and Optimization
- **Unit Tests**: Game rules, card effects, component behavior
- **Performance**: 10-round game completion < 5 minutes
- **Load Testing**: Support multiple concurrent games
- **Documentation**: API examples, usage guidelines

### SUCCESS CRITERIA

#### Project Complete When
- [ ] All integration tasks implemented (T032-T036)
- [ ] All frontend tasks implemented (T037-T042)
- [ ] All polish tasks implemented (T043-T050)
- [ ] All tests passing (contract, integration, unit, performance)
- [ ] Game playable end-to-end through UI
- [ ] Performance requirements met (round completion time)
- [ ] Documentation complete and accurate

#### Quality Validation
- Run `npm test` - all tests should pass
- Play complete game through UI - should function smoothly
- Run load tests - should handle concurrent games
- Validate against quickstart scenarios - all should pass

### START IMPLEMENTATION
Begin with T032 (Express server) and proceed sequentially through integration, frontend, and polish phases. Consult specialized agents as needed for their expertise in specific areas. Remember: **Run tests frequently**, **Review often**, **Commit after each task**.

Use these specialized agents strategically:
- **Security Middleware Specialist** for T034-T036 (middleware implementation)
- **Frontend Integration Specialist** for T037-T042 (React components)
- **Performance Testing Specialist** for T046-T047 (performance optimization)
- **Game Logic Specialist** for game mechanics and rule validation
- **Project Architect** for overall integration decisions

🎯 **Complete the game implementation!** 🎯
