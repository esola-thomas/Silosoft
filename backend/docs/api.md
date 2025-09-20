# Silosoft Card Game API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL & Authentication](#base-url--authentication)
- [Security & CORS](#security--cors)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Reference](#api-reference)
  - [Game Management](#game-management)
  - [Game Actions](#game-actions)
  - [Health Check](#health-check)
- [Data Models](#data-models)
- [Complete Usage Examples](#complete-usage-examples)
- [Testing & Debugging](#testing--debugging)

---

## Overview

The Silosoft Card Game API is a RESTful service that powers a cooperative workplace card game where 2-4 players work together to complete software features before running out of rounds. The API handles game state management, card mechanics, turn-based gameplay, and scoring.

### Key Features
- Real-time game state management
- Turn-based multiplayer support (2-4 players)
- Card mechanics (draw, assign, discard)
- Automatic scoring and win condition tracking
- Comprehensive error handling

### API Version
Current Version: `1.0.0`

---

## Base URL & Authentication

### Development Server
```
Base URL: http://localhost:3001/api/v1
```

### Production Server
```
Base URL: https://api.silosoft.com/v1
```

### Authentication
Currently, the API does not require authentication. Future versions may implement JWT-based authentication for persistent player profiles and game history.

### Headers
All requests must include:
```http
Content-Type: application/json
Accept: application/json
```

---

## Security & CORS

### CORS Configuration

#### Development Environment
In development, CORS allows all origins for easier testing:
- Allowed Origins: `*` (all origins)
- Credentials: `true` (cookies and auth headers allowed)
- Methods: `GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH`

#### Production Environment
Production uses strict CORS policies:
```javascript
Allowed Origins:
- http://localhost:3000 (development fallback)
- https://silosoft.com (production frontend)
- Environment-specific URLs via FRONTEND_URL
```

#### CORS Headers Example
```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Security Headers

The API implements comprehensive security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

In production with HTTPS:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Input Validation

All API endpoints validate input against OpenAPI 3.0 schemas:
- Player names: Non-empty strings, 2-4 players required
- Game IDs: Valid UUID format
- Player IDs: Valid UUID format matching existing players
- Card IDs: Valid format matching existing cards

### Best Practices for Security

1. **Never trust client input** - All data is validated server-side
2. **Use HTTPS in production** - Encrypt data in transit
3. **Implement rate limiting** - Prevent abuse and DDoS
4. **Sanitize error messages** - Don't expose internal details
5. **Log security events** - Monitor for suspicious activity

---

## Error Handling

### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": "Error Type",
  "message": "Detailed error description",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Status Code | Meaning | Common Scenarios |
|------------|---------|-----------------|
| 200 | OK | Successful GET, PUT, or action |
| 201 | Created | New game created successfully |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, game rules violation |
| 404 | Not Found | Game or resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

### Error Codes and Messages

#### Game Management Errors
```json
{
  "error": "Bad Request",
  "message": "Must have 2-4 players",
  "code": "INVALID_PLAYER_COUNT"
}

{
  "error": "Not Found",
  "message": "Game game-123 not found",
  "code": "GAME_NOT_FOUND"
}
```

#### Turn-Based Errors
```json
{
  "error": "Bad Request",
  "message": "Not your turn",
  "code": "INVALID_TURN"
}

{
  "error": "Bad Request",
  "message": "Game is over",
  "code": "GAME_OVER"
}
```

#### Card Action Errors
```json
{
  "error": "Bad Request",
  "message": "Deck is empty",
  "code": "EMPTY_DECK"
}

{
  "error": "Bad Request",
  "message": "Player hand is full (max 7 cards)",
  "code": "HAND_FULL"
}

{
  "error": "Bad Request",
  "message": "Resource already assigned",
  "code": "RESOURCE_ASSIGNED"
}

{
  "error": "Bad Request",
  "message": "Resource is temporarily unavailable",
  "code": "RESOURCE_UNAVAILABLE"
}
```

### Client-Side Error Handling

#### JavaScript/React Example
```javascript
async function createGame(playerNames) {
  try {
    const response = await fetch('http://localhost:3001/api/v1/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerNames })
    });

    if (!response.ok) {
      const error = await response.json();

      switch(error.code) {
        case 'INVALID_PLAYER_COUNT':
          alert('Please select 2-4 players');
          break;
        case 'INVALID_TURN':
          alert('Please wait for your turn');
          break;
        default:
          console.error('API Error:', error.message);
      }
      return null;
    }

    return await response.json();
  } catch (networkError) {
    console.error('Network error:', networkError);
    alert('Unable to connect to game server');
  }
}
```

---

## Rate Limiting

### Current Implementation
Rate limiting is not currently implemented but recommended for production.

### Recommended Limits
```
Per IP Address:
- 100 requests per minute for game actions
- 10 requests per minute for game creation
- 1000 requests per hour total

Per Game Session:
- 60 actions per minute
- 500 actions per hour
```

### Rate Limit Headers
When implemented, the API will return:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## API Reference

### Game Management

#### Create New Game

**POST** `/api/v1/games`

Creates a new game session with 2-4 players.

**Request Body:**
```json
{
  "playerNames": ["Alice", "Bob", "Charlie"]
}
```

**Response (201 Created):**
```json
{
  "id": "game-uuid-123",
  "players": [
    {
      "id": "player-1",
      "name": "Alice",
      "hand": [
        {
          "id": "f01",
          "cardType": "feature",
          "name": "User Login",
          "description": "Basic authentication system",
          "requirements": { "dev": 2, "pm": 1, "ux": 0 },
          "points": 3,
          "assignedResources": [],
          "completed": false
        },
        {
          "id": "r15",
          "cardType": "resource",
          "role": "dev",
          "level": "senior",
          "value": 3,
          "assignedTo": null,
          "unavailableUntil": null
        }
      ],
      "score": 0,
      "temporarilyUnavailable": [],
      "joinCode": "Q8Z4M1",
      "isConnected": false,
      "isReady": false
    },
    {
      "id": "player-2",
      "name": "Bob",
      "hand": [],
      "score": 0,
      "temporarilyUnavailable": [],
      "joinCode": "D3K7LP",
      "isConnected": false,
      "isReady": false
    }
  ],
  "gamePhase": "lobby",
  "currentRound": 1,
  "currentPlayerIndex": 0,
  "currentPlayerId": "player-1",
  "featuresInPlay": [],
  "featureBacklog": [],
  "deckSize": 35,
  "maxRounds": 10,
  "winCondition": false,
  "isGameOver": false,
  "lastAction": {
    "type": "game_created",
    "timestamp": "2024-01-15T10:00:00Z"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid player configuration
- `500 Internal Server Error` - Server error

---

#### Get Game State

**GET** `/api/v1/games/{gameId}`

Retrieves the current state of a game.

**Path Parameters:**
- `gameId` (string, required): The unique game identifier

**Query Parameters (optional):**
- `includeJoinCodes` (boolean): When `true`, the response includes per-player join codes and lobby readiness metadata.

**Response (200 OK):**
```json
{
  "id": "game-uuid-123",
  "players": [
    {
      "id": "player-1",
      "name": "Alice",
      "hand": [/* ... */],
      "score": 6,
      "temporarilyUnavailable": [],
      "joinCode": "Q8Z4M1",
      "isConnected": true,
      "isReady": false
    }
  ],
  "gamePhase": "playing",
  "currentRound": 3,
  "currentPlayerIndex": 1,
  "currentPlayer": {
    "id": "player-2",
    "name": "Bob",
    "hand": [/* ... */]
  },
  "featuresInPlay": [
    {
      "id": "f04",
      "cardType": "feature",
      "name": "Dashboard",
      "requirements": { "dev": 3, "pm": 2, "ux": 2 },
      "points": 5,
      "assignedResources": [
        {
          "id": "r10",
          "role": "dev",
          "level": "senior",
          "value": 3
        }
      ],
      "completed": false
    }
  ],
  "featureBacklog": [/* queued features waiting for a slot */],
  "deckSize": 28,
  "discardPileSize": 7,
  "maxRounds": 10,
  "winCondition": false,
  "isGameOver": false,
  "lastAction": "Player Bob drew a card",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

#### Join Game Lobby

**POST** `/api/v1/games/{gameId}/join`

Claims a seat in the lobby using a join code or reconnects an existing player session using a stored player token.

**Request Body (Join with code):**
```json
{
  "joinCode": "Q8Z4M1"
}
```

**Request Body (Reconnect with token):**
```json
{
  "playerId": "player-1",
  "playerToken": "8d2a4c52-b94c-4c2b-9c24-ef50779c4ad0"
}
```

**Response (200 OK):**
```json
{
  "playerId": "player-1",
  "playerName": "Alice",
  "playerToken": "8d2a4c52-b94c-4c2b-9c24-ef50779c4ad0",
  "gameState": {
    "id": "game-uuid-123",
    "players": [/* ... */],
    "gamePhase": "lobby",
    "currentRound": 1,
    "currentPlayerIndex": 0
  }
}
```

**Common Errors:**
- `400 Bad Request` — Missing join code or token
- `401 Unauthorized` — Invalid session token
- `404 Not Found` — Game or join code not found

---

#### Set Player Ready State

**POST** `/api/v1/games/{gameId}/ready`

Marks the authenticated player as ready (or not ready) while the game is in the lobby phase. Once all connected players are ready the game will start automatically.

**Request Body:**
```json
{
  "playerId": "player-1",
  "playerToken": "8d2a4c52-b94c-4c2b-9c24-ef50779c4ad0",
  "isReady": true
}
```

**Response (200 OK):** Updated game state reflecting the new readiness status.

**Common Errors:**
- `400 Bad Request` — Invalid or missing payload
- `401 Unauthorized` — Session token mismatch
- `409 Conflict` — Game already started or ended

---

#### Start Game

**POST** `/api/v1/games/{gameId}/start`

Starts the game once all players have joined and are ready. This endpoint is optional—games will auto-start when everyone is ready, but hosts can call it to enforce a manual start.

**Request Body:**
```json
{
  "playerId": "player-1",
  "playerToken": "8d2a4c52-b94c-4c2b-9c24-ef50779c4ad0"
}
```

**Response (200 OK):** Updated game state with `gamePhase` set to `playing`.

**Common Errors:**
- `401 Unauthorized` — Session token mismatch
- `409 Conflict` — Players missing or not all ready

**Error Responses:**
- `404 Not Found` - Game not found
- `500 Internal Server Error` - Server error

---

#### List All Games

**GET** `/api/v1/games`

Lists all active games (debugging endpoint).

**Response (200 OK):**
```json
{
  "games": [
    {
      "id": "game-uuid-123",
      "playerCount": 3,
      "currentRound": 3,
      "gamePhase": "playing",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

#### Delete Game

**DELETE** `/api/v1/games/{gameId}`

Deletes a game session (cleanup endpoint).

**Path Parameters:**
- `gameId` (string, required): The game to delete

**Response (204 No Content):** Empty response on success

**Error Responses:**
- `404 Not Found` - Game not found

---

### Game Actions

#### Draw Card

**POST** `/api/v1/games/{gameId}/actions/draw`

Player draws one card from the deck on their turn.

**Path Parameters:**
- `gameId` (string, required): The game identifier

**Request Body:**
```json
{
  "playerId": "player-1"
}
```

**Response (200 OK):**
```json
{
  "card": {
    "id": "e03",
    "cardType": "event",
    "type": "layoff",
    "name": "Budget Cuts",
    "effect": "Each player discards one resource card",
    "parameters": { "count": 1 }
  },
  "gameState": {
    "id": "game-uuid-123",
    "currentRound": 3,
    "players": [...],
    "gamePhase": "playing"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Not player's turn, deck empty, or hand full
- `404 Not Found` - Game not found

---

#### Assign Resource

**POST** `/api/v1/games/{gameId}/actions/assign`

Assigns a resource card to a feature card.

**Path Parameters:**
- `gameId` (string, required): The game identifier

**Request Body:**
```json
{
  "playerId": "player-1",
  "resourceId": "r15",
  "featureId": "f04"
}
```

**Response (200 OK):**
```json
{
  "featureCompleted": true,
  "pointsAwarded": 5,
  "gameState": {
    "id": "game-uuid-123",
    "players": [...],
    "featuresInPlay": [...],
    "winCondition": false
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid assignment (wrong type, unavailable, already assigned)
- `404 Not Found` - Game, player, resource, or feature not found

---

#### End Turn

**POST** `/api/v1/games/{gameId}/actions/end-turn`

Ends the current player's turn and advances to the next player.

**Path Parameters:**
- `gameId` (string, required): The game identifier

**Request Body:**
```json
{
  "playerId": "player-1"
}
```

**Response (200 OK):**
```json
{
  "id": "game-uuid-123",
  "currentRound": 3,
  "currentPlayerIndex": 2,
  "currentPlayer": "player-3",
  "players": [...],
  "gamePhase": "playing",
  "winCondition": false
}
```

**Error Responses:**
- `400 Bad Request` - Not current player's turn
- `404 Not Found` - Game not found

---

#### Get Available Actions

**GET** `/api/v1/games/{gameId}/actions`

Helper endpoint to check what actions are available for the current player.

**Response (200 OK):**
```json
{
  "canDraw": true,
  "canAssign": true,
  "canEndTurn": true,
  "gameOver": false,
  "currentPlayer": "player-1"
}
```

---

### Health Check

#### System Health

**GET** `/health`

Checks if the API server is running and healthy.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600.5
}
```

---

## Data Models

### Card Types

#### Feature Card
```json
{
  "id": "f01",
  "cardType": "feature",
  "name": "User Login",
  "description": "Basic authentication system",
  "requirements": {
    "dev": 2,    // Number of dev points needed
    "pm": 1,     // Number of PM points needed
    "ux": 0      // Number of UX points needed
  },
  "points": 3,   // Victory points (3, 5, or 8)
  "complexity": "basic",  // basic, complex, or critical
  "assignedResources": [],
  "completed": false
}
```

#### Resource Card
```json
{
  "id": "r15",
  "cardType": "resource",
  "name": "Senior Developer",
  "role": "dev",         // dev, pm, or ux
  "level": "senior",     // entry, junior, or senior
  "value": 3,           // 1, 2, or 3 points
  "assignedTo": null,   // Feature ID when assigned
  "unavailableUntil": null  // Round number when available
}
```

#### Event Card
```json
{
  "id": "e03",
  "cardType": "event",
  "type": "layoff",     // layoff, reorg, contractor, competition, pto
  "name": "Budget Cuts",
  "description": "Company-wide resource reduction",
  "effect": "Each player discards one resource card",
  "parameters": {
    "count": 1
  }
}
```

### Player Model
```json
{
  "id": "player-uuid",
  "name": "Alice",
  "hand": [],           // Array of cards (max 7)
  "score": 12,          // Total victory points
  "temporarilyUnavailable": []  // Resources affected by events
}
```

### Game State Model
```json
{
  "id": "game-uuid",
  "players": [],        // Array of Player objects
  "currentRound": 3,    // 1-10
  "currentPlayerIndex": 1,
  "gamePhase": "playing",  // setup, playing, or ended
  "deck": [],           // Remaining cards
  "featuresInPlay": [], // Active feature cards
  "discardPile": [],    // Used cards
  "maxRounds": 10,
  "winCondition": false,
  "lastAction": "Player drew a card",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

## Complete Usage Examples

### Example 1: Complete Game Flow

```javascript
// 1. Create a new game
const createResponse = await fetch('http://localhost:3001/api/v1/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerNames: ['Alice', 'Bob', 'Charlie']
  })
});
const game = await createResponse.json();
const gameId = game.id;
const player1Id = game.players[0].id;

// 2. Draw a card on Player 1's turn
const drawResponse = await fetch(`http://localhost:3001/api/v1/games/${gameId}/actions/draw`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: player1Id
  })
});
const drawResult = await drawResponse.json();

// 3. Check if drawn card is a feature, put it in play
if (drawResult.card.cardType === 'feature') {
  // Feature cards automatically go to featuresInPlay
  console.log(`Drew feature: ${drawResult.card.name}`);
}

// 4. Assign a resource to a feature
const resourceId = game.players[0].hand.find(c => c.cardType === 'resource')?.id;
const featureId = drawResult.gameState.featuresInPlay[0]?.id;

if (resourceId && featureId) {
  const assignResponse = await fetch(`http://localhost:3001/api/v1/games/${gameId}/actions/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: player1Id,
      resourceId: resourceId,
      featureId: featureId
    })
  });
  const assignResult = await assignResponse.json();

  if (assignResult.featureCompleted) {
    console.log(`Feature completed! Earned ${assignResult.pointsAwarded} points`);
  }
}

// 5. End turn
const endTurnResponse = await fetch(`http://localhost:3001/api/v1/games/${gameId}/actions/end-turn`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: player1Id
  })
});
const newGameState = await endTurnResponse.json();
console.log(`Now it's ${newGameState.currentPlayer}'s turn`);
```

### Example 2: Error Handling with Retry Logic

```javascript
class GameClient {
  constructor(baseUrl = 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
    this.maxRetries = 3;
  }

  async makeRequest(url, options = {}, retries = 0) {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle specific errors
        if (error.code === 'INVALID_TURN') {
          console.log('Waiting for your turn...');
          return null;
        }

        if (error.code === 'GAME_OVER') {
          console.log('Game has ended');
          return null;
        }

        throw new Error(error.message);
      }

      return await response.json();
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`Retry attempt ${retries + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return this.makeRequest(url, options, retries + 1);
      }
      throw error;
    }
  }

  async createGame(playerNames) {
    return this.makeRequest('/games', {
      method: 'POST',
      body: JSON.stringify({ playerNames })
    });
  }

  async getGameState(gameId) {
    return this.makeRequest(`/games/${gameId}`);
  }

  async drawCard(gameId, playerId) {
    return this.makeRequest(`/games/${gameId}/actions/draw`, {
      method: 'POST',
      body: JSON.stringify({ playerId })
    });
  }
}

// Usage
const client = new GameClient();
const game = await client.createGame(['Alice', 'Bob']);
const state = await client.getGameState(game.id);
```

### Example 3: React Integration

```jsx
import React, { useState, useEffect } from 'react';

function GameBoard({ gameId }) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch game state
  const fetchGameState = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/games/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game');
      const data = await response.json();
      setGameState(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Draw a card
  const handleDrawCard = async (playerId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/v1/games/${gameId}/actions/draw`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const result = await response.json();
      setGameState(result.gameState);

      // Show drawn card
      alert(`Drew: ${result.card.name || result.card.type}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Assign resource
  const handleAssignResource = async (playerId, resourceId, featureId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/v1/games/${gameId}/actions/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, resourceId, featureId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const result = await response.json();
      setGameState(result.gameState);

      if (result.featureCompleted) {
        alert(`Feature completed! +${result.pointsAwarded} points!`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameState();
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  if (!gameState) return <div>Loading game...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="game-board">
      <h2>Round {gameState.currentRound} of {gameState.maxRounds}</h2>
      <p>Current Player: {gameState.players[gameState.currentPlayerIndex].name}</p>

      {/* Render game UI */}
      <button
        onClick={() => handleDrawCard(gameState.currentPlayer)}
        disabled={loading || gameState.isGameOver}
      >
        Draw Card
      </button>

      {/* More game UI components */}
    </div>
  );
}
```

### Example 4: Event Card Handling

```javascript
// Handle different event card types
async function processEventCard(gameId, eventCard) {
  console.log(`Event triggered: ${eventCard.name}`);

  switch (eventCard.type) {
    case 'layoff':
      // Each player must discard resources
      console.log('Budget cuts! Each player loses a resource.');
      break;

    case 'pto':
      // Resources become temporarily unavailable
      console.log('Vacation time! Some resources are unavailable.');
      break;

    case 'contractor':
      // Temporary resource boost
      console.log('Contractor hired! Extra help available.');
      break;

    case 'competition':
      // Feature requirements increase
      console.log('Competition heating up! Features now harder.');
      break;

    case 'reorg':
      // Resources get shuffled
      console.log('Reorganization! Resources redistributed.');
      break;
  }

  // Fetch updated game state to see event effects
  const response = await fetch(`http://localhost:3001/api/v1/games/${gameId}`);
  return await response.json();
}
```

---

## Testing & Debugging

### Using cURL for Testing

```bash
# Create a new game
curl -X POST http://localhost:3001/api/v1/games \
  -H "Content-Type: application/json" \
  -d '{"playerNames": ["Alice", "Bob"]}'

# Get game state
curl http://localhost:3001/api/v1/games/game-uuid-123

# Draw a card
curl -X POST http://localhost:3001/api/v1/games/game-uuid-123/actions/draw \
  -H "Content-Type: application/json" \
  -d '{"playerId": "player-1"}'

# Assign resource
curl -X POST http://localhost:3001/api/v1/games/game-uuid-123/actions/assign \
  -H "Content-Type: application/json" \
  -d '{"playerId": "player-1", "resourceId": "r15", "featureId": "f04"}'

# End turn
curl -X POST http://localhost:3001/api/v1/games/game-uuid-123/actions/end-turn \
  -H "Content-Type: application/json" \
  -d '{"playerId": "player-1"}'

# Check available actions
curl http://localhost:3001/api/v1/games/game-uuid-123/actions

# Health check
curl http://localhost:3001/health
```

### Using Postman

1. **Import the OpenAPI specification** from `/specs/feat/001-Silosoft-MVP/contracts/game-api.yaml`

2. **Set up environment variables:**
   ```
   baseUrl: http://localhost:3001/api/v1
   gameId: (set after creating game)
   playerId: (set from game response)
   ```

3. **Create test collections** for:
   - Happy path gameplay
   - Error scenarios
   - Edge cases
   - Performance testing

### Common Debugging Scenarios

#### 1. "Not your turn" Error
```javascript
// Check current player before action
const state = await getGameState(gameId);
const currentPlayerId = state.players[state.currentPlayerIndex].id;
console.log(`Current player: ${currentPlayerId}`);

// Only perform action if it's your turn
if (currentPlayerId === myPlayerId) {
  await drawCard(gameId, myPlayerId);
}
```

#### 2. Resource Assignment Issues
```javascript
// Debug why resource can't be assigned
const state = await getGameState(gameId);
const player = state.players.find(p => p.id === playerId);
const resource = player.hand.find(c => c.id === resourceId);
const feature = state.featuresInPlay.find(f => f.id === featureId);

console.log('Resource:', {
  available: resource.assignedTo === null,
  unavailable: resource.unavailableUntil,
  role: resource.role,
  value: resource.value
});

console.log('Feature:', {
  requirements: feature.requirements,
  assigned: feature.assignedResources,
  completed: feature.completed
});
```

#### 3. Game State Monitoring
```javascript
// Monitor game progression
function logGameState(state) {
  console.log('=== Game State ===');
  console.log(`Round: ${state.currentRound}/${state.maxRounds}`);
  console.log(`Phase: ${state.gamePhase}`);
  console.log(`Current Player: ${state.players[state.currentPlayerIndex].name}`);
  console.log(`Deck Size: ${state.deckSize}`);
  console.log(`Features in Play: ${state.featuresInPlay.length}`);
  console.log(`Win Condition: ${state.winCondition}`);
  console.log('Player Scores:', state.players.map(p => `${p.name}: ${p.score}`));
}
```

### Performance Testing

```javascript
// Measure API response times
async function measurePerformance() {
  const iterations = 100;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await fetch('http://localhost:3001/api/v1/games/test-game');
    const end = Date.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);

  console.log(`Performance Report (${iterations} requests):`);
  console.log(`Average: ${avg}ms`);
  console.log(`Min: ${min}ms`);
  console.log(`Max: ${max}ms`);
}
```

### Logging Best Practices

1. **Enable verbose logging** in development:
   ```javascript
   // Client-side
   const DEBUG = true;

   function apiCall(endpoint, options) {
     if (DEBUG) {
       console.log(`API Call: ${endpoint}`, options);
     }
     // ... make request
   }
   ```

2. **Track game events**:
   ```javascript
   // Log all game actions
   const gameLog = [];

   function logAction(action, data, result) {
     gameLog.push({
       timestamp: new Date().toISOString(),
       action,
       data,
       result,
       success: !result.error
     });
   }
   ```

3. **Export game history** for debugging:
   ```javascript
   function exportGameLog() {
     const blob = new Blob([JSON.stringify(gameLog, null, 2)],
       { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `game-log-${Date.now()}.json`;
     a.click();
   }
   ```

---

## Additional Resources

### API Client Libraries

Consider creating client libraries for common frameworks:

```javascript
// JavaScript/TypeScript SDK
npm install @silosoft/game-client

// Python SDK
pip install silosoft-game-client

// Go SDK
go get github.com/silosoft/game-client-go
```

### WebSocket Support (Future)

For real-time updates in multiplayer mode:

```javascript
const ws = new WebSocket('ws://localhost:3001/api/v1/games/socket');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  switch (event.type) {
    case 'player_joined':
    case 'card_drawn':
    case 'resource_assigned':
    case 'turn_ended':
      updateGameState(event.gameState);
      break;
  }
});
```

### Monitoring and Analytics

Track game metrics for balancing:
- Average game duration
- Win/loss ratios
- Most/least used features
- Resource utilization patterns
- Event card impact on outcomes

---

## Version History

### v1.0.0 (Current)
- Initial API release
- Core game mechanics
- 2-4 player support
- 50 card deck
- Turn-based gameplay

### Planned Features (v1.1.0)
- WebSocket real-time updates
- Player profiles and statistics
- Game replay functionality
- Tournament mode
- Extended card sets

---

## Contact & Support

- **API Issues**: api@silosoft.com
- **Documentation**: docs@silosoft.com
- **GitHub**: https://github.com/silosoft/card-game-api
- **Discord**: https://discord.gg/silosoft

---

*Last Updated: January 2025 | API Version: 1.0.0*
