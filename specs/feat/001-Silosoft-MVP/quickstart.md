# Quickstart: Silosoft Card Game

**Purpose**: End-to-end validation that the game works as designed
**Duration**: ~10 minutes to complete full test cycle
**Prerequisites**: Game implementation complete with API and frontend

## Setup Test

### 1. Initialize New Game
```bash
curl -X POST http://localhost:3001/api/v1/games \
  -H "Content-Type: application/json" \
  -d '{"playerNames": ["Alice", "Bob", "Charlie"]}'
```

**Expected Result**:
- HTTP 201 Created response
- Game ID returned
- 3 players created with empty hands
- Deck contains 50 cards (15 features, 27 resources, 8 events)
- Current round = 1, current player = 0 (Alice)

### 2. Initial Card Deal
```bash
# Each player should receive starting cards automatically
curl -X GET http://localhost:3001/api/v1/games/{gameId}
```

**Expected Result**:
- Each player has 1 feature card + resource cards in hand
- Deck reduced by cards dealt
- Game phase = "playing"

## Core Gameplay Test

### 3. Turn 1 - Alice Draws Card
```bash
curl -X POST http://localhost:3001/api/v1/games/{gameId}/actions/draw \
  -H "Content-Type: application/json" \
  -d '{"playerId": "alice-id"}'
```

**Expected Result**:
- Alice receives 1 card from deck
- Deck size reduced by 1
- Card added to Alice's hand

### 4. Resource Assignment
```bash
curl -X POST http://localhost:3001/api/v1/games/{gameId}/actions/assign \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "alice-id",
    "resourceId": "r1",
    "featureId": "f1"
  }'
```

**Expected Result**:
- Resource card assigned to feature
- If requirements met: feature completed, points awarded
- Resource card marked as assigned

### 5. End Turn
```bash
curl -X POST http://localhost:3001/api/v1/games/{gameId}/actions/end-turn \
  -H "Content-Type: application/json" \
  -d '{"playerId": "alice-id"}'
```

**Expected Result**:
- Current player index advances to 1 (Bob)
- Turn counter increments
- Alice can no longer take actions

## Event Handling Test

### 6. Event Card Trigger
When an event card is drawn during normal gameplay:

**Layoff Event**:
- Random resource card removed from current player
- Removed card goes to discard pile
- Player hand size reduced

**PTO Event**:
- Player chooses resource to make unavailable
- Resource marked with unavailableUntil = currentRound + 2
- Resource cannot be assigned while unavailable

**Competition Event**:
- Player has 1.5 rounds to complete any feature
- Success: +2 points bonus
- Failure: -3 points penalty

## Win Condition Test

### 7. Complete All Features
Continue gameplay until either:
- All feature cards are completed (team wins)
- Round 10 completes with features remaining (team loses)

**Team Win Expected**:
- Game phase changes to "ended"
- winCondition = true
- Final scores calculated with bonuses

**Team Loss Expected**:
- Game phase changes to "ended"
- winCondition = false
- Round counter = 11

## Performance Validation

### 8. Load Time Test
```bash
time curl -X GET http://localhost:3001/api/v1/games/{gameId}
```

**Expected Result**:
- Response time < 200ms
- Complete game state returned
- No timeout errors

### 9. Full Game Cycle
Run complete 10-round game with 4 players:

**Expected Result**:
- Total time < 5 minutes for simulated play
- No memory leaks or performance degradation
- Consistent response times throughout

## Error Handling Test

### 10. Invalid Actions
```bash
# Try to draw when not your turn
curl -X POST http://localhost:3001/api/v1/games/{gameId}/actions/draw \
  -H "Content-Type: application/json" \
  -d '{"playerId": "bob-id"}'
```

**Expected Result**:
- HTTP 400 Bad Request
- Clear error message: "Not your turn"
- Game state unchanged

### 11. Empty Deck Scenario
Continue playing until deck is empty, then attempt draw:

**Expected Result**:
- Graceful handling of empty deck
- Game continues with existing cards
- No crashes or undefined behavior

## Frontend Integration Test

### 12. UI State Sync
Open game in browser and verify:
- Game state displays correctly
- Card assignments work via drag/drop or buttons
- Real-time updates reflect backend changes
- Error messages display clearly

### 13. Multiplayer Sync (if implemented)
Open game in multiple browser tabs:
- Actions in one tab reflect in others
- Turn order enforced across clients
- No race conditions or state conflicts

## Success Criteria

✅ **All API endpoints respond correctly**
✅ **Game rules enforced properly**
✅ **Win/loss conditions trigger accurately**
✅ **Event cards have proper effects**
✅ **Performance meets constitutional requirements**
✅ **Error handling prevents crashes**
✅ **UI accurately reflects game state**

## Common Issues & Debugging

### Card Assignment Failures
- Check resource availability (not already assigned)
- Verify resource type matches feature requirements
- Confirm it's the correct player's turn

### State Sync Issues
- Verify WebSocket connections (if using real-time)
- Check for network timeouts
- Validate JSON schema on all requests

### Performance Problems
- Monitor memory usage during long games
- Check for resource leaks in card data
- Validate database/file I/O efficiency

---
**Quickstart Complete**: Ready for development validation testing