const formatCard = (card) => {
  if (!card) {
    return null;
  }

  const cardType = card.cardType
    || (card.requirements ? 'feature' : card.role ? 'resource' : 'event');

  const formatted = {
    ...card,
    cardType,
  };

  if (Array.isArray(card.assignedResources)) {
    formatted.assignedResources = card.assignedResources.map(formatCard);
  }

  return formatted;
};

const serializePlayer = (player, { includeJoinCodes = false } = {}) => {
  if (!player) {
    return null;
  }

  const basePlayer = {
    id: player.id,
    name: player.name,
    hand: Array.isArray(player.hand) ? player.hand.map(formatCard) : [],
    score: player.score,
    temporarilyUnavailable: Array.isArray(player.temporarilyUnavailable)
      ? player.temporarilyUnavailable.map(formatCard)
      : [],
    isConnected: Boolean(player.isConnected),
    isReady: Boolean(player.isReady),
  };

  if (includeJoinCodes) {
    basePlayer.joinCode = player.joinCode;
  }

  return basePlayer;
};

const serializeGameState = (gameState, {
  includeDeck = true,
  includeJoinCodes = false,
  includeDiscard = false,
} = {}) => {
  if (!gameState) {
    return null;
  }

  const currentPlayer = typeof gameState.getCurrentPlayer === 'function'
    ? gameState.getCurrentPlayer()
    : (gameState.players || [])[gameState.currentPlayerIndex || 0];

  const serialized = {
    id: gameState.id,
    gamePhase: gameState.gamePhase,
    currentRound: gameState.currentRound,
    currentPlayerIndex: gameState.currentPlayerIndex,
    currentPlayerId: currentPlayer ? currentPlayer.id : null,
    players: (gameState.players || []).map((player) =>
      serializePlayer(player, { includeJoinCodes })),
    featuresInPlay: (gameState.featuresInPlay || []).map(formatCard),
    deckSize: Array.isArray(gameState.deck) ? gameState.deck.length : 0,
    winCondition: gameState.winCondition,
    maxRounds: gameState.maxRounds,
    lastAction: gameState.lastAction,
    createdAt: gameState.createdAt,
    isGameOver: typeof gameState.isGameOver === 'function'
      ? gameState.isGameOver()
      : Boolean(gameState.winCondition || (gameState.gamePhase === 'ended')),
  };

  if (includeDeck) {
    serialized.deck = (gameState.deck || []).map(formatCard);
  }

  if (currentPlayer) {
    serialized.currentPlayer = serializePlayer(currentPlayer, {
      includeJoinCodes,
    });
  }

  if (includeDiscard) {
    serialized.discardPile = (gameState.discardPile || []).map(formatCard);
  } else {
    serialized.discardPileSize = Array.isArray(gameState.discardPile)
      ? gameState.discardPile.length
      : 0;
  }

  return serialized;
};

module.exports = {
  formatCard,
  serializePlayer,
  serializeGameState,
};
