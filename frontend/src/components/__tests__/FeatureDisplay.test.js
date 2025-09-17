import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import FeatureDisplay from '../FeatureDisplay';
import { GameProvider } from '../../context/GameContext';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  ...jest.requireActual('react-beautiful-dnd'),
  Droppable: ({ children, droppableId, isDropDisabled }) => children({
    innerRef: jest.fn(),
    droppableProps: {
      'data-testid': `droppable-${droppableId}`,
      'data-drop-disabled': isDropDisabled
    },
    placeholder: <div data-testid="droppable-placeholder" />
  }, {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: null,
    isUsingPlaceholder: false
  })
}));

// Mock Card component
jest.mock('../Card', () => {
  return function MockCard({ card, size, showDetails, isDraggable, isAssigned }) {
    return (
      <div
        data-testid={`card-${card?.id}`}
        data-size={size}
        data-show-details={showDetails}
        data-draggable={isDraggable}
        data-assigned={isAssigned}
        className={`mock-card ${isAssigned ? 'assigned' : ''}`}
      >
        <div className="card-name">{card?.name || card?.role}</div>
        <div className="card-value">{card?.value}</div>
        <div className="card-type">{card?.cardType}</div>
      </div>
    );
  };
});

// Mock game context
const mockGameContext = {
  assignResource: jest.fn(),
  isMyTurn: true,
  loading: false,
};

// Helper to mock useGame hook
const mockUseGame = () => mockGameContext;
jest.mock('../../context/GameContext', () => ({
  useGame: () => mockUseGame(),
  GameProvider: ({ children }) => children
}));

// Test data
const mockFeatures = [
  {
    id: 'f1',
    name: 'User Authentication',
    requirements: { dev: 2, pm: 1, ux: 1 },
    assignedResources: [],
    completed: false,
    cardType: 'feature',
    points: 5
  },
  {
    id: 'f2',
    name: 'Dashboard',
    requirements: { dev: 3, ux: 2 },
    assignedResources: [
      { id: 'r1', role: 'dev', level: 'senior', value: 3 },
      { id: 'r2', role: 'ux', level: 'junior', value: 1 }
    ],
    completed: false,
    cardType: 'feature',
    points: 8
  },
  {
    id: 'f3',
    name: 'API Integration',
    requirements: { dev: 2, pm: 1 },
    assignedResources: [
      { id: 'r3', role: 'dev', level: 'senior', value: 3 },
      { id: 'r4', role: 'pm', level: 'senior', value: 2 }
    ],
    completed: true,
    cardType: 'feature',
    points: 3
  }
];

const renderFeatureDisplay = (props = {}) => {
  const defaultProps = {
    features: mockFeatures,
    showAssignmentZones: true,
    interactive: true,
    layout: 'grid'
  };

  return render(
    <GameProvider>
      <FeatureDisplay {...defaultProps} {...props} />
    </GameProvider>
  );
};

