# Silosoft Agent Specialists Documentation

**Last Updated**: 2025-09-15
**Project**: Silosoft Digital Cooperative Card Game
**Total Agents**: 7 specialized agents

## Overview

The Silosoft project uses specialized AI agents to handle different aspects of game development. Each agent has domain expertise and is optimized for specific development tasks. All agents use Claude Code's proven built-in tools for maximum reliability and hackathon speed.

## Available Agent Specialists

### 1. Game Logic Specialist 🎮
**File**: `game-logic-specialist.md`
**Model**: Sonnet
**Primary Use**: Card game mechanics, rule validation, game balance

**Expertise**:
- Card game mechanics design and implementation
- Game rule validation and state management
- Cooperative gameplay systems
- Game balance analysis and testing
- Player experience optimization
- Silosoft-specific workplace theme integration

**When to Use**:
- Implementing card effects and resource management
- Validating game rules and preventing invalid states
- Balancing HR events and feature completion mechanics
- Creating cooperative win conditions
- Debugging game logic and rule inconsistencies

**Example Invocations**:
- "Validate that players can only assign resources they actually have"
- "Balance the layoff event to be challenging but not game-breaking"
- "Implement the Company Competition deadline mechanics"

### 2. Frontend Integration Specialist ⚛️
**File**: `frontend-integration-specialist.md`
**Model**: Sonnet
**Primary Use**: React components, UI/UX, API integration

**Expertise**:
- React/Vue application architecture
- Frontend state management (Context API, Redux)
- API integration and error handling
- Build configuration (Vite, Webpack)
- Responsive design and accessibility

**When to Use**:
- Creating React components for game interface
- Implementing drag-and-drop card interactions
- Integrating frontend with game API
- Setting up build and development workflows
- Optimizing frontend performance

**Example Invocations**:
- "Create a GameBoard component with player hands display"
- "Implement drag-and-drop for card assignment"
- "Set up React Context for game state management"
- "Test the UI components with Playwright browser automation"
- "Get the latest React 18 documentation for proper hook usage"

### 3. DevOps Deployment Specialist 🚀
**File**: `devops-deployment-specialist.md`
**Model**: Sonnet
**Primary Use**: Docker, CI/CD, infrastructure, deployment

**Expertise**:
- Docker containerization and multi-stage builds
- CI/CD pipeline implementation
- Production deployment strategies
- Infrastructure as Code
- Monitoring and observability

**When to Use**:
- Creating Docker containers for frontend and backend
- Setting up GitHub Actions workflows
- Configuring production deployment
- Implementing logging and monitoring
- Security and compliance setup

**Example Invocations**:
- "Create Docker containers for both backend and frontend"
- "Set up CI/CD pipeline for automated testing and deployment"
- "Configure production environment with proper security"

### 4. Performance Testing Specialist ⚡
**File**: `performance-testing-specialist.md`
**Model**: Sonnet
**Primary Use**: Load testing, performance optimization, bottleneck analysis

**Expertise**:
- API performance and load testing
- Database query optimization
- Frontend performance testing
- Concurrent user testing
- Performance monitoring and alerting

**When to Use**:
- Testing game API under load conditions
- Analyzing database performance for game state queries
- Implementing performance benchmarks
- Creating load tests for multiplayer scenarios
- Optimizing game response times

**Example Invocations**:
- "Create performance tests for the game API endpoints"
- "Test concurrent WebSocket connections for multiplayer"
- "Analyze SQLite query performance for game state operations"

### 5. Project Architect 🏗️
**File**: `project-architect.md`
**Model**: Opus (highest capability)
**Primary Use**: Strategic planning, architecture guidance, codebase analysis

**Expertise**:
- System architecture and design patterns
- Codebase analysis and refactoring strategies
- Technical debt identification
- Implementation planning and risk assessment
- Cross-system integration planning

**When to Use**:
- Planning major feature implementations
- Analyzing existing codebase before changes
- Creating architectural decisions and documentation
- Identifying refactoring opportunities
- Strategic technical planning

**Example Invocations**:
- "Analyze the codebase and plan the multiplayer feature implementation"
- "Review the current architecture and suggest improvements"
- "Create an implementation plan for the real-time game updates"

### 6. Python Architect 🐍
**File**: `python-architect.md`
**Model**: Sonnet
**Primary Use**: Python backend development, API design, code quality

**Expertise**:
- Python best practices and design patterns
- API design and implementation
- Code quality and maintainability
- Testing strategies and implementation
- Performance optimization

**When to Use**:
- Implementing Python backend services (if chosen over Node.js)
- Creating API endpoints and business logic
- Refactoring Python code for better architecture
- Implementing comprehensive testing strategies
- Optimizing Python performance

