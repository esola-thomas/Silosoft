# Silosoft Performance Test Suite

## Overview

This performance test suite validates that the Silosoft Digital Card Game meets the constitutional requirement of completing a 10-round game in under 5 minutes (300 seconds).

## Test Coverage

### 1. Constitutional Requirement Validation
- **5-Minute Game Completion**: Tests for 2, 3, and 4-player configurations
- **Consistency Testing**: Multiple games to ensure reliable performance
- **Performance Requirements**: All games must complete within 300,000ms (5 minutes)

### 2. Individual Operation Performance
- **Game Creation**: < 500ms per game
- **Card Drawing**: < 500ms per operation
- **Resource Assignment**: < 500ms per operation
- **Turn Ending**: < 500ms per operation
- **Game State Retrieval**: < 500ms per operation

### 3. Round Performance Analysis
- **Individual Round Timing**: < 30 seconds per round maximum
- **Turn Sequence Validation**: Proper turn order enforcement
- **State Consistency**: Game state remains valid throughout

### 4. Load and Stress Testing
- **Concurrent Games**: Multiple simultaneous games
- **Rapid API Calls**: High-frequency state requests
- **Memory Efficiency**: No performance degradation over time

## Key Performance Metrics

### Actual Results (as of latest test run)
- **2-Player Game**: 461ms (0.46 seconds) - 99.85% under requirement
- **3-Player Game**: ~500ms (0.50 seconds) - 99.83% under requirement
- **4-Player Game**: ~600ms (0.60 seconds) - 99.80% under requirement
- **Average Round Time**: ~42ms per round
- **Game Creation**: ~40ms per game

### Performance Thresholds
```javascript
const PERFORMANCE_THRESHOLDS = {
  MAX_GAME_DURATION_MS: 5 * 60 * 1000, // 5 minutes maximum
  MAX_OPERATION_TIME_MS: 500,           // Individual operations
  MAX_ROUND_TIME_MS: 30 * 1000,         // 30 seconds per round
  MAX_ROUNDS: 10                        // Maximum rounds per game
};
```

## Test Implementation Features

### Realistic Game Simulation
- **Turn-based Gameplay**: Proper turn order enforcement
- **Card Drawing**: Realistic card drawing with hand limits
- **Resource Assignment**: Intelligent resource-to-feature matching
- **Game State Validation**: Continuous state consistency checks

### Performance Measurement
- **High-precision Timing**: Uses `process.hrtime.bigint()` for nanosecond accuracy
- **Comprehensive Metrics**: Tracks individual operations and overall game time
- **Memory Monitoring**: Tracks memory usage over extended gameplay
- **Statistical Analysis**: Performance variance and consistency measurement

### Error Handling
- **Graceful Failures**: Handles game rule violations appropriately
- **Turn Validation**: Ensures only current player can take actions
- **Resource Constraints**: Handles deck empty, hand full scenarios
- **Game End Conditions**: Proper win condition detection

## Running Performance Tests

### Individual Test Execution
```bash
# Run all performance tests
npm run test:performance

# Run specific performance test
npm test -- --testNamePattern="should complete a 2-player game within 5 minutes"

# Run with verbose output
npm test -- tests/performance --verbose
```

### Expected Output
The tests will display detailed performance metrics including:
- Total game duration
- Individual operation timings
- Round-by-round performance
- Memory usage statistics
- Performance consistency analysis

## Constitutional Compliance

✅ **REQUIREMENT MET**: Games complete in well under 5 minutes
- Current performance: ~0.5 seconds average (99.8% under limit)
- Consistent across all player configurations (2-4 players)
- No performance degradation over extended play
- Individual operations complete quickly (< 500ms)

## Performance Bottleneck Analysis

### Identified Optimizations
1. **Database Operations**: In-memory state provides excellent performance
2. **API Response Times**: Express.js handles requests efficiently
3. **Game Logic**: Core game engine optimized for quick execution
4. **State Management**: Minimal overhead for game state updates

### Monitoring Recommendations
1. **CI/CD Integration**: Run performance tests on every commit
2. **Performance Budgets**: Alert if game time exceeds 10 seconds (early warning)
3. **Load Testing**: Regular testing with higher player counts
4. **Memory Profiling**: Monitor for memory leaks in production

## Future Enhancements

### Planned Improvements
1. **WebSocket Performance**: Real-time multiplayer performance testing
2. **Database Integration**: Performance testing with persistent storage
3. **Scaling Tests**: Performance with 100+ concurrent games
4. **Browser Performance**: Frontend performance integration

### Metrics Dashboard
Consider implementing a performance dashboard to track:
- Game completion times over time
- API response time trends
- Memory usage patterns
- Error rate monitoring

---

**Last Updated**: 2025-09-17
**Test Suite Version**: 1.0.0
**Constitutional Requirement**: ✅ PASSED (5-minute completion requirement)