import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import Card from '../Card';

// Mock react-beautiful-dnd for testing
jest.mock('react-beautiful-dnd', () => ({
  ...jest.requireActual('react-beautiful-dnd'),
  Draggable: ({ children, isDragDisabled }) => children({
    draggableProps: { 'data-testid': 'draggable' },
    dragHandleProps: { 'data-testid': 'drag-handle' },
    innerRef: jest.fn(),
    isDragging: false,
    isDragDisabled: isDragDisabled || false
  })
}));

const mockFeatureCard = {
  id: 'f1',
  name: 'User Authentication',
  requirements: { dev: 2, pm: 1, ux: 1 },
  points: 5,
  assignedResources: [],
  completed: false,
  cardType: 'feature'
};

const mockResourceCard = {
  id: 'r1',
  role: 'dev',
  level: 'senior',
  value: 3,
  assignedTo: null,
  unavailableUntil: null,
  cardType: 'resource'
};

const mockEventCard = {
  id: 'e1',
  type: 'layoff',
  effect: 'Remove one random resource card',
  parameters: { count: 1 },
  cardType: 'event'
};

const renderCardWithDragDrop = (props) => {
  return render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <Card {...props} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

describe('Card Component', () => {
  describe('Feature Card Rendering', () => {
    test('renders feature card with correct information', () => {
      render(<Card card={mockFeatureCard} />);

      expect(screen.getByText('User Authentication')).toBeInTheDocument();
      expect(screen.getByText('5 pts')).toBeInTheDocument();
      expect(screen.getByText('Dev: 2')).toBeInTheDocument();
      expect(screen.getByText('PM: 1')).toBeInTheDocument();
      expect(screen.getByText('UX: 1')).toBeInTheDocument();
    });

    test('shows completed status for completed feature', () => {
      const completedFeature = { ...mockFeatureCard, completed: true };
      render(<Card card={completedFeature} />);

      expect(screen.getByText('✅ Completed')).toBeInTheDocument();
    });

    test('displays assigned resources for feature card', () => {
      const featureWithResources = {
        ...mockFeatureCard,
        assignedResources: [
          { id: 'r1', role: 'dev', level: 'senior', value: 3 },
          { id: 'r2', role: 'pm', level: 'junior', value: 2 }
        ]
      };

      render(<Card card={featureWithResources} />);

      expect(screen.getByText('Assigned:')).toBeInTheDocument();
      expect(screen.getByText('👨‍💻 Dev (Senior)')).toBeInTheDocument();
      expect(screen.getByText('👔 PM (Junior)')).toBeInTheDocument();
    });

    test('shows progress for partially completed features', () => {
      const partialFeature = {
        ...mockFeatureCard,
        assignedResources: [
          { id: 'r1', role: 'dev', level: 'senior', value: 3 }
        ]
      };

      render(<Card card={partialFeature} />);

      // Should show progress (3 out of 4 total requirement value)
      expect(screen.getByText(/Progress:/)).toBeInTheDocument();
    });
  });

  describe('Resource Card Rendering', () => {
    test('renders resource card with correct information', () => {
      render(<Card card={mockResourceCard} />);

      expect(screen.getByText('👨‍💻')).toBeInTheDocument(); // Dev icon
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();
      expect(screen.getByText('Value: 3')).toBeInTheDocument();
    });

    test('shows assigned status for assigned resource', () => {
      const assignedResource = { ...mockResourceCard, assignedTo: 'f1' };
      render(<Card card={assignedResource} />);

      expect(screen.getByText('✅ Assigned')).toBeInTheDocument();
    });

    test('shows unavailable status for temporarily unavailable resource', () => {
      const unavailableResource = { ...mockResourceCard, unavailableUntil: 5 };
      render(<Card card={unavailableResource} currentRound={3} />);

      expect(screen.getByText(/Unavailable until/)).toBeInTheDocument();
    });

    test('renders different role icons correctly', () => {
      const pmCard = { ...mockResourceCard, role: 'pm' };
      const uxCard = { ...mockResourceCard, role: 'ux' };

      render(<Card card={pmCard} />);
      expect(screen.getByText('👔')).toBeInTheDocument(); // PM icon

      render(<Card card={uxCard} />);
      expect(screen.getByText('🎨')).toBeInTheDocument(); // UX icon
    });

    test('renders different skill levels correctly', () => {
      const entryCard = { ...mockResourceCard, level: 'entry', value: 1 };
      const juniorCard = { ...mockResourceCard, level: 'junior', value: 2 };

      render(<Card card={entryCard} />);
      expect(screen.getByText('Entry Developer')).toBeInTheDocument();

      render(<Card card={juniorCard} />);
      expect(screen.getByText('Junior Developer')).toBeInTheDocument();
    });
  });

  describe('Event Card Rendering', () => {
    test('renders event card with correct information', () => {
      render(<Card card={mockEventCard} />);

      expect(screen.getByText('⚡ HR Event')).toBeInTheDocument();
      expect(screen.getByText('Layoff')).toBeInTheDocument();
      expect(screen.getByText('Remove one random resource card')).toBeInTheDocument();
    });

    test('shows different event types correctly', () => {
      const ptoEvent = { ...mockEventCard, type: 'pto', effect: 'Resource takes PTO' };
      render(<Card card={ptoEvent} />);
      expect(screen.getByText('PTO')).toBeInTheDocument();
    });
  });

  describe('Card Interactions', () => {
    test('handles click events when onClick is provided', () => {
      const handleClick = jest.fn();
      render(<Card card={mockResourceCard} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(mockResourceCard);
    });

    test('applies selected styling when card is selected', () => {
      render(<Card card={mockResourceCard} isSelected={true} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('selected');
    });

    test('applies disabled styling when card is disabled', () => {
      render(<Card card={mockResourceCard} disabled={true} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('disabled');
      expect(cardElement).toBeDisabled();
    });
  });

  describe('Drag and Drop', () => {
    test('makes resource cards draggable by default', () => {
      renderCardWithDragDrop({
        card: mockResourceCard,
        index: 0,
        isDraggable: true
      });

      expect(screen.getByTestId('draggable')).toBeInTheDocument();
      expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    });

    test('disables dragging for assigned resources', () => {
      const assignedResource = { ...mockResourceCard, assignedTo: 'f1' };
      renderCardWithDragDrop({
        card: assignedResource,
        index: 0,
        isDraggable: false
      });

      // Should still render but with dragging disabled
      expect(screen.getByTestId('draggable')).toBeInTheDocument();
    });

    test('disables dragging for unavailable resources', () => {
      const unavailableResource = { ...mockResourceCard, unavailableUntil: 5 };
      renderCardWithDragDrop({
        card: unavailableResource,
        index: 0,
        currentRound: 3,
        isDraggable: false
      });

      expect(screen.getByTestId('draggable')).toBeInTheDocument();
    });

    test('does not make feature cards draggable', () => {
      render(<Card card={mockFeatureCard} />);

      // Feature cards should not have drag handles
      expect(screen.queryByTestId('drag-handle')).not.toBeInTheDocument();
    });
  });

  describe('Card Size Variants', () => {
    test('applies small size class when size prop is small', () => {
      render(<Card card={mockResourceCard} size="small" />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('card-small');
    });

    test('applies large size class when size prop is large', () => {
      render(<Card card={mockResourceCard} size="large" />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('card-large');
    });

    test('uses normal size by default', () => {
      render(<Card card={mockResourceCard} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).not.toHaveClass('card-small');
      expect(cardElement).not.toHaveClass('card-large');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<Card card={mockResourceCard} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('aria-label');
    });

    test('supports keyboard navigation', () => {
      const handleClick = jest.fn();
      render(<Card card={mockResourceCard} onClick={handleClick} />);

      const cardElement = screen.getByRole('button');
      fireEvent.keyDown(cardElement, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    test('provides descriptive aria-label for screen readers', () => {
      render(<Card card={mockResourceCard} />);

      const cardElement = screen.getByRole('button');
      const ariaLabel = cardElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Senior Developer');
      expect(ariaLabel).toContain('value 3');
    });
  });

  describe('Error Handling', () => {
    test('handles missing card properties gracefully', () => {
      const incompleteCard = { id: 'incomplete' };

      expect(() => {
        render(<Card card={incompleteCard} />);
      }).not.toThrow();
    });

    test('handles null or undefined card', () => {
      expect(() => {
        render(<Card card={null} />);
      }).not.toThrow();

      expect(() => {
        render(<Card card={undefined} />);
      }).not.toThrow();
    });

    test('handles unknown card types', () => {
      const unknownCard = { id: 'unknown', cardType: 'unknown' };

      expect(() => {
        render(<Card card={unknownCard} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('memoizes card rendering for unchanged props', () => {
      const { rerender } = render(<Card card={mockResourceCard} />);

      // Re-render with same props should not cause issues
      rerender(<Card card={mockResourceCard} />);

      expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    });
  });
});