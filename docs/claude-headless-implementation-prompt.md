# Claude Code Headless Implementation Prompt
## Silosoft Digital Cooperative Card Game - Complete Implementation

### MISSION
You are implementing the complete Silosoft digital card game as specified in the comprehensive task list. This is a cooperative workplace-themed card game where 2-4 players collaborate to complete feature projects within 10 rounds by strategically assigning team resources while navigating HR events.

### CRITICAL SPECIFICATIONS TO READ FIRST
**MANDATORY**: Read these files in order before starting any implementation:

1. **`/specs/feat/001-Silosoft-MVP/spec.md`** - Core feature specification with 15 functional requirements
2. **`/specs/feat/001-Silosoft-MVP/plan.md`** - Technical architecture (React + Express + Jest)
3. **`/specs/feat/001-Silosoft-MVP/data-model.md`** - 6 core entities with validation rules and relationships
4. **`/specs/feat/001-Silosoft-MVP/contracts/game-api.yaml`** - Complete OpenAPI specification with 5 endpoints
5. **`/specs/feat/001-Silosoft-MVP/research.md`** - Resolved design decisions and card distributions
6. **`/specs/feat/001-Silosoft-MVP/tasks.md`** - **YOUR IMPLEMENTATION ROADMAP** (50 numbered tasks T001-T050)
7. **`/specs/feat/001-Silosoft-MVP/quickstart.md`** - End-to-end validation scenarios
8. **`.specify/memory/constitution.md`** - Constitutional requirements (game-first, simplicity, test-first)

### IMPLEMENTATION STRATEGY

#### Phase Execution Order (STRICT)
1. **Setup (T001-T006)**: Project structure, dependencies, linting
2. **Tests First (T007-T017)**: Contract tests + integration tests (**MUST FAIL INITIALLY**)
3. **Core Implementation (T018-T031)**: Models → Services → API Endpoints
4. **Integration (T032-T036)**: Express server, middleware, persistence
5. **Frontend (T037-T042)**: React components, game UI
6. **Polish (T043-T050)**: Unit tests, performance, documentation

#### Constitutional Requirements (NON-NEGOTIABLE)
- **Game-First**: Every decision supports building a playable game
- **Test-First**: Write failing tests before ANY implementation (T007-T017 before T018+)
- **Simplicity**: Use frameworks directly, no complex patterns
- **Playable After Each Phase**: Game must work end-to-end after each major phase

#### Parallel Task Execution
Tasks marked **[P]** can run simultaneously (different files, no dependencies):
- **All Contract Tests**: T007-T011 together
- **All Integration Tests**: T012-T017 together
- **All Models**: T018-T023 together
- **All Frontend Components**: T037-T041 together

### WORKFLOW PROTOCOLS

#### Review & Safety Checks
- **Run `/review` after every 3-5 task completions**
- **Run `/review` before any major architectural changes**
- **Run `/review` before moving between phases**
- **STOP immediately if `/review` identifies any issues**

#### Commit Strategy
- **Commit after each task completion** with format:
  ```
  feat: T001 - Create web app project structure

  - Created backend/, frontend/, shared/ directories
  - Initialized npm workspaces
  - Added basic package.json files

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- **Commit failing tests immediately** when implementing T007-T017
- **Commit working implementation** when tests pass
- **Run `/review` before each commit**

#### Error Handling
- If any task fails, STOP and run `/review`
- If tests don't fail when they should, STOP and run `/review`
- If constitutional violations detected, STOP and run `/review`
- If unable to complete a task, document blockers and run `/review`

### TECHNICAL IMPLEMENTATION DETAILS

#### Project Structure (Web App)
```
backend/
├── src/
│   ├── models/          # T018-T023
│   ├── services/        # T024-T026
│   ├── routes/          # T027-T031
│   ├── middleware/      # T034-T036
│   └── app.js          # T032
├── tests/
│   ├── contract/        # T007-T011
│   ├── integration/     # T012-T016
│   ├── unit/           # T043-T044
│   └── performance/     # T046-T047
└── docs/               # T048

frontend/
├── src/
│   ├── components/      # T039-T041
│   ├── context/        # T037
│   ├── services/       # T038
│   └── App.js          # T042
└── tests/
    └── integration/     # T017

shared/
└── schemas/            # T006
```

#### Technology Stack (EXACT)
- **Backend**: Node.js 18+, Express, Jest, CORS
- **Frontend**: React 18+, Context API, React Testing Library
- **Testing**: Jest for all backend/frontend tests
- **Data**: JSON files for card definitions and persistence
- **Validation**: OpenAPI schema validation

#### Game Mechanics (Core Rules)
- **Players**: 2-4 per game
- **Rounds**: 10 maximum
- **Cards**: 50 total (15 features, 27 resources, 8 events)
- **Resources**: Dev/PM/UX with Entry(+1)/Junior(+2)/Senior(+3) levels
- **Win Condition**: Complete all feature cards within 10 rounds
- **Cooperation**: Shared resource assignment, team victory only

### QUALITY GATES

#### Phase Completion Criteria
- **Setup Complete**: All dependencies installed, linting configured, project structure created
- **Tests Complete**: All 11 tests written and FAILING (contract + integration)
- **Core Complete**: All tests PASSING, API endpoints functional
- **Integration Complete**: Express server running, middleware working
- **Frontend Complete**: React app connects to backend, basic UI functional
- **Polish Complete**: All tests passing, performance validated

#### Constitutional Compliance Check
Before each phase transition, verify:
- [ ] Game-first: Implementation supports core gameplay
- [ ] Simplicity: Direct framework usage, minimal complexity
- [ ] Test-first: Tests written before implementation
- [ ] Playability: Game works end-to-end at current phase

### CRITICAL SUCCESS FACTORS

#### TDD Enforcement (ABSOLUTE)
1. Write contract test (T007-T011) → MUST FAIL
2. Write integration test (T012-T017) → MUST FAIL
3. Run ALL tests → Verify failures
4. Implement models (T018-T023) → Some tests may pass
5. Implement services (T024-T026) → More tests pass
6. Implement endpoints (T027-T031) → All tests PASS

#### Game Balance Implementation
- **Card Distribution**: Exactly as specified in research.md
- **Scoring System**: Progressive (3/5/8 points) with bonuses
- **HR Events**: Balanced for challenge without frustration
- **Resource Validation**: Prevent impossible assignments

#### Error Prevention
- Validate all user inputs against OpenAPI schema
- Handle edge cases gracefully (empty deck, invalid moves)
- Provide clear error messages for rule violations
- Maintain game state integrity at all times

### COMPLETION VALIDATION

#### Final Checklist
- [ ] All 50 tasks (T001-T050) completed
- [ ] All tests passing (contract, integration, unit, performance)
- [ ] Quickstart scenarios executable and passing
- [ ] Game playable end-to-end for 2-4 players
- [ ] 10-round game completion under 5 minutes
- [ ] Constitutional requirements met
- [ ] Branch ready for PR creation

#### Deliverable Artifacts
- **Working Game**: Playable React frontend + Express backend
- **Complete Test Suite**: 100+ tests covering all functionality
- **API Documentation**: Generated from OpenAPI spec
- **Performance Validation**: Load testing results
- **Game Data**: Complete card definitions and examples

### START IMPLEMENTATION
Begin with T001 and proceed sequentially through all phases. Remember: **Tests before implementation**, **Review frequently**, **Commit often**, **Game-first always**.

🎮 **Build a game that people want to play!** 🎮