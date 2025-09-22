---

## Thematic Feature Catalog (Microsoft-Style Deck)

The numeric placeholder features have been replaced by a curated set of 30 thematic features reflecting common Microsoft cloud & productivity scenarios. Total points roughly map to difficulty (3–7). Multi-role features skew higher; three-role cards usually land at 6–7.

| ID  | Name                                 | Description (≤ 80 chars)                                       | DEV | PM | UX | Total |
|-----|--------------------------------------|-----------------------------------------------------------------|-----|----|----|-------|
| F1  | Azure AD Single Sign-On              | Enable tenant SSO via OpenID Connect                            | 3   | 2  | -  | 5     |
| F2  | Teams Presence Sync                  | Real-time presence across clients                               | 3   | 2  | 1  | 6     |
| F3  | Outlook Add-in Compose Pane          | Add-in panel for AI assisted replies                            | 3   | -  | 1  | 4     |
| F4  | SharePoint Document Version Diff     | Visual diff of major document revisions                         | 4   | 2  | 1  | 7     |
| F5  | OneDrive Offline Sync Optimization   | Smarter chunking reduces conflicts                              | 4   | 1  | -  | 5     |
| F6  | Teams Meeting Live Reactions         | Animated accessible emoji reaction stream                       | 3   | 1  | 2  | 6     |
| F7  | Azure Cost Anomaly Alerting          | Detect & notify spend spikes                                    | 3   | 2  | -  | 5     |
| F8  | Power BI Dark Theme Polish           | Improve contrast token mapping                                  | 2   | -  | 2  | 4     |
| F9  | M365 Unified Search Autosuggest      | Cross-product query suggestions                                 | 4   | 2  | 1  | 7     |
| F10 | Azure Functions Cold Start Reduction | Warm pool for premium functions                                 | 5   | 1  | -  | 6     |
| F11 | Teams Channel Archive Restore        | Self-service channel restore flow                               | 3   | 2  | -  | 5     |
| F12 | Intune Device Compliance Badge       | Device health indicator in portal                               | 2   | 1  | 1  | 4     |
| F13 | Azure Monitor Query Snippets         | Reusable tagged Kusto snippets                                  | 3   | 2  | -  | 5     |
| F14 | Outlook Calendar Focus Time Block    | Auto-insert focus based on meeting load                         | 3   | 2  | 1  | 6     |
| F15 | Edge Collections Sharing             | Share and collaborate on tab groups                             | 3   | 1  | 1  | 5     |
| F16 | Azure DevOps Sprint Burnup Chart     | Burnup visualization widget                                     | 2   | 2  | -  | 4     |
| F17 | Teams Adaptive Background Blur       | Dynamic blur tuned to motion & light                            | 4   | 1  | 2  | 7     |
| F18 | SharePoint Inline Image OCR          | Extract text for indexing                                       | 4   | 2  | -  | 6     |
| F19 | Azure Portal Keyboard Shortcuts      | Global resource navigation shortcuts                            | 2   | 1  | 2  | 5     |
| F20 | Teams Poll Template Library          | Pre-built poll templates                                        | 2   | 2  | -  | 4     |
| F21 | OneDrive Link Expiration Policy      | Policy UI for mandatory expirations                             | 3   | 2  | -  | 5     |
| F22 | PowerPoint Live Co-Author Pointer    | Show collaborator pointer live                                  | 3   | 1  | 2  | 6     |
| F23 | Azure Role Assignment Audit Export   | Scheduled RBAC diff export                                      | 3   | 2  | -  | 5     |
| F24 | Defender Threat Timeline Zoom        | Zoomable incident progression                                   | 4   | 1  | 2  | 7     |
| F25 | Teams Message Pinning v2             | Multiple ordered pin slots                                      | 3   | 1  | -  | 4     |
| F26 | Azure Backup Restore Progress UI     | Show progress & ETA for restores                                | 3   | 1  | 1  | 5     |
| F27 | M365 Data Residency Report           | Export geo storage locations                                    | 2   | 3  | -  | 5     |
| F28 | Teams Emoji Skin Tone Memory         | Persist last selected tone                                      | 2   | -  | 1  | 3     |
| F29 | Outlook Mobile Attachment Quick Save | One-tap save to recent folder                                   | 3   | -  | 1  | 4     |
| F30 | Azure Policy Drift Detection         | Detect & flag resource config drift                             | 4   | 2  | -  | 6     |

Balancing notes:
- Mixed 1, 2, 3-role distribution encourages collaboration & resource diversity.
- High difficulty (≥7) requires either three roles or heavy DEV commitment.
- UX appears selectively to keep its scarcity strategically meaningful.

