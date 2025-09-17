const CardFactory = require('../models/CardFactory');

class CardService {
  constructor() {
    this.cardFactory = new CardFactory();
  }

  getCardDefinitions() {
    return this.cardFactory.cardDefinitions;
  }

  getCardStats() {
    return this.cardFactory.getCardStats();
  }

  createCard(cardData) {
    if (cardData.requirements !== undefined) {
      return this.cardFactory.createFeatureCard(cardData);
    } else if (cardData.role !== undefined) {
      return this.cardFactory.createResourceCard(cardData);
    } else if (cardData.type !== undefined) {
      return this.cardFactory.createEventCard(cardData);
    } else {
      throw new Error('Invalid card data: cannot determine card type');
    }
  }

  getCardById(cardId) {
    return this.cardFactory.getCardById(cardId);
  }

  createFullDeck() {
    return this.cardFactory.createDeck();
  }

  shuffleDeck(deck) {
    return this.cardFactory.shuffleDeck(deck);
  }

  dealInitialCards(deck, players) {
    return this.cardFactory.dealInitialCards(deck, players);
  }

  validateDeck(deck) {
    return this.cardFactory.validateDeck(deck);
  }

  getFeatureCards() {
    const definitions = this.getCardDefinitions();
    return definitions.cards.features.map(cardData =>
      this.cardFactory.createFeatureCard(cardData)
    );
  }

  getResourceCards() {
    const definitions = this.getCardDefinitions();
    return definitions.cards.resources.map(cardData =>
      this.cardFactory.createResourceCard(cardData)
    );
  }

  getEventCards() {
    const definitions = this.getCardDefinitions();
    return definitions.cards.events.map(cardData =>
      this.cardFactory.createEventCard(cardData)
    );
  }

  getCardsByType(type) {
    switch (type) {
      case 'feature':
        return this.getFeatureCards();
      case 'resource':
        return this.getResourceCards();
      case 'event':
        return this.getEventCards();
      default:
        throw new Error(`Invalid card type: ${type}`);
    }
  }

  filterCards(criteria) {
    const allCards = this.createFullDeck();

    return allCards.filter(card => {
      // Filter by type
      if (criteria.type) {
        if (criteria.type === 'feature' && card.requirements === undefined) return false;
        if (criteria.type === 'resource' && card.role === undefined) return false;
        if (criteria.type === 'event' && card.type === undefined) return false;
      }

      // Filter by role (for resource cards)
      if (criteria.role && card.role !== criteria.role) return false;

      // Filter by level (for resource cards)
      if (criteria.level && card.level !== criteria.level) return false;

      // Filter by complexity (for feature cards)
      if (criteria.complexity && card.complexity !== criteria.complexity) return false;

      // Filter by points (for feature cards)
      if (criteria.points && card.points !== criteria.points) return false;

      // Filter by event type
      if (criteria.eventType && card.type !== criteria.eventType) return false;

      return true;
    });
  }

  getDeckComposition(deck) {
    const composition = {
      features: { basic: 0, complex: 0, epic: 0, total: 0 },
      resources: {
        dev: { entry: 0, junior: 0, senior: 0, total: 0 },
        pm: { entry: 0, junior: 0, senior: 0, total: 0 },
        ux: { entry: 0, junior: 0, senior: 0, total: 0 },
        total: 0
      },
      events: { layoff: 0, pto: 0, competition: 0, bonus: 0, reorg: 0, contractor: 0, total: 0 },
      total: deck.length
    };

    deck.forEach(card => {
      if (card.requirements !== undefined) {
        // Feature card
        composition.features[card.complexity]++;
        composition.features.total++;
      } else if (card.role !== undefined) {
        // Resource card
        if (card.role === 'contractor') {
          composition.resources.contractor = (composition.resources.contractor || 0) + 1;
        } else {
          composition.resources[card.role][card.level]++;
          composition.resources[card.role].total++;
        }
        composition.resources.total++;
      } else if (card.type !== undefined) {
        // Event card
        composition.events[card.type] = (composition.events[card.type] || 0) + 1;
        composition.events.total++;
      }
    });

    return composition;
  }

  drawCardsFromDeck(deck, count, type = null) {
    if (!Array.isArray(deck)) {
      throw new Error('Deck must be an array');
    }

    if (count <= 0) {
      throw new Error('Count must be positive');
    }

    let availableCards = [...deck];

    // Filter by type if specified
    if (type) {
      availableCards = availableCards.filter(card => {
        if (type === 'feature') return card.requirements !== undefined;
        if (type === 'resource') return card.role !== undefined;
        if (type === 'event') return card.type !== undefined;
        return true;
      });
    }

    if (availableCards.length < count) {
      throw new Error(`Not enough ${type || ''} cards in deck. Requested: ${count}, Available: ${availableCards.length}`);
    }

    // Shuffle available cards
    const shuffled = this.shuffleDeck(availableCards);

    // Draw the requested number
    return shuffled.slice(0, count);
  }

  optimizeDeckForPlayerCount(playerCount) {
    if (playerCount < 2 || playerCount > 4) {
      throw new Error('Player count must be between 2 and 4');
    }

    const baseFeatures = Math.ceil(12 + (playerCount * 2)); // More features for more players
    const baseResources = Math.ceil(15 + (playerCount * 3)); // More resources for more players
    const baseEvents = Math.ceil(6 + playerCount); // More events for more players

    const allCards = this.createFullDeck();
    const optimizedDeck = [];

    // Add features
    const features = allCards.filter(card => card.requirements !== undefined);
    optimizedDeck.push(...features.slice(0, Math.min(baseFeatures, features.length)));

    // Add resources
    const resources = allCards.filter(card => card.role !== undefined);
    optimizedDeck.push(...resources.slice(0, Math.min(baseResources, resources.length)));

    // Add events
    const events = allCards.filter(card => card.type !== undefined);
    optimizedDeck.push(...events.slice(0, Math.min(baseEvents, events.length)));

    return this.shuffleDeck(optimizedDeck);
  }

  validateCardAssignment(resourceCard, featureCard) {
    if (!resourceCard || !featureCard) {
      throw new Error('Both resource and feature cards are required');
    }

    if (resourceCard.role === undefined) {
      throw new Error('First argument must be a resource card');
    }

    if (featureCard.requirements === undefined) {
      throw new Error('Second argument must be a feature card');
    }

    if (featureCard.completed) {
      return { valid: false, reason: 'Feature is already completed' };
    }

    if (resourceCard.assignedTo && resourceCard.assignedTo !== featureCard.id) {
      return { valid: false, reason: 'Resource is already assigned to another feature' };
    }

    if (resourceCard.unavailableUntil !== null) {
      return { valid: false, reason: 'Resource is temporarily unavailable' };
    }

    // Check if the resource type is needed
    const currentAssigned = featureCard.getAssignedValue ? featureCard.getAssignedValue(resourceCard.role) : 0;
    const required = featureCard.requirements[resourceCard.role] || 0;

    if (currentAssigned >= required) {
      return { valid: false, reason: `Feature already has enough ${resourceCard.role} resources` };
    }

    return { valid: true, reason: 'Assignment is valid' };
  }
}

module.exports = CardService;