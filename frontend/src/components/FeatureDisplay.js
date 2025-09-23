import React, { memo, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useGame } from '../context/GameContext';
import Card from './Card';
import './FeatureDisplay.css';

/**
 * FeatureDisplay component for showing feature cards with their requirements
 * and assigned resources. Includes drop zones for resource assignment.
 */
const FeatureDisplay = memo(({
  features = [],
  showAssignmentZones = true,
  interactive = true,
  layout = 'grid', // grid, list, compact
}) => {
  const { isMyTurn, loading } = useGame();

  // Calculate completion status for each feature
  const featuresWithStatus = useMemo(() => {
    return (features || []).filter((feature) => feature !== null).map((feature) => {
      const assigned = feature.assignedResources || [];
      const requirements = feature.requirements || {};

      // Calculate assigned values by role
      const assignedByRole = assigned.reduce((acc, resource) => {
        acc[resource.role] = (acc[resource.role] || 0) + 1;
        return acc;
      }, {});

      // Check if requirements are met
      const isComplete = Object.entries(requirements || {}).every(([role, needed]) => {
        return (assignedByRole[role] || 0) >= needed;
      });

      // Calculate progress percentage
      const totalNeeded = Object.values(requirements || {}).reduce((sum, val) => sum + val, 0);
      const totalAssigned = Object.values(assignedByRole).reduce((sum, val) => sum + val, 0);
      const progress = totalNeeded > 0 ? Math.min((totalAssigned / totalNeeded) * 100, 100) : 0;

      return {
        ...feature,
        assignedByRole,
        isComplete,
        progress,
      };
    });
  }, [features]);

  // Handle resource drop - currently unused but available for drag/drop functionality
  // const handleResourceDrop = async (featureId, resourceId) => {
  //   if (!isMyTurn || loading) {
  //     return false;
  //   }

  //   try {
  //     await assignResource(resourceId, featureId);
  //     return true;
  //   } catch (error) {
  //     console.error('Failed to assign resource:', error);
  //     return false;
  //   }
  // };

  // Render requirement progress bar
  const renderRequirementProgress = (feature) => {
    const { requirements = {}, assignedByRole = {} } = feature;

    return (
      <div className="requirement-progress">
        {Object.entries(requirements || {}).map(([role, needed]) => {
          const assigned = assignedByRole[role] || 0;
          const percentage = needed > 0 ? Math.min((assigned / needed) * 100, 100) : 0;
          const isComplete = assigned >= needed;

          return (
            <div key={role} className="requirement-row">
              <div className="requirement-info">
                <span className="role-icon">{getRoleIcon(role)}</span>
                <span className="requirement-text">
                  {assigned}/{needed}
                </span>
              </div>
              <div className="requirement-bar">
                <div
                  className={`requirement-fill ${isComplete ? 'complete' : ''}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Get role icon
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

  // Render assigned resources
  const renderAssignedResources = (feature) => {
    const assignedResources = feature.assignedResources || [];

    if (assignedResources.length === 0) {
      return (
        <div className="assigned-resources-empty">
          No resources assigned
        </div>
      );
    }

    return (
      <div className="assigned-resources">
        <div className="assigned-resources-header">Assigned Resources:</div>
        <div className="assigned-resources-list">
          {assignedResources.map((resource, index) => (
            <Card
              key={resource.id || index}
              card={resource}
              size="small"
              showDetails={false}
              isDraggable={false}
              isAssigned={true}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render drop zone for a feature
  const renderDropZone = (feature) => {
    if (!showAssignmentZones || !interactive) {
      return null;
    }

    const isDropDisabled = !isMyTurn || loading || feature.completed || feature.isComplete;

    return (
      <Droppable
        droppableId={`feature-${feature.id}`}
        type="RESOURCE"
        isDropDisabled={isDropDisabled}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`feature-drop-zone ${
              snapshot.isDraggingOver ? 'drop-zone-active' : ''
            } ${isDropDisabled ? 'drop-zone-disabled' : ''}`}
          >
            {snapshot.isDraggingOver ? (
              <div className="drop-zone-indicator">
                Drop resource here
              </div>
            ) : (
              <div className="drop-zone-hint">
                {(() => {
                  if (isMyTurn && !loading && !feature.isComplete) {
                    return 'Drag resources here';
                  }
                  if (feature.isComplete) {
                    return 'Feature completed';
                  }
                  return 'Not your turn';
                })()}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  // Render single feature
  const renderFeature = (feature) => {
    return (
      <div
        key={feature.id}
        className={`feature-item ${feature.isComplete ? 'feature-complete' : ''} ${
          layout === 'compact' ? 'feature-compact' : ''
        }`}
      >
        {/* Feature card */}
        <div className="feature-card-container">
          <Card
            card={feature}
            size={layout === 'compact' ? 'small' : 'normal'}
            isDraggable={false}
            showDetails={true}
          />

          {/* Progress indicator */}
          <div className="feature-progress-overlay">
            <div className="progress-circle">
              <svg className="progress-ring" width="40" height="40">
                <circle
                  className="progress-ring-background"
                  cx="20"
                  cy="20"
                  r="15"
                />
                <circle
                  className="progress-ring-progress"
                  cx="20"
                  cy="20"
                  r="15"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 15}`,
                    strokeDashoffset: `${2 * Math.PI * 15 * (1 - feature.progress / 100)}`,
                  }}
                />
              </svg>
              <div className="progress-text">
                {Math.round(feature.progress)}%
              </div>
            </div>
          </div>
        </div>

        {/* Requirements and assignment area */}
        <div className="feature-assignment-area">
          {/* Requirement progress */}
          <div className="feature-requirements">
            <h4 className="requirements-title">Requirements Progress</h4>
            {renderRequirementProgress(feature)}
          </div>

          {/* Drop zone */}
          {renderDropZone(feature)}

          {/* Assigned resources */}
          {layout !== 'compact' && renderAssignedResources(feature)}
        </div>
      </div>
    );
  };

  if (!features || features.length === 0) {
    return (
      <div className="feature-display-empty">
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-message">No features in play</div>
          <div className="empty-description">
            Features will appear here when the game starts
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`feature-display feature-layout-${layout}`}>
      <div className="feature-display-header">
        <h3 className="feature-display-title">
          Features in Play ({features.length})
        </h3>
        {featuresWithStatus.filter((f) => f.isComplete).length > 0 && (
          <div className="completion-summary">
            {featuresWithStatus.filter((f) => f.isComplete).length} of {features.length} completed
          </div>
        )}
      </div>

      <div className="feature-display-content">
        {featuresWithStatus.map((feature, index) => (
          <div key={feature.id || index}>
            {renderFeature(feature)}
          </div>
        ))}
      </div>
    </div>
  );
});

FeatureDisplay.displayName = 'FeatureDisplay';

export default FeatureDisplay;
