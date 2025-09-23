import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useGame } from '../context/GameContext';
import './Card.css';

/**
 * Reusable Card component for displaying Feature, Resource, and Event cards
 * Supports drag and drop functionality for resource assignment
 */
const Card = memo(({
  card,
  index,
  isDraggable = false,
  isInHand = false,
  isAssigned = false,
  isUnavailable = false,
  onClick,
  showDetails = true,
  size = 'normal', // normal, small, large
  extraClassName,
}) => {
  const { selectedCard, setSelectedCard } = useGame();

  if (!card) {
    return null;
  }

  // DEBUG: Log card props to track draggable conditions
  console.log('Card props:', {
    cardId: card.id,
    cardType: card.cardType,
    isDraggable,
    isUnavailable,
    isInHand,
    index,
    hasUnavailableUntil: !!card.unavailableUntil,
    unavailableUntil: card.unavailableUntil,
    willWrapWithDraggable: isDraggable && !isUnavailable && index !== undefined,
  });

  const isSelected = selectedCard && selectedCard.id === card.id;

  // Handle card click
  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(card);
    } else if (isInHand && !isUnavailable) {
      setSelectedCard(isSelected ? null : card);
    }
  };

  // Get card type specific styling and content
  const getCardTypeInfo = () => {
    switch (card.cardType) {
      case 'feature':
        return {
          className: 'card-feature',
          icon: '🎯',
          subtitle: `${card.points} points`,
        };
      case 'resource':
        return {
          className: 'card-resource',
          icon: getRoleIcon(card.role),
          subtitle: `${card.role} - ${card.level} (${card.value})`,
        };
      case 'event':
        return {
          className: 'card-event',
          icon: '⚡',
          subtitle: card.type,
        };
      default:
        return {
          className: 'card-unknown',
          icon: '❓',
          subtitle: 'Unknown',
        };
    }
  };

  // Get role icon for resource cards
  const getRoleIcon = (role) => {
    switch (role) {
      case 'dev':
        return '💻';
      case 'pm':
        return '📋';
      case 'ux':
        return '🎨';
      default:
        return '👤';
    }
  };

  // Get requirements display for feature cards
  const getRequirementsDisplay = () => {
    if (card.cardType !== 'feature' || !card.requirements) {
      return null;
    }

    const reqs = [];
    if (card.requirements.dev > 0) {
      reqs.push(`💻 ${card.requirements.dev}`);
    }
    if (card.requirements.pm > 0) {
      reqs.push(`📋 ${card.requirements.pm}`);
    }
    if (card.requirements.ux > 0) {
      reqs.push(`🎨 ${card.requirements.ux}`);
    }

    return reqs.join(' | ');
  };

  // Get assigned resources display for feature cards
  const getAssignedResourcesDisplay = () => {
    if (card.cardType !== 'feature' || !card.assignedResources || card.assignedResources.length === 0) {
      return null;
    }

    return (
      <div className="card-assigned-resources">
        <div className="assigned-resources-label">Assigned:</div>
        {card.assignedResources.map((resource, idx) => (
          <span key={resource.id || idx} className="assigned-resource-badge">
            {getRoleIcon(resource.role)} {resource.value}
          </span>
        ))}
      </div>
    );
  };

  const formatEffectKey = (key) => key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

  const renderEventEffect = () => {
    if (!card.effect) {
      return null;
    }

    if (typeof card.effect === 'string') {
      return card.effect;
    }

    const effectEntries = Object.entries(card.effect);

    if (effectEntries.length === 0) {
      return card.description || null;
    }

    return (
      <>
        {card.description && (
          <div className="card-effect-description">{card.description}</div>
        )}
        <ul className="card-effect-details">
          {effectEntries.map(([key, value]) => (
            <li key={key}>
              <span className="card-effect-key">{formatEffectKey(key)}:</span> {String(value)}
            </li>
          ))}
        </ul>
      </>
    );
  };

  const cardTypeInfo = getCardTypeInfo();
  const eventEffectContent = renderEventEffect();

  // Build CSS classes
  const cardClasses = [
    'card',
    cardTypeInfo.className,
    `card-size-${size}`,
    isSelected && 'card-selected',
    isUnavailable && 'card-unavailable',
    isAssigned && 'card-assigned',
    isDraggable && !isUnavailable && 'card-draggable',
    card.completed && 'card-completed',
    extraClassName,
  ].filter(Boolean).join(' ');

  // Card content
  const cardContent = (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      role="button"
      tabIndex={isDraggable && !isUnavailable ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick(e);
        }
      }}
    >
      {/* Card header */}
      <div className="card-header">
        <span className="card-icon">{cardTypeInfo.icon}</span>
        <span className="card-name">{card.name || card.id}</span>
        {card.completed && <span className="completion-badge">✓</span>}
      </div>

      {/* Card body */}
      {showDetails && (
        <div className="card-body">
          <div className="card-subtitle">{cardTypeInfo.subtitle}</div>

          {/* Feature card specific content */}
          {card.cardType === 'feature' && (
            <>
              {getRequirementsDisplay() && (
                <div className="card-requirements">
                  <div className="requirements-label">Needs:</div>
                  <div className="requirements-text">{getRequirementsDisplay()}</div>
                </div>
              )}
              {getAssignedResourcesDisplay()}
            </>
          )}

          {/* Event card specific content */}
          {card.cardType === 'event' && eventEffectContent && (
            <div className="card-effect">
              {eventEffectContent}
            </div>
          )}

          {/* Resource card availability status */}
          {card.cardType === 'resource' && card.unavailableUntil && (
            <div className="card-unavailable-info">
              Unavailable until round {card.unavailableUntil}
            </div>
          )}
        </div>
      )}

      {/* Drag indicator */}
      {isDraggable && !isUnavailable && (
        <div className="card-drag-indicator">
          <span>⋮⋮</span>
        </div>
      )}
    </div>
  );

  // Wrap with Draggable if drag is enabled
  if (isDraggable && !isUnavailable && index !== undefined) {
    return (
      <Draggable
        draggableId={card.id}
        index={index}
        type="RESOURCE"
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`card-draggable-wrapper ${snapshot.isDragging ? 'card-dragging' : ''}`}
          >
            {cardContent}
          </div>
        )}
      </Draggable>
    );
  }

  return cardContent;
});

Card.displayName = 'Card';

export default Card;
