# Frontend Component Testing Guide - Silosoft Card Game

## Overview

This guide outlines the comprehensive testing strategies implemented for the Silosoft Digital Card Game frontend components. The testing approach focuses on ensuring reliability, maintainability, and user experience quality across all components.

## Testing Philosophy

### Core Principles
1. **User-Centric Testing**: Test from the user's perspective, focusing on behavior rather than implementation
2. **Comprehensive Coverage**: Cover critical functionality, edge cases, and error scenarios
3. **Maintainable Tests**: Write clear, focused tests that are easy to understand and maintain
4. **Performance Awareness**: Test component performance and optimization features
5. **Accessibility First**: Ensure all components meet accessibility standards

### Testing Pyramid Structure
- **Unit Tests**: Individual component functionality and logic
- **Integration Tests**: Component interaction with context and services
- **User Interaction Tests**: User workflows and drag-and-drop functionality

## Testing Stack

### Core Libraries
- **React Testing Library**: Primary testing framework for component rendering and interaction
- **Jest**: Test runner and assertion library
- **@testing-library/user-event**: Realistic user interaction simulation
- **@testing-library/jest-dom**: Enhanced DOM assertions

### Mocking Strategy
- **API Services**: Mock external API calls for consistent testing
- **React Beautiful DnD**: Mock drag-and-drop library for interaction testing
- **Context Providers**: Mock game context for isolated component testing

## Component Testing Strategies

### 1. Card Component (Already Implemented)

**Key Areas Tested:**
- Rendering different card types (Feature, Resource, Event)
- Visual states (selected, disabled, completed)
- Drag and drop functionality
- Accessibility features
- Error handling for malformed data

**Testing Patterns:**
```javascript
// Rendering tests with mock data
const mockCard = { id: 'test', cardType: 'resource', role: 'dev' };
render(<Card card={mockCard} />);

// Interaction testing
fireEvent.click(screen.getByRole('button'));
expect(mockClickHandler).toHaveBeenCalledWith(mockCard);

// Drag and drop mocking
jest.mock('react-beautiful-dnd', () => ({
  Draggable: ({ children, isDragDisabled }) => children({ ... })
}));
```

### 2. GameBoard Component

**Key Areas Tested:**
- **State Management**: Loading states, error handling, game phase transitions
- **Player Management**: Hand display, player switching, unavailable resources
- **Game Controls**: Draw card, end turn, button states and validation
- **Drag and Drop Integration**: Resource assignment flow
- **Scoreboard**: Player information, current turn indicators
- **Responsive Layout**: Sidebar, main content, hands section

**Critical Test Categories:**

**Loading and State Management:**
```javascript
test('shows loading spinner when loading without game state', () => {
  renderGameBoard({ loading: true, gameState: null });
  expect(screen.getByText('Loading game...')).toBeInTheDocument();
});
```

**Game Controls:**
```javascript
test('calls drawCard when draw button is clicked', async () => {
  const drawCard = jest.fn().mockResolvedValue({});
  renderGameBoard({ drawCard });
  await userEvent.click(screen.getByText('Draw Card'));
  expect(drawCard).toHaveBeenCalledTimes(1);
});
```

**Player Hand Management:**
```javascript
test('shows cards in hand with correct properties', () => {
  renderGameBoard();
  const card = screen.getByTestId('card-r1');
  expect(card).toHaveAttribute('data-draggable', 'true');
  expect(card).toHaveAttribute('data-in-hand', 'true');
});
```

### 3. FeatureDisplay Component

**Key Areas Tested:**
- **Progress Calculation**: Resource assignment progress, completion status
- **Requirement Tracking**: Progress bars, role-based requirements
- **Drop Zone Functionality**: Drag and drop target areas
- **Layout Variations**: Grid, list, compact layouts
- **Assignment Visualization**: Resource display, completion indicators

**Critical Test Categories:**

**Progress Calculation:**
```javascript
test('calculates progress correctly for partially assigned features', () => {
  renderFeatureDisplay();
  // Dashboard has 4/5 requirements met = 80%
  expect(screen.getByText('80%')).toBeInTheDocument();
});
```

**Drop Zone Management:**
```javascript
test('disables drop zones when not my turn', () => {
  mockGameContext.isMyTurn = false;
  renderFeatureDisplay();
  const dropZones = screen.getAllByTestId(/^droppable-feature-/);
  dropZones.forEach(zone => {
    expect(zone).toHaveAttribute('data-drop-disabled', 'true');
  });
});
```

