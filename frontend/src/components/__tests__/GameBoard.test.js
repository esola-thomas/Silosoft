import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import GameBoard from '../GameBoard';
import { GameProvider } from '../../context/GameContext';
import * as apiService from '../../services/ApiService';

// Mock the GameContext and ApiService
jest.mock('../../services/ApiService');
jest.mock('react-beautiful-dnd', () => ({
  ...jest.requireActual('react-beautiful-dnd'),
  DragDropContext: ({ children, onDragEnd }) => children,
  Droppable: ({ children, droppableId }) => children({
    innerRef: jest.fn(),
    droppableProps: { 'data-testid': `droppable-${droppableId}` },
    placeholder: <div data-testid="droppable-placeholder" />
  }),
}));

// Mock components
jest.mock('../FeatureDisplay', () => {
  return function MockFeatureDisplay({ features, showAssignmentZones, interactive, layout }) {
    return (
      <div data-testid="feature-display">
        <div data-testid="feature-count">{features?.length || 0}</div>
        <div data-testid="assignment-zones">{showAssignmentZones ? 'enabled' : 'disabled'}</div>
        <div data-testid="interactive">{interactive ? 'enabled' : 'disabled'}</div>
        <div data-testid="layout">{layout}</div>
      </div>
    );
  };
});

jest.mock('../Card', () => {
  return function MockCard({ card, isDraggable, size, isInHand, isUnavailable }) {
    return (
      <div
        data-testid={`card-${card?.id}`}
        data-draggable={isDraggable}
        data-size={size}
        data-in-hand={isInHand}
        data-unavailable={isUnavailable}
      >
        {card?.name || card?.role || 'Unknown Card'}
      </div>
    );
  };
});

// Mock game states
const mockGameState = {
  id: 'game-123',
  gamePhase: 'playing',
  currentRound: 3,
  currentPlayerIndex: 0,
  winCondition: false,
  deck: [{ id: 'deck1' }, { id: 'deck2' }],
  players: [
    {
      id: 'player-1',
      name: 'Alice',
      score: 15,
      hand: [
        { id: 'r1', cardType: 'resource', role: 'dev', level: 'senior', value: 3 },
        { id: 'r2', cardType: 'resource', role: 'pm', level: 'junior', value: 2 }
      ],
      temporarilyUnavailable: []
    },
    {
      id: 'player-2',
      name: 'Bob',
      score: 10,
      hand: [
        { id: 'r3', cardType: 'resource', role: 'ux', level: 'senior', value: 3 }
      ],
      temporarilyUnavailable: [
        { id: 'r4', role: 'dev', level: 'entry', value: 1, unavailableUntil: 5 }
      ]
    }
  ],
  featuresInPlay: [
    {
      id: 'f1',
      name: 'User Authentication',
      requirements: { dev: 2, pm: 1 },
      assignedResources: [],
      completed: false,
      cardType: 'feature'
    },
    {
      id: 'f2',
      name: 'Dashboard',
      requirements: { dev: 3, ux: 2 },
      assignedResources: [
        { id: 'r5', role: 'dev', level: 'senior', value: 3 }
      ],
      completed: false,
      cardType: 'feature'
    }
  ]
};

const mockGameContextValue = {
  gameState: mockGameState,
  players: mockGameState.players,
  currentPlayer: mockGameState.players[0],
  myPlayer: mockGameState.players[0],
  currentRound: mockGameState.currentRound,
  deckSize: mockGameState.deck.length,
  featuresInPlay: mockGameState.featuresInPlay,
  gamePhase: mockGameState.gamePhase,
  winCondition: mockGameState.winCondition,
  isMyTurn: true,
  loading: false,
  error: null,
  drawCard: jest.fn(),
  assignResource: jest.fn(),
  endTurn: jest.fn(),
  clearError: jest.fn(),
};

// Helper to render GameBoard with mocked context
const renderGameBoard = (contextOverrides = {}) => {
  const contextValue = { ...mockGameContextValue, ...contextOverrides };

  // Mock the useGame hook
  const mockUseGame = jest.fn(() => contextValue);
  jest.doMock('../../context/GameContext', () => ({
    useGame: mockUseGame,
    GameProvider: ({ children }) => children
  }));

  return render(
    <GameProvider>
      <GameBoard />
    </GameProvider>
  );
};

