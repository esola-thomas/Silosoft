# Data Model: Silosoft Card Game

**Created**: 2025-09-15
**Phase**: 1 - Design & Contracts
**Status**: Complete

## Core Entities

### Player
**Purpose**: Represents a game participant
**Fields**:
- `id`: string (unique identifier)
- `name`: string (display name)
- `hand`: Card[] (cards currently held)
- `score`: number (accumulated points)
- `temporarilyUnavailable`: ResourceCard[] (PTO/PLM locked resources)

**Validation Rules**:
- Hand size maximum 7 cards
- Score starts at 0, can go negative
- Player ID must be unique within game session

**State Transitions**:
- Active → Drawing (on turn start)
- Drawing → Planning (after card drawn)
- Planning → Active (after resources assigned)

### FeatureCard
**Purpose**: Defines project requirements and point values
**Fields**:
- `id`: string (unique identifier)
- `name`: string (feature description)
- `requirements`: Object (resource needs: {dev: number, pm: number, ux: number})
- `points`: number (base point value: 3, 5, or 8)
- `assignedResources`: ResourceCard[] (currently assigned)
- `completed`: boolean (completion status)

**Validation Rules**:
- Requirements must specify at least one resource type
- Points must be 3, 5, or 8 (Basic, Complex, Epic)
- Cannot be completed without meeting all requirements

**State Transitions**:
- InDeck → InPlay (when drawn)
- InPlay → Completed (when requirements met)

### ResourceCard
**Purpose**: Represents team members with skills and levels
**Fields**:
- `id`: string (unique identifier)
- `role`: enum ('dev' | 'pm' | 'ux')
- `level`: enum ('entry' | 'junior' | 'senior')
- `value`: number (skill points: 1, 2, or 3)
- `assignedTo`: string | null (feature card ID if assigned)
- `unavailableUntil`: number | null (round number when available again)

**Validation Rules**:
- Role must be one of: dev, pm, ux
- Level must be one of: entry (value 1), junior (value 2), senior (value 3)
- Cannot be assigned to multiple features simultaneously
- Unavailable resources cannot be assigned

**State Transitions**:
- Available → Assigned (when allocated to feature)
- Assigned → Available (when feature completed or reassigned)
- Available → Unavailable (during PTO/PLM)
- Unavailable → Available (when lock expires)

### EventCard
**Purpose**: Triggers workplace disruptions and special events
**Fields**:
- `id`: string (unique identifier)
- `type`: enum ('layoff' | 'reorg' | 'contractor' | 'competition' | 'pto')
- `effect`: string (description of effect)
- `parameters`: Object (effect-specific data)

**Validation Rules**:
- Type determines valid parameters structure
- Effect text must describe player-facing impact
- Parameters must match type requirements

**State Transitions**:
- InDeck → Triggered (when drawn)
- Triggered → Resolved (after effect applied)

### GameState
**Purpose**: Tracks overall game progress and rules
**Fields**:
- `id`: string (game session identifier)
- `players`: Player[] (all participants)
- `currentRound`: number (1-10)
- `currentPlayerIndex`: number (whose turn)
- `deck`: Card[] (undrawn cards)
- `discardPile`: Card[] (used cards)
- `featuresInPlay`: FeatureCard[] (active features)
- `gamePhase`: enum ('setup' | 'playing' | 'ended')
- `winCondition`: boolean (all features completed?)

**Validation Rules**:
- Round must be 1-10
- Current player index must be valid
- Game ends when round > 10 or all features completed
- Minimum 2, maximum 4 players

**State Transitions**:
- Setup → Playing (after initial deal)
- Playing → Ended (round > 10 or victory achieved)

### Round
**Purpose**: Time unit for game progression
**Fields**:
- `number`: number (1-10)
- `actions`: Action[] (log of events this round)
- `completed`: boolean (all players had turns)

**Validation Rules**:
- Round number must be sequential
- Cannot progress until all players complete turn
- Round 11 triggers game end

## Relationships

### Player ↔ Cards
- Player has many cards in hand (1:many)
- ResourceCard can be owned by one Player (many:1)
- FeatureCard can be assigned resources from multiple Players (many:many via assignments)

### FeatureCard ↔ ResourceCard
- FeatureCard requires specific resource types and quantities
- ResourceCard can be assigned to one FeatureCard at a time
- Assignment tracked in ResourceCard.assignedTo field

### GameState ↔ All Entities
- GameState contains all Players, Cards, and game progression data
- Provides single source of truth for current game status
- Enforces turn order and round progression rules

## Data Persistence

### JSON File Structure
```json
{
  "version": "1.0.0",
  "gameState": {
    "id": "game-uuid",
    "currentRound": 1,
    "gamePhase": "playing",
    "players": [...],
    "deck": [...],
    "featuresInPlay": [...]
  },
  "cardDefinitions": {
    "features": [...],
    "resources": [...],
    "events": [...]
  }
}
```

### Validation Schema
- JSON Schema validation for all card types
- Game state validation on each state transition
- Client-side validation mirrors server validation
- Error handling for malformed data graceful degradation

---
**Data Model Complete**: 2025-09-15 | **Phase 1 Foundation** ✓