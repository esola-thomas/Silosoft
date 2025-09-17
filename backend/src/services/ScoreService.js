class ScoreService {
  constructor() {
    this.pointValues = {
      basic: 3,
      complex: 5,
      epic: 8
    };

    this.bonusMultipliers = {
      earlyCompletion: 1.5,
      perfectMatch: 1.2,
      teamwork: 1.1,
      deadline: 2.0
    };
  }

  calculateFeaturePoints(featureCard, gameState = null, completionContext = {}) {
    if (!featureCard || featureCard.requirements === undefined) {
      throw new Error('Invalid feature card');
    }

    let basePoints = featureCard.points;
    let bonuses = 0;
    let penalties = 0;
    let multiplier = 1.0;

    // Base points validation
    if (![3, 5, 8].includes(basePoints)) {
      throw new Error('Invalid base points for feature');
    }

    // Early completion bonus (completed before halfway through game)
    if (gameState && gameState.currentRound <= Math.floor(gameState.maxRounds / 2)) {
      bonuses += Math.floor(basePoints * (this.bonusMultipliers.earlyCompletion - 1));
    }

    // Perfect resource match bonus (no over-assignment)
    if (this.isPerfectResourceMatch(featureCard)) {
      bonuses += Math.floor(basePoints * (this.bonusMultipliers.perfectMatch - 1));
    }

    // Teamwork bonus (resources from multiple players)
    if (completionContext.multipleContributors) {
      bonuses += Math.floor(basePoints * (this.bonusMultipliers.teamwork - 1));
    }

    // Deadline pressure bonus/penalty
    if (featureCard.deadline) {
      if (gameState && gameState.currentRound <= featureCard.deadline) {
        // Met deadline - bonus
        bonuses += featureCard.deadlineBonus || Math.floor(basePoints * (this.bonusMultipliers.deadline - 1));
      } else {
        // Missed deadline - penalty
        penalties += Math.abs(featureCard.deadlinePenalty || 0);
      }
    }

    // Complexity multiplier for late game completions
    if (gameState && gameState.currentRound > Math.floor(gameState.maxRounds * 0.75)) {
      const complexityBonus = {
        basic: 0,
        complex: 1,
        epic: 2
      };
      bonuses += complexityBonus[featureCard.complexity] || 0;
    }

    const totalPoints = Math.max(0, basePoints + bonuses - penalties);

    return {
      basePoints,
      bonuses,
      penalties,
      totalPoints,
      breakdown: this.getScoreBreakdown(basePoints, bonuses, penalties, featureCard, gameState)
    };
  }

  isPerfectResourceMatch(featureCard) {
    if (!featureCard.assignedResources || !featureCard.requirements) {
      return false;
    }

    const assigned = { dev: 0, pm: 0, ux: 0 };

    featureCard.assignedResources.forEach(resource => {
      assigned[resource.role] += resource.value;
    });

    // Check if assignment exactly matches requirements (no over-assignment)
    return (
      assigned.dev === featureCard.requirements.dev &&
      assigned.pm === featureCard.requirements.pm &&
      assigned.ux === featureCard.requirements.ux
    );
  }

  getScoreBreakdown(basePoints, bonuses, penalties, featureCard, gameState) {
    const breakdown = {
      base: basePoints,
      adjustments: []
    };

    if (bonuses > 0) {
      breakdown.adjustments.push({
        type: 'bonus',
        amount: bonuses,
        reason: 'Performance bonuses'
      });
    }

    if (penalties > 0) {
      breakdown.adjustments.push({
        type: 'penalty',
        amount: -penalties,
        reason: 'Deadline or efficiency penalties'
      });
    }

    return breakdown;
  }

  calculatePlayerScore(player, gameState = null) {
    if (!player) {
      throw new Error('Player is required');
    }

    let totalScore = player.score || 0;
    let featureContributions = 0;
    let bonuses = 0;
    let penalties = 0;

    // Count contributions to completed features
    if (gameState) {
      const completedFeatures = gameState.discardPile.filter(card => card.completed && card.requirements);

      completedFeatures.forEach(feature => {
        if (feature.assignedResources) {
          const playerContribution = feature.assignedResources.some(resource => {
            return player.hand.some(handCard => handCard.id === resource.id) ||
                   player.temporarilyUnavailable.some(tempCard => tempCard.id === resource.id);
          });

          if (playerContribution) {
            featureContributions += feature.points;
          }
        }
      });
    }

    // Calculate penalties for unassigned resources at game end
    if (gameState && gameState.isGameOver && gameState.isGameOver()) {
      const unassignedResources = player.hand.filter(card =>
        card.role !== undefined && card.assignedTo === null
      );
      penalties += unassignedResources.length; // 1 point penalty per unassigned resource
    }

    return {
      currentScore: totalScore,
      featureContributions,
      bonuses,
      penalties,
      finalScore: Math.max(0, totalScore + featureContributions + bonuses - penalties),
      breakdown: {
        base: totalScore,
        features: featureContributions,
        bonuses,
        penalties: -penalties
      }
    };
  }

  calculateTeamScore(gameState) {
    if (!gameState || !gameState.players) {
      throw new Error('Valid game state is required');
    }

    const teamStats = {
      totalScore: 0,
      averageScore: 0,
      featuresCompleted: 0,
      featuresRemaining: 0,
      roundsUsed: gameState.currentRound,
      roundsRemaining: Math.max(0, gameState.maxRounds - gameState.currentRound),
      efficiency: 0
    };

    // Calculate total team score
    gameState.players.forEach(player => {
      const playerScore = this.calculatePlayerScore(player, gameState);
      teamStats.totalScore += playerScore.finalScore;
    });

    teamStats.averageScore = teamStats.totalScore / gameState.players.length;

    // Count completed and remaining features
    if (gameState.discardPile) {
      teamStats.featuresCompleted = gameState.discardPile.filter(card =>
        card.completed && card.requirements
      ).length;
    }

    if (gameState.featuresInPlay) {
      teamStats.featuresRemaining = gameState.featuresInPlay.filter(card =>
        !card.completed && card.requirements
      ).length;
    }

    // Calculate efficiency (features completed per round)
    if (gameState.currentRound > 1) {
      teamStats.efficiency = teamStats.featuresCompleted / (gameState.currentRound - 1);
    }

    // Team bonuses
    const teamBonuses = this.calculateTeamBonuses(gameState, teamStats);
    teamStats.bonuses = teamBonuses;
    teamStats.totalScore += teamBonuses.total;

    return teamStats;
  }

  calculateTeamBonuses(gameState, teamStats) {
    const bonuses = {
      speedBonus: 0,
      efficiencyBonus: 0,
      cooperationBonus: 0,
      total: 0
    };

    // Speed bonus - complete game early
    if (gameState.winCondition && gameState.currentRound < gameState.maxRounds) {
      const roundsLeft = gameState.maxRounds - gameState.currentRound;
      bonuses.speedBonus = roundsLeft * 2;
    }

    // Efficiency bonus - high features per round ratio
    if (teamStats.efficiency > 1.5) {
      bonuses.efficiencyBonus = Math.floor(teamStats.efficiency * 3);
    }

    // Cooperation bonus - even score distribution
    const scores = gameState.players.map(p => this.calculatePlayerScore(p, gameState).finalScore);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreDifference = maxScore - minScore;

    if (scoreDifference <= 5 && teamStats.featuresCompleted > 3) {
      bonuses.cooperationBonus = 5;
    }

    bonuses.total = bonuses.speedBonus + bonuses.efficiencyBonus + bonuses.cooperationBonus;

    return bonuses;
  }

  getLeaderboard(gameState) {
    if (!gameState || !gameState.players) {
      throw new Error('Valid game state is required');
    }

    const leaderboard = gameState.players.map(player => {
      const scoreData = this.calculatePlayerScore(player, gameState);
      return {
        playerId: player.id,
        playerName: player.name,
        score: scoreData.finalScore,
        featureContributions: scoreData.featureContributions,
        bonuses: scoreData.bonuses,
        penalties: scoreData.penalties,
        breakdown: scoreData.breakdown
      };
    });

    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);

    // Add rankings
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard;
  }

  projectedScore(gameState, player, hypotheticalFeature) {
    const currentScore = this.calculatePlayerScore(player, gameState);
    const featureScore = this.calculateFeaturePoints(hypotheticalFeature, gameState);

    return {
      current: currentScore.finalScore,
      projected: currentScore.finalScore + featureScore.totalPoints,
      gain: featureScore.totalPoints,
      featureBreakdown: featureScore.breakdown
    };
  }

  getScoreHistory(gameState) {
    // This would typically track score changes over time
    // For now, return current state
    return {
      gameId: gameState.id,
      currentRound: gameState.currentRound,
      playerScores: this.getLeaderboard(gameState),
      teamScore: this.calculateTeamScore(gameState)
    };
  }
}

module.exports = ScoreService;