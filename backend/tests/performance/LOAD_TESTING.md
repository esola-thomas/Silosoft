# Load Testing Suite - Silosoft Digital Card Game

## Overview

The comprehensive load testing suite validates server performance under various concurrent load conditions, ensuring the Silosoft card game can handle multiple simultaneous players and games without performance degradation.

## Test Coverage

### 1. Concurrent Game Sessions Load Tests

**Purpose**: Test server capacity to handle multiple simultaneous games

#### Light Load (5 concurrent games)
- **Scenario**: 5 simultaneous 2-player games with gameplay simulation
- **Metrics**: Success rate, average response time, memory usage
- **Thresholds**: 95% success rate, <1000ms response time, <100MB memory increase
- **Status**: ✅ PASSING

#### Medium Load (10 concurrent games)
- **Scenario**: 10 simultaneous games with 2-4 players each
- **Metrics**: Response time degradation, error rates, resource consumption
- **Thresholds**: 90% success rate, <1500ms response time
- **Status**: ✅ IMPLEMENTED

#### Heavy Load (20+ concurrent games)
- **Scenario**: Stress test with 20+ simultaneous games
- **Metrics**: System stability, graceful degradation
- **Thresholds**: 70% success rate (acceptable under extreme load)
- **Status**: ✅ IMPLEMENTED

### 2. API Endpoint Load Testing

**Purpose**: Validate individual API endpoints under high request volumes

#### Rapid Successive Calls
- **Test**: 100 rapid requests to same endpoint (GET /games/{id})
- **Metrics**: Response time consistency, success rate
- **Results**: Measures server's ability to handle request bursts
- **Status**: ✅ PASSING

#### Concurrent Mixed Endpoints
- **Test**: Simultaneous calls to different API endpoints
- **Endpoints**: Game retrieval, card draw, turn ending
- **Metrics**: Per-endpoint performance, overall system stability
- **Status**: ✅ IMPLEMENTED

#### Mixed Workload Scenarios
- **Test**: Realistic traffic patterns (50% reads, 30% writes, 20% creates)
- **Metrics**: Workload distribution impact on performance
- **Purpose**: Simulate real-world usage patterns
- **Status**: ✅ IMPLEMENTED

### 3. Realistic User Scenario Testing

**Purpose**: Test real-world usage patterns and player behaviors

#### Multi-Player Game Simulation
- **Scenario**: 8 games with 3 players each, multiple rounds
- **Metrics**: Player turn timing, game completion rates
- **Validation**: Cross-game isolation, no session interference
- **Status**: ✅ IMPLEMENTED

#### Peak Usage Simulation (Startup Rush)
- **Scenario**: 15 games created rapidly (simulating app launch)
- **Metrics**: Game creation rate, system response during peak
- **Purpose**: Validate performance during high user onboarding
- **Status**: ✅ IMPLEMENTED

### 4. Server Resource Utilization

**Purpose**: Monitor system resources under sustained load

#### Memory Usage Monitoring
- **Test**: 20-second sustained load with continuous monitoring
- **Metrics**: Memory growth, heap utilization, garbage collection impact
- **Monitoring**: 1-second interval snapshots
- **Status**: ✅ IMPLEMENTED

#### Response Time Degradation Analysis
- **Test**: Progressive load increase (1, 3, 5, 8, 10 concurrent games)
- **Metrics**: Response time ratios compared to baseline
- **Threshold**: <2x degradation under normal load
- **Status**: ✅ IMPLEMENTED

### 5. Scalability Limits and Recovery

**Purpose**: Identify maximum capacity and test recovery mechanisms

#### Maximum Capacity Testing
- **Test**: Progressive load until system limits reached
- **Levels**: 10, 15, 20, 25, 30 concurrent games
- **Metrics**: Maximum sustainable concurrent games
- **Result**: Identifies deployment capacity planning requirements
- **Status**: ✅ IMPLEMENTED

#### Graceful Degradation Testing
- **Test**: Intentional overload with 50+ concurrent games
- **Metrics**: Error handling, system stability under extreme load
- **Validation**: Server remains responsive, no crashes
- **Status**: ✅ IMPLEMENTED

#### Recovery Time Testing
- **Test**: Performance recovery after load spikes
- **Metrics**: Time to return to baseline performance
- **Threshold**: Recovery within 5 seconds
- **Status**: ✅ IMPLEMENTED

## Key Metrics Tracked

