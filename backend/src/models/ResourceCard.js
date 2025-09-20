class ResourceCard {
  constructor(id, role, level, value) {
    if (!id || !role || !level || value === undefined) {
      throw new Error('ResourceCard must have id, role, level, and value');
    }

    this.id = id;
    this.role = role;
    this.level = level;
    this.value = value;
    this.name = '';
    this.color = '';
    this.assignedTo = null;
    this.unavailableUntil = null;
    this.contractorExpiresAt = null;
    this.cardType = 'resource';
  }

  static validate(cardData) {
    if (!cardData.id || !cardData.role || !cardData.level || cardData.value === undefined) {
      throw new Error('ResourceCard must have id, role, level, and value');
    }

    // Validate role
    const validRoles = ['dev', 'pm', 'ux'];
    if (!validRoles.includes(cardData.role)) {
      throw new Error(`Role must be one of: ${validRoles.join(', ')}`);
    }

    // Validate level
    const validLevels = ['entry', 'junior', 'senior'];
    if (!validLevels.includes(cardData.level)) {
      throw new Error(`Level must be one of: ${validLevels.join(', ')}`);
    }

    // Validate value matches level
    const expectedValue = ResourceCard.getValueForLevel(cardData.level);
    if (cardData.value !== expectedValue) {
      throw new Error(`Value ${cardData.value} does not match level ${cardData.level}`);
    }

    return true;
  }

  static getValueForLevel(level) {
    switch (level) {
      case 'entry': return 1;
      case 'junior': return 2;
      case 'senior': return 3;
      default: throw new Error(`Invalid level: ${level}`);
    }
  }

  static getLevelForValue(value) {
    switch (value) {
      case 1: return 'entry';
      case 2: return 'junior';
      case 3: return 'senior';
      default: throw new Error(`Invalid value: ${value}`);
    }
  }

  isAvailable(currentRound = null) {
    if (this.contractorExpiresAt !== null && currentRound !== null && currentRound >= this.contractorExpiresAt) {
      return false;
    }

    if (this.isUnavailable(currentRound)) {
      return false;
    }

    return this.assignedTo === null;
  }

  isAssigned() {
    return this.assignedTo !== null;
  }

  isUnavailable(currentRound = null) {
    if (this.unavailableUntil === null) {
      return false;
    }

    if (currentRound !== null && this.unavailableUntil <= currentRound) {
      this.unavailableUntil = null;
      return false;
    }

    return true;
  }

  assign(featureId) {
    if (this.assignedTo !== null) {
      throw new Error(`Resource ${this.id} is already assigned to ${this.assignedTo}`);
    }

    if (this.unavailableUntil !== null) {
      throw new Error(`Resource ${this.id} is unavailable until round ${this.unavailableUntil}`);
    }

    this.assignedTo = featureId;
  }

  unassign() {
    if (this.assignedTo === null) {
      throw new Error(`Resource ${this.id} is not assigned`);
    }

    this.assignedTo = null;
  }

  makeUnavailable(untilRound) {
    if (this.assignedTo !== null) {
      throw new Error(`Cannot make assigned resource ${this.id} unavailable`);
    }

    this.unavailableUntil = untilRound;
  }

  makeAvailable() {
    this.unavailableUntil = null;
  }

  getSkillValue() {
    return this.value;
  }

  getDisplayName() {
    const roleNames = {
      dev: 'Developer',
      pm: 'Product Manager',
      ux: 'UX Designer'
    };

    const levelNames = {
      entry: 'Entry',
      junior: 'Junior',
      senior: 'Senior'
    };

    return `${levelNames[this.level]} ${roleNames[this.role]}`;
  }

  toJSON() {
    return {
      id: this.id,
      role: this.role,
      level: this.level,
      value: this.value,
      name: this.name,
      color: this.color,
      assignedTo: this.assignedTo,
      unavailableUntil: this.unavailableUntil
    };
  }

  static fromJSON(data) {
    const card = new ResourceCard(data.id, data.role, data.level, data.value);
    card.name = data.name || '';
    card.color = data.color || '';
    card.assignedTo = data.assignedTo || null;
    card.unavailableUntil = data.unavailableUntil || null;
    return card;
  }
}

module.exports = ResourceCard;