**Layout Flexibility:**
```javascript
test('renders cards with correct size for compact layout', () => {
  renderFeatureDisplay({ layout: 'compact' });
  const cards = screen.getAllByTestId(/^card-f/);
  cards.forEach(card => {
    expect(card).toHaveAttribute('data-size', 'small');
  });
});
```

### 4. App Component

**Key Areas Tested:**
- **Routing Logic**: Setup screen vs. game session transitions
- **Form Validation**: Player name validation, error handling
- **Game Creation**: API integration, loading states
- **Error Boundary**: Global error handling, recovery mechanisms
- **Context Integration**: GameProvider wrapper, state management

**Critical Test Categories:**

**Form Validation:**
```javascript
test('validates unique player names', async () => {
  render(<App />);
  // Set duplicate names
  await userEvent.type(firstPlayerInput, 'Alice');
  await userEvent.type(secondPlayerInput, 'Alice');
  await userEvent.click(screen.getByText('Start Game'));
  expect(screen.getByText('Player names must be unique')).toBeInTheDocument();
});
```

**State Transitions:**
```javascript
test('shows game board when game state exists', () => {
  const mockContext = createMockGameContext({ gameState: mockGameState });
  render(<App />);
  expect(screen.getByTestId('game-board')).toBeInTheDocument();
});
```

**Error Boundary:**
```javascript
test('displays error boundary UI when error occurs', () => {
  render(<App />);
  const rejectionEvent = new Event('unhandledrejection');
  window.dispatchEvent(rejectionEvent);
  expect(screen.getByText('🚨 Something went wrong')).toBeInTheDocument();
});
```

## Testing Patterns and Best Practices

### 1. Component Mocking Strategy

**Mock External Dependencies:**
```javascript
// Mock API services
jest.mock('../../services/ApiService', () => ({
  createGame: jest.fn(),
  assignResource: jest.fn(),
  drawCard: jest.fn()
}));

// Mock complex libraries
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({ ... }),
  Draggable: ({ children }) => children({ ... })
}));
```

**Mock Child Components:**
```javascript
jest.mock('../ChildComponent', () => {
  return function MockChildComponent({ prop1, prop2 }) {
    return (
      <div data-testid="mock-child">
        <div data-testid="prop1">{prop1}</div>
        <div data-testid="prop2">{prop2}</div>
      </div>
    );
  };
});
```

### 2. Context Testing

**Mock Game Context:**
```javascript
const createMockGameContext = (overrides = {}) => ({
  gameState: null,
  loading: false,
  error: null,
  drawCard: jest.fn(),
  assignResource: jest.fn(),
  ...overrides
});

const renderWithMockContext = (component, contextOverrides = {}) => {
  const contextValue = createMockGameContext(contextOverrides);
  jest.doMock('../../context/GameContext', () => ({
    useGame: () => contextValue,
    GameProvider: ({ children }) => children
  }));
  return render(component);
};
```

### 3. Async Interaction Testing

**User Events:**
```javascript
test('handles async user interactions', async () => {
  const user = userEvent.setup();
  const mockFunction = jest.fn().mockResolvedValue({});

  render(<Component onAction={mockFunction} />);

  await user.click(screen.getByText('Action Button'));

  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

**Error Handling:**
```javascript
test('handles errors gracefully', async () => {
  const mockFunction = jest.fn().mockRejectedValue(new Error('Test error'));
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  render(<Component onAction={mockFunction} />);
  await userEvent.click(screen.getByText('Action Button'));

  expect(consoleSpy).toHaveBeenCalledWith('Error message:', expect.any(Error));
  consoleSpy.mockRestore();
});
```

### 4. Drag and Drop Testing

**Mock DnD Library:**
```javascript
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }) => {
    global.mockOnDragEnd = onDragEnd;
    return <div data-testid="drag-drop-context">{children}</div>;
  },
  Droppable: ({ children, droppableId, isDropDisabled }) => children({
    innerRef: jest.fn(),
    droppableProps: { 'data-testid': `droppable-${droppableId}` },
    placeholder: <div data-testid="placeholder" />
  }, { isDraggingOver: false })
}));
```

**Test Drag Events:**
```javascript
test('handles drag end events', async () => {
  const assignResource = jest.fn();
  render(<Component assignResource={assignResource} />);

  const dragResult = {
    destination: { droppableId: 'feature-f1' },
    source: { droppableId: 'hand-player-1' },
    draggableId: 'resource-r1'
  };

  if (global.mockOnDragEnd) {
    await global.mockOnDragEnd(dragResult);
    expect(assignResource).toHaveBeenCalledWith('resource-r1', 'f1');
  }
});
```

## Test Organization

### File Structure
```
src/components/__tests__/
├── Card.test.js              # Card component tests
├── GameBoard.test.js         # GameBoard component tests
├── FeatureDisplay.test.js    # FeatureDisplay component tests
├── App.test.js              # App component tests
└── TESTING_GUIDE.md         # This documentation
```

### Test Structure Pattern
```javascript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Basic rendering tests
  });

  describe('User Interactions', () => {
    // Click, type, drag events
  });

  describe('State Management', () => {
    // State changes, context integration
  });

  describe('Error Handling', () => {
    // Error scenarios, edge cases
  });

  describe('Accessibility', () => {
    // ARIA attributes, keyboard navigation
  });

  describe('Performance', () => {
    // Memoization, optimization
  });
});
```

## Running Tests

### Command Line Options
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test GameBoard.test.js

# Run tests matching pattern
npm test -- --testNamePattern="drag"
```

