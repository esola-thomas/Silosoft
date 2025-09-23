const request = require('supertest');
const app = require('../../src/app');

describe('Load Testing Suite - Server Performance Under Concurrent Load', () => {
  // Load testing thresholds and configuration
  const LOAD_THRESHOLDS = {
    MAX_RESPONSE_TIME_MS: 1000,     // Maximum acceptable response time under load
    MAX_RESPONSE_DEGRADATION: 2.0,  // Maximum response time increase ratio under load
    MIN_SUCCESS_RATE: 0.95,         // Minimum 95% success rate under load
    MAX_MEMORY_INCREASE_MB: 100,    // Maximum memory increase during load test
    MAX_CPU_UTILIZATION: 0.8,       // Maximum CPU utilization (80%)
    CONCURRENT_GAMES_LIGHT: 5,      // Light load scenario
    CONCURRENT_GAMES_MEDIUM: 10,    // Medium load scenario
    CONCURRENT_GAMES_HEAVY: 20,     // Heavy load scenario
    RAPID_REQUESTS_COUNT: 100,      // Number of rapid API requests
    SUSTAINED_LOAD_DURATION_MS: 30000, // 30 seconds sustained load
  };

  // Enhanced measurement utilities
  const measureExecutionTime = async (fn) => {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn();
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();

      const durationMs = Number(endTime - startTime) / 1_000_000;
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

      return {
        result,
        durationMs,
        memoryDelta,
        success: true,
        error: null
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      return {
        result: null,
        durationMs,
        memoryDelta: 0,
        success: false,
        error: error.message
      };
    }
  };

  const createTestGame = async (playerCount = 2, retries = 3) => {
    const playerNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'].slice(0, playerCount);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await request(app)
          .post('/api/v1/games')
          .send({ playerNames })
          .expect(201);

        return {
          gameId: response.body.id,
          players: response.body.players,
          initialState: response.body,
          attempt
        };
      } catch (error) {
        if (attempt === retries) throw error;
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  };

  const simulateGamePlay = async (gameId, maxRounds = 5) => {
    const metrics = {
      rounds: 0,
      actions: 0,
      errors: 0,
      totalTime: 0,
      actionTimes: []
    };

    const startTime = process.hrtime.bigint();

    try {
      for (let round = 1; round <= maxRounds; round++) {
        // Get current game state
        const gameState = await request(app)
          .get(`/api/v1/games/${gameId}`)
          .expect(200);

        if (gameState.body.gamePhase === 'ended' || gameState.body.isGameOver) {
          break;
        }

        const currentPlayerIndex = gameState.body.currentPlayerIndex;
        const currentPlayer = gameState.body.players[currentPlayerIndex];

        try {
          // Draw action
          const drawResult = await measureExecutionTime(async () => {
            return await request(app)
              .post(`/api/v1/games/${gameId}/actions/draw`)
              .send({ playerId: currentPlayer.id });
          });

          if (drawResult.success) {
            metrics.actions++;
            metrics.actionTimes.push(drawResult.durationMs);
          } else {
            metrics.errors++;
          }

          // Assignment action (if possible)
          const updatedState = await request(app)
            .get(`/api/v1/games/${gameId}`)
            .expect(200);

          const player = updatedState.body.players[currentPlayerIndex];
          const resource = player.hand.find(card => card.cardType === 'resource' && !card.assignedTo);
          const feature = updatedState.body.featuresInPlay.find(f => !f.completed);

          if (resource && feature) {
            const assignResult = await measureExecutionTime(async () => {
              return await request(app)
                .post(`/api/v1/games/${gameId}/actions/assign`)
                .send({
                  playerId: currentPlayer.id,
                  resourceId: resource.id,
                  featureId: feature.id
                });
            });

            if (assignResult.success) {
              metrics.actions++;
              metrics.actionTimes.push(assignResult.durationMs);
            } else {
              metrics.errors++;
            }
          }

          // End turn
          const endTurnResult = await measureExecutionTime(async () => {
            return await request(app)
              .post(`/api/v1/games/${gameId}/actions/end-turn`)
              .send({ playerId: currentPlayer.id });
          });

          if (endTurnResult.success) {
            metrics.actions++;
            metrics.actionTimes.push(endTurnResult.durationMs);
          } else {
            metrics.errors++;
          }

        } catch (error) {
          metrics.errors++;
        }

        metrics.rounds = round;
      }
    } catch (error) {
      metrics.errors++;
    }

    const endTime = process.hrtime.bigint();
    metrics.totalTime = Number(endTime - startTime) / 1_000_000;

    return metrics;
  };

  const getSystemMetrics = () => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime()
    };
  };

  describe('Concurrent Game Sessions Load Tests', () => {
    it('should handle 5 concurrent games (light load)', async () => {
      const concurrentGames = LOAD_THRESHOLDS.CONCURRENT_GAMES_LIGHT;
      const startMetrics = getSystemMetrics();
      const gamePromises = [];
      const gameMetrics = [];

      console.log(`Starting ${concurrentGames} concurrent games...`);

      // Create and start games concurrently
      for (let i = 0; i < concurrentGames; i++) {
        const gamePromise = (async () => {
          const gameData = await createTestGame(2);
          const playMetrics = await simulateGamePlay(gameData.gameId, 3);
          return { gameId: gameData.gameId, ...playMetrics };
        })();
        gamePromises.push(gamePromise);
      }

      const results = await Promise.allSettled(gamePromises);
      const endMetrics = getSystemMetrics();

      // Analyze results
      const successfulGames = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failedGames = results.filter(r => r.status === 'rejected');

      const successRate = successfulGames.length / concurrentGames;
      const avgResponseTime = successfulGames.reduce((sum, game) =>
        sum + (game.actionTimes.reduce((a, b) => a + b, 0) / game.actionTimes.length), 0
      ) / successfulGames.length;

      const memoryIncreaseMB = (endMetrics.memory.heapUsed - startMetrics.memory.heapUsed) / 1024 / 1024;

      console.log(`Light Load Test Results:
        Concurrent Games: ${concurrentGames}
        Success Rate: ${(successRate * 100).toFixed(2)}%
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
        Memory Increase: ${memoryIncreaseMB.toFixed(2)}MB
        Failed Games: ${failedGames.length}
      `);

      // Assertions
      expect(successRate).toBeGreaterThanOrEqual(LOAD_THRESHOLDS.MIN_SUCCESS_RATE);
      expect(avgResponseTime).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_TIME_MS);
      expect(memoryIncreaseMB).toBeLessThan(LOAD_THRESHOLDS.MAX_MEMORY_INCREASE_MB);

      // Cleanup
      for (const game of successfulGames) {
        try {
          await request(app).delete(`/api/v1/games/${game.gameId}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }, 30000);

    it('should handle 10 concurrent games (medium load)', async () => {
      const concurrentGames = LOAD_THRESHOLDS.CONCURRENT_GAMES_MEDIUM;
      const startMetrics = getSystemMetrics();
      const gamePromises = [];

      console.log(`Starting ${concurrentGames} concurrent games...`);

      // Create games concurrently
      for (let i = 0; i < concurrentGames; i++) {
        const gamePromise = (async () => {
          const gameData = await createTestGame(Math.floor(Math.random() * 3) + 2); // 2-4 players
          const playMetrics = await simulateGamePlay(gameData.gameId, 4);
          return { gameId: gameData.gameId, ...playMetrics };
        })();
        gamePromises.push(gamePromise);
      }

      const results = await Promise.allSettled(gamePromises);
      const endMetrics = getSystemMetrics();

      // Analyze results
      const successfulGames = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failedGames = results.filter(r => r.status === 'rejected');

      const successRate = successfulGames.length / concurrentGames;
      const avgResponseTime = successfulGames.reduce((sum, game) =>
        sum + (game.actionTimes.reduce((a, b) => a + b, 0) / game.actionTimes.length), 0
      ) / successfulGames.length;

      const memoryIncreaseMB = (endMetrics.memory.heapUsed - startMetrics.memory.heapUsed) / 1024 / 1024;

      console.log(`Medium Load Test Results:
        Concurrent Games: ${concurrentGames}
        Success Rate: ${(successRate * 100).toFixed(2)}%
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
        Memory Increase: ${memoryIncreaseMB.toFixed(2)}MB
        Failed Games: ${failedGames.length}
        Total Actions: ${successfulGames.reduce((sum, game) => sum + game.actions, 0)}
        Total Errors: ${successfulGames.reduce((sum, game) => sum + game.errors, 0)}
      `);

      // More lenient thresholds for medium load
      expect(successRate).toBeGreaterThanOrEqual(0.9); // 90% success rate
      expect(avgResponseTime).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_TIME_MS * 1.5);
      expect(memoryIncreaseMB).toBeLessThan(LOAD_THRESHOLDS.MAX_MEMORY_INCREASE_MB * 1.5);

      // Cleanup
      for (const game of successfulGames) {
        try {
          await request(app).delete(`/api/v1/games/${game.gameId}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }, 45000);

    it('should handle 20 concurrent games (heavy load)', async () => {
      const concurrentGames = LOAD_THRESHOLDS.CONCURRENT_GAMES_HEAVY;
      const startMetrics = getSystemMetrics();
      const gamePromises = [];

      console.log(`Starting ${concurrentGames} concurrent games (stress test)...`);

      // Create games in batches to prevent overwhelming the system
      const batchSize = 5;
      const batches = Math.ceil(concurrentGames / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = [];
        const gamesInBatch = Math.min(batchSize, concurrentGames - (batch * batchSize));

        for (let i = 0; i < gamesInBatch; i++) {
          const gamePromise = (async () => {
            const gameData = await createTestGame(2); // Keep simple for stress test
            const playMetrics = await simulateGamePlay(gameData.gameId, 2);
            return { gameId: gameData.gameId, ...playMetrics };
          })();
          batchPromises.push(gamePromise);
        }

        const batchResults = await Promise.allSettled(batchPromises);
        gamePromises.push(...batchResults);

        // Small delay between batches
        if (batch < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const endMetrics = getSystemMetrics();

      // Analyze results
      const successfulGames = gamePromises.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failedGames = gamePromises.filter(r => r.status === 'rejected');

      const successRate = successfulGames.length / concurrentGames;
      const avgResponseTime = successfulGames.length > 0 ?
        successfulGames.reduce((sum, game) =>
          sum + (game.actionTimes.length > 0 ?
            game.actionTimes.reduce((a, b) => a + b, 0) / game.actionTimes.length : 0), 0
        ) / successfulGames.length : 0;

      const memoryIncreaseMB = (endMetrics.memory.heapUsed - startMetrics.memory.heapUsed) / 1024 / 1024;

      console.log(`Heavy Load Test Results:
        Concurrent Games: ${concurrentGames}
        Success Rate: ${(successRate * 100).toFixed(2)}%
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
        Memory Increase: ${memoryIncreaseMB.toFixed(2)}MB
        Failed Games: ${failedGames.length}
        Total Actions: ${successfulGames.reduce((sum, game) => sum + game.actions, 0)}
        Total Errors: ${successfulGames.reduce((sum, game) => sum + game.errors, 0)}
      `);

      // Very lenient thresholds for stress test - focus on not crashing
      expect(successRate).toBeGreaterThanOrEqual(0.7); // 70% success rate acceptable under heavy load
      expect(memoryIncreaseMB).toBeLessThan(LOAD_THRESHOLDS.MAX_MEMORY_INCREASE_MB * 3);

      // Cleanup
      for (const game of successfulGames) {
        try {
          await request(app).delete(`/api/v1/games/${game.gameId}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }, 60000);
  });

  describe('API Endpoint Load Testing', () => {
    let testGameId;
    let testPlayers;

    beforeAll(async () => {
      const gameData = await createTestGame(2);
      testGameId = gameData.gameId;
      testPlayers = gameData.players;
    });

    afterAll(async () => {
      try {
        await request(app).delete(`/api/v1/games/${testGameId}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should handle rapid successive API calls to same endpoint', async () => {
      const requestCount = LOAD_THRESHOLDS.RAPID_REQUESTS_COUNT;
      const promises = [];
      const startTime = process.hrtime.bigint();

      console.log(`Making ${requestCount} rapid requests to GET /games/{id}...`);

      // Make concurrent requests to same endpoint
      for (let i = 0; i < requestCount; i++) {
        promises.push(measureExecutionTime(async () => {
          return await request(app)
            .get(`/api/v1/games/${testGameId}`)
            .expect(200);
        }));
      }

      const results = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      const successfulRequests = results.filter(r => r.success);
      const failedRequests = results.filter(r => !r.success);
      const successRate = successfulRequests.length / requestCount;
      const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.durationMs, 0) / successfulRequests.length;
      const maxResponseTime = Math.max(...successfulRequests.map(r => r.durationMs));
      const minResponseTime = Math.min(...successfulRequests.map(r => r.durationMs));

      console.log(`Rapid API Calls Results:
        Total Requests: ${requestCount}
        Success Rate: ${(successRate * 100).toFixed(2)}%
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
        Min Response Time: ${minResponseTime.toFixed(2)}ms
        Max Response Time: ${maxResponseTime.toFixed(2)}ms
        Total Time: ${totalTime.toFixed(2)}ms
        Requests/Second: ${(requestCount / (totalTime / 1000)).toFixed(2)}
        Failed Requests: ${failedRequests.length}
      `);

      expect(successRate).toBeGreaterThanOrEqual(LOAD_THRESHOLDS.MIN_SUCCESS_RATE);
      expect(avgResponseTime).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_TIME_MS);
    }, 30000);

    it('should handle concurrent calls to different endpoints', async () => {
      const callsPerEndpoint = 20;
      const endpoints = [
        { method: 'GET', path: `/api/v1/games/${testGameId}`, name: 'getGame' },
        { method: 'POST', path: `/api/v1/games/${testGameId}/actions/draw`, body: { playerId: testPlayers[0].id }, name: 'drawCard' },
        { method: 'POST', path: `/api/v1/games/${testGameId}/actions/end-turn`, body: { playerId: testPlayers[0].id }, name: 'endTurn' }
      ];

      const allPromises = [];
      const startTime = process.hrtime.bigint();

      console.log(`Making ${callsPerEndpoint} concurrent calls to ${endpoints.length} different endpoints...`);

      for (const endpoint of endpoints) {
        for (let i = 0; i < callsPerEndpoint; i++) {
          const promise = measureExecutionTime(async () => {
            if (endpoint.method === 'GET') {
              return await request(app).get(endpoint.path);
            } else {
              return await request(app).post(endpoint.path).send(endpoint.body);
            }
          });

          promise.then(result => result.endpoint = endpoint.name);
          allPromises.push(promise);
        }
      }

      const results = await Promise.all(allPromises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      // Analyze by endpoint
      const endpointStats = {};
      for (const endpoint of endpoints) {
        const endpointResults = results.filter(r => r.endpoint === endpoint.name);
        const successfulResults = endpointResults.filter(r => r.success);

        endpointStats[endpoint.name] = {
          total: endpointResults.length,
          successful: successfulResults.length,
          successRate: successfulResults.length / endpointResults.length,
          avgResponseTime: successfulResults.reduce((sum, r) => sum + r.durationMs, 0) / successfulResults.length || 0
        };
      }

      const overallSuccessRate = results.filter(r => r.success).length / results.length;
      const overallAvgResponseTime = results.filter(r => r.success).reduce((sum, r) => sum + r.durationMs, 0) / results.filter(r => r.success).length;

      console.log(`Mixed Endpoint Load Test Results:
        Total Requests: ${results.length}
        Overall Success Rate: ${(overallSuccessRate * 100).toFixed(2)}%
        Overall Average Response Time: ${overallAvgResponseTime.toFixed(2)}ms
        Total Time: ${totalTime.toFixed(2)}ms
      `);

      for (const [endpointName, stats] of Object.entries(endpointStats)) {
        console.log(`  ${endpointName}: ${(stats.successRate * 100).toFixed(1)}% success, ${stats.avgResponseTime.toFixed(2)}ms avg`);
      }

      expect(overallSuccessRate).toBeGreaterThanOrEqual(0.8); // 80% success rate for mixed calls
      expect(overallAvgResponseTime).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_TIME_MS * 2);
    }, 30000);

    it('should handle mixed workload scenarios', async () => {
      const scenarios = [
        { weight: 0.5, action: 'read', description: 'Game state retrieval' },
        { weight: 0.3, action: 'write', description: 'Game actions (draw/assign/end-turn)' },
        { weight: 0.2, action: 'create', description: 'New game creation' }
      ];

      const totalRequests = 100;
      const promises = [];
      const requestDistribution = {};
      const startTime = process.hrtime.bigint();

      console.log(`Running mixed workload test with ${totalRequests} requests...`);

      for (let i = 0; i < totalRequests; i++) {
        const random = Math.random();
        let cumulativeWeight = 0;
        let selectedScenario = null;

        for (const scenario of scenarios) {
          cumulativeWeight += scenario.weight;
          if (random <= cumulativeWeight) {
            selectedScenario = scenario;
            break;
          }
        }

        requestDistribution[selectedScenario.action] = (requestDistribution[selectedScenario.action] || 0) + 1;

        if (selectedScenario.action === 'read') {
          promises.push(measureExecutionTime(async () => {
            return await request(app).get(`/api/v1/games/${testGameId}`).expect(200);
          }).then(result => ({ ...result, action: 'read' })));
        } else if (selectedScenario.action === 'write') {
          // Randomly choose between different write actions
          const writeActions = ['draw', 'end-turn'];
          const writeAction = writeActions[Math.floor(Math.random() * writeActions.length)];

          promises.push(measureExecutionTime(async () => {
            return await request(app)
              .post(`/api/v1/games/${testGameId}/actions/${writeAction}`)
              .send({ playerId: testPlayers[0].id });
          }).then(result => ({ ...result, action: 'write' })));
        } else if (selectedScenario.action === 'create') {
          promises.push(measureExecutionTime(async () => {
            const response = await request(app)
              .post('/api/v1/games')
              .send({ playerNames: ['TestPlayer1', 'TestPlayer2'] })
              .expect(201);

            // Clean up immediately
            try {
              await request(app).delete(`/api/v1/games/${response.body.id}`);
            } catch (error) {
              // Ignore cleanup errors
            }

            return response;
          }).then(result => ({ ...result, action: 'create' })));
        }
      }

      const results = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      // Analyze by action type
      const actionStats = {};
      for (const action of ['read', 'write', 'create']) {
        const actionResults = results.filter(r => r.action === action);
        const successfulResults = actionResults.filter(r => r.success);

        actionStats[action] = {
          total: actionResults.length,
          successful: successfulResults.length,
          successRate: successfulResults.length / actionResults.length,
          avgResponseTime: successfulResults.reduce((sum, r) => sum + r.durationMs, 0) / successfulResults.length || 0
        };
      }

      const overallSuccessRate = results.filter(r => r.success).length / results.length;

      console.log(`Mixed Workload Test Results:
        Total Time: ${totalTime.toFixed(2)}ms
        Overall Success Rate: ${(overallSuccessRate * 100).toFixed(2)}%
        Request Distribution: ${JSON.stringify(requestDistribution)}
      `);

      for (const [action, stats] of Object.entries(actionStats)) {
        console.log(`  ${action}: ${stats.total} requests, ${(stats.successRate * 100).toFixed(1)}% success, ${stats.avgResponseTime.toFixed(2)}ms avg`);
      }

      expect(overallSuccessRate).toBeGreaterThanOrEqual(0.85); // 85% success rate for mixed workload
    }, 45000);
  });

  describe('Realistic User Scenario Testing', () => {
    it('should handle multiple players joining and leaving games', async () => {
      const simultaneousGames = 8;
      const playersPerGame = 3;
      const gamePromises = [];
      const startTime = process.hrtime.bigint();

      console.log(`Simulating ${simultaneousGames} games with ${playersPerGame} players each...`);

      for (let gameIndex = 0; gameIndex < simultaneousGames; gameIndex++) {
        const gamePromise = (async () => {
          try {
            // Create game
            const gameData = await createTestGame(playersPerGame);

            // Simulate each player taking several turns
            const playerMetrics = [];
            for (let round = 1; round <= 3; round++) {
              for (let playerIndex = 0; playerIndex < playersPerGame; playerIndex++) {
                const player = gameData.players[playerIndex];

                const turnResult = await measureExecutionTime(async () => {
                  // Draw card
                  await request(app)
                    .post(`/api/v1/games/${gameData.gameId}/actions/draw`)
                    .send({ playerId: player.id });

                  // End turn (simplified for this test)
                  await request(app)
                    .post(`/api/v1/games/${gameData.gameId}/actions/end-turn`)
                    .send({ playerId: player.id });
                });

                playerMetrics.push({
                  round,
                  playerIndex,
                  duration: turnResult.durationMs,
                  success: turnResult.success
                });
              }
            }

            // Clean up game
            await request(app).delete(`/api/v1/games/${gameData.gameId}`);

            return {
              gameIndex,
              gameId: gameData.gameId,
              playerMetrics,
              success: true
            };
          } catch (error) {
            return {
              gameIndex,
              gameId: null,
              playerMetrics: [],
              success: false,
              error: error.message
            };
          }
        })();

        gamePromises.push(gamePromise);
      }

      const results = await Promise.all(gamePromises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      const successfulGames = results.filter(r => r.success);
      const failedGames = results.filter(r => !r.success);
      const successRate = successfulGames.length / simultaneousGames;

      const allPlayerMetrics = successfulGames.flatMap(game => game.playerMetrics);
      const successfulTurns = allPlayerMetrics.filter(metric => metric.success);
      const avgTurnTime = successfulTurns.reduce((sum, metric) => sum + metric.duration, 0) / successfulTurns.length;

      console.log(`Multi-Player Game Simulation Results:
        Simultaneous Games: ${simultaneousGames}
        Players Per Game: ${playersPerGame}
        Game Success Rate: ${(successRate * 100).toFixed(2)}%
        Total Player Turns: ${allPlayerMetrics.length}
        Successful Turns: ${successfulTurns.length}
        Turn Success Rate: ${(successfulTurns.length / allPlayerMetrics.length * 100).toFixed(2)}%
        Average Turn Time: ${avgTurnTime.toFixed(2)}ms
        Total Test Time: ${totalTime.toFixed(2)}ms
        Failed Games: ${failedGames.length}
      `);

      expect(successRate).toBeGreaterThanOrEqual(0.8); // 80% of games should complete successfully
      expect(successfulTurns.length / allPlayerMetrics.length).toBeGreaterThanOrEqual(0.9); // 90% of turns should succeed
      expect(avgTurnTime).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_TIME_MS);
    }, 60000);

    it('should simulate peak usage scenario (game startup rush)', async () => {
      const peakGameCreations = 15;
      const creationInterval = 100; // ms between game creations
      const gameMetrics = [];
      const startTime = process.hrtime.bigint();

      console.log(`Simulating peak usage: ${peakGameCreations} games created rapidly...`);

      // Simulate rapid game creation (startup rush)
      for (let i = 0; i < peakGameCreations; i++) {
        const creationStart = process.hrtime.bigint();

        try {
          const gameData = await createTestGame(2);
          const creationEnd = process.hrtime.bigint();
          const creationTime = Number(creationEnd - creationStart) / 1_000_000;

          gameMetrics.push({
            gameIndex: i,
            gameId: gameData.gameId,
            creationTime,
            success: true
          });

          // Brief pause between creations to simulate realistic timing
          if (i < peakGameCreations - 1) {
            await new Promise(resolve => setTimeout(resolve, creationInterval));
          }
        } catch (error) {
          const creationEnd = process.hrtime.bigint();
          const creationTime = Number(creationEnd - creationStart) / 1_000_000;

          gameMetrics.push({
            gameIndex: i,
            gameId: null,
            creationTime,
            success: false,
            error: error.message
          });
        }
      }

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      const successfulCreations = gameMetrics.filter(m => m.success);
      const failedCreations = gameMetrics.filter(m => !m.success);
      const successRate = successfulCreations.length / peakGameCreations;
      const avgCreationTime = successfulCreations.reduce((sum, m) => sum + m.creationTime, 0) / successfulCreations.length;
      const maxCreationTime = Math.max(...successfulCreations.map(m => m.creationTime));

      console.log(`Peak Usage Simulation Results:
        Game Creation Attempts: ${peakGameCreations}
        Successful Creations: ${successfulCreations.length}
        Failed Creations: ${failedCreations.length}
        Success Rate: ${(successRate * 100).toFixed(2)}%
        Average Creation Time: ${avgCreationTime.toFixed(2)}ms
        Max Creation Time: ${maxCreationTime.toFixed(2)}ms
        Total Time: ${totalTime.toFixed(2)}ms
        Games/Second: ${(successfulCreations.length / (totalTime / 1000)).toFixed(2)}
      `);

      // Cleanup created games
      for (const metric of successfulCreations) {
        try {
          await request(app).delete(`/api/v1/games/${metric.gameId}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      expect(successRate).toBeGreaterThanOrEqual(0.8); // 80% success rate during peak load
      expect(avgCreationTime).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_TIME_MS * 2);
    }, 45000);
  });

  describe('Server Resource Utilization', () => {
    it('should monitor memory usage under sustained load', async () => {
      const duration = 20000; // 20 seconds
      const requestInterval = 100; // Request every 100ms
      const gameId = await createTestGame(2).then(data => data.gameId);

      const startMemory = process.memoryUsage();
      const startTime = process.hrtime.bigint();
      const memorySnapshots = [];
      const requestMetrics = [];

      console.log(`Running sustained load test for ${duration}ms...`);

      let requestCount = 0;
      let isRunning = true;

      // Memory monitoring interval
      const memoryMonitor = setInterval(() => {
        const currentMemory = process.memoryUsage();
        const currentTime = Number(process.hrtime.bigint() - startTime) / 1_000_000;

        memorySnapshots.push({
          timestamp: currentTime,
          heapUsed: currentMemory.heapUsed,
          heapTotal: currentMemory.heapTotal,
          external: currentMemory.external,
          rss: currentMemory.rss
        });
      }, 1000); // Every second

      // Request generation
      const requestGenerator = async () => {
        while (isRunning) {
          const requestStart = process.hrtime.bigint();

          try {
            await request(app)
              .get(`/api/v1/games/${gameId}`)
              .expect(200);

            const requestEnd = process.hrtime.bigint();
            const requestTime = Number(requestEnd - requestStart) / 1_000_000;

            requestMetrics.push({
              requestNumber: requestCount++,
              responseTime: requestTime,
              timestamp: Number(requestEnd - startTime) / 1_000_000,
              success: true
            });
          } catch (error) {
            const requestEnd = process.hrtime.bigint();
            const requestTime = Number(requestEnd - requestStart) / 1_000_000;

            requestMetrics.push({
              requestNumber: requestCount++,
              responseTime: requestTime,
              timestamp: Number(requestEnd - startTime) / 1_000_000,
              success: false
            });
          }

          await new Promise(resolve => setTimeout(resolve, requestInterval));
        }
      };

      // Start request generation
      const requestPromise = requestGenerator();

      // Stop after duration
      setTimeout(() => {
        isRunning = false;
        clearInterval(memoryMonitor);
      }, duration);

      await requestPromise;
      const endMemory = process.memoryUsage();
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      // Analysis
      const successfulRequests = requestMetrics.filter(r => r.success);
      const successRate = successfulRequests.length / requestMetrics.length;
      const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;

      const peakMemory = Math.max(...memorySnapshots.map(s => s.heapUsed));
      const memoryGrowth = endMemory.heapUsed - startMemory.heapUsed;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;

      console.log(`Sustained Load Test Results:
        Duration: ${totalTime.toFixed(2)}ms
        Total Requests: ${requestMetrics.length}
        Successful Requests: ${successfulRequests.length}
        Success Rate: ${(successRate * 100).toFixed(2)}%
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
        Requests/Second: ${(successfulRequests.length / (totalTime / 1000)).toFixed(2)}
        Memory Growth: ${memoryGrowthMB.toFixed(2)}MB
        Peak Memory: ${(peakMemory / 1024 / 1024).toFixed(2)}MB
        Memory Snapshots: ${memorySnapshots.length}
      `);

      // Cleanup
      try {
        await request(app).delete(`/api/v1/games/${gameId}`);
      } catch (error) {
        // Ignore cleanup error
      }

      expect(successRate).toBeGreaterThanOrEqual(LOAD_THRESHOLDS.MIN_SUCCESS_RATE);
      expect(avgResponseTime).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_TIME_MS);
      expect(memoryGrowthMB).toBeLessThan(50); // Memory growth should be reasonable
    }, 30000);

    it('should measure response time degradation under increasing load', async () => {
      const loadSteps = [1, 3, 5, 8, 10]; // Increasing concurrent game counts
      const baselineMetrics = {};
      const loadMetrics = {};

      console.log('Measuring response time degradation under increasing load...');

      for (const concurrentGames of loadSteps) {
        console.log(`Testing with ${concurrentGames} concurrent games...`);

        const gamePromises = [];
        const startTime = process.hrtime.bigint();

        // Create concurrent games
        for (let i = 0; i < concurrentGames; i++) {
          gamePromises.push((async () => {
            const gameData = await createTestGame(2);

            // Make several requests to measure response time
            const requestTimes = [];
            for (let j = 0; j < 10; j++) {
              const reqStart = process.hrtime.bigint();
              await request(app).get(`/api/v1/games/${gameData.gameId}`).expect(200);
              const reqEnd = process.hrtime.bigint();
              requestTimes.push(Number(reqEnd - reqStart) / 1_000_000);
            }

            // Cleanup
            await request(app).delete(`/api/v1/games/${gameData.gameId}`);

            return { gameId: gameData.gameId, requestTimes };
          })());
        }

        const results = await Promise.all(gamePromises);
        const endTime = process.hrtime.bigint();
        const totalTime = Number(endTime - startTime) / 1_000_000;

        // Aggregate metrics
        const allRequestTimes = results.flatMap(r => r.requestTimes);
        const avgResponseTime = allRequestTimes.reduce((sum, time) => sum + time, 0) / allRequestTimes.length;
        const maxResponseTime = Math.max(...allRequestTimes);
        const minResponseTime = Math.min(...allRequestTimes);

        loadMetrics[concurrentGames] = {
          concurrentGames,
          totalTime,
          avgResponseTime,
          maxResponseTime,
          minResponseTime,
          requestCount: allRequestTimes.length
        };

        // Set baseline (first measurement)
        if (concurrentGames === loadSteps[0]) {
          baselineMetrics.avgResponseTime = avgResponseTime;
          baselineMetrics.maxResponseTime = maxResponseTime;
        }

        console.log(`  ${concurrentGames} games: avg=${avgResponseTime.toFixed(2)}ms, max=${maxResponseTime.toFixed(2)}ms`);
      }

      // Calculate degradation
      console.log('\nResponse Time Degradation Analysis:');
      for (const [games, metrics] of Object.entries(loadMetrics)) {
        const avgDegradation = metrics.avgResponseTime / baselineMetrics.avgResponseTime;
        const maxDegradation = metrics.maxResponseTime / baselineMetrics.maxResponseTime;

        console.log(`  ${games} games: avg degradation ${avgDegradation.toFixed(2)}x, max degradation ${maxDegradation.toFixed(2)}x`);

        // Ensure degradation is within acceptable limits
        expect(avgDegradation).toBeLessThan(LOAD_THRESHOLDS.MAX_RESPONSE_DEGRADATION);
      }
    }, 90000);
  });

  describe('Scalability Limits and Recovery', () => {
    it('should find maximum concurrent games capacity', async () => {
      const testLevels = [10, 15, 20, 25, 30]; // Progressive load levels
      let maxCapacity = 0;
      let systemLimitReached = false;

      console.log('Finding maximum server capacity...');

      for (const gameCount of testLevels) {
        console.log(`Testing capacity with ${gameCount} concurrent games...`);

        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        const gamePromises = [];

        // Create games in small batches to avoid overwhelming the system
        const batchSize = 5;
        const batches = Math.ceil(gameCount / batchSize);

        try {
          for (let batch = 0; batch < batches; batch++) {
            const batchPromises = [];
            const gamesInBatch = Math.min(batchSize, gameCount - (batch * batchSize));

            for (let i = 0; i < gamesInBatch; i++) {
              batchPromises.push((async () => {
                const gameData = await createTestGame(2);

                // Perform minimal gameplay to test actual functionality
                await request(app)
                  .post(`/api/v1/games/${gameData.gameId}/actions/draw`)
                  .send({ playerId: gameData.players[0].id });

                return gameData.gameId;
              })());
            }

            const batchResults = await Promise.allSettled(batchPromises);
            gamePromises.push(...batchResults);

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          const endTime = process.hrtime.bigint();
          const endMemory = process.memoryUsage();
          const totalTime = Number(endTime - startTime) / 1_000_000;
          const memoryIncrease = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;

          const successfulGames = gamePromises.filter(p => p.status === 'fulfilled');
          const failedGames = gamePromises.filter(p => p.status === 'rejected');
          const successRate = successfulGames.length / gameCount;

          console.log(`  ${gameCount} games: ${successfulGames.length} successful, ${failedGames.length} failed`);
          console.log(`  Success rate: ${(successRate * 100).toFixed(1)}%, Time: ${totalTime.toFixed(2)}ms, Memory: +${memoryIncrease.toFixed(2)}MB`);

          // Cleanup successful games
          for (const promise of successfulGames) {
            try {
              await request(app).delete(`/api/v1/games/${promise.value}`);
            } catch (error) {
              // Ignore cleanup errors
            }
          }

          // Consider this level successful if success rate is above 70%
          if (successRate >= 0.7) {
            maxCapacity = gameCount;
          } else {
            systemLimitReached = true;
            console.log(`  System limit reached at ${gameCount} concurrent games`);
            break;
          }

        } catch (error) {
          console.log(`  Error at ${gameCount} games: ${error.message}`);
          systemLimitReached = true;
          break;
        }
      }

      console.log(`\nCapacity Test Results:
        Maximum Concurrent Games: ${maxCapacity}
        System Limit Reached: ${systemLimitReached}
        Recommended Capacity: ${Math.floor(maxCapacity * 0.8)} (80% of max for safety)
      `);

      // Should be able to handle at least 10 concurrent games
      expect(maxCapacity).toBeGreaterThanOrEqual(10);
    }, 120000);

    it('should test graceful degradation under extreme load', async () => {
      const extremeGameCount = 50; // Intentionally high to test limits
      const gamePromises = [];
      const startTime = process.hrtime.bigint();

      console.log(`Testing graceful degradation with ${extremeGameCount} concurrent games...`);

      // Attempt to create many games simultaneously
      for (let i = 0; i < extremeGameCount; i++) {
        gamePromises.push((async (gameIndex) => {
          try {
            const gameData = await createTestGame(2);
            return {
              gameIndex,
              gameId: gameData.gameId,
              success: true,
              error: null
            };
          } catch (error) {
            return {
              gameIndex,
              gameId: null,
              success: false,
              error: error.message
            };
          }
        })(i));
      }

      const results = await Promise.allSettled(gamePromises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      // Analyze results
      const fulfilledResults = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const rejectedResults = results.filter(r => r.status === 'rejected');

      const successfulGames = fulfilledResults.filter(r => r.success);
      const failedGames = fulfilledResults.filter(r => !r.success);

      const overallSuccessRate = successfulGames.length / extremeGameCount;

      console.log(`Extreme Load Test Results:
        Attempted Games: ${extremeGameCount}
        Successful Games: ${successfulGames.length}
        Failed Games: ${failedGames.length}
        Rejected Promises: ${rejectedResults.length}
        Success Rate: ${(overallSuccessRate * 100).toFixed(2)}%
        Total Time: ${totalTime.toFixed(2)}ms
        Average Time per Game: ${(totalTime / extremeGameCount).toFixed(2)}ms
      `);

      // Cleanup successful games
      for (const game of successfulGames) {
        try {
          await request(app).delete(`/api/v1/games/${game.gameId}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      // Under extreme load, we should still get some successful games
      // and the server should not crash (indicated by test completion)
      expect(successfulGames.length).toBeGreaterThan(0);
      expect(overallSuccessRate).toBeGreaterThan(0.1); // At least 10% should succeed
    }, 150000);

    it('should measure recovery time after load spikes', async () => {
      console.log('Testing recovery time after load spike...');

      // Create baseline performance
      const baselineGame = await createTestGame(2);
      const baselineStart = process.hrtime.bigint();
      await request(app).get(`/api/v1/games/${baselineGame.gameId}`).expect(200);
      const baselineEnd = process.hrtime.bigint();
      const baselineTime = Number(baselineEnd - baselineStart) / 1_000_000;
      await request(app).delete(`/api/v1/games/${baselineGame.gameId}`);

      console.log(`Baseline response time: ${baselineTime.toFixed(2)}ms`);

      // Create load spike
      const spikeGameCount = 20;
      const spikePromises = [];

      console.log(`Creating load spike with ${spikeGameCount} games...`);

      for (let i = 0; i < spikeGameCount; i++) {
        spikePromises.push((async () => {
          const gameData = await createTestGame(2);
          // Keep games alive during spike
          return gameData.gameId;
        })());
      }

      const spikeResults = await Promise.allSettled(spikePromises);
      const successfulSpikeGames = spikeResults
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      console.log(`Load spike created: ${successfulSpikeGames.length} games active`);

      // Test performance during spike
      const duringSpike = await createTestGame(2);
      const spikeStart = process.hrtime.bigint();
      await request(app).get(`/api/v1/games/${duringSpike.gameId}`).expect(200);
      const spikeEnd = process.hrtime.bigint();
      const spikeTime = Number(spikeEnd - spikeStart) / 1_000_000;
      await request(app).delete(`/api/v1/games/${duringSpike.gameId}`);

      console.log(`Performance during spike: ${spikeTime.toFixed(2)}ms (${(spikeTime / baselineTime).toFixed(2)}x baseline)`);

      // Clean up spike games
      const cleanupStart = process.hrtime.bigint();
      for (const gameId of successfulSpikeGames) {
        try {
          await request(app).delete(`/api/v1/games/${gameId}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      const cleanupEnd = process.hrtime.bigint();
      const cleanupTime = Number(cleanupEnd - cleanupStart) / 1_000_000;

      console.log(`Spike cleanup completed in ${cleanupTime.toFixed(2)}ms`);

      // Test recovery performance
      const recoveryIntervals = [0, 1000, 2000, 5000]; // Test immediately and after delays
      const recoveryTimes = [];

      for (const delay of recoveryIntervals) {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const recoveryGame = await createTestGame(2);
        const recoveryStart = process.hrtime.bigint();
        await request(app).get(`/api/v1/games/${recoveryGame.gameId}`).expect(200);
        const recoveryEnd = process.hrtime.bigint();
        const recoveryTime = Number(recoveryEnd - recoveryStart) / 1_000_000;
        await request(app).delete(`/api/v1/games/${recoveryGame.gameId}`);

        recoveryTimes.push({
          delayMs: delay,
          responseTime: recoveryTime,
          degradationRatio: recoveryTime / baselineTime
        });

        console.log(`Recovery after ${delay}ms: ${recoveryTime.toFixed(2)}ms (${(recoveryTime / baselineTime).toFixed(2)}x baseline)`);
      }

      // Find when performance returns to acceptable levels (within 2x baseline)
      const acceptablePerformance = recoveryTimes.find(r => r.degradationRatio <= 2.0);

      console.log(`Recovery Analysis:
        Baseline: ${baselineTime.toFixed(2)}ms
        During Spike: ${spikeTime.toFixed(2)}ms (${(spikeTime / baselineTime).toFixed(2)}x)
        Recovery to 2x baseline: ${acceptablePerformance ? `${acceptablePerformance.delayMs}ms` : 'Not achieved within test window'}
        Final Performance: ${recoveryTimes[recoveryTimes.length - 1].responseTime.toFixed(2)}ms
      `);

      // Server should recover to reasonable performance within 5 seconds
      expect(acceptablePerformance).toBeTruthy();
      expect(acceptablePerformance.delayMs).toBeLessThanOrEqual(5000);
    }, 120000);
  });

  // Global cleanup to prevent test pollution
  afterEach(async () => {
    try {
      // Clean up any remaining games
      const response = await request(app).get('/api/v1/games');
      if (response.status === 200 && response.body.games) {
        for (const game of response.body.games) {
          try {
            await request(app).delete(`/api/v1/games/${game.id}`);
          } catch (error) {
            // Ignore individual cleanup errors
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors - server might be under stress
    }
  });
});