class FeatureCard {
  constructor(id, name, requirements, points) {
    if (!id || !name || !requirements || !points) {
      throw new Error('FeatureCard must have id, name, requirements, and points');
    }

    this.id = id;
    this.name = name;
    this.description = '';
    this.requirements = requirements;
    this.points = points;
    this.assignedResources = [];
    this.completed = false;
    this.complexity = this.determineComplexity(points);
    this.cardType = 'feature';
  }

  static validate(cardData) {
    if (!cardData.id || !cardData.name || !cardData.requirements || !cardData.points) {
      throw new Error('FeatureCard must have id, name, requirements, and points');
    }

    // Validate points are 3, 5, or 8
    if (![3, 5, 8].includes(cardData.points)) {
      throw new Error('FeatureCard points must be 3, 5, or 8');
    }

    // Validate requirements structure
    const { requirements } = cardData;
    if (typeof requirements !== 'object' || requirements === null) {
      throw new Error('Requirements must be an object');
    }

    // Check that at least one resource type is required
    const totalRequired = (requirements.dev || 0) + (requirements.pm || 0) + (requirements.ux || 0);
    if (totalRequired === 0) {
      throw new Error('Feature must require at least one resource');
    }

    return true;
  }

  determineComplexity(points) {
    switch (points) {
      case 3: return 'basic';
      case 5: return 'complex';
      case 8: return 'epic';
      default: throw new Error('Invalid points value for complexity determination');
    }
  }

  canAssignResource(resourceCard) {
    if (this.completed) {
      return false;
    }

    if (resourceCard.assignedTo && resourceCard.assignedTo !== this.id) {
      return false;
    }

    if (resourceCard.unavailableUntil !== null) {
      return false;
    }

    const remaining = this.getRemainingRequirements();
    const needed = remaining[resourceCard.role] || 0;
    if (needed <= 0) {
      return false;
    }

    return true;
  }

  assignResource(resourceCard) {
    if (this.completed) {
      throw new Error('Feature is already completed');
    }

    if (!this.canAssignResource(resourceCard)) {
      throw new Error(`Cannot assign resource ${resourceCard.id} to feature ${this.id}`);
    }

    if (typeof resourceCard.assign === 'function') {
      resourceCard.assign(this.id);
    } else {
      resourceCard.assignedTo = this.id;
    }

    this.assignedResources.push(resourceCard);

    // Check if feature is now complete
    this.checkCompletion();
  }

  unassignResource(resourceId) {
    const index = this.assignedResources.findIndex(resource => resource.id === resourceId);
    if (index === -1) {
      throw new Error(`Resource ${resourceId} not assigned to feature ${this.id}`);
    }

    const resource = this.assignedResources.splice(index, 1)[0];
    resource.assignedTo = null;
    return resource;
  }

  checkCompletion() {
    const assignedCounts = {
      dev: 0,
      pm: 0,
      ux: 0,
    };

    this.assignedResources.forEach((resource) => {
      assignedCounts[resource.role] += 1;
    });

    const isComplete =
      assignedCounts.dev >= (this.requirements?.dev || 0) &&
      assignedCounts.pm >= (this.requirements?.pm || 0) &&
      assignedCounts.ux >= (this.requirements?.ux || 0);

    if (isComplete && !this.completed) {
      this.completed = true;
      return true;
    }

    return false;
  }

  getAssignedValue(role) {
    return this.assignedResources.filter(resource => resource.role === role).length;
  }

  getRemainingRequirements() {
    return {
      dev: Math.max(0, (this.requirements?.dev || 0) - this.getAssignedValue('dev')),
      pm: Math.max(0, (this.requirements?.pm || 0) - this.getAssignedValue('pm')),
      ux: Math.max(0, (this.requirements?.ux || 0) - this.getAssignedValue('ux'))
    };
  }

  isCompleted() {
    return this.completed;
  }

  getCompletionPercentage() {
    const totalRequired = (this.requirements?.dev || 0) + (this.requirements?.pm || 0) + (this.requirements?.ux || 0);

    if (totalRequired === 0) {
      return this.completed ? 100 : 0;
    }

    const assignedTotals = {
      dev: Math.min(this.getAssignedValue('dev'), this.requirements?.dev || 0),
      pm: Math.min(this.getAssignedValue('pm'), this.requirements?.pm || 0),
      ux: Math.min(this.getAssignedValue('ux'), this.requirements?.ux || 0),
    };

    const achieved = assignedTotals.dev + assignedTotals.pm + assignedTotals.ux;
    return Math.min(100, Number(((achieved / totalRequired) * 100).toFixed(2)));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      requirements: this.requirements,
      points: this.points,
      complexity: this.complexity,
      assignedResources: this.assignedResources,
      completed: this.completed
    };
  }

  static fromJSON(data) {
    const card = new FeatureCard(data.id, data.name, data.requirements, data.points);
    card.description = data.description || '';
    card.assignedResources = data.assignedResources || [];
    card.completed = data.completed || false;
    return card;
  }
}

module.exports = FeatureCard;
