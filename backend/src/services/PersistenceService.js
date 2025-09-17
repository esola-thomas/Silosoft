const fs = require('fs').promises;
const path = require('path');

/**
 * PersistenceService - Handles saving and loading game state to/from JSON files
 * Provides backup and recovery functionality for game sessions
 */
class PersistenceService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.gamesDir = path.join(this.dataDir, 'games');
    this.backupDir = path.join(this.dataDir, 'backups');
    this.initialized = false;
  }

  /**
   * Initialize the persistence service by creating necessary directories
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.gamesDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      this.initialized = true;
      console.log('PersistenceService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PersistenceService:', error);
      throw error;
    }
  }

  /**
   * Get the file path for a game's JSON data
   * @param {string} gameId - The game ID
   * @returns {string} The file path
   */
  getGameFilePath(gameId) {
    return path.join(this.gamesDir, `${gameId}.json`);
  }

  /**
   * Get the backup file path for a game
   * @param {string} gameId - The game ID
   * @param {string} timestamp - Optional timestamp for the backup
   * @returns {string} The backup file path
   */
  getBackupFilePath(gameId, timestamp = null) {
    const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.backupDir, `${gameId}_${ts}.json`);
  }

  /**
   * Save game state to JSON file
   * @param {Object} gameState - The game state object to save
   * @returns {Promise<boolean>} True if saved successfully
   */
  async saveGame(gameState) {
    await this.initialize();

    if (!gameState || !gameState.id) {
      throw new Error('Invalid game state: missing id');
    }

    try {
      const filePath = this.getGameFilePath(gameState.id);

      // Create a backup if the file already exists
      try {
        await fs.access(filePath);
        await this.createBackup(gameState.id);
      } catch (error) {
        // File doesn't exist, no backup needed
      }

      // Serialize the game state with proper formatting
      const serializedState = this.serializeGameState(gameState);
      const jsonData = JSON.stringify(serializedState, null, 2);

      await fs.writeFile(filePath, jsonData, 'utf8');

      console.log(`Game ${gameState.id} saved successfully`);
      return true;

    } catch (error) {
      console.error(`Failed to save game ${gameState.id}:`, error);
      throw error;
    }
  }

  /**
   * Load game state from JSON file
   * @param {string} gameId - The game ID to load
   * @returns {Promise<Object>} The loaded game state
   */
  async loadGame(gameId) {
    await this.initialize();

    if (!gameId) {
      throw new Error('Game ID is required');
    }

    try {
      const filePath = this.getGameFilePath(gameId);
      const jsonData = await fs.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(jsonData);

      // Deserialize and restore the game state
      const gameState = this.deserializeGameState(parsedData);

      console.log(`Game ${gameId} loaded successfully`);
      return gameState;

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Game ${gameId} not found`);
      }
      console.error(`Failed to load game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a game file exists
   * @param {string} gameId - The game ID to check
   * @returns {Promise<boolean>} True if the game file exists
   */
  async gameExists(gameId) {
    await this.initialize();

    try {
      const filePath = this.getGameFilePath(gameId);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a game file
   * @param {string} gameId - The game ID to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteGame(gameId) {
    await this.initialize();

    try {
      const filePath = this.getGameFilePath(gameId);

      // Create a backup before deletion
      await this.createBackup(gameId);

      await fs.unlink(filePath);
      console.log(`Game ${gameId} deleted successfully`);
      return true;

    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // File didn't exist
      }
      console.error(`Failed to delete game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * List all available game IDs
   * @returns {Promise<Array<string>>} Array of game IDs
   */
  async listGames() {
    await this.initialize();

    try {
      const files = await fs.readdir(this.gamesDir);
      const gameIds = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      return gameIds;

    } catch (error) {
      console.error('Failed to list games:', error);
      throw error;
    }
  }

  /**
   * Create a backup of an existing game file
   * @param {string} gameId - The game ID to backup
   * @returns {Promise<boolean>} True if backup created successfully
   */
  async createBackup(gameId) {
    try {
      const filePath = this.getGameFilePath(gameId);
      const backupPath = this.getBackupFilePath(gameId);

      const data = await fs.readFile(filePath, 'utf8');
      await fs.writeFile(backupPath, data, 'utf8');

      console.log(`Backup created for game ${gameId}`);
      return true;

    } catch (error) {
      console.error(`Failed to create backup for game ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Serialize game state for JSON storage
   * @param {Object} gameState - The game state to serialize
   * @returns {Object} Serialized game state
   */
  serializeGameState(gameState) {
    return {
      id: gameState.id,
      players: gameState.players.map(player => ({
        id: player.id,
        name: player.name,
        hand: player.hand,
        score: player.score,
        temporarilyUnavailable: player.temporarilyUnavailable || []
      })),
      deck: gameState.deck,
      discardPile: gameState.discardPile || [],
      featuresInPlay: gameState.featuresInPlay || [],
      currentRound: gameState.currentRound,
      maxRounds: gameState.maxRounds,
      currentPlayerIndex: gameState.currentPlayerIndex,
      gamePhase: gameState.gamePhase,
      winCondition: gameState.winCondition,
      lastAction: gameState.lastAction || null,
      createdAt: gameState.createdAt,
      updatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Deserialize game state from JSON storage
   * @param {Object} data - The serialized data
   * @returns {Object} Deserialized game state
   */
  deserializeGameState(data) {
    // Validate required fields
    if (!data.id || !data.players || !Array.isArray(data.players)) {
      throw new Error('Invalid serialized game state: missing required fields');
    }

    // Return the deserialized state (GameEngine will reconstruct the class instance)
    return {
      id: data.id,
      players: data.players.map(player => ({
        id: player.id,
        name: player.name,
        hand: player.hand || [],
        score: player.score || 0,
        temporarilyUnavailable: player.temporarilyUnavailable || []
      })),
      deck: data.deck || [],
      discardPile: data.discardPile || [],
      featuresInPlay: data.featuresInPlay || [],
      currentRound: data.currentRound || 1,
      maxRounds: data.maxRounds || 10,
      currentPlayerIndex: data.currentPlayerIndex || 0,
      gamePhase: data.gamePhase || 'setup',
      winCondition: data.winCondition || 'complete_all_features',
      lastAction: data.lastAction || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      version: data.version || '1.0.0'
    };
  }

  /**
   * Clean up old backup files (keep last N backups per game)
   * @param {number} keepCount - Number of backups to keep per game (default: 5)
   * @returns {Promise<void>}
   */
  async cleanupBackups(keepCount = 5) {
    await this.initialize();

    try {
      const files = await fs.readdir(this.backupDir);
      const gameBackups = {};

      // Group backups by game ID
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const parts = file.split('_');
          if (parts.length >= 2) {
            const gameId = parts[0];
            if (!gameBackups[gameId]) {
              gameBackups[gameId] = [];
            }
            gameBackups[gameId].push(file);
          }
        }
      });

      // Clean up old backups for each game
      for (const [gameId, backups] of Object.entries(gameBackups)) {
        if (backups.length > keepCount) {
          // Sort by timestamp (oldest first)
          backups.sort();
          const toDelete = backups.slice(0, backups.length - keepCount);

          for (const file of toDelete) {
            const filePath = path.join(this.backupDir, file);
            await fs.unlink(filePath);
            console.log(`Deleted old backup: ${file}`);
          }
        }
      }

    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }
}

module.exports = PersistenceService;