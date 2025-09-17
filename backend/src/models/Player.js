class Player {
  constructor(id, name) {
    if (!id || !name) {
      throw new Error('Player must have id and name');
    }

    this.id = id;
    this.name = name;
    this.hand = [];
    this.score = 0;
    this.temporarilyUnavailable = [];
  }

  static validate(playerData) {
    if (!playerData.id || !playerData.name) {
      throw new Error('Player must have id and name');
    }

    if (playerData.hand && playerData.hand.length > 7) {
      throw new Error('Player hand size cannot exceed 7 cards');
    }

    if (playerData.score !== undefined && typeof playerData.score !== 'number') {
      throw new Error('Player score must be a number');
    }

    return true;
  }

  addCardToHand(card) {
    if (this.hand.length >= 7) {
      throw new Error('Cannot add card: hand size limit of 7 exceeded');
    }
    this.hand.push(card);
  }

  removeCardFromHand(cardId) {
    const index = this.hand.findIndex(card => card.id === cardId);
    if (index === -1) {
      throw new Error(`Card ${cardId} not found in player's hand`);
    }
    return this.hand.splice(index, 1)[0];
  }

  getResourceCards() {
    return this.hand.filter(card => card.role !== undefined);
  }

  getFeatureCards() {
    return this.hand.filter(card => card.requirements !== undefined);
  }

  addScore(points) {
    this.score += points;
  }

  makeResourceUnavailable(resourceCard, rounds) {
    resourceCard.unavailableUntil = rounds;
    this.temporarilyUnavailable.push(resourceCard);
  }

  restoreAvailableResources(currentRound) {
    this.temporarilyUnavailable = this.temporarilyUnavailable.filter(resource => {
      if (resource.unavailableUntil <= currentRound) {
        resource.unavailableUntil = null;
        return false;
      }
      return true;
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hand: this.hand,
      score: this.score,
      temporarilyUnavailable: this.temporarilyUnavailable
    };
  }

  static fromJSON(data) {
    const player = new Player(data.id, data.name);
    player.hand = data.hand || [];
    player.score = data.score || 0;
    player.temporarilyUnavailable = data.temporarilyUnavailable || [];
    return player;
  }
}

module.exports = Player;