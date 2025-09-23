const FeatureCard = require('./FeatureCard');
const ResourceCard = require('./ResourceCard');
const EventCard = require('./EventCard');
const path = require('path');
const fs = require('fs');

class CardFactory {
  constructor() {
    this.cardDefinitions = null;
    this.loadCardDefinitions();
  }

  loadCardDefinitions() {
    try {
      const cardsPath = path.join(__dirname, '../../../shared/schemas/cards.json');
      const cardsData = fs.readFileSync(cardsPath, 'utf8');
      this.cardDefinitions = JSON.parse(cardsData);
    } catch (error) {
      throw new Error(`Failed to load card definitions: ${error.message}`);
    }
  }

  createFeatureCard(cardData) {
    const card = new FeatureCard(
      cardData.id,
      cardData.name,
      cardData.requirements,
      cardData.points
    );

    card.description = cardData.description || '';
    card.complexity = cardData.complexity || card.determineComplexity(cardData.points);

    return card;
  }

  createResourceCard(cardData) {
    const card = new ResourceCard(
      cardData.id,
      cardData.role,
      cardData.level,
      cardData.value
    );

    card.name = cardData.name || '';
    card.color = cardData.color || '';

    return card;
  }

  createEventCard(cardData) {
    const card = new EventCard(
      cardData.id,
      cardData.type,
      cardData.name,
      cardData.description,
      cardData.effect
    );

    card.color = cardData.color || '';

    return card;
  }

  createDeck() {
    if (!this.cardDefinitions) {
      throw new Error('Card definitions not loaded');
    }

    const deck = [];

    // Create feature cards
    this.cardDefinitions.cards.features.forEach(cardData => {
      try {
        const card = this.createFeatureCard(cardData);
        deck.push(card);
      } catch (error) {
        console.error(`Failed to create feature card ${cardData.id}:`, error.message);
      }
    });

    // Create resource cards
    this.cardDefinitions.cards.resources.forEach(cardData => {
      try {
        const card = this.createResourceCard(cardData);
        deck.push(card);
      } catch (error) {
        console.error(`Failed to create resource card ${cardData.id}:`, error.message);
      }
    });

    // Create event cards
    this.cardDefinitions.cards.events.forEach(cardData => {
      try {
        const card = this.createEventCard(cardData);
        deck.push(card);
      } catch (error) {
        console.error(`Failed to create event card ${cardData.id}:`, error.message);
      }
    });

    return deck;
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];

    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  dealInitialCards(deck, players) {
    if (!Array.isArray(deck) || !Array.isArray(players)) {
      throw new Error('Deck and players must be arrays');
    }

    if (players.length < 2 || players.length > 4) {
      throw new Error('Must have 2-4 players');
    }

    const shuffledDeck = this.shuffleDeck(deck);
    const dealtDeck = [...shuffledDeck];

    // Give each player 1 feature card
    const featureCards = dealtDeck.filter(card => card.requirements !== undefined);
    if (featureCards.length < players.length) {
      throw new Error('Not enough feature cards for all players');
    }

    players.forEach((player, index) => {
      if (index < featureCards.length) {
        player.hand.push(featureCards[index]);
        // Remove from deck
        const deckIndex = dealtDeck.findIndex(card => card.id === featureCards[index].id);
        if (deckIndex !== -1) {
          dealtDeck.splice(deckIndex, 1);
        }
      }
    });

    // Give each player resource cards (3-4 cards total hand size)
    const resourceCards = dealtDeck.filter(card => card.role !== undefined);
    let resourceIndex = 0;

    players.forEach(player => {
      const cardsNeeded = 4 - player.hand.length; // Target 4 cards total

      for (let i = 0; i < cardsNeeded && resourceIndex < resourceCards.length; i++) {
        player.hand.push(resourceCards[resourceIndex]);
        // Remove from deck
        const deckIndex = dealtDeck.findIndex(card => card.id === resourceCards[resourceIndex].id);
        if (deckIndex !== -1) {
          dealtDeck.splice(deckIndex, 1);
        }
        resourceIndex++;
      }
    });

    return dealtDeck;
  }

  createGameDeck(players) {
    const fullDeck = this.createDeck();
    const remainingDeck = this.dealInitialCards(fullDeck, players);

    return {
      deck: this.shuffleDeck(remainingDeck),
      totalCards: fullDeck.length,
      dealtCards: fullDeck.length - remainingDeck.length,
      remainingCards: remainingDeck.length
    };
  }

  getCardById(cardId) {
    if (!this.cardDefinitions) {
      throw new Error('Card definitions not loaded');
    }

    // Search in features
    let cardData = this.cardDefinitions.cards.features.find(card => card.id === cardId);
    if (cardData) {
      return this.createFeatureCard(cardData);
    }

    // Search in resources
    cardData = this.cardDefinitions.cards.resources.find(card => card.id === cardId);
    if (cardData) {
      return this.createResourceCard(cardData);
    }

    // Search in events
    cardData = this.cardDefinitions.cards.events.find(card => card.id === cardId);
    if (cardData) {
      return this.createEventCard(cardData);
    }

    throw new Error(`Card with id ${cardId} not found`);
  }

  getCardStats() {
    if (!this.cardDefinitions) {
      return null;
    }

    return {
      total: this.cardDefinitions.metadata.totalCards,
      features: this.cardDefinitions.metadata.deckComposition.features,
      resources: this.cardDefinitions.metadata.deckComposition.resources,
      events: this.cardDefinitions.metadata.deckComposition.events,
      version: this.cardDefinitions.version
    };
  }

  validateDeck(deck) {
    if (!Array.isArray(deck)) {
      throw new Error('Deck must be an array');
    }

    const stats = {
      features: 0,
      resources: 0,
      events: 0,
      total: deck.length
    };

    deck.forEach(card => {
      if (card.requirements !== undefined) {
        stats.features++;
      } else if (card.role !== undefined) {
        stats.resources++;
      } else if (card.type !== undefined) {
        stats.events++;
      } else {
        throw new Error(`Invalid card type for card ${card.id}`);
      }
    });

    return stats;
  }
}

module.exports = CardFactory;