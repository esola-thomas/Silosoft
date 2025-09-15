# Feature Specification: Silosoft Digital Cooperative Card Game

**Feature Branch**: `feat/001-got-it-since`
**Created**: 2025-09-15
**Status**: Draft
**Input**: User description: "Got it =€  since you want a **full functional game** spec prompt for Silosoft, I'll structure this like a **Product Functional Specification** you can feed directly into a dev workflow (Codex, Claude Code, or hackathon teammates). It will include: **MVP scope, game loop, UI, backend logic, and technical essentials**."

## Execution Flow (main)
```
1. Parse user description from Input
   ’ Feature description extracted: Digital cooperative card game simulating workplace challenges
2. Extract key concepts from description
   ’ Actors: Players (2-4), Game System
   ’ Actions: Draw cards, assign resources, complete features, handle events
   ’ Data: Cards (Feature/Resource/Event), game state, player hands, rounds
   ’ Constraints: 10 rounds limit, resource matching requirements
3. For each unclear aspect:
   ’ [NEEDS CLARIFICATION: Specific card quantities and distributions not defined]
   ’ [NEEDS CLARIFICATION: Exact scoring mechanism for completed features]
4. Fill User Scenarios & Testing section
   ’ User flow identified: Setup ’ Turn-based gameplay ’ Win/Loss resolution
5. Generate Functional Requirements
   ’ Each requirement defined as testable capability
6. Identify Key Entities
   ’ Cards, Players, Game State, Resources identified
7. Run Review Checklist
   ’ WARN "Spec has uncertainties regarding card distributions and scoring"
8. Return: SUCCESS (spec ready for planning with clarifications needed)
```

---

## ¡ Quick Guidelines
-  Focus on WHAT users need and WHY
- L Avoid HOW to implement (no tech stack, APIs, code structure)
- =e Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
Players collaborate to complete workplace feature projects by strategically assigning team resources (developers, project managers, UX designers) while navigating disruptive corporate events like layoffs and reorganizations. Success requires completing all feature cards within 10 rounds through teamwork and resource management.

### Acceptance Scenarios
1. **Given** a new game starts, **When** players are dealt initial cards, **Then** each player receives 1 feature card and a pool of resource cards
2. **Given** it's a player's turn, **When** they draw a card, **Then** they receive either a feature card or an HR event card
3. **Given** a feature card with specific requirements, **When** players assign matching resources, **Then** the feature is completed and removed from play
4. **Given** an HR event card is drawn, **When** the event triggers, **Then** the specified disruption (layoff, reorg, etc.) is applied to player resources
5. **Given** 10 rounds have passed, **When** all required features are completed, **Then** the team wins the game
6. **Given** 10 rounds have passed, **When** required features remain incomplete, **Then** the team loses the game

### Edge Cases
- What happens when a Company Competition card forces immediate feature completion but resources are insufficient?
- How does the system handle resource conflicts when multiple players want to use the same resources?
- What occurs when a layoff event removes the exact resources needed for a feature in progress?

## Requirements

### Functional Requirements
- **FR-001**: System MUST support 2-4 players in a single game session
- **FR-002**: System MUST deal each player 1 feature card and a pool of resource cards at game start
- **FR-003**: System MUST enforce turn-based gameplay where players draw 1 card per turn
- **FR-004**: System MUST validate resource requirements before allowing feature completion
- **FR-005**: System MUST apply HR event effects immediately when event cards are drawn
- **FR-006**: System MUST track round progression and enforce 10-round game limit
- **FR-007**: System MUST determine win/loss conditions based on feature completion within round limit
- **FR-008**: Players MUST be able to assign resources to features collaboratively
- **FR-009**: System MUST handle three resource types: Dev, PM, and UX with Entry/Junior/Senior levels
- **FR-010**: System MUST process layoff events by removing random resources from players
- **FR-011**: System MUST allow reorg events to reassign resources between teammates
- **FR-012**: System MUST support contractor cards as wildcard resources
- **FR-013**: System MUST enforce Company Competition deadlines [NEEDS CLARIFICATION: exact deadline mechanism not specified]
- **FR-014**: System MUST handle PTO/PLM events by making resources temporarily unavailable [NEEDS CLARIFICATION: duration not specified]
- **FR-015**: System MUST persist game state throughout the session [NEEDS CLARIFICATION: specific data retention requirements not defined]

### Key Entities
- **Player**: Represents a game participant with a hand of cards and assigned resources
- **Feature Card**: Defines project requirements (resource types and quantities needed for completion)
- **Resource Card**: Represents team members with role (Dev/PM/UX) and level (Entry +1, Junior +2, Senior +3)
- **HR Event Card**: Triggers workplace disruptions (layoffs, reorgs, contractor hires, PTO, competition deadlines)
- **Game State**: Tracks current round, active features, player hands, deck status, and completion progress
- **Round**: Time unit limiting game duration to 10 cycles maximum

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed (pending clarifications)

---