**Example Invocations**:
- "Design the Python API structure for the game backend"
- "Implement the game engine logic with proper testing"
- "Refactor the card service for better maintainability"

### 7. Security Middleware Specialist 🔒
**File**: `security-middleware-specialist.md`
**Model**: Sonnet
**Primary Use**: Authentication, security, middleware, error handling

**Expertise**:
- Authentication and authorization systems
- Security middleware implementation
- CORS configuration and security headers
- Error handling and logging
- API security best practices

**When to Use**:
- Implementing user authentication for multiplayer
- Setting up security middleware for API protection
- Configuring CORS and security headers
- Creating secure error handling systems
- Implementing audit logging

**Example Invocations**:
- "Create authentication middleware for multiplayer sessions"
- "Set up CORS and security headers for production"
- "Implement secure error handling with proper logging"

## Agent Selection Guidelines

### By Development Phase

**Planning & Architecture**:
- Project Architect (strategic planning)
- Game Logic Specialist (game design)

**Implementation**:
- Frontend Integration Specialist (React components)
- Python Architect (backend services)
- Game Logic Specialist (game mechanics)

**Security & Infrastructure**:
- Security Middleware Specialist (auth & security)
- DevOps Deployment Specialist (deployment)

**Testing & Optimization**:
- Performance Testing Specialist (load testing)
- Game Logic Specialist (game testing)

**Production & Maintenance**:
- DevOps Deployment Specialist (deployment)
- Performance Testing Specialist (monitoring)

### By Problem Type

**Game Rules & Mechanics**: Game Logic Specialist
**UI/UX Issues**: Frontend Integration Specialist
**API/Backend Problems**: Python Architect
**Performance Issues**: Performance Testing Specialist
**Security Concerns**: Security Middleware Specialist
**Deployment Problems**: DevOps Deployment Specialist
**Architecture Decisions**: Project Architect

## Usage Examples

### Parallel Agent Execution
```bash
# Run multiple agents simultaneously for different tasks
Task: "Create React components for game board" (Frontend Integration Specialist)
Task: "Implement card validation logic" (Game Logic Specialist)
Task: "Set up performance tests" (Performance Testing Specialist)
```

### Sequential Agent Workflow
```bash
1. Project Architect: "Analyze requirements and create implementation plan"
2. Game Logic Specialist: "Design and implement core game mechanics"
3. Frontend Integration Specialist: "Create UI components for game interface"
4. Performance Testing Specialist: "Test and optimize game performance"
5. DevOps Deployment Specialist: "Deploy game to production"
```

## Tools and Capabilities

All agents have access to Claude Code's built-in tools:
- **File Operations**: Read, Write, Edit, MultiEdit
- **Search & Navigation**: Grep, Glob
- **System Operations**: Bash
- **Development**: Git commands, package management
- **Web Access**: WebFetch, WebSearch
- **Task Management**: TodoWrite

### MCP Server Access

**Available MCP Servers**:
- **Playwright** (`mcp__playwright__*`): Browser automation and testing
- **Context7** (`mcp__context7__*`): Up-to-date documentation retrieval

**Agent MCP Assignments**:
- **Frontend Integration Specialist**: Playwright + Context7 (React/frontend docs + browser testing)
- **Performance Testing Specialist**: Playwright + Context7 (browser performance + testing docs)
- **DevOps Deployment Specialist**: Context7 (infrastructure and deployment docs)
- **Project Architect**: Context7 (architectural patterns and best practices)
- **Game Logic Specialist**: Context7 (game development and JavaScript library docs)
- **Python Architect**: Standard tools only
- **Security Middleware Specialist**: Standard tools only

## Constitutional Compliance

All agents follow Silosoft's constitutional principles:
- **Game-First**: Every decision supports building a playable game
- **Simplicity & Speed**: Focus on hackathon timeline and quick iteration
- **Test-First**: Implement tests before features (non-negotiable)
- **Collaboration**: Mirror the cooperative gameplay in development workflow
- **Observability**: Maintain clear state visibility and debugging capabilities

## Getting Started

1. **Identify the task type** using the guidelines above
2. **Select the appropriate specialist** based on domain expertise
3. **Invoke the agent** with a clear, specific request
4. **Provide context** about the current game development phase
5. **Let the specialist** apply their domain expertise with built-in tools

---

**For Support**: Agents are designed to work autonomously with minimal guidance
**Best Practice**: Use the most specific agent for each task rather than general-purpose approaches
**Performance**: Specialists complete tasks faster and with higher quality than generic agents