Implementation notes:
- Backend deck now returns this catalog unless a legacy `size` override is provided.
- `FeatureCard.description` (≤140 chars) added & surfaced in serializers and UI.
- Frontend `PlayerFeatureCard` displays description under the title.

Future extensions:
- Add categories (Collaboration, Security, Performance) for event synergies.
- Introduce rare epics (Σ 8) plus special scoring modifiers.

---

## End-Game Visual Polish (Win / Defeat Modal)

The end-game summary modal has been upgraded for clarity, celebration, and accessibility:

Enhancements:
- Distinct visual theming for Victory vs Defeat (gradient surfaces, accent overlays).
- Lightweight CSS confetti (respecting `prefers-reduced-motion` & custom `data-motion='off'`).
- Animated metric cards with progress bars for Completed vs Target and Turn consumption.
- Player performance table now highlights top performers (★) based on highest completed OR highest score (ties honored).
- Accessible structure: ARIA labels on sections, consistent heading, semantic table headers.
- Buttons upgraded to primary / outline styling for visual hierarchy.

Tech Notes:
- Confetti bits generated in React state (up to 42) and rely on pure CSS fall animation.
- Reduced motion: confetti suppressed & defeat pulse simplified.
- Added new CSS classes: `.endgame-modal`, `.endgame-metrics`, `.metric*`, `.confetti-layer`, `.players-breakdown .top-performer`.
- No change to existing test selectors (heading text & button labels preserved) so prior tests remain valid.

Potential future polish:
- Add shareable summary export (image or markdown snapshot).
- Add per-player efficiency stat (completed / turns taken) and average points per completion.
- Provide quick “Play Again with Tweaked Config” flow (inline editable multiplier & turns).
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
  - **Layoff**: Discard 1 resource from your hand. (If hand empty → nullify.) In the interactive digital version you now choose the specific card to discard; if you do not choose, a random fallback may be applied server‑side (tests still allow random behavior when no selection supplied).
  - **Reorg**: Move exactly 1 resource from your hand to a different player's hand. You now choose both the card and the destination player (if you omit choices the server falls back to random selection). (If single player or you have no resources → nullify.)
  - **Company Competition**: Sets a personal challenge: you must complete at least one feature on your *next* turn (the turn after it was drawn). If the deadline turn ends without any completion, apply a penalty: remove your most recently completed feature (if any) else discard up to 2 random resource cards. Either completing any feature during the challenge window or suffering the penalty clears the challenge.
  - **PTO / PLM**: Lock exactly 1 resource card in your hand; that card cannot be used for completion until after your *next* turn ends (`availableOnTurn = currentTurn + 2`). You now explicitly select which card to lock (fallback to random if omitted). If no resources → nullify. Multiple PTO locks may stack across different draws.

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
- Unlock PTO card locks whose `availableOnTurn <= current turn` (card becomes usable again).
- If a Company Competition challenge on you reaches its deadline turn end without a completion: apply its penalty (remove last completed feature or discard two resources) and clear the challenge.
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
1. Header: Turn X / 10, Team Progress (Completed / Target), Active Player highlight, per-player Competition challenge countdown chips (CH:PlayerId:Remaining), replay export button.
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
- PTO: dim card + lock icon + tooltip “Unavailable until after your next turn”. Now chosen card highlighted at event resolution.
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
- Layoff: modal now lists your resource cards allowing selection; acknowledging applies discard.
- Reorg: modal shows your resource cards and target player buttons; you must pick card + target to enable acknowledge.
- Competition: still passive (just sets per‑player challenge countdown chip) – acknowledgment only.
- PTO: modal lists cards for selection; selected card becomes locked and displays lock overlay (LOCK:n) until usable again.

### Keep It Simple (MVP Boundaries)
- No animated random selection beyond a quick fade.
- No persistent assignment UI (atomic completion only).
- No advanced analytics or replay yet.
 - Added lightweight replay export (JSON) for logs + seed; no in-app playback yet.