### Coverage Goals
- **Lines**: >90%
- **Functions**: >90%
- **Branches**: >85%
- **Statements**: >90%

## Common Testing Scenarios

### 1. Loading States
```javascript
test('shows loading indicator', () => {
  render(<Component loading={true} />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### 2. Error States
```javascript
test('displays error message', () => {
  render(<Component error="Error message" />);
  expect(screen.getByText('Error message')).toBeInTheDocument();
});
```

### 3. Empty States
```javascript
test('shows empty state when no data', () => {
  render(<Component data={[]} />);
  expect(screen.getByText('No data available')).toBeInTheDocument();
});
```

### 4. Form Validation
```javascript
test('validates required fields', async () => {
  render(<Form />);
  await userEvent.click(screen.getByText('Submit'));
  expect(screen.getByText('Field is required')).toBeInTheDocument();
});
```

### 5. Conditional Rendering
```javascript
test('shows admin controls for admin users', () => {
  render(<Component user={{ role: 'admin' }} />);
  expect(screen.getByText('Admin Panel')).toBeInTheDocument();
});
```

## Accessibility Testing

### ARIA Attributes
```javascript
test('provides proper ARIA labels', () => {
  render(<Component />);
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-label');
});
```

### Keyboard Navigation
```javascript
test('supports keyboard navigation', async () => {
  render(<Component />);
  await userEvent.tab();
  expect(screen.getByRole('button')).toHaveFocus();
});
```

### Screen Reader Support
```javascript
test('provides descriptive text for screen readers', () => {
  render(<Component />);
  expect(screen.getByText('Loading, please wait')).toBeInTheDocument();
});
```

## Performance Testing

### Memoization
```javascript
test('component is memoized correctly', () => {
  const { rerender } = render(<Component prop="value" />);
  rerender(<Component prop="value" />);
  // Component should not re-render unnecessarily
});
```

### Large Data Sets
```javascript
test('handles large data sets efficiently', () => {
  const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
  render(<Component data={largeDataSet} />);
  expect(screen.getByText('1000 items')).toBeInTheDocument();
});
```

## Debugging Tests

### Console Debugging
```javascript
test('debug test output', () => {
  render(<Component />);
  screen.debug(); // Print current DOM
  screen.debug(screen.getByRole('button')); // Print specific element
});
```

### Query Debugging
```javascript
test('find elements for debugging', () => {
  render(<Component />);

  // Available queries
  screen.getByRole('button');
  screen.getByText('Click me');
  screen.getByTestId('my-component');
  screen.getByLabelText('Username');

  // Query variants
  screen.queryByText('Maybe exists'); // Returns null if not found
  screen.findByText('Async element'); // Waits for element
});
```

## Continuous Integration

### Test Pipeline
1. **Lint**: ESLint checks for code quality
2. **Test**: Jest runs all test suites
3. **Coverage**: Generate coverage reports
4. **Build**: Ensure tests pass before build

### Coverage Reporting
```bash
# Generate coverage report
npm run test:coverage

# Coverage files generated:
coverage/
├── lcov-report/index.html    # HTML report
├── lcov.info                # LCOV format
└── coverage-final.json      # JSON format
```

This comprehensive testing strategy ensures the Silosoft Card Game frontend maintains high quality, reliability, and user experience across all components and user interactions.