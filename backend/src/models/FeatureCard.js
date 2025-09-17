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

    return true;
  }

  assignResource(resourceCard) {
    if (!this.canAssignResource(resourceCard)) {
      throw new Error(`Cannot assign resource ${resourceCard.id} to feature ${this.id}`);
    }

    resourceCard.assignedTo = this.id;
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
    const assigned = {
      dev: 0,
      pm: 0,
      ux: 0
    };

    this.assignedResources.forEach(resource => {
      assigned[resource.role] += resource.value;
    });

    const isComplete =
      assigned.dev >= this.requirements.dev &&
      assigned.pm >= this.requirements.pm &&
      assigned.ux >= this.requirements.ux;

    if (isComplete && !this.completed) {
      this.completed = true;
      return true;
    }

    return false;
  }

  getAssignedValue(role) {
    return this.assignedResources
      .filter(resource => resource.role === role)
      .reduce((sum, resource) => sum + resource.value, 0);
  }

  getRemainingRequirements() {
    return {
      dev: Math.max(0, this.requirements.dev - this.getAssignedValue('dev')),
      pm: Math.max(0, this.requirements.pm - this.getAssignedValue('pm')),
      ux: Math.max(0, this.requirements.ux - this.getAssignedValue('ux'))
    };
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