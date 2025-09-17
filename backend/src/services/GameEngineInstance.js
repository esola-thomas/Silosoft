const GameEngine = require('./GameEngine');

// Singleton instance to share between routes
const gameEngineInstance = new GameEngine();

module.exports = gameEngineInstance;