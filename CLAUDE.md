# Claude Code Context: Silosoft Digital Card Game

**Project Type**: Web Application (React + Express)
**Phase**: Implementation Planning Complete
**Version**: 1.0.0

## Current Development Status

**Feature**: Silosoft Digital Cooperative Card Game
**Branch**: feat/001-got-it-since
**Completion**: Phase 1 Design Complete

## Technology Stack

### Frontend
- **Framework**: React 18+ with Context API
- **Testing**: Jest + React Testing Library
- **Build**: Create React App or Vite
- **UI**: Minimal card-based interface with drag/drop

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express REST API
- **Real-time**: Socket.io (multiplayer stretch goal)
- **Testing**: Jest for API endpoints

### Data & Storage
- **Persistence**: JSON files for card definitions
- **State**: In-memory game state with file backup
- **Schema**: OpenAPI 3.0 contracts defined

## Game Architecture

### Core Components
1. **Game Engine**: Core business logic and rules
2. **Card System**: Feature/Resource/Event card types
3. **Player Management**: Turn order and scoring
4. **State Management**: Game progression and validation

### API Design
- REST endpoints for game actions
- WebSocket support for real-time updates
- JSON schema validation on all requests
- Error handling with clear user messages

## Implementation Approach

### Constitutional Requirements
- **TDD**: Contract tests → Integration tests → Unit tests
- **Simplicity**: Direct framework usage, no complex patterns
- **Performance**: <5 second load, <5 minute game cycle
- **Testing**: RED-GREEN-Refactor cycle enforced

### Development Order
1. Contract tests (failing initially)
2. Data models and validation
3. Core game engine logic
4. API endpoint implementation
5. Frontend components
6. Integration and E2E tests

## Current Phase Artifacts

### Documentation
- **Specification**: Complete with 15 functional requirements
- **Research**: All technical unknowns resolved
- **Data Model**: 6 core entities with relationships
- **API Contracts**: OpenAPI 3.0 specification
- **Quickstart**: End-to-end validation procedures

### Next Steps
- Phase 2: Task generation (/tasks command)
- Phase 3: Implementation execution
- Phase 4: Testing and validation

## Key Game Mechanics

### Card Types
- **Features**: 15 cards requiring Dev/PM/UX resources
- **Resources**: 27 cards with role and skill level
- **Events**: 8 HR disruption cards (layoffs, PTO, etc.)

### Gameplay Flow
1. Setup: Deal initial cards to 2-4 players
2. Turns: Draw card → Assign resources → End turn
3. Win: Complete all features within 10 rounds
4. Scoring: Progressive points (3/5/8) with bonuses

### Technical Constraints
- Single-player mode mandatory
- Multiplayer optional stretch goal
- Fail gracefully on invalid moves
- Clear state visibility for debugging

## Recent Changes

**2025-09-15**: Implementation plan completed
- Research phase resolved all clarifications
- API contracts generated from requirements
- Data model supports all functional requirements
- Ready for task generation and implementation

---
**Auto-generated**: 2025-09-15 | **Keep under 150 lines for token efficiency**