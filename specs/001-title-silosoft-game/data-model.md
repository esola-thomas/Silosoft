# Data Model: Silosoft Game Core Mechanics

## Entities

### Game
Fields:
- id (string)
- turnNumber (int)
- turnLimit (int = 10)
- playerCount (int 1–4)
- targetFeatures (int = playerCount * 3)
- completedFeaturesTotal (int)
- featureDeck (FeatureCard[] remaining)
- rngSeed (string)
- config { resourceWeight:int, singleCompletionPerTurn:bool, logRetention:int }
- log (ActionLogEntry[] capped)
- status ("in-progress" | "won" | "lost")

### Player
Fields:
- id (string)
- hand (ResourceCard[])
- activeFeature (FeatureCard | null)
- completed (FeatureCard[])
- lost (FeatureCard[])
- competitionDeadlineTurn (int | null)
- ptoLocks (PtoLock[])
- tradesInitiated (int cumulative)

### FeatureCard
Fields:
- id (string)
- title (string)
- requirements: { Dev?:int, PM?:int, UX?:int }

### ResourceCard
Fields:
- id (string)
- role ("Dev" | "PM" | "UX" | "Contractor")
- level ("Senior" | "Junior" | "Entry" | null for Contractor)
- points (int)
- ptoUntilTurn (int | null)

### Event (Drawn effect)
Fields:
- type ("Layoff" | "Reorg" | "Competition" | "PTO")
- metadata (object)

### ActionLogEntry
Fields:
- id (string)
- timestamp (ISO)
- type ("DRAW"|"EVENT"|"COMPLETE"|"TRADE"|"PENALTY"|"WIN"|"LOSS")
- playerId (string|null)
- detail (object)

### PtoLock
Fields:
- resourceId (string)
- availableOnTurn (int)

## Relationships
- Game has many Players.
- Player has one activeFeature (or null) and multiple completed / lost features.
- FeatureCard instances move from deck → activeFeature → completed or lost.
- ResourceCards exist only in hands then discard (implicit) post completion/event.

## Validation Rules
- Hand resources used in completion must collectively meet each requirement threshold exactly or exceed (excess ignored).
- No partial progress stored per feature.
- PTO-locked resource cannot be used if turnNumber <= ptoUntilTurn.
- Competition penalty triggers only at end of required turn if no completion occurred.
- Trades limited to one initiation per player turn.

## State Transitions (High-Level)
- startGame → draw initial hands & features
- startTurn(player) → draw card (resource/event) → apply event if any
- actionPhase → (optional trade) → (0..N completions) → pass
- completion → update totals, check win
- endTurn → resolve PTO expirations & competition penalty → increment turnNumber → check loss

## Invariants
- completedFeaturesTotal = sum(players.completed.length) - sum(players.lost.length)
- turnNumber in [1, turnLimit] while status = in-progress
- status won implies completedFeaturesTotal >= targetFeatures
- status lost implies turnNumber > turnLimit and not won

## Derived Values
- remainingTurns = turnLimit - turnNumber + 1
- reachableTarget heuristic (optional future) not used for termination.

## OpenAPI Schema References
Defined in contracts folder (see `contracts/openapi.yaml`).
