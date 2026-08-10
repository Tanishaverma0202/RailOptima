// 🗄️ SIMULATION STORAGE SYSTEM
// Persistent storage for model training and continuous learning

class SimulationStorage {
  constructor() {
    this.storageKey = 'railoptima_simulations';
    this.maxStoredSimulations = 1000; // Limit storage size
    this.initializeStorage();
  }

  // Initialize storage if it doesn't exist
  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        simulations: [],
        metadata: {
          totalRuns: 0,
          bestRewardScore: 0,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }
  }

  // Get all stored simulations
  getAllSimulations() {
    const data = JSON.parse(localStorage.getItem(this.storageKey));
    return data.simulations || [];
  }

  // Get storage metadata
  getMetadata() {
    const data = JSON.parse(localStorage.getItem(this.storageKey));
    return data.metadata || {};
  }

  // Store a new simulation
  storeSimulation(simulation) {
    const data = JSON.parse(localStorage.getItem(this.storageKey));
    
    // Create enhanced simulation record
    const enhancedSimulation = {
      ...simulation,
      id: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      // Enhanced metrics for training
      trainingMetrics: this.calculateTrainingMetrics(simulation),
      // Performance indicators
      efficiency: this.calculateEfficiency(simulation),
      // Learning data
      learningData: this.extractLearningData(simulation)
    };

    // Add to storage
    data.simulations.unshift(enhancedSimulation);
    
    // Update metadata
    data.metadata.totalRuns = (data.metadata.totalRuns || 0) + 1;
    data.metadata.bestRewardScore = Math.max(
      data.metadata.bestRewardScore || 0,
      simulation.kpis?.rewardScore || 0
    );
    data.metadata.lastUpdated = new Date().toISOString();

    // Limit storage size
    if (data.simulations.length > this.maxStoredSimulations) {
      data.simulations = data.simulations.slice(0, this.maxStoredSimulations);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(data));
    
    return enhancedSimulation;
  }

  // Get training data for model improvement
  getTrainingData(limit = 100) {
    const simulations = this.getAllSimulations();
    return simulations.slice(0, limit).map(sim => ({
      id: sim.id,
      timestamp: sim.timestamp,
      kpis: sim.kpis,
      trainingMetrics: sim.trainingMetrics,
      efficiency: sim.efficiency,
      learningData: sim.learningData,
      schedule: sim.schedule,
      conflicts: sim.conflicts
    }));
  }

  // Calculate training metrics
  calculateTrainingMetrics(simulation) {
    if (!simulation.schedule || !simulation.kpis) return {};

    const trains = simulation.schedule;
    const conflicts = simulation.conflicts || [];
    
    return {
      // Conflict resolution efficiency
      conflictResolutionRate: trains.length > 0 ? (trains.length - conflicts.length) / trains.length : 0,
      
      // Delay distribution
      delayVariance: this.calculateDelayVariance(trains),
      delayMean: this.calculateDelayMean(trains),
      
      // Track utilization
      trackUtilization: this.calculateTrackUtilization(trains),
      
      // Time efficiency
      timeEfficiency: this.calculateTimeEfficiency(trains),
      
      // Resource optimization
      resourceOptimization: this.calculateResourceOptimization(trains, conflicts),
      
      // Predictive accuracy (based on historical patterns)
      predictiveAccuracy: this.calculatePredictiveAccuracy(simulation)
    };
  }

  // Calculate efficiency score
  calculateEfficiency(simulation) {
    const kpis = simulation.kpis || {};
    const weights = {
      rewardScore: 0.3,
      throughput: 0.25,
      conflictResolution: 0.2,
      delayReduction: 0.15,
      completionRate: 0.1
    };

    const normalizedScores = {
      rewardScore: Math.min(kpis.rewardScore / 100, 1),
      throughput: (kpis.maxThroughput || 0) / 100,
      conflictResolution: 1 - ((kpis.totalConflicts || 0) / 10), // Normalize to 0-1
      delayReduction: 1 - ((kpis.avgDelay || 0) / 30), // Normalize to 0-1
      completionRate: (kpis.completionRate || 0) / 100
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (normalizedScores[key] || 0) * weight;
    }, 0);
  }

  // Extract learning data for model training
  extractLearningData(simulation) {
    return {
      // Pattern recognition data
      conflictPatterns: this.extractConflictPatterns(simulation.conflicts),
      delayPatterns: this.extractDelayPatterns(simulation.schedule),
      trackPatterns: this.extractTrackPatterns(simulation.schedule),
      
      // Decision outcomes
      successfulResolutions: this.getSuccessfulResolutions(simulation),
      failedResolutions: this.getFailedResolutions(simulation),
      
      // Optimization opportunities
      optimizationTargets: this.identifyOptimizationTargets(simulation),
      
      // Performance trends
      performanceTrends: this.calculatePerformanceTrends(simulation)
    };
  }

  // Helper methods for calculations
  calculateDelayVariance(trains) {
    if (!trains.length) return 0;
    const delays = trains.map(t => t.delay || 0);
    const mean = delays.reduce((a, b) => a + b, 0) / delays.length;
    const variance = delays.reduce((sum, delay) => sum + Math.pow(delay - mean, 2), 0) / delays.length;
    return variance;
  }

  calculateDelayMean(trains) {
    if (!trains.length) return 0;
    return trains.reduce((sum, train) => sum + (train.delay || 0), 0) / trains.length;
  }

  calculateTrackUtilization(trains) {
    if (!trains.length) return 0;
    const trackUsage = {};
    trains.forEach(train => {
      trackUsage[train.track] = (trackUsage[train.track] || 0) + 1;
    });
    const maxUsage = Math.max(...Object.values(trackUsage));
    return maxUsage / trains.length;
  }

  calculateTimeEfficiency(trains) {
    if (!trains.length) return 0;
    const onTimeTrains = trains.filter(t => (t.delay || 0) === 0).length;
    return onTimeTrains / trains.length;
  }

  calculateResourceOptimization(trains, conflicts) {
    const trackCount = new Set(trains.map(t => t.track)).size;
    const conflictRate = conflicts.length / trains.length;
    return Math.max(0, 1 - conflictRate) * (trackCount / trains.length);
  }

  calculatePredictiveAccuracy(simulation) {
    // This would compare predicted vs actual outcomes
    // For now, return a placeholder based on reward score
    return Math.min((simulation.kpis?.rewardScore || 0) / 100, 1);
  }

  extractConflictPatterns(conflicts) {
    if (!conflicts.length) return [];
    
    return conflicts.map(conflict => ({
      track: conflict.track,
      trainTypes: [conflict.train1, conflict.train2],
      timePattern: this.getTimePattern(conflict),
      resolutionType: conflict.suggestion?.includes('Reassign') ? 'reassign' : 'unknown'
    }));
  }

  extractDelayPatterns(trains) {
    return trains.map(train => ({
      trainId: train.id,
      delay: train.delay || 0,
      track: train.track,
      timeSlot: this.getTimeSlot(train.startTime),
      delayCategory: this.categorizeDelay(train.delay || 0)
    }));
  }

  extractTrackPatterns(trains) {
    const trackData = {};
    trains.forEach(train => {
      if (!trackData[train.track]) {
        trackData[train.track] = {
          trainCount: 0,
          totalDelay: 0,
          conflicts: 0
        };
      }
      trackData[train.track].trainCount++;
      trackData[train.track].totalDelay += train.delay || 0;
    });
    return trackData;
  }

  getSuccessfulResolutions(simulation) {
    // This would track which AI suggestions were successful
    return {
      acceptedSuggestions: 0, // Would be tracked in action log
      rejectedSuggestions: 0,
      successRate: 0
    };
  }

  getFailedResolutions(simulation) {
    return {
      failedOverrides: 0,
      unresolvedConflicts: simulation.conflicts?.length || 0,
      failureRate: 0
    };
  }

  identifyOptimizationTargets(simulation) {
    const targets = [];
    
    if (simulation.kpis?.avgDelay > 10) {
      targets.push('delay_reduction');
    }
    if (simulation.kpis?.totalConflicts > 3) {
      targets.push('conflict_resolution');
    }
    if (simulation.kpis?.maxThroughput < 80) {
      targets.push('throughput_improvement');
    }
    
    return targets;
  }

  calculatePerformanceTrends(simulation) {
    const recentSims = this.getAllSimulations().slice(0, 10);
    if (recentSims.length < 2) return { trend: 'insufficient_data' };
    
    const recentScores = recentSims.map(s => s.kpis?.rewardScore || 0);
    const trend = recentScores[0] > recentScores[recentScores.length - 1] ? 'improving' : 'declining';
    
    return {
      trend,
      recentAverage: recentScores.reduce((a, b) => a + b, 0) / recentScores.length,
      volatility: this.calculateVolatility(recentScores)
    };
  }

  // Helper utility methods
  getSessionId() {
    let sessionId = sessionStorage.getItem('railoptima_session');
    if (!sessionId) {
      sessionId = `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('railoptima_session', sessionId);
    }
    return sessionId;
  }

  getTimePattern(conflict) {
    // Extract time patterns from conflict data
    return 'peak_hours'; // Placeholder
  }

  getTimeSlot(startTime) {
    if (!startTime) return 'unknown';
    const hour = parseInt(startTime.split(':')[0]);
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  categorizeDelay(delay) {
    if (delay === 0) return 'on_time';
    if (delay <= 5) return 'minor';
    if (delay <= 15) return 'moderate';
    return 'severe';
  }

  calculateVolatility(scores) {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  // Clear old data (maintenance)
  clearOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const data = JSON.parse(localStorage.getItem(this.storageKey));
    data.simulations = data.simulations.filter(sim => 
      new Date(sim.timestamp) > cutoffDate
    );
    
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Export data for analysis
  exportData() {
    const data = {
      simulations: this.getAllSimulations(),
      metadata: this.getMetadata(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `railoptima_simulations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create global instance
const simulationStorage = new SimulationStorage();

export default simulationStorage;