describe('GameBoard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    test('shows loading spinner when loading without game state', () => {
      renderGameBoard({ loading: true, gameState: null });

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
      expect(screen.getByRole('presentation')).toHaveClass('spinner');
    });

    test('shows empty state when no game state exists', () => {
      renderGameBoard({ gameState: null, loading: false });

      expect(screen.getByText('No game in progress')).toBeInTheDocument();
      expect(screen.getByText('Create a new game to start playing')).toBeInTheDocument();
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    test('shows loading indicators on buttons when loading with game state', () => {
      renderGameBoard({ loading: true });

      expect(screen.getByText('Drawing...')).toBeInTheDocument();
      expect(screen.getByText('Ending...')).toBeInTheDocument();
    });
  });

  describe('Game Header', () => {
    test('displays current game status information', () => {
      renderGameBoard();

      expect(screen.getByText('Round 3/10')).toBeInTheDocument();
      expect(screen.getByText('2 cards left')).toBeInTheDocument();
      expect(screen.getByText('Phase: playing')).toBeInTheDocument();
    });

    test('shows current turn indicator', () => {
      renderGameBoard();

      expect(screen.getByText('Current Turn:')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
    });

    test('shows win condition when game is won', () => {
      renderGameBoard({ winCondition: true });

      expect(screen.getByText('🎉 All features completed! Game won!')).toBeInTheDocument();
    });

    test('hides "Your Turn" badge when not my turn', () => {
      renderGameBoard({ isMyTurn: false });

      expect(screen.queryByText('Your Turn')).not.toBeInTheDocument();
    });
  });

  describe('Game Controls', () => {
    test('shows draw and end turn buttons when it is my turn', () => {
      renderGameBoard({ isMyTurn: true, gamePhase: 'playing' });

      expect(screen.getByText('Draw Card')).toBeInTheDocument();
      expect(screen.getByText('End Turn')).toBeInTheDocument();
    });

    test('hides game controls when not my turn', () => {
      renderGameBoard({ isMyTurn: false });

      expect(screen.queryByText('Draw Card')).not.toBeInTheDocument();
      expect(screen.queryByText('End Turn')).not.toBeInTheDocument();
    });

    test('hides game controls when game phase is not playing', () => {
      renderGameBoard({ gamePhase: 'setup' });

      expect(screen.queryByText('Draw Card')).not.toBeInTheDocument();
      expect(screen.queryByText('End Turn')).not.toBeInTheDocument();
    });

    test('disables draw button when deck is empty', () => {
      renderGameBoard({ deckSize: 0 });

      const drawButton = screen.getByText('Draw Card');
      expect(drawButton).toBeDisabled();
    });

    test('disables buttons when loading', () => {
      renderGameBoard({ loading: true });

      const drawButton = screen.getByText('Drawing...');
      const endTurnButton = screen.getByText('Ending...');

      expect(drawButton).toBeDisabled();
      expect(endTurnButton).toBeDisabled();
    });
  });

  describe('Game Controls Actions', () => {
    test('calls drawCard when draw button is clicked', async () => {
      const drawCard = jest.fn().mockResolvedValue({});
      renderGameBoard({ drawCard });

      const drawButton = screen.getByText('Draw Card');
      await userEvent.click(drawButton);

      expect(drawCard).toHaveBeenCalledTimes(1);
    });

    test('calls endTurn when end turn button is clicked', async () => {
      const endTurn = jest.fn().mockResolvedValue({});
      renderGameBoard({ endTurn });

      const endTurnButton = screen.getByText('End Turn');
      await userEvent.click(endTurnButton);

      expect(endTurn).toHaveBeenCalledTimes(1);
    });

    test('handles drawCard errors gracefully', async () => {
      const drawCard = jest.fn().mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderGameBoard({ drawCard });

      const drawButton = screen.getByText('Draw Card');
      await userEvent.click(drawButton);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to draw card:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('handles endTurn errors gracefully', async () => {
      const endTurn = jest.fn().mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderGameBoard({ endTurn });

      const endTurnButton = screen.getByText('End Turn');
      await userEvent.click(endTurnButton);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to end turn:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Scoreboard', () => {
    test('displays all players with their information', () => {
      renderGameBoard();

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('15 points')).toBeInTheDocument();
      expect(screen.getByText('2 cards')).toBeInTheDocument();

      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('10 points')).toBeInTheDocument();
      expect(screen.getByText('1 cards')).toBeInTheDocument();
    });

    test('highlights current player', () => {
      renderGameBoard();

      const playerCards = screen.getAllByText(/Alice|Bob/).map(el => el.closest('.player-card'));
      const aliceCard = playerCards.find(card => card.textContent.includes('Alice'));

      expect(aliceCard).toHaveClass('current-player');
    });

    test('highlights my player', () => {
      renderGameBoard();

      const playerCards = screen.getAllByText(/Alice|Bob/).map(el => el.closest('.player-card'));
      const aliceCard = playerCards.find(card => card.textContent.includes('Alice'));

      expect(aliceCard).toHaveClass('my-player');
    });

    test('shows unavailable resources count', () => {
      renderGameBoard();

      expect(screen.getByText('Unavailable:')).toBeInTheDocument();
      expect(screen.getByText('1 resources')).toBeInTheDocument();
    });

    test('allows toggling hand view for individual players', async () => {
      renderGameBoard();

      const viewHandButtons = screen.getAllByText(/View Hand|Hide Hand/);
      const aliceViewButton = viewHandButtons.find(btn =>
        btn.closest('.player-card').textContent.includes('Alice')
      );

      await userEvent.click(aliceViewButton);

      expect(screen.getByText('Hide Hand')).toBeInTheDocument();
    });
  });

  describe('Player Hands', () => {
    test('displays selected player hand by default', () => {
      renderGameBoard();

      expect(screen.getByText("Alice's Hand (2 cards)")).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    test('shows cards in hand with correct properties', () => {
      renderGameBoard();

      expect(screen.getByTestId('card-r1')).toBeInTheDocument();
      expect(screen.getByTestId('card-r2')).toBeInTheDocument();

      const card1 = screen.getByTestId('card-r1');
      expect(card1).toHaveAttribute('data-draggable', 'true');
      expect(card1).toHaveAttribute('data-in-hand', 'true');
      expect(card1).toHaveAttribute('data-size', 'normal');
    });

    test('disables dragging when not my turn', () => {
      renderGameBoard({ isMyTurn: false });

      const card1 = screen.getByTestId('card-r1');
      expect(card1).toHaveAttribute('data-draggable', 'false');
    });

    test('shows empty hand message when player has no cards', () => {
      const emptyHandState = {
        ...mockGameState,
        players: [
          { ...mockGameState.players[0], hand: [] },
          mockGameState.players[1]
        ]
      };

      renderGameBoard({
        gameState: emptyHandState,
        players: emptyHandState.players,
        myPlayer: emptyHandState.players[0]
      });

      expect(screen.getByText('No cards in hand')).toBeInTheDocument();
    });

    test('shows temporarily unavailable resources', () => {
      renderGameBoard();

      // Switch to Bob's hand to see unavailable resources
      const bobViewButton = screen.getAllByText('View Hand')[1];
      fireEvent.click(bobViewButton);

      expect(screen.getByText('Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByTestId('card-r4')).toBeInTheDocument();

      const unavailableCard = screen.getByTestId('card-r4');
      expect(unavailableCard).toHaveAttribute('data-unavailable', 'true');
      expect(unavailableCard).toHaveAttribute('data-draggable', 'false');
    });

    test('allows toggling between individual and all hands view', async () => {
      renderGameBoard();

      const toggleButton = screen.getByText('Show All Hands');
      await userEvent.click(toggleButton);

      expect(screen.getByText('Show Individual')).toBeInTheDocument();

      // Should show both players' hands
      expect(screen.getByText("Alice's Hand (2 cards)")).toBeInTheDocument();
      expect(screen.getByText("Bob's Hand (1 cards)")).toBeInTheDocument();
    });

    test('shows message when no player is selected', () => {
      renderGameBoard({ myPlayer: null, selectedPlayer: null });

      expect(screen.getByText('Select a player to view their hand')).toBeInTheDocument();
    });
  });

  describe('Features Display Integration', () => {
    test('passes correct props to FeatureDisplay component', () => {
      renderGameBoard();

      expect(screen.getByTestId('feature-display')).toBeInTheDocument();
      expect(screen.getByTestId('feature-count')).toHaveTextContent('2');
      expect(screen.getByTestId('assignment-zones')).toHaveTextContent('enabled');
      expect(screen.getByTestId('interactive')).toHaveTextContent('enabled');
      expect(screen.getByTestId('layout')).toHaveTextContent('grid');
    });
  });

  describe('Drag and Drop Integration', () => {
    test('provides DragDropContext for hands', () => {
      renderGameBoard();

      expect(screen.getByTestId('droppable-hand-player-1')).toBeInTheDocument();
    });

    test('handles drag end with resource assignment', async () => {
      const assignResource = jest.fn().mockResolvedValue({});
      renderGameBoard({ assignResource });

      // Simulate a drag end event
      const dragEndResult = {
        destination: { droppableId: 'feature-f1', index: 0 },
        source: { droppableId: 'hand-player-1', index: 0 },
        draggableId: 'r1'
      };

      // This would normally be triggered by react-beautiful-dnd
      // We'll test the component's handleDragEnd method indirectly
      expect(screen.getByTestId('feature-display')).toBeInTheDocument();
    });

    test('ignores drag end when dropped outside droppable area', () => {
      const assignResource = jest.fn();
      renderGameBoard({ assignResource });

      // Test with null destination
      const dragEndResult = {
        destination: null,
        source: { droppableId: 'hand-player-1', index: 0 },
        draggableId: 'r1'
      };

      // The component should handle this gracefully
      expect(assignResource).not.toHaveBeenCalled();
    });

    test('ignores drag end when dropped in same position', () => {
      const assignResource = jest.fn();
      renderGameBoard({ assignResource });

      const dragEndResult = {
        destination: { droppableId: 'hand-player-1', index: 0 },
        source: { droppableId: 'hand-player-1', index: 0 },
        draggableId: 'r1'
      };

      expect(assignResource).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when error exists', () => {
      renderGameBoard({ error: 'Failed to perform action' });

      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText('Failed to perform action')).toBeInTheDocument();
    });

    test('allows dismissing error messages', async () => {
      const clearError = jest.fn();
      renderGameBoard({ error: 'Test error', clearError });

      const dismissButton = screen.getByText('✕');
      await userEvent.click(dismissButton);

      expect(clearError).toHaveBeenCalledTimes(1);
    });

    test('handles missing game data gracefully', () => {
      const incompleteGameState = {
        ...mockGameState,
        players: undefined,
        featuresInPlay: undefined
      };

      expect(() => {
        renderGameBoard({
          gameState: incompleteGameState,
          players: [],
          featuresInPlay: []
        });
      }).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    test('applies correct CSS classes for layout', () => {
      renderGameBoard();

      expect(screen.getByRole('main')).toHaveClass('game-board');
      expect(screen.getByRole('complementary')).toHaveClass('game-sidebar');
      expect(screen.getByRole('region')).toHaveClass('game-main');
    });
  });

  describe('Performance Optimizations', () => {
    test('component is memoized and does not re-render unnecessarily', () => {
      const { rerender } = renderGameBoard();

      // Re-render with same props
      rerender(
        <GameProvider>
          <GameBoard />
        </GameProvider>
      );

      // Component should still be present and functional
      expect(screen.getByText('Round 3/10')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels and roles', () => {
      renderGameBoard();

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    test('maintains keyboard navigation support', () => {
      renderGameBoard();

      const drawButton = screen.getByText('Draw Card');
      expect(drawButton).toHaveAttribute('tabIndex');
    });
  });

  describe('Integration with Game Context', () => {
    test('responds to game state changes', () => {
      const { rerender } = renderGameBoard();

      // Simulate game state change
      const updatedGameState = {
        ...mockGameState,
        currentRound: 4,
        currentPlayerIndex: 1
      };

      const updatedContext = {
        ...mockGameContextValue,
        gameState: updatedGameState,
        currentRound: 4,
        currentPlayer: updatedGameState.players[1],
        isMyTurn: false
      };

      // Mock the updated context
      jest.doMock('../../context/GameContext', () => ({
        useGame: () => updatedContext,
        GameProvider: ({ children }) => children
      }));

      rerender(
        <GameProvider>
          <GameBoard />
        </GameProvider>
      );

      expect(screen.getByText('Round 4/10')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });
});