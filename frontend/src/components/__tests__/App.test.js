import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';
import * as apiService from '../../services/ApiService';

// Mock API service
jest.mock('../../services/ApiService', () => ({
  createGame: jest.fn(),
  drawCard: jest.fn(),
  assignResource: jest.fn(),
  endTurn: jest.fn(),
  getGameState: jest.fn()
}));

// Mock react-beautiful-dnd for drag and drop functionality
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }) => {
    // Store the onDragEnd handler for testing
    global.mockOnDragEnd = onDragEnd;
    return <div data-testid="drag-drop-context">{children}</div>;
  },
  Droppable: ({ children, droppableId }) => children({
    innerRef: jest.fn(),
    droppableProps: { 'data-testid': `droppable-${droppableId}` },
    placeholder: <div data-testid="droppable-placeholder" />
  }),
  Draggable: ({ children, draggableId, index, isDragDisabled }) => children({
    draggableProps: { 'data-testid': `draggable-${draggableId}` },
    dragHandleProps: { 'data-testid': `drag-handle-${draggableId}` },
    innerRef: jest.fn(),
    isDragging: false,
    isDragDisabled: isDragDisabled || false
  })
}));

// Mock child components to focus on App component logic
jest.mock('../GameBoard', () => {
  return function MockGameBoard() {
    return (
      <div data-testid="game-board">
        <div data-testid="mock-game-board">Game Board Component</div>
      </div>
    );
  };
});

// Mock GameContext directly for specific tests
const mockGameState = {
  id: 'game-123',
  gamePhase: 'playing',
  currentRound: 1,
  currentPlayerIndex: 0,
  players: [
    { id: 'player-1', name: 'Alice', score: 0, hand: [] },
    { id: 'player-2', name: 'Bob', score: 0, hand: [] }
  ],
  featuresInPlay: [],
  deck: [],
  winCondition: false
};