### Performance Metrics
- **Response Time**: Individual API call latency
- **Throughput**: Requests per second capacity
- **Success Rate**: Percentage of successful operations
- **Error Rate**: Failed request percentage

### Resource Metrics
- **Memory Usage**: Heap utilization and growth
- **CPU Utilization**: Processing load under stress
- **Concurrent Capacity**: Maximum simultaneous games supported

### Quality Metrics
- **Performance Degradation**: Response time increase under load
- **Recovery Time**: Time to restore baseline performance
- **Stability**: System uptime and crash resistance

## Load Test Execution

### Running Specific Test Categories

```bash
# All load tests
npm run test:performance -- --testPathPattern=test_load.js

# Light load only
npm run test:performance -- --testNamePattern="light load"

# API endpoint tests
npm run test:performance -- --testNamePattern="API endpoint"

# Scalability tests
npm run test:performance -- --testNamePattern="Scalability"

# Resource monitoring
npm run test:performance -- --testNamePattern="Resource"
```

### Test Configuration

Load test thresholds can be adjusted in the test file:

```javascript
const LOAD_THRESHOLDS = {
  MAX_RESPONSE_TIME_MS: 1000,        // Response time limit
  MAX_RESPONSE_DEGRADATION: 2.0,     // Acceptable degradation ratio
  MIN_SUCCESS_RATE: 0.95,            // Minimum success rate
  MAX_MEMORY_INCREASE_MB: 100,       // Memory growth limit
  CONCURRENT_GAMES_LIGHT: 5,         // Light load game count
  CONCURRENT_GAMES_MEDIUM: 10,       // Medium load game count
  CONCURRENT_GAMES_HEAVY: 20,        // Heavy load game count
};
```

## Expected Results

### Baseline Performance
- **Single Game Response Time**: <50ms
- **Game Creation Time**: <100ms
- **API Call Response Time**: <100ms

### Load Performance Targets
- **5 Concurrent Games**: 95% success rate, <500ms avg response
- **10 Concurrent Games**: 90% success rate, <1000ms avg response
- **20+ Concurrent Games**: 70% success rate (stress test)

### Resource Utilization
- **Memory Growth**: <100MB for 10 concurrent games
- **Performance Degradation**: <2x baseline under normal load
- **Recovery Time**: <5 seconds after load spike

## Deployment Insights

### Capacity Planning
Based on load test results:
- **Recommended Capacity**: 80% of maximum tested capacity
- **Scaling Triggers**: Response time >500ms or success rate <95%
- **Resource Monitoring**: Track memory growth and CPU utilization

### Performance Optimization Areas
1. **Database Query Optimization**: Reduce game state retrieval time
2. **Memory Management**: Optimize game cleanup and garbage collection
3. **Connection Pooling**: Improve concurrent request handling
4. **Caching Strategy**: Cache frequently accessed game data

### Production Monitoring
- **Response Time Alerts**: >1000ms average
- **Error Rate Alerts**: >5% failure rate
- **Memory Alerts**: >200MB growth per hour
- **Capacity Alerts**: >80% of tested maximum load

## Integration with CI/CD

The load testing suite is designed to run as part of performance regression testing:

```yaml
# Example CI configuration
performance-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Run Load Tests
      run: npm run test:performance -- --testPathPattern=test_load.js
    - name: Archive Performance Results
      uses: actions/upload-artifact@v2
      with:
        name: load-test-results
        path: test-results/
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for game cleanup failures
   - Monitor garbage collection efficiency
   - Verify proper session cleanup

2. **Response Time Degradation**
   - Profile database query performance
   - Check for resource contention
   - Verify proper connection pooling

3. **Test Failures Under Load**
   - Increase test timeouts for heavy load scenarios
   - Check system resource availability
   - Verify network stability

### Debugging Tools

```bash
# Run with detailed logging
DEBUG=* npm run test:performance

# Memory profiling
node --inspect test-runner.js

# CPU profiling
node --prof test-runner.js
```

## Future Enhancements

1. **WebSocket Load Testing**: Test real-time multiplayer features
2. **Database Load Testing**: Separate persistence layer testing
3. **Network Simulation**: Test under various network conditions
4. **Automated Capacity Scaling**: Dynamic resource allocation testing
5. **Performance Regression Detection**: Automated performance comparison

---

**File**: `/home/esola-thomas/silosoft/backend/tests/performance/test_load.js`
**Created**: 2025-09-17
**Last Updated**: 2025-09-17