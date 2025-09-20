class EventCard {
  constructor(id, type, name, description, effect) {
    if (description && typeof description === 'object' && effect === undefined) {
      effect = description;
      description = name;
    }

    if (!id || !type || !effect) {
      throw new Error('EventCard must have id, type, and effect');
    }

    this.id = id;
    this.type = type;
    this.name = name || '';
    this.description = description || '';
    this.effect = effect;
    this.color = '';
    this.triggered = false;
    this.resolved = false;
    this.cardType = 'event';
  }

  static validate(cardData) {
    if (!cardData.id || !cardData.type || !cardData.effect) {
      throw new Error('EventCard must have id, type, and effect');
    }

    // Validate event type
    const validTypes = ['layoff', 'reorg', 'contractor', 'competition', 'pto', 'plm', 'bonus'];
    if (!validTypes.includes(cardData.type)) {
      throw new Error(`Event type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate effect structure based on type
    EventCard.validateEffectForType(cardData.type, cardData.effect);

    return true;
  }

  static validateEffectForType(type, effect) {
    if (typeof effect !== 'object' || effect === null) {
      throw new Error('Effect must be an object');
    }

    switch (type) {
      case 'layoff':
        if (!effect.action || effect.action !== 'random_discard') {
          throw new Error('Layoff event must have action: random_discard');
        }
        if (!effect.count || typeof effect.count !== 'number') {
          throw new Error('Layoff event must specify count');
        }
        break;

      case 'pto':
      case 'plm':
        if (!effect.action || effect.action !== 'resource_lock') {
          throw new Error(`${type} event must have action: resource_lock`);
        }
        if (!effect.duration || typeof effect.duration !== 'number') {
          throw new Error(`${type} event must specify duration`);
        }
        break;

      case 'competition':
        if (!effect.action || effect.action !== 'deadline_pressure') {
          throw new Error('Competition event must have action: deadline_pressure');
        }
        if (!effect.rounds || typeof effect.rounds !== 'number') {
          throw new Error('Competition event must specify rounds');
        }
        if (effect.failurePenalty === undefined || typeof effect.failurePenalty !== 'number') {
          throw new Error('Competition event must specify failurePenalty');
        }
        break;

      case 'bonus':
        if (!effect.action || effect.action !== 'draw_resources') {
          throw new Error('Bonus event must have action: draw_resources');
        }
        if (!effect.count || typeof effect.count !== 'number') {
          throw new Error('Bonus event must specify count');
        }
        break;

      case 'reorg':
        if (!effect.action || effect.action !== 'reassign_resources') {
          throw new Error('Reorg event must have action: reassign_resources');
        }
        break;

      case 'contractor':
        if (!effect.action || effect.action !== 'add_wildcard') {
          throw new Error('Contractor event must have action: add_wildcard');
        }
        break;
    }
  }

  trigger() {
    if (this.triggered) {
      throw new Error(`Event ${this.id} has already been triggered`);
    }

    this.triggered = true;
  }

  resolve() {
    if (!this.triggered) {
      throw new Error(`Event ${this.id} must be triggered before resolving`);
    }

    if (this.resolved) {
      throw new Error(`Event ${this.id} has already been resolved`);
    }

    this.resolved = true;
  }

  getEffectDescription() {
    switch (this.type) {
      case 'layoff':
        return `Randomly discard ${this.effect.count} resource card(s)`;

      case 'pto':
      case 'plm':
        return `Choose a resource to be unavailable for ${this.effect.duration} rounds`;

      case 'competition':
        return `Complete a feature in ${this.effect.rounds} rounds or lose ${Math.abs(this.effect.failurePenalty)} points`;

      case 'bonus':
        return `Draw ${this.effect.count} extra resource cards`;

      case 'reorg':
        return 'Reassign resources between teammates';

      case 'contractor':
        return 'Add a wildcard resource that can substitute for any role';

      default:
        return this.description;
    }
  }

  canBeApplied(gameState) {
    switch (this.type) {
      case 'layoff':
        // Need resources to discard
        return gameState.players.some(player =>
          player.getResourceCards().length > 0
        );

      case 'pto':
      case 'plm':
        // Need available resources to lock
        return gameState.players.some(player =>
          player.getResourceCards().some(resource => resource.isAvailable())
        );

      case 'competition':
        // Need features in play
        return gameState.featuresInPlay.length > 0;

      case 'bonus':
        // Need cards in deck to draw
        return gameState.deck.filter(card => card.role !== undefined).length >= this.effect.count;

      default:
        return true;
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      effect: this.effect,
      color: this.color,
      triggered: this.triggered,
      resolved: this.resolved
    };
  }

  static fromJSON(data) {
    const card = new EventCard(data.id, data.type, data.name, data.description, data.effect);
    card.color = data.color || '';
    card.triggered = data.triggered || false;
    card.resolved = data.resolved || false;
    return card;
  }
}

module.exports = EventCard;
