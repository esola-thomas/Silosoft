# Silosoft Constitution

## Core Principles

### I. Game-First

Every decision must support the goal of building a **fully functional, playable digital game**. All features are evaluated on whether they directly improve playability, clarity, or player experience.

### II. Simplicity & Speed

Prioritize **simple mechanics and fast iteration**. Implement the minimum viable game loop (draw, assign resources, resolve, win/lose) first, then expand. Avoid scope creep during hackathon build.

### III. Test-First (Non-Negotiable)

Each mechanic must be **playable and testable as soon as it is built**. The game must always run end-to-end, even if some features are placeholders. Bugs in the core loop block progress until resolved.

### IV. Collaboration Over Competition

Silosoft simulates workplace collaboration. Game mechanics, code structure, and workflow should mirror this—team members must align, share responsibilities, and iterate transparently.

### V. Observability & Debuggability

The digital version must provide **clear state visibility**: current round, cards in play, resources assigned, and pending actions. Logs or debug views should make playtesting quick and frictionless.

---

## Technical Constraints

1. **Technology Stack**

   * **Frontend**: React (minimal UI, card drag/drop or button actions).
   * **Backend**: Node.js/Express or Python (FastAPI/Flask).
   * **State Management**: Simple state machine (deck, rounds, players).
   * **Data Source**: JSON files for card definitions (Feature, Resource, Event).

2. **Performance Standards**

   * Must support a full game cycle (10 rounds) in < 5 minutes.
   * Load time < 5 seconds.
   * Single-player mode mandatory; multiplayer is a stretch goal.

3. **Security & Stability**

   * No sensitive data.
   * Fail gracefully: invalid moves or empty decks should not crash game state.

---

## Development Workflow

1. **Phases**

   * **MVP**: Core loop (draw, assign, resolve, win/lose).
   * **Beta**: UI polish, event card diversity, end screen summaries.
   * **Production**: Multiplayer support, expansion packs, difficulty levels.

2. **Code Reviews & Quality Gates**

   * Every pull request must include a playable demo.
   * Deck/card changes require schema validation.
   * No merging if game loop is broken.

3. **Testing**

   * Unit tests for card resolution logic.
   * Integration test for full 10-round playthrough.
   * Manual playtest feedback after each sprint.

---

## Governance

* This constitution **supersedes ad-hoc feature requests**.
* Amendments require:

  * Documenting the change.
  * Explaining its necessity for playability or adoption.
  * Approval by project lead or team consensus.
* Complexity must always be justified against hackathon timeline.

---

**Version**: 1.0.0 | **Ratified**: 2025-09-15 | **Last Amended**: 2025-09-15

---
