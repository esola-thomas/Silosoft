const request = require('supertest');
const app = require('../../src/app');

describe('Game Performance Tests - Constitutional Requirements', () => {
  // Performance thresholds based on constitutional requirements
  const PERFORMANCE_THRESHOLDS = {
    MAX_GAME_DURATION_MS: 5 * 60 * 1000, // 5 minutes maximum
    MAX_OPERATION_TIME_MS: 500, // Individual operations should complete quickly
    MAX_ROUND_TIME_MS: 30 * 1000, // 30 seconds per round maximum
    MIN_ROUNDS_FOR_WIN: 3, // Minimum rounds before possible win
    MAX_ROUNDS: 10, // Maximum rounds per game
  };

  // Test utilities for performance measurement
  const measureExecutionTime = async (fn) => {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    return { result, durationMs };
  };

  const createTestGame = async (playerCount = 2) => {
    const playerNames = ['Alice', 'Bob', 'Charlie', 'Dave'].slice(0, playerCount);
    const response = await request(app)
      .post('/api/v1/games')
      .send({ playerNames })
      .expect(201);

    return {
      gameId: response.body.id,
      players: response.body.players,
      initialState: response.body
    };
  };

  const simulatePlayerTurn = async (gameId, playerId, shouldDraw = true, maxAssignments = 2) => {
    const turnMetrics = {
      drawTime: 0,
      assignmentTimes: [],
      endTurnTime: 0,
      totalTurnTime: 0
    };

    const turnStartTime = process.hrtime.bigint();

    try {
      // Verify it's the correct player's turn
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const currentPlayerIndex = gameState.body.currentPlayerIndex;
      const currentPlayer = gameState.body.players[currentPlayerIndex];

      // Only proceed if it's this player's turn
      if (currentPlayer.id !== playerId) {
        turnMetrics.totalTurnTime = 0;
        return turnMetrics;
      }

      // Draw a card if specified and conditions allow
      if (shouldDraw && gameState.body.deck.length > 0 && currentPlayer.hand.length < 7) {
        const { durationMs } = await measureExecutionTime(async () => {
          return await request(app)
            .post(`/api/v1/games/${gameId}/actions/draw`)
            .send({ playerId })
            .expect(200);
        });
        turnMetrics.drawTime = durationMs;
      }

      // Get updated game state after drawing
      const updatedGameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      const updatedPlayer = updatedGameState.body.players[currentPlayerIndex];
      const availableResources = updatedPlayer.hand.filter(
        card => card.cardType === 'resource' && !card.assignedTo
      );
      const availableFeatures = updatedGameState.body.featuresInPlay.filter(
        feature => !feature.completed
      );

      // Make resource assignments (simulate realistic gameplay)
      const assignmentsToMake = Math.min(
        maxAssignments,
        availableResources.length,
        availableFeatures.length
      );

      for (let i = 0; i < assignmentsToMake; i++) {
        const resource = availableResources[i];
        const feature = availableFeatures[i % availableFeatures.length];

        try {
          const { durationMs } = await measureExecutionTime(async () => {
            const response = await request(app)
              .post(`/api/v1/games/${gameId}/actions/assign`)
              .send({
                playerId,
                resourceId: resource.id,
                featureId: feature.id
              });

            // Accept both 200 (success) and 400 (assignment rules prevent this)
            if (response.status !== 200 && response.status !== 400) {
              throw new Error(`Unexpected status: ${response.status}`);
            }

            return response;
          });
          turnMetrics.assignmentTimes.push(durationMs);
        } catch (assignError) {
          // Skip this assignment if it fails
          console.log(`Assignment ${i} failed: ${assignError.message}`);
        }
      }

      // End turn
      const { durationMs: endTurnTime } = await measureExecutionTime(async () => {
        return await request(app)
          .post(`/api/v1/games/${gameId}/actions/end-turn`)
          .send({ playerId })
          .expect(200);
      });
      turnMetrics.endTurnTime = endTurnTime;

    } catch (error) {
      // Handle graceful failures (e.g., deck empty, hand full, wrong turn)
      if (!error.response || ![400, 404].includes(error.response.status)) {
        console.error(`Turn simulation error for player ${playerId}:`, error.message);
      }
    }

    const turnEndTime = process.hrtime.bigint();
    turnMetrics.totalTurnTime = Number(turnEndTime - turnStartTime) / 1_000_000;

    return turnMetrics;
  };

  const simulateFullGame = async (playerCount, targetRounds = 10) => {
    const gameMetrics = {
      creationTime: 0,
      roundTimes: [],
      playerTurnTimes: [],
      totalGameTime: 0,
      roundsPlayed: 0,
      gameCompleted: false,
      winConditionMet: false
    };

    const gameStartTime = process.hrtime.bigint();

    // Create game and measure creation time
    const { result: gameData, durationMs: creationTime } = await measureExecutionTime(async () => {
      return await createTestGame(playerCount);
    });

    gameMetrics.creationTime = creationTime;
    const { gameId, players } = gameData;

    // Simulate game rounds
    for (let round = 1; round <= targetRounds; round++) {
      const roundStartTime = process.hrtime.bigint();

      // Check if game is over before starting round
      const gameState = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .expect(200);

      if (gameState.body.gamePhase === 'ended' || gameState.body.isGameOver) {
        gameMetrics.gameCompleted = true;
        gameMetrics.winConditionMet = true;
        break;
      }

      // Each player takes their turn (but check whose turn it actually is)
      for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
        // Check current game state to see whose turn it is
        const currentState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        if (currentState.body.gamePhase === 'ended' || currentState.body.isGameOver) {
          gameMetrics.gameCompleted = true;
          gameMetrics.winConditionMet = true;
          break;
        }

        const currentPlayerIndex = currentState.body.currentPlayerIndex;
        const currentPlayer = currentState.body.players[currentPlayerIndex];

        const turnMetrics = await simulatePlayerTurn(
          gameId,
          currentPlayer.id,
          true, // Draw card
          2     // Max 2 assignments per turn
        );

        gameMetrics.playerTurnTimes.push({
          round,
          playerIndex: currentPlayerIndex,
          playerId: currentPlayer.id,
          ...turnMetrics
        });

        // Check for win condition after each turn
        const afterTurnState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        if (afterTurnState.body.gamePhase === 'ended' || afterTurnState.body.isGameOver) {
          gameMetrics.gameCompleted = true;
          gameMetrics.winConditionMet = true;
          break;
        }
      }

      const roundEndTime = process.hrtime.bigint();
      const roundDuration = Number(roundEndTime - roundStartTime) / 1_000_000;
      gameMetrics.roundTimes.push(roundDuration);
      gameMetrics.roundsPlayed = round;

      // Break if game completed during this round
      if (gameMetrics.gameCompleted) {
        break;
      }
    }

    const gameEndTime = process.hrtime.bigint();
    gameMetrics.totalGameTime = Number(gameEndTime - gameStartTime) / 1_000_000;

    return gameMetrics;
  };

  describe('Constitutional Requirement: 5-Minute Game Completion', () => {
    it('should complete a 2-player game within 5 minutes', async () => {
      const metrics = await simulateFullGame(2, 10);

      expect(metrics.totalGameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_GAME_DURATION_MS);
      expect(metrics.roundsPlayed).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MAX_ROUNDS);

      console.log(`2-Player Game Performance:
        Total Time: ${metrics.totalGameTime.toFixed(2)}ms (${(metrics.totalGameTime / 1000).toFixed(2)}s)
        Rounds Played: ${metrics.roundsPlayed}
        Average Round Time: ${(metrics.roundTimes.reduce((a, b) => a + b, 0) / metrics.roundTimes.length).toFixed(2)}ms
        Game Creation Time: ${metrics.creationTime.toFixed(2)}ms
        Game Completed: ${metrics.gameCompleted}
      `);
    }, 10000); // 10 second timeout for test

    it('should complete a 3-player game within 5 minutes', async () => {
      const metrics = await simulateFullGame(3, 10);

      expect(metrics.totalGameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_GAME_DURATION_MS);
      expect(metrics.roundsPlayed).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MAX_ROUNDS);

      console.log(`3-Player Game Performance:
        Total Time: ${metrics.totalGameTime.toFixed(2)}ms (${(metrics.totalGameTime / 1000).toFixed(2)}s)
        Rounds Played: ${metrics.roundsPlayed}
        Average Round Time: ${(metrics.roundTimes.reduce((a, b) => a + b, 0) / metrics.roundTimes.length).toFixed(2)}ms
        Game Creation Time: ${metrics.creationTime.toFixed(2)}ms
        Game Completed: ${metrics.gameCompleted}
      `);
    }, 10000);

    it('should complete a 4-player game within 5 minutes', async () => {
      const metrics = await simulateFullGame(4, 10);

      expect(metrics.totalGameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_GAME_DURATION_MS);
      expect(metrics.roundsPlayed).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MAX_ROUNDS);

      console.log(`4-Player Game Performance:
        Total Time: ${metrics.totalGameTime.toFixed(2)}ms (${(metrics.totalGameTime / 1000).toFixed(2)}s)
        Rounds Played: ${metrics.roundsPlayed}
        Average Round Time: ${(metrics.roundTimes.reduce((a, b) => a + b, 0) / metrics.roundTimes.length).toFixed(2)}ms
        Game Creation Time: ${metrics.creationTime.toFixed(2)}ms
        Game Completed: ${metrics.gameCompleted}
      `);
    }, 10000);

    it('should maintain consistent performance across multiple games', async () => {
      const gameResults = [];
      const numberOfGames = 3;

      for (let i = 0; i < numberOfGames; i++) {
        const metrics = await simulateFullGame(2, 10);
        gameResults.push(metrics.totalGameTime);

        expect(metrics.totalGameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_GAME_DURATION_MS);
      }

      const averageTime = gameResults.reduce((a, b) => a + b, 0) / gameResults.length;
      const maxTime = Math.max(...gameResults);
      const minTime = Math.min(...gameResults);

      console.log(`Multiple Games Performance Analysis:
        Average Time: ${averageTime.toFixed(2)}ms (${(averageTime / 1000).toFixed(2)}s)
        Min Time: ${minTime.toFixed(2)}ms (${(minTime / 1000).toFixed(2)}s)
        Max Time: ${maxTime.toFixed(2)}ms (${(maxTime / 1000).toFixed(2)}s)
        Performance Variance: ${((maxTime - minTime) / averageTime * 100).toFixed(2)}%
      `);

      // Ensure performance is consistent (variance less than 50%)
      expect((maxTime - minTime) / averageTime).toBeLessThan(0.5);
    }, 15000);
  });

  describe('Individual Operation Performance', () => {
    let gameData;

    beforeEach(async () => {
      gameData = await createTestGame(2);
    });

    it('should create games quickly', async () => {
      const { durationMs } = await measureExecutionTime(async () => {
        return await createTestGame(2);
      });

      expect(durationMs).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_OPERATION_TIME_MS);

      console.log(`Game Creation Performance: ${durationMs.toFixed(2)}ms`);
    });

    it('should retrieve game state quickly', async () => {
      const { durationMs } = await measureExecutionTime(async () => {
        return await request(app)
          .get(`/api/v1/games/${gameData.gameId}`)
          .expect(200);
      });

      expect(durationMs).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_OPERATION_TIME_MS);

      console.log(`Game State Retrieval Performance: ${durationMs.toFixed(2)}ms`);
    });

    it('should draw cards quickly', async () => {
      const { durationMs } = await measureExecutionTime(async () => {
        return await request(app)
          .post(`/api/v1/games/${gameData.gameId}/actions/draw`)
          .send({ playerId: gameData.players[0].id })
          .expect(200);
      });

      expect(durationMs).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_OPERATION_TIME_MS);

      console.log(`Card Draw Performance: ${durationMs.toFixed(2)}ms`);
    });

    it('should assign resources quickly', async () => {
      // Draw a card first to ensure we have a resource
      await request(app)
        .post(`/api/v1/games/${gameData.gameId}/actions/draw`)
        .send({ playerId: gameData.players[0].id })
        .expect(200);

      const gameState = await request(app)
        .get(`/api/v1/games/${gameData.gameId}`)
        .expect(200);

      const player = gameState.body.players[0];
      const resource = player.hand.find(card => card.cardType === 'resource');
      const feature = gameState.body.featuresInPlay[0];

      if (resource && feature) {
        const { durationMs } = await measureExecutionTime(async () => {
          return await request(app)
            .post(`/api/v1/games/${gameData.gameId}/actions/assign`)
            .send({
              playerId: gameData.players[0].id,
              resourceId: resource.id,
              featureId: feature.id
            })
            .expect(200);
        });

        expect(durationMs).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_OPERATION_TIME_MS);

        console.log(`Resource Assignment Performance: ${durationMs.toFixed(2)}ms`);
      } else {
        console.log('Skipping assignment test - no suitable resource/feature combination');
      }
    });

    it('should end turns quickly', async () => {
      const { durationMs } = await measureExecutionTime(async () => {
        return await request(app)
          .post(`/api/v1/games/${gameData.gameId}/actions/end-turn`)
          .send({ playerId: gameData.players[0].id })
          .expect(200);
      });

      expect(durationMs).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_OPERATION_TIME_MS);

      console.log(`End Turn Performance: ${durationMs.toFixed(2)}ms`);
    });
  });

  describe('Round Performance Analysis', () => {
    it('should complete individual rounds within time limits', async () => {
      const gameData = await createTestGame(3);
      const roundMetrics = [];

      // Play 3 rounds and measure each
      for (let round = 1; round <= 3; round++) {
        const roundStartTime = process.hrtime.bigint();

        // Each player takes their turn
        for (let playerIndex = 0; playerIndex < gameData.players.length; playerIndex++) {
          await simulatePlayerTurn(gameData.gameId, gameData.players[playerIndex].id);
        }

        const roundEndTime = process.hrtime.bigint();
        const roundDuration = Number(roundEndTime - roundStartTime) / 1_000_000;
        roundMetrics.push(roundDuration);

        expect(roundDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_ROUND_TIME_MS);
      }

      const averageRoundTime = roundMetrics.reduce((a, b) => a + b, 0) / roundMetrics.length;

      console.log(`Round Performance Analysis:
        Round 1: ${roundMetrics[0].toFixed(2)}ms
        Round 2: ${roundMetrics[1].toFixed(2)}ms
        Round 3: ${roundMetrics[2].toFixed(2)}ms
        Average: ${averageRoundTime.toFixed(2)}ms
      `);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple concurrent games', async () => {
      const concurrentGames = 3;
      const gamePromises = [];

      const startTime = process.hrtime.bigint();

      // Start multiple games concurrently
      for (let i = 0; i < concurrentGames; i++) {
        gamePromises.push(simulateFullGame(2, 5)); // Shorter games for load test
      }

      const results = await Promise.all(gamePromises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      // All games should complete within the time limit
      results.forEach((metrics, index) => {
        expect(metrics.totalGameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_GAME_DURATION_MS);
        console.log(`Concurrent Game ${index + 1}: ${metrics.totalGameTime.toFixed(2)}ms`);
      });

      console.log(`Concurrent Load Test:
        Total Time for ${concurrentGames} games: ${totalTime.toFixed(2)}ms
        Average Game Time: ${(results.reduce((sum, m) => sum + m.totalGameTime, 0) / results.length).toFixed(2)}ms
      `);
    }, 20000); // Extended timeout for load test

    it('should maintain performance with rapid API calls', async () => {
      const gameData = await createTestGame(2);
      const rapidCallMetrics = [];

      // Make 20 rapid game state requests
      for (let i = 0; i < 20; i++) {
        const { durationMs } = await measureExecutionTime(async () => {
          return await request(app)
            .get(`/api/v1/games/${gameData.gameId}`)
            .expect(200);
        });
        rapidCallMetrics.push(durationMs);
      }

      const averageTime = rapidCallMetrics.reduce((a, b) => a + b, 0) / rapidCallMetrics.length;
      const maxTime = Math.max(...rapidCallMetrics);

      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_OPERATION_TIME_MS);
      expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_OPERATION_TIME_MS * 2); // Allow some variance

      console.log(`Rapid API Calls Performance:
        Average Response Time: ${averageTime.toFixed(2)}ms
        Max Response Time: ${maxTime.toFixed(2)}ms
        Min Response Time: ${Math.min(...rapidCallMetrics).toFixed(2)}ms
      `);
    });
  });

  describe('Memory and Resource Efficiency', () => {
    it('should not degrade performance over extended gameplay', async () => {
      const extendedGameMetrics = [];
      const numberOfGames = 5;

      for (let gameNumber = 1; gameNumber <= numberOfGames; gameNumber++) {
        const startMemory = process.memoryUsage();
        const gameMetrics = await simulateFullGame(2, 8);
        const endMemory = process.memoryUsage();

        extendedGameMetrics.push({
          gameNumber,
          gameTime: gameMetrics.totalGameTime,
          memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          roundsPlayed: gameMetrics.roundsPlayed
        });

        // Ensure each game still meets performance requirements
        expect(gameMetrics.totalGameTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_GAME_DURATION_MS);
      }

      // Check for performance degradation
      const firstGameTime = extendedGameMetrics[0].gameTime;
      const lastGameTime = extendedGameMetrics[numberOfGames - 1].gameTime;
      const performanceDegradation = (lastGameTime - firstGameTime) / firstGameTime;

      expect(performanceDegradation).toBeLessThan(0.2); // Less than 20% degradation

      console.log('Extended Gameplay Performance Analysis:');
      extendedGameMetrics.forEach(metric => {
        console.log(`  Game ${metric.gameNumber}: ${metric.gameTime.toFixed(2)}ms, Memory: ${(metric.memoryDelta / 1024 / 1024).toFixed(2)}MB, Rounds: ${metric.roundsPlayed}`);
      });

      console.log(`Performance degradation: ${(performanceDegradation * 100).toFixed(2)}%`);
    }, 30000); // Extended timeout for multiple games
  });

  // Cleanup after all tests
  afterEach(async () => {
    // Clean up any remaining games to prevent memory leaks
    try {
      const response = await request(app).get('/api/v1/games').expect(200);
      for (const game of response.body.games) {
        await request(app).delete(`/api/v1/games/${game.id}`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});