This high-level summary should guide an initial scaffold without over-specifying animations or deep implementation details.
\n+---\n+\n+## Thematic Feature Catalog (Microsoft-Style Deck)\n+\n+The numeric placeholder features have been replaced by a curated set of 30 thematic features reflecting common Microsoft cloud & productivity scenarios. Total points roughly map to difficulty (3–7). Multi-role features skew higher; three-role cards usually land at 6–7.\n+\n+| ID  | Name                                 | Description (≤ 80 chars)                                       | DEV | PM | UX | Total |\n+|-----|--------------------------------------|-----------------------------------------------------------------|-----|----|----|-------|\n+| F1  | Azure AD Single Sign-On              | Enable tenant SSO via OpenID Connect                            | 3   | 2  | -  | 5     |\n+| F2  | Teams Presence Sync                  | Real-time presence across clients                               | 3   | 2  | 1  | 6     |\n+| F3  | Outlook Add-in Compose Pane          | Add-in panel for AI assisted replies                            | 3   | -  | 1  | 4     |\n+| F4  | SharePoint Document Version Diff     | Visual diff of major document revisions                         | 4   | 2  | 1  | 7     |\n+| F5  | OneDrive Offline Sync Optimization   | Smarter chunking reduces conflicts                              | 4   | 1  | -  | 5     |\n+| F6  | Teams Meeting Live Reactions         | Animated accessible emoji reaction stream                       | 3   | 1  | 2  | 6     |\n+| F7  | Azure Cost Anomaly Alerting          | Detect & notify spend spikes                                    | 3   | 2  | -  | 5     |\n+| F8  | Power BI Dark Theme Polish           | Improve contrast token mapping                                  | 2   | -  | 2  | 4     |\n+| F9  | M365 Unified Search Autosuggest      | Cross-product query suggestions                                 | 4   | 2  | 1  | 7     |\n+| F10 | Azure Functions Cold Start Reduction | Warm pool for premium functions                                 | 5   | 1  | -  | 6     |\n+| F11 | Teams Channel Archive Restore        | Self-service channel restore flow                               | 3   | 2  | -  | 5     |\n+| F12 | Intune Device Compliance Badge       | Device health indicator in portal                               | 2   | 1  | 1  | 4     |\n+| F13 | Azure Monitor Query Snippets         | Reusable tagged Kusto snippets                                  | 3   | 2  | -  | 5     |\n+| F14 | Outlook Calendar Focus Time Block    | Auto-insert focus based on meeting load                         | 3   | 2  | 1  | 6     |\n+| F15 | Edge Collections Sharing             | Share and collaborate on tab groups                             | 3   | 1  | 1  | 5     |\n+| F16 | Azure DevOps Sprint Burnup Chart     | Burnup visualization widget                                     | 2   | 2  | -  | 4     |\n+| F17 | Teams Adaptive Background Blur       | Dynamic blur tuned to motion & light                            | 4   | 1  | 2  | 7     |\n+| F18 | SharePoint Inline Image OCR          | Extract text for indexing                                       | 4   | 2  | -  | 6     |\n+| F19 | Azure Portal Keyboard Shortcuts      | Global resource navigation shortcuts                            | 2   | 1  | 2  | 5     |\n+| F20 | Teams Poll Template Library          | Pre-built poll templates                                        | 2   | 2  | -  | 4     |\n+| F21 | OneDrive Link Expiration Policy      | Policy UI for mandatory expirations                             | 3   | 2  | -  | 5     |\n+| F22 | PowerPoint Live Co-Author Pointer    | Show collaborator pointer live                                  | 3   | 1  | 2  | 6     |\n+| F23 | Azure Role Assignment Audit Export   | Scheduled RBAC diff export                                      | 3   | 2  | -  | 5     |\n+| F24 | Defender Threat Timeline Zoom        | Zoomable incident progression                                   | 4   | 1  | 2  | 7     |\n+| F25 | Teams Message Pinning v2             | Multiple ordered pin slots                                      | 3   | 1  | -  | 4     |\n+| F26 | Azure Backup Restore Progress UI     | Show progress & ETA for restores                                | 3   | 1  | 1  | 5     |\n+| F27 | M365 Data Residency Report           | Export geo storage locations                                    | 2   | 3  | -  | 5     |\n+| F28 | Teams Emoji Skin Tone Memory         | Persist last selected tone                                      | 2   | -  | 1  | 3     |\n+| F29 | Outlook Mobile Attachment Quick Save | One-tap save to recent folder                                   | 3   | -  | 1  | 4     |\n+| F30 | Azure Policy Drift Detection         | Detect & flag resource config drift                             | 4   | 2  | -  | 6     |\n+\n+Balancing notes:\n+- Mixed 1, 2, 3-role distribution encourages collaboration & resource diversity.\n+- High difficulty (≥7) requires either three roles or heavy DEV commitment.\n+- UX appears selectively to keep its scarcity strategically meaningful.\n+\n+Implementation notes:\n+- Backend deck now returns this catalog unless a legacy `size` override is provided.\n+- `FeatureCard.description` (≤140 chars) added & surfaced in serializers and UI.\n+- Frontend `PlayerFeatureCard` displays description under the title.\n+\n+Future extensions:\n+- Add categories (Collaboration, Security, Performance) for event synergies.\n+- Introduce rare epics (Σ 8) plus special scoring modifiers.\n*** End Patch