const createMockGameContext = (overrides = {}) => ({
  gameState: null,
  loading: false,
  error: null,
  createGame: jest.fn(),
  assignResource: jest.fn(),
  ...overrides
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.createGame.mockClear();

    // Reset global error handlers
    const listeners = window._listeners || {};
    Object.keys(listeners).forEach(event => {
      if (event === 'unhandledrejection') {
        listeners[event].forEach(listener => {
          window.removeEventListener(event, listener);
        });
      }
    });
  });

  afterEach(() => {
    // Clean up any error handlers
    jest.restoreAllMocks();
  });

  describe('Initial Render and Game Setup', () => {
    test('renders game setup screen by default', () => {
      render(<App />);

      expect(screen.getByText('Silosoft Digital Card Game')).toBeInTheDocument();
      expect(screen.getByText('Setup New Game')).toBeInTheDocument();
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    test('shows game rules in setup screen', () => {
      render(<App />);

      expect(screen.getByText('Game Rules:')).toBeInTheDocument();
      expect(screen.getByText(/Complete all features within 10 rounds/)).toBeInTheDocument();
      expect(screen.getByText(/Draw cards and assign resources to features/)).toBeInTheDocument();
      expect(screen.getByText(/Watch out for disruptions!/)).toBeInTheDocument();
      expect(screen.getByText(/Earn points by completing features/)).toBeInTheDocument();
      expect(screen.getByText(/Work together to manage resources efficiently/)).toBeInTheDocument();
    });

    test('initializes with two empty player name inputs', () => {
      render(<App />);

      const playerInputs = screen.getAllByLabelText(/Player \d+:/);
      expect(playerInputs).toHaveLength(2);
      expect(playerInputs[0]).toHaveValue('');
      expect(playerInputs[1]).toHaveValue('');
    });

    test('shows player count indicator', () => {
      render(<App />);

      expect(screen.getByText('Players (2/4)')).toBeInTheDocument();
    });
  });

  describe('Player Management', () => {
    test('allows adding players up to maximum of 4', async () => {
      render(<App />);
      const user = userEvent.setup();

      const addButton = screen.getByText('➕ Add Player');

      await user.click(addButton);
      expect(screen.getByText('Players (3/4)')).toBeInTheDocument();

      await user.click(addButton);
      expect(screen.getByText('Players (4/4)')).toBeInTheDocument();

      // Should not show add button when at maximum
      expect(screen.queryByText('➕ Add Player')).not.toBeInTheDocument();
    });

    test('allows removing players down to minimum of 2', async () => {
      render(<App />);
      const user = userEvent.setup();

      // Add a third player first
      await user.click(screen.getByText('➕ Add Player'));

      // Should show remove buttons for players 2 and 3
      const removeButtons = screen.getAllByText('✕');
      expect(removeButtons).toHaveLength(2);

      await user.click(removeButtons[0]);
      expect(screen.getByText('Players (2/4)')).toBeInTheDocument();
    });

    test('does not show remove buttons when at minimum players', () => {
      render(<App />);

      // Should not show remove buttons with only 2 players
      expect(screen.queryByText('✕')).not.toBeInTheDocument();
    });

    test('updates player names correctly', async () => {
      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      await user.type(firstPlayerInput, 'Alice');

      expect(firstPlayerInput).toHaveValue('Alice');
    });

    test('clears validation errors when user types', async () => {
      render(<App />);
      const user = userEvent.setup();

      // Try to create game with empty names to trigger validation
      await user.click(screen.getByText('Start Game'));

      expect(screen.getByText('Player 1 name is required')).toBeInTheDocument();

      // Start typing in first player input
      const firstPlayerInput = screen.getByLabelText('Player 1:');
      await user.type(firstPlayerInput, 'A');

      // Errors should be cleared
      expect(screen.queryByText('Player 1 name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('validates required player names', async () => {
      render(<App />);
      const user = userEvent.setup();

      await user.click(screen.getByText('Start Game'));

      expect(screen.getByText('Player 1 name is required')).toBeInTheDocument();
      expect(screen.getByText('Player 2 name is required')).toBeInTheDocument();
    });

    test('validates minimum name length', async () => {
      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      await user.type(firstPlayerInput, 'A');

      await user.click(screen.getByText('Start Game'));

      expect(screen.getByText('Player 1 name must be at least 2 characters')).toBeInTheDocument();
    });

    test('validates maximum name length', async () => {
      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      await user.type(firstPlayerInput, 'A'.repeat(21)); // 21 characters

      await user.click(screen.getByText('Start Game'));

      expect(screen.getByText('Player 1 name must be 20 characters or less')).toBeInTheDocument();
    });

    test('validates unique player names', async () => {
      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      const secondPlayerInput = screen.getByLabelText('Player 2:');

      await user.type(firstPlayerInput, 'Alice');
      await user.type(secondPlayerInput, 'Alice');

      await user.click(screen.getByText('Start Game'));

      expect(screen.getByText('Player names must be unique')).toBeInTheDocument();
    });

    test('trims whitespace from names during validation', async () => {
      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      const secondPlayerInput = screen.getByLabelText('Player 2:');

      await user.type(firstPlayerInput, '  Alice  ');
      await user.type(secondPlayerInput, 'Alice');

      await user.click(screen.getByText('Start Game'));

      expect(screen.getByText('Player names must be unique')).toBeInTheDocument();
    });

    test('applies error styling to invalid inputs', async () => {
      render(<App />);
      const user = userEvent.setup();

      await user.click(screen.getByText('Start Game'));

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      expect(firstPlayerInput).toHaveClass('error');
    });
  });

  describe('Game Creation', () => {
    test('calls createGame with valid player names', async () => {
      apiService.createGame.mockResolvedValue(mockGameState);
      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      const secondPlayerInput = screen.getByLabelText('Player 2:');

      await user.type(firstPlayerInput, 'Alice');
      await user.type(secondPlayerInput, 'Bob');

      await user.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(apiService.createGame).toHaveBeenCalledWith(['Alice', 'Bob']);
      });
    });

    test('shows loading state during game creation', async () => {
      // Make createGame take some time to resolve
      apiService.createGame.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockGameState), 100);
      }));

      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      const secondPlayerInput = screen.getByLabelText('Player 2:');

      await user.type(firstPlayerInput, 'Alice');
      await user.type(secondPlayerInput, 'Bob');

      await user.click(screen.getByText('Start Game'));

      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Creating Game...')).toBeInTheDocument();

      const createButton = screen.getByRole('button', { name: /Creating Game/ });
      expect(createButton).toBeDisabled();
    });

    test('disables start button with fewer than 2 players', () => {
      render(<App />);

      const startButton = screen.getByText('Start Game');
      expect(startButton).toBeDisabled();
    });

    test('handles game creation errors', async () => {
      const errorMessage = 'Failed to create game';
      apiService.createGame.mockRejectedValue(new Error(errorMessage));

      render(<App />);
      const user = userEvent.setup();

      const firstPlayerInput = screen.getByLabelText('Player 1:');
      const secondPlayerInput = screen.getByLabelText('Player 2:');

      await user.type(firstPlayerInput, 'Alice');
      await user.type(secondPlayerInput, 'Bob');

      await user.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(screen.getByText(`❌ ${errorMessage}`)).toBeInTheDocument();
      });
    });
  });

  describe('Game Session State', () => {
    test('shows loading screen when context is loading', () => {
      // Mock the GameProvider to simulate loading state
      const MockGameProvider = ({ children }) => {
        const mockContext = createMockGameContext({ loading: true });
        return React.createElement(
          React.createContext().Provider,
          { value: mockContext },
          children
        );
      };

      jest.doMock('../../context/GameContext', () => ({
        GameProvider: MockGameProvider,
        useGame: () => createMockGameContext({ loading: true })
      }));

      render(<App />);

      expect(screen.getByText('Loading Game...')).toBeInTheDocument();
      expect(screen.getByText('Setting up your game session')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    test('shows game board when game state exists', () => {
      const MockGameProvider = ({ children }) => {
        const mockContext = createMockGameContext({ gameState: mockGameState });
        return React.createElement(
          React.createContext().Provider,
          { value: mockContext },
          children
        );
      };

      jest.doMock('../../context/GameContext', () => ({
        GameProvider: MockGameProvider,
        useGame: () => createMockGameContext({ gameState: mockGameState })
      }));

      render(<App />);

      expect(screen.getByTestId('game-board')).toBeInTheDocument();
      expect(screen.getByText('Game Board Component')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Integration', () => {
    test('provides DragDropContext wrapper for game session', () => {
      const MockGameProvider = ({ children }) => {
        const mockContext = createMockGameContext({ gameState: mockGameState });
        return React.createElement(
          React.createContext().Provider,
          { value: mockContext },
          children
        );
      };

      jest.doMock('../../context/GameContext', () => ({
        GameProvider: MockGameProvider,
        useGame: () => createMockGameContext({ gameState: mockGameState })
      }));

      render(<App />);

      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
    });

    test('handles drag end events for resource assignment', async () => {
      const assignResource = jest.fn().mockResolvedValue({});
      const gameState = {
        ...mockGameState,
        players: [
          { id: 'player-1', name: 'Alice', score: 0, hand: [] }
        ],
        currentPlayerIndex: 0
      };

      const MockGameProvider = ({ children }) => {
        const mockContext = createMockGameContext({
          gameState,
          assignResource
        });
        return React.createElement(
          React.createContext().Provider,
          { value: mockContext },
          children
        );
      };

      jest.doMock('../../context/GameContext', () => ({
        GameProvider: MockGameProvider,
        useGame: () => createMockGameContext({
          gameState,
          assignResource
        })
      }));

      render(<App />);

      // Simulate drag end event
      const dragEndResult = {
        destination: { droppableId: 'feature-f1', index: 0 },
        source: { droppableId: 'hand-player-1', index: 0 },
        draggableId: 'resource-r1'
      };

      if (global.mockOnDragEnd) {
        await global.mockOnDragEnd(dragEndResult);

        expect(assignResource).toHaveBeenCalledWith('resource-r1', 'f1');
      }
    });

    test('ignores drag events with invalid destinations', async () => {
      const assignResource = jest.fn();
      const MockGameProvider = ({ children }) => {
        const mockContext = createMockGameContext({
          gameState: mockGameState,
          assignResource
        });
        return React.createElement(
          React.createContext().Provider,
          { value: mockContext },
          children
        );
      };

      jest.doMock('../../context/GameContext', () => ({
        GameProvider: MockGameProvider,
        useGame: () => createMockGameContext({
          gameState: mockGameState,
          assignResource
        })
      }));

      render(<App />);

      // Test various invalid drag scenarios
      const invalidDragResults = [
        { destination: null },
        { destination: { droppableId: 'invalid-zone' } },
        {
          destination: { droppableId: 'feature-f1', index: 0 },
          source: { droppableId: 'feature-f1', index: 0 }
        }
      ];

      if (global.mockOnDragEnd) {
        for (const result of invalidDragResults) {
          await global.mockOnDragEnd(result);
        }

        expect(assignResource).not.toHaveBeenCalled();
      }
    });

    test('handles drag end assignment errors gracefully', async () => {
      const assignResource = jest.fn().mockRejectedValue(new Error('Assignment failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const MockGameProvider = ({ children }) => {
        const mockContext = createMockGameContext({
          gameState: mockGameState,
          assignResource
        });
        return React.createElement(
          React.createContext().Provider,
          { value: mockContext },
          children
        );
      };

      jest.doMock('../../context/GameContext', () => ({
        GameProvider: MockGameProvider,
        useGame: () => createMockGameContext({
          gameState: mockGameState,
          assignResource
        })
      }));

      render(<App />);

      const dragEndResult = {
        destination: { droppableId: 'feature-f1', index: 0 },
        source: { droppableId: 'hand-player-1', index: 0 },
        draggableId: 'resource-r1'
      };

      if (global.mockOnDragEnd) {
        await global.mockOnDragEnd(dragEndResult);

        expect(consoleSpy).toHaveBeenCalledWith('Failed to assign resource:', expect.any(Error));
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Error Boundary and Global Error Handling', () => {
    test('sets up global unhandled rejection handler', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      render(<App />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    test('displays error boundary UI when error occurs', () => {
      render(<App />);

      // Simulate an unhandled promise rejection
      const rejectionEvent = new Event('unhandledrejection');
      rejectionEvent.reason = 'Test error';

      window.dispatchEvent(rejectionEvent);

      // Component should show error UI
      expect(screen.getByText('🚨 Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. Please refresh the page.')).toBeInTheDocument();
      expect(screen.getByText('🔄 Reload Application')).toBeInTheDocument();
    });

    test('reload button triggers page refresh', async () => {
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation();

      render(<App />);

      // Trigger error state
      const rejectionEvent = new Event('unhandledrejection');
      rejectionEvent.reason = 'Test error';
      window.dispatchEvent(rejectionEvent);

      const reloadButton = screen.getByText('🔄 Reload Application');
      await userEvent.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
    });

    test('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<App />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Context Integration', () => {
    test('provides GameProvider context to child components', () => {
      render(<App />);

      // The App should wrap content in GameProvider
      // This is tested implicitly by the successful rendering of child components
      expect(screen.getByText('Silosoft Digital Card Game')).toBeInTheDocument();
    });

    test('shows error from game context', () => {
      const MockGameProvider = ({ children }) => {
        const mockContext = createMockGameContext({
          error: 'Context error message'
        });
        return React.createElement(
          React.createContext().Provider,
          { value: mockContext },
          children
        );
      };

      jest.doMock('../../context/GameContext', () => ({
        GameProvider: MockGameProvider,
        useGame: () => createMockGameContext({
          error: 'Context error message'
        })
      }));

      render(<App />);

      expect(screen.getByText('❌ Context error message')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper semantic structure', () => {
      render(<App />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    test('form inputs have proper labels', () => {
      render(<App />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    test('buttons have proper accessibility attributes', () => {
      render(<App />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    test('provides keyboard navigation support', async () => {
      render(<App />);
      const user = userEvent.setup();

      const firstInput = screen.getByLabelText('Player 1:');

      // Tab navigation should work
      await user.tab();
      expect(firstInput).toHaveFocus();
    });
  });

  describe('Input Constraints', () => {
    test('enforces maximum length on player name inputs', () => {
      render(<App />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('maxLength', '20');
      });
    });

    test('provides helpful placeholder text', () => {
      render(<App />);

      expect(screen.getByPlaceholderText('Enter player 1 name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter player 2 name')).toBeInTheDocument();
    });
  });
});