# Feature Specification: Silosoft Game Core Mechanics

**Feature Branch**: `001-title-silosoft-game`
**Created**: 2025-09-17
**Status**: Draft
**Input**: User description: "Implement Silosoft workplace simulation core mechanics (cards events turn engine win lose rng trading timers validation)" (Derived from detailed design document for Silosoft cooperative workplace simulation game.)

## Execution Flow (main)
```
1. Parse user description from Input
	→ If empty: ERROR "No feature description provided"
2. Extract key concepts from description
	→ Identify: actors (players), actions (draw, trade, complete feature, pass), data (cards, turn counters, timers), constraints (turn limit, single active feature, trade limits)
3. Confirm no unresolved ambiguities remain (all design decisions recorded)
4. Populate User Scenarios & Testing section
	→ If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements (all testable & unambiguous)
6. Identify Key Entities (data involved)
7. Run Review Checklist
	→ If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
All prior ambiguities have been resolved; decisions are documented in the Resolved Design Decisions section.

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a team of players, we want to cooperatively complete a target number of feature cards within a fixed number of turns, by drawing resources, mitigating events, and strategically trading so that we achieve an instant team victory before the turn limit expires.

### Acceptance Scenarios
1. **Given** a new game with X players and each holding an initial active feature and 3 resource cards, **When** the first player starts their turn and draws a resource (per weighted draw) **Then** the resource is added to their hand and they may take actions (trade, attempt completion, pass).
2. **Given** a player draws an Event card "Layoff" with at least one resource in hand, **When** the event resolves, **Then** exactly one resource is removed at random from that player's hand and the turn proceeds.
3. **Given** a player has sufficient role points in hand to meet all role thresholds on their active feature, **When** they choose to complete the feature, **Then** the required resources are expended simultaneously, the feature counts toward the team total, and a replacement feature is immediately drawn if within the turn limit.
4. **Given** the team reaches (playerCount * 3) completed features on any completion before or during turn 10, **When** that completion is processed, **Then** the game ends immediately with a team win.
5. **Given** turn 10 ends without reaching the target number of completed features, **When** the end-of-turn check runs, **Then** the game ends in a loss.
6. **Given** a player is under a Company Competition requirement set on the prior turn, **When** they fail to complete any feature during their next turn, **Then** the defined penalty (feature forfeiture or resource discard if none) is applied at turn end.
7. **Given** a resource is marked PTO, **When** the owning player attempts to include it in a completion bundle before it becomes available, **Then** the system prevents its selection.
8. **Given** a player initiates one trade in a turn, **When** they attempt to initiate a second trade in the same turn, **Then** the action is disallowed (recipient participation as non-initiator does not count against their initiation limit).

### Edge Cases
- Drawing an event when the player's hand is empty (Layoff / Reorg / PTO) → event nullifies without side effects.
- Company Competition penalty when player has zero completed features → resource discard fallback triggers. [Confirm exact number of discards if insufficient resources.]
- Multiple possible completion bundles in hand → player selects one; excess points are ignored.
- Attempted completion with over-satisfaction on a role (e.g., need 2, have 5) → allowed; excess has no carryover.
- Turn 10 instant win vs. loss race: if win threshold reached during any action of turn 10, game ends immediately as win before loss condition checks.
- Contractor wildcard role declaration must be atomic with completion decision; cannot count for multiple roles simultaneously.
- PTO resource expiring exactly at end of owner's next turn becomes usable on following turn start.
- Trading PTO-marked resources: PTO-locked resources may be traded; their lock persists for the recipient.
- Simultaneous competition and PTO interactions: PTO lock does not waive competition requirement; player may still fail and incur penalty.
- No available new feature card at completion (feature list exhausted) → Player simply has no active feature; game continues (victory still possible through other players). No early termination.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The game MUST support 1–4 players configurable at game start.
- **FR-002**: Each player MUST begin with exactly one active feature card and exactly three resource cards.
- **FR-003**: The system MUST enforce a global turn limit of 10 turns where a "turn" = one player's complete sequence.
- **FR-004**: The system MUST track and display the team target = playerCount * 3 completed features.
- **FR-005**: The system MUST end the game immediately in victory upon reaching or exceeding the target within the turn limit.
- **FR-006**: The system MUST end the game in loss immediately after the 10th turn ends if the target was not reached.
- **FR-007**: The draw phase MUST produce either a resource or event card using a default 70% / 30% weighting; weighting configurable (resource weight 0–100; event = remainder) at game start.
- **FR-008**: Resource cards MUST include roles (Dev, PM, UX) or wildcard Contractor; each role card MUST have a point value (Senior 3, Junior 2, Entry 1; Contractor 2) as defined.
- **FR-009**: Contractor cards MUST be declared as exactly one role at the moment of feature completion and count only toward that role.
- **FR-010**: Feature completion MUST require meeting or exceeding each listed role threshold simultaneously with a single chosen bundle from the hand.
- **FR-011**: On feature completion the system MUST remove the used resource cards from that player's hand and increment the completed feature total.
- **FR-012**: After completion assign a new feature immediately if deck remains; if exhausted, player has no active feature until game end.
- **FR-013**: A player MUST have at most one active feature at a time.
- **FR-014**: The system MUST allow at most one trade initiation per player per turn (recipient can still initiate their own on their turn).
- **FR-015**: Trades MUST involve exactly two players and MAY consist of an exchange or a one-sided gift.
- **FR-016**: Event: Layoff MUST randomly discard one resource from the triggering player's hand if any; otherwise nullify.
- **FR-017**: Event: Reorg MUST allow the triggering player to select one resource to transfer to another player's hand if possible; otherwise nullify.
- **FR-018**: Event: Company Competition MUST impose a requirement to complete at least one feature on the player's next turn; failing that MUST trigger its penalty at end of that turn.
- **FR-019**: Company Competition penalty MUST remove one previously completed feature chosen by the player; if none exist, discard two random resources (or as many as available if fewer than two).
- **FR-020**: Event: PTO MUST mark a chosen resource as unavailable for the current and the player's next turn; it becomes available after that next turn ends.
- **FR-021**: PTO-marked resources MUST be visually indicated to the owning player and excluded from completion bundles until reactivated.
- **FR-022**: Events MUST affect only the drawing player and must never retroactively alter already completed features (except Company Competition penalty which removes one from the team total explicitly).
- **FR-023**: If an event has no legal effect, it MUST be declared nullified with no state change.
- **FR-024**: The system MUST prevent partial feature progress tracking; either a feature completes atomically or has no progress stored.
- **FR-025**: Multiple completions per turn allowed by default; optional toggle can restrict to one.
- **FR-026**: The system MUST ignore and not carry over excess role points beyond thresholds.
- **FR-027**: Deterministic random sequence when optional seed specified; otherwise generate & reveal seed in end summary.
- **FR-028**: Log significant actions retaining last 100 entries (configurable).
- **FR-029**: The system MUST restrict completion attempts to cards in the player's current hand only (no borrowed temporary resources outside trades).
- **FR-030**: PTO-locked resources are tradable; lock persists with resource under new owner.
- **FR-031**: The system MUST enforce that competition requirement clears immediately upon any feature completion by the affected player during the required turn.
- **FR-032**: The system MUST surface a visible indicator when a player is under a competition requirement.
- **FR-033**: The game MUST present current team progress (completed vs. target) at all times.
- **FR-034**: The system MUST disallow feature completion if any required role threshold would not be met after applying declared Contractor role assignments.
- **FR-035**: The system MUST allow a player to pass their action phase without trading or completing.
- **FR-036**: If a player's hand is empty they MUST still complete the draw phase and may only pass afterward.
- **FR-037**: Removal penalty decrements team total; forfeited feature enters lost pile and never re-enters play.
- **FR-038**: The system MUST ensure that win condition checks happen immediately following any feature completion before further actions.
- **FR-039**: Role color coding supplemented by distinct icons and text labels for accessibility.
- **FR-040**: Actions processed sequentially; no concurrent conflicting actions in MVP.
- **FR-041**: Configurable: draw weighting, multiple completion toggle, RNG seed, log retention size; victory target formula fixed.
- **FR-042**: The system MUST document and expose to players (or host) any optional rule toggles chosen at game start (e.g., single vs multiple completions per turn).
- **FR-043**: The system MUST ensure that feature requirements never include roles outside the defined role set.
- **FR-044**: The system MUST ensure PTO timers decrement correctly and release resources precisely after the owner's next turn ends.
- **FR-045**: The system MUST not allow a player to hold more than one active feature simultaneously. (Reiterated to guarantee enforcement.)
- **FR-046**: End summary includes outcome, turns used, team target, total completed, per-player completed counts, trades initiated, events by type, resources discarded via events, features forfeited, RNG seed.
- **FR-047**: Blocking modal decisions are serialized; completion disabled until resolved.
- **FR-048**: The system MUST treat all random selection of resources (Layoff, penalty discards) as uniformly distributed across eligible cards.
- **FR-049**: Forfeited features reduce progress; any achieved instant win remains final.
- **FR-050**: The system MUST maintain game state integrity so that invalid actions are rejected without state mutation.

### Key Entities *(include if feature involves data)*
- **Game**: Represents a single cooperative session; tracks turn number, turn limit, target completion threshold, completed feature total, RNG seed, configuration (optional rules), and log.
- **Player**: Participant with an identifier, current hand of resource cards, active feature, completed feature collection, lost (forfeited) feature collection, active competition requirement (if any), PTO locks.
- **Feature Card**: Defines required role thresholds (subset of roles). Attributes: id, title, roleRequirements (role→points). State: active, completed, forfeited.
- **Resource Card**: Represents staffing capacity; attributes: id, role (or Contractor), level (Senior/Junior/Entry) or wildcard flag, pointValue, PTO status/timer.
- **Event Card**: One-off effect upon draw: Layoff, Reorg, Company Competition, PTO; attributes: type, parameters (if any), resolution state (nullified vs applied).
- **Deck / Generator**: Feature deck is finite & shuffled at game start; resource & event draws are virtual infinite (generated per weighting each draw).
- **Competition Requirement**: Pending obligation tied to a player with deadline turn reference.
- **PTO Lock**: Temporal restriction object storing resource reference and release turn.
- **Action Log Entry**: Record of significant events for visibility (type, player, timestamp, summary).

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No unresolved ambiguity markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---

## Resolved Design Decisions
| Topic | Decision | Rationale |
|-------|----------|-----------|
| Player Count | 1–4 players | Supports solo & small-group cooperative focus |
| Turn Definition | One player's full sequence = 1 turn (limit 10) | Aligns with tension pacing described |
| Draw Weighting | 70/30 default; configurable resource weight 0–100 | Facilitates balancing without code change |
| Multiple Completions | Allowed; optional toggle to restrict | Encourages burst strategy while supporting variant |
| Feature Deck Exhaustion | Player may have no feature; play continues | Avoids premature termination, keeps cooperation dynamics |
| RNG Seed | Optional input; generated if omitted; revealed at end | Reproducibility & transparency |
| Action Log | Retain last 100 entries (configurable) | Bounded memory & clarity |
| PTO Trade | Allowed; lock persists to new owner | Strategic flexibility; consistent lock semantics |
| Lost Features | Never re-enter | Maintains penalty weight |
| Accessibility | Color + icon + text labels | Inclusive for color-blind users |
| Concurrency | Sequential processing only | Simplifies MVP, avoids race conditions |
| Configurable Params | Weighting, completion toggle, seed, log size | Focused minimal config surface |
| End Summary Analytics | Outcome, turns, target, totals, per-player stats, trades, events by type, discards, forfeits, seed | Post-game insight & balancing data |
| Modal Handling | Serialized blocking modals | Prevents overlapping decisions |
| Instant Win | Irreversible once achieved | Preserves celebratory finality |
| Feature Supply | Finite shuffled feature deck; infinite virtual resource/event supply | Balance+variety without depletion issues |
| PTO Lock | Persists through trade; unlocks after owner's next turn ends | Predictable timing |
| Contractor Assignment | Declared once per completion attempt | Enforces atomic integrity |
| Unreachable Target | Game continues; no early forced loss | Simple consistent rule set |
