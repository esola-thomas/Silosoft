# Silosoft Digital Cooperative Card Game

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![Jest](https://img.shields.io/badge/Jest-29.7.0-C21325.svg)](https://jestjs.io/)

A collaborative digital card game that simulates workplace challenges in software development teams. Players work together to complete feature projects by strategically managing resources while navigating corporate events like layoffs, reorganizations, and market pressures.

## 🎯 Game Overview

**Silosoft** is a cooperative card game where 2-4 players represent a software development team working to complete features within a 10-round time limit. Success requires teamwork, resource management, and adaptation to unexpected workplace events.

### Core Mechanics
- **🎴 Card Types**: Feature cards (projects to complete), Resource cards (team members), Event cards (workplace disruptions)
- **👥 Cooperative Play**: All players win or lose together
- **⏰ Time Pressure**: Complete all features within 10 rounds
- **🎲 Event System**: Random workplace events add challenge and variety
- **🏆 Scoring**: Earn points by completing features (3, 5, or 8 points)

### Win Conditions
- **Victory**: Complete all feature cards within 10 rounds
- **Defeat**: Fail to complete all features when time runs out

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/esola-thomas/silosoft.git
   cd silosoft
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on `http://localhost:3001`

2. **Start the frontend application** (in a new terminal)
   ```bash
   cd frontend
   npm start
   ```
   Application opens at `http://localhost:3000`

3. **Play the game**
   - Open `http://localhost:3000` in your browser
   - Create a new game with 2-4 player names
   - Share join codes with teammates
   - Start playing cooperatively!

## 📁 Project Structure

```
silosoft/
├── 📄 README.md                    # This file
├── 📁 backend/                     # Node.js Express API Server
│   ├── 📁 src/
│   │   ├── 🔧 app.js              # Express application setup
│   │   ├── 📁 models/             # Game entities (GameState, Cards, Player)
│   │   ├── 📁 services/           # Business logic (GameEngine, CardService)
│   │   ├── 📁 routes/             # API endpoints
│   │   ├── 📁 middleware/         # CORS, validation, error handling
│   │   └── 📁 utils/              # Utility functions
│   ├── 📁 tests/                  # Test suites
│   │   ├── 📁 unit/               # Component unit tests
│   │   ├── 📁 integration/        # API integration tests
│   │   ├── 📁 contract/           # API contract tests
│   │   └── 📁 performance/        # Load and performance tests
│   └── 📦 package.json            # Backend dependencies
├── 📁 frontend/                    # React Single Page Application
│   ├── 📁 src/
│   │   ├── 🎨 App.js              # Main application component
│   │   ├── 📁 components/         # React UI components
│   │   ├── 📁 context/            # React Context for state management
│   │   ├── 📁 services/           # API service layer
│   │   └── 📁 tests/              # Frontend test suites
│   ├── 📁 public/                 # Static assets
│   └── 📦 package.json            # Frontend dependencies
├── 📁 specs/                      # Project specifications
│   └── 📁 feat/001-Silosoft-MVP/  # MVP feature specification
│       ├── 📋 spec.md             # Functional requirements
│       ├── 🗂️ data-model.md       # Data structures
│       ├── ⚡ quickstart.md       # Testing guide
│       └── 📋 contracts/          # API contracts (OpenAPI)
└── 📁 shared/                     # Shared resources
    └── 📁 schemas/                # Card definitions and game data
```

## 🏗️ Architecture

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Language**: JavaScript (ES6+)
- **Testing**: Jest 29.7.0 with Supertest
- **Validation**: Express-validator + AJV
- **Logging**: Winston

**Key Components:**

1. **GameEngine** (`src/services/GameEngine.js`)
   - Core game logic and rule enforcement
   - Player session management
   - Game state persistence
   - Event processing

2. **GameState** (`src/models/GameState.js`)
   - Game state management
   - Turn progression
   - Win/loss condition checking
   - Player hand management

3. **Card Models** (`src/models/`)
   - `FeatureCard`: Project requirements and scoring
   - `ResourceCard`: Team member roles and levels
   - `EventCard`: Workplace disruption effects
   - `CardFactory`: Deck creation and card generation

4. **API Routes** (`src/routes/`)
   - `/api/v1/games` - Game creation and retrieval
   - `/api/v1/games/:id/actions/*` - Game actions (draw, assign, end turn)

**API Design:**
- RESTful endpoints following OpenAPI 3.0 specification
- JSON request/response format
- Comprehensive error handling with HTTP status codes
- Request validation middleware

### Frontend Architecture

**Technology Stack:**
- **Library**: React 18.2.0
- **Language**: JavaScript (ES6+) with JSX
- **HTTP Client**: Axios 1.6.2
- **Drag & Drop**: @hello-pangea/dnd 16.6.0
- **Testing**: React Testing Library + Jest
- **Build Tool**: Create React App

**Key Components:**

1. **App.js** - Main application router and error boundary
2. **GameContext** (`src/context/GameContext.js`)
   - Global state management
   - API action dispatching
   - Session persistence
   - Real-time game updates

3. **UI Components** (`src/components/`)
   - `GameBoard`: Main game interface
   - `GameLobby`: Pre-game player management
   - `Card`: Individual card rendering with drag/drop
   - `FeatureDisplay`: Feature cards with progress tracking

4. **Services** (`src/services/`)
   - `ApiService`: HTTP client for backend communication

**State Management:**
- React Context + useReducer for global state
- Local component state for UI-specific data
- Session storage for player authentication persistence
- Automatic polling for real-time updates during lobby phase

## 🎮 Game Rules

### Setup Phase
1. **Game Creation**: Host creates game with 2-4 player names
2. **Player Joining**: Players join using 6-character join codes
3. **Deck Preparation**: 50 cards shuffled (15 features, 27 resources, 8 events)
4. **Initial Deal**: 3 feature cards placed in play, remaining cards in deck

### Gameplay Phase

**Turn Structure:**
1. **Draw Phase**: Active player draws 1 card from deck
2. **Action Phase**: Assign resources to features (optional)
3. **End Turn**: Advance to next player

**Card Types:**

**🎯 Feature Cards** (15 total)
- Represent software projects needing completion
- Require specific resource combinations (Dev/PM/UX roles)
- Point values: 3 (Basic), 5 (Complex), 8 (Epic)
- Examples: User Login (3pts), Dashboard (5pts), Mobile App (8pts)

**👥 Resource Cards** (27 total)
- Represent team members with roles and experience levels
- **Roles**: Developer (Dev), Product Manager (PM), UX Designer (UX)
- **Levels**: Entry (1 point), Junior (2 points), Senior (3 points)
- **Distribution**: 9 cards per role, 3 cards per level

**⚡ Event Cards** (8 total)
- Workplace disruptions affecting gameplay
- **Layoff**: Discard random resource cards
- **PTO/PLM**: Lock resources for 2 rounds
- **Competition**: Deadline pressure with bonus/penalty
- **Bonus**: Draw extra resource cards

### Resource Assignment Rules
1. Resources must match feature role requirements
2. Once assigned, resources cannot be reassigned
3. Features complete when all requirements met
4. Completed features award points to contributing players
5. New features replace completed ones

### Special Mechanics

**Contractor Cards**: Temporary high-value resources from event cards
**Resource Locking**: PTO/PLM events make resources temporarily unavailable
**Deadline Pressure**: Competition events create bonus/penalty scenarios
**Collaborative Scoring**: All players contribute to team victory

## 🧪 Testing

### Backend Testing Strategy

**Test Categories:**
- **Unit Tests**: Individual component logic
- **Integration Tests**: API endpoint functionality
- **Contract Tests**: API specification compliance
- **Performance Tests**: Load testing and optimization

**Coverage Requirements:**
- Lines: >80%
- Functions: >80%
- Branches: >80%
- Statements: >80%

**Running Backend Tests:**
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:contract
npm run test:performance

# Watch mode
npm run test:watch
```

### Frontend Testing Strategy

**Test Categories:**
- **Component Tests**: UI component rendering and interaction
- **Integration Tests**: Context and service integration
- **User Flow Tests**: End-to-end user scenarios
- **Accessibility Tests**: Screen reader and keyboard navigation

**Testing Tools:**
- React Testing Library for component testing
- Jest for test running and assertions
- @testing-library/user-event for user interaction simulation
- Mock implementations for drag-and-drop functionality

**Running Frontend Tests:**
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Interactive watch mode
npm test -- --watch
```

### Test Data

The project includes comprehensive test data:
- Mock game states for various scenarios
- Sample card combinations for feature completion
- Edge case scenarios (empty deck, max rounds, etc.)
- Error conditions and validation failures

## 🔧 Development

### Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   npm run dev        # Start with nodemon hot reload
   npm run lint       # ESLint code quality check
   npm run format     # Prettier code formatting
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm start          # Start development server
   npm run lint       # ESLint code quality check
   npm run format     # Prettier code formatting
   ```

### Code Quality Tools

**ESLint Configuration:**
- Extends recommended rules for Node.js and React
- Jest-specific rules for test files
- Prettier integration for consistent formatting

**Prettier Configuration:**
- 2-space indentation
- Single quotes for strings
- Trailing commas where valid
- Automatic semicolon insertion

### Environment Variables

**Backend** (optional):
```bash
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development         # Environment mode
```

**Frontend** (optional):
```bash
REACT_APP_API_URL=http://localhost:3001  # Backend API URL
```

### API Documentation

The backend implements OpenAPI 3.0 specification:
- **Contract**: `specs/feat/001-Silosoft-MVP/contracts/game-api.yaml`
- **Validation**: Automatic request/response validation
- **Documentation**: Self-documenting endpoints

**Key Endpoints:**
- `POST /api/v1/games` - Create new game
- `GET /api/v1/games/:id` - Get game state
- `POST /api/v1/games/:id/actions/draw` - Draw card
- `POST /api/v1/games/:id/actions/assign` - Assign resource
- `POST /api/v1/games/:id/actions/end-turn` - End turn

## 🎯 Game Design

### Balancing Mechanics

**Resource Distribution:**
- Equal distribution across roles (9 Dev, 9 PM, 9 UX)
- Pyramidal level distribution (3 Entry, 3 Junior, 3 Senior per role)
- Promotes diverse team composition strategies

**Feature Complexity:**
- Basic features (3pts): Single-role focused, quick completion
- Complex features (5pts): Multi-role collaboration required
- Epic features (8pts): Full team coordination needed

**Event Frequency:**
- 8 event cards in 50-card deck (16% probability)
- Mix of negative (layoffs, PTO) and positive (bonus) events
- Balanced risk/reward for strategic depth

### Cooperative Elements

**Shared Victory Condition**: All players win or lose together
**Resource Sharing**: Players can assign resources to any feature
**Turn Order Flexibility**: Strategic timing of actions matters
**Information Transparency**: All game state visible to all players

## 🐛 Troubleshooting

### Common Issues

**Backend Server Won't Start:**
```bash
# Check if port 3001 is available
lsof -i :3001

# Kill process using port
kill -9 <PID>

# Clear npm cache
npm cache clean --force
```

**Frontend Won't Connect to Backend:**
```bash
# Verify backend is running
curl http://localhost:3001/health

# Check CORS configuration
# Backend includes CORS middleware for localhost:3000
```

**Game State Issues:**
```bash
# Clear browser localStorage
localStorage.clear()

# Check browser console for errors
# Enable network tab to monitor API calls
```

**Test Failures:**
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests in verbose mode
npm test -- --verbose

# Update snapshots if needed
npm test -- --updateSnapshot
```

### Performance Optimization

**Backend:**
- Game state stored in memory (consider Redis for production)
- Request validation with efficient schemas
- Error handling with proper HTTP status codes

**Frontend:**
- React.memo for component memoization
- Drag and drop performance optimizations
- Efficient polling intervals for real-time updates

## 🚀 Deployment

### Production Considerations

**Backend Deployment:**
```bash
# Build production bundle
npm run build

# Set production environment
export NODE_ENV=production

# Use process manager (PM2)
npm install -g pm2
pm2 start src/app.js --name silosoft-backend
```

**Frontend Deployment:**
```bash
# Build static assets
npm run build

# Serve with static file server
npm install -g serve
serve -s build -l 3000
```

**Environment Configuration:**
- Set appropriate CORS origins for production
- Configure proper API URLs
- Enable production logging
- Set up database persistence (currently in-memory)

### Scaling Considerations

**Multi-Instance Support:**
- Game state currently in memory (single instance)
- Consider Redis or database for shared state
- Session management across instances

**Performance Monitoring:**
- Add metrics collection
- Monitor API response times
- Track game completion statistics

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run linting and formatting
5. Submit pull request

### Project Roadmap

**Phase 1**: MVP Implementation ✅
- Core game mechanics
- Basic UI components
- Local multiplayer support

**Phase 2**: Enhancement (Planned)
- Real-time multiplayer with WebSockets ✅
- Player statistics and history
- Advanced event cards
- Mobile-responsive design improvements

**Phase 3**: Expansion (Future)
- Custom card sets
- Tournament mode
- AI opponents
- Community features

---
