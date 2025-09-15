# Research: Silosoft Card Game Design & Technology

**Created**: 2025-09-15
**Phase**: 0 - Outline & Research
**Status**: Complete

## Card Quantities and Distribution

**Decision**: 50-card deck composition:
- 15 Feature Cards (30%)
- 27 Resource Cards (54%) - 9 Dev, 9 PM, 9 UX (3 each of Entry/Junior/Senior)
- 8 HR Event Cards (16%)

**Rationale**:
- 50 cards enables 10+ rounds with 4 players drawing consistently
- 54% resources ensures sufficient assignment options without oversupply
- 30% features provides enough variety while maintaining completion challenge
- 16% events creates disruption without overwhelming core gameplay

**Alternatives considered**:
- 40-card deck: Too limited for 4-player 10-round games
- 60-card deck: Excessive for hackathon MVP, slows playtesting
- Even resource distribution: Rejected due to workplace realism (more devs than PMs)

## Scoring Mechanism

**Decision**: Progressive point system:
- Basic Features: 3 points
- Complex Features: 5 points
- Epic Features: 8 points
- Efficiency Bonus: +1 point for completing under minimum resources
- Speed Bonus: +1 point for completion in rounds 1-3

**Rationale**:
- Progressive values encourage tackling harder challenges
- Bonuses reward strategic resource management and early momentum
- Simple arithmetic supports quick manual scoring during playtests
- Total ~45 possible points creates meaningful score differences

**Alternatives considered**:
- Flat scoring: Rejected as it doesn't reflect effort differences
- Complex multipliers: Rejected for hackathon simplicity
- Team-only scoring: Rejected as individual contribution tracking adds engagement

## Company Competition Deadline Mechanism

**Decision**: 1.5-round grace period with point penalties:
- Player draws competition card → 1.5 rounds to complete any feature
- Success: +2 bonus points
- Failure: -3 points (not game ending)
- Grace calculation: Current round + 1 full round + half next round

**Rationale**:
- Non-elimination maintains cooperative spirit
- Point stakes create urgency without destroying game flow
- 1.5 rounds allows for realistic resource gathering and assignment
- Positive/negative incentives balance risk/reward

**Alternatives considered**:
- Immediate completion: Too harsh, breaks game flow
- Elimination consequences: Contradicts cooperative principles
- Fixed 2-round deadline: Too generous, reduces urgency

## PTO/PLM Event Duration

**Decision**: 2-round lock with player choice:
- Player drawing PTO/PLM chooses which resource to "send on leave"
- Chosen resource unavailable for 2 complete rounds
- Returns automatically at start of third round
- Resource card remains visible but marked as unavailable

**Rationale**:
- 2 rounds creates meaningful impact without permanent loss
- Player choice maintains agency and strategic options
- Automatic return reduces tracking complexity
- Visible cards help players plan for resource return

**Alternatives considered**:
- Random selection: Reduces player agency
- 1-round duration: Insufficient impact on strategy
- 3-round duration: Too punitive for cooperative game
- Permanent loss: Too harsh, conflicts with cooperation theme

## Web Development Best Practices

**Decision**: React/Express architecture with:
- Frontend: React with Context API for state management
- Backend: Express REST API for game logic
- Real-time: Socket.io for multiplayer (stretch goal)
- Testing: Jest + React Testing Library
- Data: JSON files with in-memory caching

**Rationale**:
- React Context API sufficient for game state without Redux complexity
- Express provides simple REST patterns suitable for card game actions
- JSON files enable easy card definition changes during development
- Socket.io adds multiplayer capability without architectural changes
- Jest ecosystem familiar and comprehensive

**Alternatives considered**:
- Next.js full-stack: Overkill for simple game logic
- Redux state management: Too complex for hackathon timeline
- Database storage: Unnecessary for stateless card definitions
- WebSockets directly: Socket.io provides better fallbacks and tooling

## JSON Schema Patterns

**Decision**: Structured validation with versioning:
```json
{
  "version": "1.0.0",
  "cards": {
    "features": [{"id": "f1", "name": "User Login", "requirements": {"dev": 2, "pm": 1}, "points": 3}],
    "resources": [{"id": "r1", "role": "dev", "level": "senior", "value": 3}],
    "events": [{"id": "e1", "type": "layoff", "effect": "random_discard", "count": 1}]
  }
}
```

**Rationale**:
- Version field enables schema migrations during development
- Separate arrays by card type simplify deck building and validation
- Consistent ID patterns support referencing and debugging
- Flat structure optimizes for file editing and validation

**Alternatives considered**:
- Single cards array: Harder to validate and organize by type
- Complex nested schemas: Too complex for hackathon iteration speed
- YAML format: JSON better tooling support in JavaScript ecosystem
- Database normalization: Premature optimization for card definition data

## Implementation Priority

**Phase 0 Complete**: All NEEDS CLARIFICATION items resolved
**Next**: Phase 1 data modeling and contract generation
**Risk Mitigation**: All decisions optimized for hackathon timeline and iterative testing

---
**Research Complete**: 2025-09-15 | **All unknowns resolved** ✓