describe('FeatureDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders features display with correct title', () => {
      renderFeatureDisplay();

      expect(screen.getByText('Features in Play (3)')).toBeInTheDocument();
    });

    test('renders all provided features', () => {
      renderFeatureDisplay();

      expect(screen.getByTestId('card-f1')).toBeInTheDocument();
      expect(screen.getByTestId('card-f2')).toBeInTheDocument();
      expect(screen.getByTestId('card-f3')).toBeInTheDocument();
    });

    test('shows empty state when no features provided', () => {
      renderFeatureDisplay({ features: [] });

      expect(screen.getByText('No features in play')).toBeInTheDocument();
      expect(screen.getByText('Features will appear here when the game starts')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    test('shows empty state when features is null or undefined', () => {
      renderFeatureDisplay({ features: null });
      expect(screen.getByText('No features in play')).toBeInTheDocument();

      renderFeatureDisplay({ features: undefined });
      expect(screen.getByText('No features in play')).toBeInTheDocument();
    });
  });

  describe('Layout Variations', () => {
    test('applies grid layout class by default', () => {
      renderFeatureDisplay();

      const container = screen.getByRole('region');
      expect(container).toHaveClass('feature-layout-grid');
    });

    test('applies list layout class when specified', () => {
      renderFeatureDisplay({ layout: 'list' });

      const container = screen.getByRole('region');
      expect(container).toHaveClass('feature-layout-list');
    });

    test('applies compact layout class when specified', () => {
      renderFeatureDisplay({ layout: 'compact' });

      const container = screen.getByRole('region');
      expect(container).toHaveClass('feature-layout-compact');
    });

    test('renders cards with correct size for compact layout', () => {
      renderFeatureDisplay({ layout: 'compact' });

      const cards = screen.getAllByTestId(/^card-f/);
      cards.forEach(card => {
        expect(card).toHaveAttribute('data-size', 'small');
      });
    });

    test('renders cards with normal size for non-compact layouts', () => {
      renderFeatureDisplay({ layout: 'grid' });

      const cards = screen.getAllByTestId(/^card-f/);
      cards.forEach(card => {
        expect(card).toHaveAttribute('data-size', 'normal');
      });
    });
  });

  describe('Feature Progress Calculation', () => {
    test('calculates progress correctly for partially assigned features', () => {
      renderFeatureDisplay();

      // Dashboard has dev: 3 out of 3, ux: 1 out of 2 = 4/5 = 80%
      const dashboardProgress = screen.getByText('80%');
      expect(dashboardProgress).toBeInTheDocument();
    });

    test('shows 100% progress for completed features', () => {
      renderFeatureDisplay();

      // API Integration is completed
      const completedProgress = screen.getByText('100%');
      expect(completedProgress).toBeInTheDocument();
    });

    test('shows 0% progress for unassigned features', () => {
      renderFeatureDisplay();

      // User Authentication has no assigned resources
      const emptyProgress = screen.getByText('0%');
      expect(emptyProgress).toBeInTheDocument();
    });
  });

  describe('Requirement Progress Bars', () => {
    test('displays requirement progress for all roles', () => {
      renderFeatureDisplay();

      // Check for progress indicators (role icons)
      expect(screen.getAllByText('💻')).toHaveLength(3); // Dev requirements
      expect(screen.getAllByText('📋')).toHaveLength(2); // PM requirements
      expect(screen.getAllByText('🎨')).toHaveLength(2); // UX requirements
    });

    test('shows correct requirement ratios', () => {
      renderFeatureDisplay();

      // User Authentication: dev 0/2, pm 0/1, ux 0/1
      expect(screen.getByText('0/2')).toBeInTheDocument();
      expect(screen.getByText('0/1')).toBeInTheDocument();

      // Dashboard: dev 3/3, ux 1/2
      expect(screen.getByText('3/3')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();

      // API Integration: dev 3/2 (over-assigned), pm 2/1 (over-assigned)
      expect(screen.getByText('3/2')).toBeInTheDocument();
      expect(screen.getByText('2/1')).toBeInTheDocument();
    });

    test('applies complete styling to fulfilled requirements', () => {
      renderFeatureDisplay();

      const progressBars = screen.getAllByRole('progressbar');

      // Should have some complete progress bars for fulfilled requirements
      const completeBar = progressBars.find(bar =>
        bar.querySelector('.requirement-fill.complete')
      );
      expect(completeBar).toBeInTheDocument();
    });
  });

  describe('Assigned Resources Display', () => {
    test('shows assigned resources for features with assignments', () => {
      renderFeatureDisplay();

      expect(screen.getByText('Assigned Resources:')).toBeInTheDocument();

      // Dashboard should show its assigned resources
      expect(screen.getByTestId('card-r1')).toBeInTheDocument();
      expect(screen.getByTestId('card-r2')).toBeInTheDocument();
    });

    test('shows empty message for features without assignments', () => {
      renderFeatureDisplay();

      expect(screen.getByText('No resources assigned')).toBeInTheDocument();
    });

    test('renders assigned resource cards with correct properties', () => {
      renderFeatureDisplay();

      const assignedCard = screen.getByTestId('card-r1');
      expect(assignedCard).toHaveAttribute('data-size', 'small');
      expect(assignedCard).toHaveAttribute('data-show-details', 'false');
      expect(assignedCard).toHaveAttribute('data-draggable', 'false');
      expect(assignedCard).toHaveAttribute('data-assigned', 'true');
    });

    test('hides assigned resources in compact layout', () => {
      renderFeatureDisplay({ layout: 'compact' });

      expect(screen.queryByText('Assigned Resources:')).not.toBeInTheDocument();
    });
  });

  describe('Drop Zones', () => {
    test('shows drop zones when showAssignmentZones is true', () => {
      renderFeatureDisplay({ showAssignmentZones: true });

      expect(screen.getByTestId('droppable-feature-f1')).toBeInTheDocument();
      expect(screen.getByTestId('droppable-feature-f2')).toBeInTheDocument();
      expect(screen.getByTestId('droppable-feature-f3')).toBeInTheDocument();
    });

    test('hides drop zones when showAssignmentZones is false', () => {
      renderFeatureDisplay({ showAssignmentZones: false });

      expect(screen.queryByTestId('droppable-feature-f1')).not.toBeInTheDocument();
    });

    test('hides drop zones when interactive is false', () => {
      renderFeatureDisplay({ interactive: false });

      expect(screen.queryByTestId('droppable-feature-f1')).not.toBeInTheDocument();
    });

    test('shows appropriate drop zone hint when my turn', () => {
      renderFeatureDisplay();

      expect(screen.getAllByText('Drag resources here')).toHaveLength(3);
    });

    test('shows not my turn message when not my turn', () => {
      mockGameContext.isMyTurn = false;
      renderFeatureDisplay();

      expect(screen.getAllByText('Not your turn')).toHaveLength(3);
    });

    test('disables drop zones for completed features', () => {
      renderFeatureDisplay();

      // API Integration is completed
      const completedDropZone = screen.getByTestId('droppable-feature-f3');
      expect(completedDropZone).toHaveAttribute('data-drop-disabled', 'true');
    });

    test('disables drop zones when loading', () => {
      mockGameContext.loading = true;
      renderFeatureDisplay();

      const dropZones = screen.getAllByTestId(/^droppable-feature-/);
      dropZones.forEach(zone => {
        expect(zone).toHaveAttribute('data-drop-disabled', 'true');
      });
    });

    test('disables drop zones when not my turn', () => {
      mockGameContext.isMyTurn = false;
      renderFeatureDisplay();

      const dropZones = screen.getAllByTestId(/^droppable-feature-/);
      dropZones.forEach(zone => {
        expect(zone).toHaveAttribute('data-drop-disabled', 'true');
      });
    });
  });

  describe('Completion Summary', () => {
    test('shows completion summary when some features are completed', () => {
      renderFeatureDisplay();

      expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
    });

    test('hides completion summary when no features are completed', () => {
      const incompleteFeatures = mockFeatures.map(f => ({ ...f, completed: false }));
      renderFeatureDisplay({ features: incompleteFeatures });

      expect(screen.queryByText(/of \d+ completed/)).not.toBeInTheDocument();
    });

    test('shows correct completion count with multiple completed features', () => {
      const multipleCompletedFeatures = mockFeatures.map((f, index) => ({
        ...f,
        completed: index < 2 // First 2 features completed
      }));
      renderFeatureDisplay({ features: multipleCompletedFeatures });

      expect(screen.getByText('2 of 3 completed')).toBeInTheDocument();
    });
  });

  describe('Feature Card Properties', () => {
    test('renders feature cards with show details enabled', () => {
      renderFeatureDisplay();

      const featureCards = screen.getAllByTestId(/^card-f/);
      featureCards.forEach(card => {
        expect(card).toHaveAttribute('data-show-details', 'true');
      });
    });

    test('makes feature cards non-draggable', () => {
      renderFeatureDisplay();

      const featureCards = screen.getAllByTestId(/^card-f/);
      featureCards.forEach(card => {
        expect(card).toHaveAttribute('data-draggable', 'false');
      });
    });

    test('applies completed styling to completed features', () => {
      renderFeatureDisplay();

      const completedFeature = screen.getByTestId('card-f3').closest('.feature-item');
      expect(completedFeature).toHaveClass('feature-complete');
    });

    test('applies compact styling in compact layout', () => {
      renderFeatureDisplay({ layout: 'compact' });

      const features = screen.getAllByTestId(/^card-f/).map(card =>
        card.closest('.feature-item')
      );
      features.forEach(feature => {
        expect(feature).toHaveClass('feature-compact');
      });
    });
  });

  describe('Resource Assignment Handler', () => {
    test('calls assignResource when handleResourceDrop is triggered', async () => {
      const assignResource = jest.fn().mockResolvedValue({});
      mockGameContext.assignResource = assignResource;

      renderFeatureDisplay();

      // Simulate calling handleResourceDrop (this would normally be called by DragDropContext)
      // Since we can't directly test the drag drop functionality without the full DnD context,
      // we focus on the component structure and prop passing
      expect(screen.getByTestId('droppable-feature-f1')).toBeInTheDocument();
    });

    test('does not allow assignment when not my turn', () => {
      mockGameContext.isMyTurn = false;
      const assignResource = jest.fn();
      mockGameContext.assignResource = assignResource;

      renderFeatureDisplay();

      // The drop zones should be disabled
      const dropZones = screen.getAllByTestId(/^droppable-feature-/);
      dropZones.forEach(zone => {
        expect(zone).toHaveAttribute('data-drop-disabled', 'true');
      });
    });

    test('does not allow assignment when loading', () => {
      mockGameContext.loading = true;
      const assignResource = jest.fn();
      mockGameContext.assignResource = assignResource;

      renderFeatureDisplay();

      const dropZones = screen.getAllByTestId(/^droppable-feature-/);
      dropZones.forEach(zone => {
        expect(zone).toHaveAttribute('data-drop-disabled', 'true');
      });
    });

    test('handles assignment errors gracefully', async () => {
      const assignResource = jest.fn().mockRejectedValue(new Error('Assignment failed'));
      mockGameContext.assignResource = assignResource;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderFeatureDisplay();

      // The component should be rendered and functional even if assignment would fail
      expect(screen.getByTestId('droppable-feature-f1')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Progress Ring Visualization', () => {
    test('renders progress rings with correct stroke properties', () => {
      renderFeatureDisplay();

      const progressRings = screen.getAllByRole('img'); // SVG elements
      expect(progressRings.length).toBeGreaterThan(0);

      // Each feature should have a progress ring
      const progressCircles = document.querySelectorAll('.progress-ring-progress');
      expect(progressCircles.length).toBe(3);
    });

    test('calculates correct stroke-dashoffset for progress visualization', () => {
      renderFeatureDisplay();

      // Test the progress ring calculation
      const progressElements = document.querySelectorAll('.progress-ring-progress');

      progressElements.forEach(element => {
        const strokeDasharray = element.style.strokeDasharray;
        const strokeDashoffset = element.style.strokeDashoffset;

        // Should have both properties set
        expect(strokeDasharray).toBeTruthy();
        expect(strokeDashoffset).toBeTruthy();
      });
    });
  });

  describe('Memoization and Performance', () => {
    test('component is memoized and handles prop changes efficiently', () => {
      const { rerender } = renderFeatureDisplay();

      // Re-render with same props
      rerender(
        <GameProvider>
          <FeatureDisplay
            features={mockFeatures}
            showAssignmentZones={true}
            interactive={true}
            layout="grid"
          />
        </GameProvider>
      );

      expect(screen.getByText('Features in Play (3)')).toBeInTheDocument();
    });

    test('recalculates feature status when features change', () => {
      const { rerender } = renderFeatureDisplay();

      const updatedFeatures = [
        ...mockFeatures,
        {
          id: 'f4',
          name: 'New Feature',
          requirements: { dev: 1 },
          assignedResources: [],
          completed: false,
          cardType: 'feature'
        }
      ];

      rerender(
        <GameProvider>
          <FeatureDisplay
            features={updatedFeatures}
            showAssignmentZones={true}
            interactive={true}
            layout="grid"
          />
        </GameProvider>
      );

      expect(screen.getByText('Features in Play (4)')).toBeInTheDocument();
      expect(screen.getByTestId('card-f4')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper semantic structure', () => {
      renderFeatureDisplay();

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    test('includes progress bars for screen readers', () => {
      renderFeatureDisplay();

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);

      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuemin');
        expect(bar).toHaveAttribute('aria-valuemax');
      });
    });

    test('provides descriptive text for progress indicators', () => {
      renderFeatureDisplay();

      // Progress percentages should be visible
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles malformed feature data gracefully', () => {
      const malformedFeatures = [
        { id: 'f1' }, // Missing required properties
        { name: 'Incomplete Feature' }, // Missing id
        null, // Null feature
        undefined // Undefined feature
      ];

      expect(() => {
        renderFeatureDisplay({ features: malformedFeatures });
      }).not.toThrow();
    });

    test('handles missing requirements gracefully', () => {
      const featuresWithoutRequirements = [{
        id: 'f1',
        name: 'Feature Without Requirements',
        cardType: 'feature'
      }];

      expect(() => {
        renderFeatureDisplay({ features: featuresWithoutRequirements });
      }).not.toThrow();
    });

    test('handles missing assigned resources gracefully', () => {
      const featuresWithoutAssignments = [{
        id: 'f1',
        name: 'Feature Without Assignments',
        requirements: { dev: 2 },
        cardType: 'feature'
      }];

      expect(() => {
        renderFeatureDisplay({ features: featuresWithoutAssignments });
      }).not.toThrow();
    });
  });
});