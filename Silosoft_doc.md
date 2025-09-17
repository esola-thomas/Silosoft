# Silosoft: Workplace Simulation Game

## Objective
- Team goal: Complete **3 feature cards per player** within **10 turns** (turn = one player's full draw + action sequence).
- Each player always has exactly **1 active feature card** (draw a new one immediately after completing the current one if within the turn limit).
- **Win (instant)**: As soon as `completedFeaturesTotal >= playerCount * 3` within the 10‑turn limit.
- **Lose**: After the 10th turn ends, if `completedFeaturesTotal < playerCount * 3` (no overtime).

> Terminology: "Turn" is used exclusively; there is no separate round construct in the all‑or‑nothing model.

---

## Components

### 1. Feature Cards
- Each card lists required roles (subset of: Dev, PM, UX) with a **minimum point threshold per role** (e.g., Dev 6, PM 2).
- If a role is not listed, it is not required.
- All requirements must be met **simultaneously** in a single assignment bundle; there is **no partial progress tracking** and no resources remain "assigned" after resolution.
- A feature is completed instantly when a player plays a bundle of resource cards (from their hand only) whose summed points by role meet or exceed every listed role's minimum.
- Excess points over a role's minimum have no additional effect and are ignored (no spillover between roles since completion is atomic).
- After completion: Count the feature toward the team total, discard the used resource cards (or return them to a common discard pile), then the player immediately draws a new feature if turns remain.
- A player may hold at most one active feature at a time.
- Example: *Build Login System: Dev ≥6, UX ≥2.* If the player plays Senior Dev (+3), Junior Dev (+2), Junior Dev (+2), Entry UX (+1), Senior UX (+3) they meet Dev 7 ≥6 and UX 4 ≥2 (excess ignored) → immediate completion.

### 2. Resource Cards
- Roles: **Developer (Dev)**, **Product Manager (PM)**, **UX Designer (UX)**.
- Levels & point values:
  - Senior = 3 points
  - Junior = 2 points
  - Entry = 1 point
- **Contractor**: Wildcard; when used in a bundle it is declared as exactly one role for that bundle and contributes 2 points.
- Resources are only ever used at the moment of feature completion (no persistent assignment). All resources used in a completing bundle leave the player's hand (return to a discard or exhausted pile per implementation).
- A player may attempt at most one feature completion per turn (optional rule: you may allow multiple if they somehow acquire enough resources; default = allow multiple as long as they have resources—specify below if you choose a limitation).

### 3. HR / Event Cards
- Events target only the **drawing player** and resolve immediately when drawn.
- Completed features are never affected retroactively.
- If an event cannot legally resolve (e.g., no resources to discard), it is **nullified** with no effect.
- Event Definitions (all reference only the player's hand, since no persistent assignments exist):
  - **Layoff**: Randomly discard 1 resource from your hand. (If hand empty → nullify.)
  - **Reorg**: Choose 1 resource from your hand and give it to another player's hand (ownership transfers). If no other players or no resources → nullify.
  - **Company Competition**: You must complete at least 1 feature on **your next turn**. If you fail, choose 1 of your completed features to forfeit (remove from team total and place into a "lost" pile). If you have none, instead discard 2 random resources (or as many as you have if <2).
  - **PTO / PLM**: Choose 1 resource in your hand; mark it PTO. A PTO resource cannot be used in a completion bundle on this turn or your next turn; it becomes usable again after your next turn ends. (If no resources → nullify.)

> Optional Variant: Layoff could allow the player to choose the resource (less punitive); current default uses randomness for tension.

---

## Setup
1. Establish virtual decks (or finite shuffled decks) for Feature, Resource, and Event cards. This spec assumes **infinite virtual generation with weighted draw** for Resource vs Event; Feature cards are drawn sequentially from a predefined list or virtual generator.
2. Each player starts with:
  - 1 active Feature Card (face-up / known).
  - 3 Resource Cards.
3. Determine turn order (e.g., each rolls a die; lowest roll goes first; ties reroll). Turn order remains fixed.
4. Initialize counters: `turnNumber = 1`, `completedFeaturesTotal = 0`, clear any pending event timers.

---

## Turn Flow
Each player executes the following steps on their turn (turnNumber increments after completion):

### 1. Draw Phase
- Roll a weighted gate (e.g., d10: 1–7 = Resource, 8–10 = Event).
- If Resource: add 1 resource card to hand.
- If Event: resolve immediately (apply effects, possibly setting a competition timer or marking PTO resources).

### 2. Action Phase
- OPTIONAL Trade: You may initiate **one** trade (including a one‑sided gift) with exactly one other player this turn. Being the recipient of another player's initiated trade does not consume your own initiation.
- OPTIONAL Completion Attempt(s): You may attempt feature completion by selecting a bundle of resource cards from your hand whose summed points per required role meet or exceed the active feature's thresholds. On success: feature completes instantly (see Completion Resolution). You may repeat if you still have resources and wish to (if allowing multiple completions per turn). If implementing a single-completion limit, enforce it here.
- You may also do nothing (pass) if you cannot or choose not to act.

### 3. Completion Resolution (Immediate)
- When you complete a feature:
  - Move the feature to your completed pile; increment `completedFeaturesTotal`.
  - Remove the used resource cards from your hand (discard zone).
  - Draw a new feature (if available and `turnNumber <= 10`).
  - If this resolves a pending Company Competition on you, clear that timer.
  - Check Win Condition (instant).

### 4. Turn End
- Decrement any PTO timers (resources marked PTO become available after the owner's next turn ends).
- If a Company Competition timer on you expires now (you had one and didn't complete a feature this turn): apply its penalty.
- Increment `turnNumber`; if `turnNumber > 10` and win condition not met → Loss.

---

## Collaboration Rules
- Collaboration happens through trades/gifts before attempting a completion. There is no shared assignment since completion is atomic.

---

## Scoring & Win Condition
- Target = `playerCount * 3` completed features.
- Instant Win: Reached or exceeded target on any completion during turns 1–10.
- Loss: After the 10th turn ends without reaching target.
- Track per-player completed count only for analytics; only the team total matters for victory.

---

## Determinism & Randomness (Implementation Guidance)
- All random operations (weighted draw, random discards) SHOULD use a seedable RNG stored as `rngSeed` in game state for reproducible simulations.
- Weighted draw gate: default 70% Resource / 30% Event; adjust via configuration if balancing later.
- Events that select resources randomly draw uniformly among eligible cards.

## Data Model Sketch (Non-Normative)
```
GameState {
  turnNumber: number,
  turnLimit: 10,
  playerCount: number,
  completedFeaturesTotal: number,
  players: [ { id, hand: ResourceCard[], completed: FeatureId[], activeFeature: FeatureCard, competitionDeadlineTurn?: number, pto: { resourceId: string, availableOnTurn: number }[] } ],
  rngSeed: string
}
```

## Action Summary
- draw -> (resource|event)
- trade(fromPlayer,toPlayer,offered[],requested[])
- complete(featureId, resourceIds[])
- pass

Errors / invalid actions should be rejected without mutating state.

---

### Digital Hackathon MVP
- **Frontend**:
  - Deck display (Feature + Event cards).
  - Player hand (Resources).
  - Shared board (Features in progress).
- **Backend**:
  - State machine for turns, card draws, resource assignments.

---

## Frontend UI (High-Level Overview)

### Layout Regions
1. Header: Turn X / 10, Team Progress (Completed / Target), Active Player highlight, optional Competition warning icon.
2. Board: Row or grid showing each player's current feature (title + required role points). Active player slightly emphasized.
3. Hand Panel (bottom): Local player’s resource cards and action buttons (Trade, Complete, Pass). PTO cards show a lock icon.
4. Sidebar / Log (optional): Recent events (last few lines) and timers (Competition, PTO summary) or collapsible on mobile.

### Interaction Flow (Per Turn)
1. Auto draw (resource into hand or event modal).
2. Resolve event immediately (pick resource, transfer, mark PTO, etc.).
3. Optionally initiate one trade (or gift) with another player.
4. Attempt feature completion by selecting a bundle that satisfies all role thresholds (atomic).
5. On success: feature card flips to completed state, new feature appears if turns remain, progress updates; check for instant win.
6. Pass ends turn if no action remains.

### Core Components (Conceptual)
- HeaderBar
- FeatureBoard (contains PlayerFeatureCard[])
- PlayerFeatureCard
- HandPanel (Card, ContractorRolePicker inline if needed)
- ActionButtons (Trade, Complete, Pass)
- EventModal (contextual to event type)
- TradeModal (simple select + confirm)
- CompletionDialog (multi-select of cards + validate)
- LogPanel (compact feed)

### Visual Cues
- Role colors: Dev (Blue), PM (Green), UX (Purple), Contractor (Gold).
- Active player border glow; competition timer as small countdown chip.
- PTO: dim card + lock icon + tooltip “Unavailable until after your next turn”.
- Completion: brief pulse + success toast.

### Accessibility (Essentials)
- All actions reachable via buttons (no drag required).
- Modal focus trap with ESC to close (when cancelable).
- Icons always paired with text or tooltip for color-blind clarity.

### Client State (Minimal)
```
game: { turnNumber, turnLimit:10, target, completedTotal, activePlayerId, players:[{id, feature:{id, requirements}, completedCount}], timers:{ competitionByPlayer? } }
hand: ResourceCard[]
pto: { resourceId, availableOnTurn }[]
ui: { modal: null|'event'|'trade'|'complete' }
log: LogEntry[] (capped)
```

### Event Handling (UI)
- Layoff: auto pick random card → toast.
- Reorg: picker modal (select card + recipient) → confirm.
- Competition: show timer chip until resolved or penalty triggered.
- PTO: card lock overlay + countdown; cannot include in completion selection.

### Keep It Simple (MVP Boundaries)
- No animated random selection beyond a quick fade.
- No persistent assignment UI (atomic completion only).
- No advanced analytics or replay yet.

This high-level summary should guide an initial scaffold without over-specifying animations or deep implementation details.