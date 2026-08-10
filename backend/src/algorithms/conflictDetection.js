import Conflict from '../database/models/Conflict.js';
import Schedule from '../database/models/Schedule.js';
import { logger } from '../utils/logger.js';

class ConflictDetectionEngine {
  constructor() {
    this.conflictTypes = {
      HEAD_ON: 'Trains moving towards each other on same track',
      FOLLOWING: 'Trains following each other too closely',
      OVERTAKING: 'Faster train attempting to overtake slower train',
      CROSSING: 'Trains crossing at intersection points',
      STATION_CONFLICT: 'Multiple trains scheduled at same station platform'
    };
  }

  // Detect all conflicts in a simulation
  async detectConflicts(simulationId, schedules) {
    const conflicts = [];
    const scheduleMap = new Map();

    // Create map of schedules by track for easier conflict detection
    for (const schedule of schedules) {
      const trackId = schedule.track.toString();
      if (!scheduleMap.has(trackId)) {
        scheduleMap.set(trackId, []);
      }
      scheduleMap.get(trackId).push(schedule);
    }

    // Detect conflicts for each track
    for (const [trackId, trackSchedules] of scheduleMap) {
      const trackConflicts = await this.detectTrackConflicts(simulationId, trackId, trackSchedules);
      conflicts.push(...trackConflicts);
    }

    // Detect station conflicts
    const stationConflicts = await this.detectStationConflicts(simulationId, schedules);
    conflicts.push(...stationConflicts);

    // Save conflicts to database
    const savedConflicts = await Promise.all(
      conflicts.map(conflict => this.saveConflict(conflict))
    );

    logger.info(`Detected ${conflicts.length} conflicts for simulation ${simulationId}`);

    return savedConflicts;
  }

  // Detect conflicts on a specific track
  async detectTrackConflicts(simulationId, trackId, schedules) {
    const conflicts = [];
    
    // Sort schedules by start time
    schedules.sort((a, b) => new Date(a.timings.scheduledStartTime) - new Date(b.timings.scheduledStartTime));

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const schedule1 = schedules[i];
        const schedule2 = schedules[j];

        // Check if schedules overlap in time
        if (this.schedulesOverlap(schedule1, schedule2)) {
          const conflictType = this.determineConflictType(schedule1, schedule2);
          const severity = this.calculateConflictSeverity(schedule1, schedule2, conflictType);
          
          if (conflictType && severity !== 'LOW') {
            const conflict = {
              id: this.generateConflictId(),
              simulationId,
              track: trackId,
              trains: [
                {
                  train: schedule1.train,
                  schedule: schedule1._id,
                  position: schedule1.position.coordinates,
                  estimatedArrival: schedule1.timings.scheduledStartTime,
                  priority: schedule1.priority
                },
                {
                  train: schedule2.train,
                  schedule: schedule2._id,
                  position: schedule2.position.coordinates,
                  estimatedArrival: schedule2.timings.scheduledStartTime,
                  priority: schedule2.priority
                }
              ],
              type: conflictType,
              severity,
              timeline: {
                detectedAt: new Date(),
                estimatedConflictTime: this.calculateConflictTime(schedule1, schedule2)
              },
              aiSuggestion: await this.generateAISuggestion(schedule1, schedule2, conflictType)
            };

            conflicts.push(conflict);
          }
        }
      }
    }

    return conflicts;
  }

  // Detect station platform conflicts
  async detectStationConflicts(simulationId, schedules) {
    const conflicts = [];
    const stationMap = new Map();

    // Group schedules by station
    for (const schedule of schedules) {
      if (schedule.position.currentStation) {
        const stationId = schedule.position.currentStation.toString();
        if (!stationMap.has(stationId)) {
          stationMap.set(stationId, []);
        }
        stationMap.get(stationId).push(schedule);
      }
    }

    // Check for conflicts at each station
    for (const [stationId, stationSchedules] of stationMap) {
      const stationConflicts = this.detectStationPlatformConflicts(simulationId, stationId, stationSchedules);
      conflicts.push(...stationConflicts);
    }

    return conflicts;
  }

  // Detect platform conflicts at a station
  detectStationPlatformConflicts(simulationId, stationId, schedules) {
    const conflicts = [];
    
    // Group by arrival time windows (30-minute windows)
    const timeWindows = new Map();
    
    for (const schedule of schedules) {
      const arrivalTime = new Date(schedule.timings.scheduledStartTime);
      const windowKey = Math.floor(arrivalTime.getTime() / (30 * 60 * 1000)); // 30-minute windows
      
      if (!timeWindows.has(windowKey)) {
        timeWindows.set(windowKey, []);
      }
      timeWindows.get(windowKey).push(schedule);
    }

    // Check each time window for conflicts
    for (const [windowKey, windowSchedules] of timeWindows) {
      if (windowSchedules.length > 1) {
        // Check if trains are assigned to same platform
        const platformMap = new Map();
        
        for (const schedule of windowSchedules) {
          const platform = schedule.route.find(r => r.station.toString() === stationId)?.platform || 1;
          
          if (!platformMap.has(platform)) {
            platformMap.set(platform, []);
          }
          platformMap.get(platform).push(schedule);
        }

        // Create conflicts for overcrowded platforms
        for (const [platform, platformSchedules] of platformMap) {
          if (platformSchedules.length > 1) {
            const conflict = {
              id: this.generateConflictId(),
              simulationId,
              track: null, // Station conflict, not track-specific
              trains: platformSchedules.map(schedule => ({
                train: schedule.train,
                schedule: schedule._id,
                position: schedule.position.coordinates,
                estimatedArrival: schedule.timings.scheduledStartTime,
                priority: schedule.priority
              })),
              type: 'STATION_CONFLICT',
              severity: this.calculateStationConflictSeverity(platformSchedules),
              timeline: {
                detectedAt: new Date(),
                estimatedConflictTime: new Date(windowKey * 30 * 60 * 1000)
              },
              aiSuggestion: this.generateStationConflictSuggestion(platformSchedules, platform)
            };

            conflicts.push(conflict);
          }
        }
      }
    }

    return conflicts;
  }

  // Check if two schedules overlap in time
  schedulesOverlap(schedule1, schedule2) {
    const start1 = new Date(schedule1.timings.scheduledStartTime);
    const end1 = new Date(schedule1.timings.scheduledEndTime);
    const start2 = new Date(schedule2.timings.scheduledStartTime);
    const end2 = new Date(schedule2.timings.scheduledEndTime);

    return start1 < end2 && start2 < end1;
  }

  // Determine the type of conflict
  determineConflictType(schedule1, schedule2) {
    // This is a simplified determination - in reality, you'd need more sophisticated logic
    // based on train directions, speeds, and track layout
    
    const timeDiff = Math.abs(
      new Date(schedule1.timings.scheduledStartTime) - 
      new Date(schedule2.timings.scheduledStartTime)
    );

    if (timeDiff < 5 * 60 * 1000) { // Less than 5 minutes apart
      return 'FOLLOWING';
    } else if (timeDiff < 15 * 60 * 1000) { // Less than 15 minutes apart
      return 'HEAD_ON';
    } else {
      return 'OVERTAKING';
    }
  }

  // Calculate conflict severity
  calculateConflictSeverity(schedule1, schedule2, conflictType) {
    let severityScore = 0;

    // Base severity by conflict type
    const typeSeverity = {
      HEAD_ON: 4,
      FOLLOWING: 2,
      OVERTAKING: 3,
      CROSSING: 3,
      STATION_CONFLICT: 2
    };

    severityScore += typeSeverity[conflictType] || 1;

    // Adjust for train priorities
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    severityScore += priorityWeight[schedule1.priority] + priorityWeight[schedule2.priority];

    // Adjust for time proximity
    const timeDiff = Math.abs(
      new Date(schedule1.timings.scheduledStartTime) - 
      new Date(schedule2.timings.scheduledStartTime)
    );
    
    if (timeDiff < 5 * 60 * 1000) severityScore += 2; // Very close
    else if (timeDiff < 15 * 60 * 1000) severityScore += 1; // Close

    // Convert score to severity level
    if (severityScore >= 8) return 'CRITICAL';
    if (severityScore >= 6) return 'HIGH';
    if (severityScore >= 4) return 'MEDIUM';
    return 'LOW';
  }

  // Calculate station conflict severity
  calculateStationConflictSeverity(schedules) {
    const highPriorityCount = schedules.filter(s => s.priority === 'HIGH').length;
    const totalCount = schedules.length;

    if (highPriorityCount >= 2 || totalCount >= 4) return 'HIGH';
    if (highPriorityCount === 1 || totalCount >= 3) return 'MEDIUM';
    return 'LOW';
  }

  // Calculate estimated conflict time
  calculateConflictTime(schedule1, schedule2) {
    const start1 = new Date(schedule1.timings.scheduledStartTime);
    const start2 = new Date(schedule2.timings.scheduledStartTime);
    
    return new Date(Math.max(start1, start2));
  }

  // Generate AI suggestion for conflict resolution
  async generateAISuggestion(schedule1, schedule2, conflictType) {
    const suggestions = {
      HEAD_ON: {
        action: 'REASSIGNMENT',
        confidence: 0.9,
        reasoning: 'Head-on conflict detected. Reassigning one train to alternative track prevents collision.',
        alternatives: [
          { action: 'DELAY', confidence: 0.7, impact: { delayReduction: 0, throughputGain: -10 } },
          { action: 'REROUTE', confidence: 0.8, impact: { delayReduction: 5, throughputGain: 5 } }
        ]
      },
      FOLLOWING: {
        action: 'DELAY',
        confidence: 0.8,
        reasoning: 'Trains following too closely. Adding delay prevents rear-end collision.',
        alternatives: [
          { action: 'SPEED_ADJUSTMENT', confidence: 0.7, impact: { delayReduction: 3, throughputGain: 2 } },
          { action: 'REASSIGNMENT', confidence: 0.6, impact: { delayReduction: 8, throughputGain: 0 } }
        ]
      },
      OVERTAKING: {
        action: 'PRIORITY_OVERRIDE',
        confidence: 0.85,
        reasoning: 'Overtaking conflict. Giving priority to higher-value train optimizes throughput.',
        alternatives: [
          { action: 'SPEED_ADJUSTMENT', confidence: 0.75, impact: { delayReduction: 5, throughputGain: 3 } },
          { action: 'REASSIGNMENT', confidence: 0.7, impact: { delayReduction: 10, throughputGain: 5 } }
        ]
      }
    };

    const baseSuggestion = suggestions[conflictType] || suggestions.FOLLOWING;
    
    // Calculate specific impact metrics
    const delayReduction = this.estimateDelayReduction(schedule1, schedule2, baseSuggestion.action);
    const throughputGain = this.estimateThroughputGain(schedule1, schedule2, baseSuggestion.action);

    return {
      ...baseSuggestion,
      impact: {
        delayReduction,
        throughputGain,
        costImpact: this.estimateCostImpact(delayReduction, throughputGain)
      }
    };
  }

  // Generate station conflict suggestion
  generateStationConflictSuggestion(schedules, platform) {
    return {
      action: 'PLATFORM_REASSIGNMENT',
      confidence: 0.9,
      reasoning: `Multiple trains assigned to platform ${platform}. Reassigning to available platforms resolves conflict.`,
      impact: {
        delayReduction: 5,
        throughputGain: 10,
        costImpact: 0
      },
      alternatives: [
        { action: 'TIME_ADJUSTMENT', confidence: 0.7, impact: { delayReduction: 3, throughputGain: 0 } },
        { action: 'PRIORITY_OVERRIDE', confidence: 0.8, impact: { delayReduction: 8, throughputGain: 5 } }
      ]
    };
  }

  // Estimate delay reduction from resolution action
  estimateDelayReduction(schedule1, schedule2, action) {
    const baseDelays = (schedule1.performance?.delay || 0) + (schedule2.performance?.delay || 0);
    
    const reductionFactors = {
      REASSIGNMENT: 0.8,
      DELAY: 0.3,
      REROUTE: 0.6,
      PRIORITY_OVERRIDE: 0.5,
      SPEED_ADJUSTMENT: 0.4,
      PLATFORM_REASSIGNMENT: 0.7,
      TIME_ADJUSTMENT: 0.2
    };

    return Math.round(baseDelays * (reductionFactors[action] || 0.5));
  }

  // Estimate throughput gain from resolution action
  estimateThroughputGain(schedule1, schedule2, action) {
    const gainFactors = {
      REASSIGNMENT: 15,
      DELAY: -5,
      REROUTE: 10,
      PRIORITY_OVERRIDE: 12,
      SPEED_ADJUSTMENT: 8,
      PLATFORM_REASSIGNMENT: 20,
      TIME_ADJUSTMENT: 0
    };

    return gainFactors[action] || 0;
  }

  // Estimate cost impact
  estimateCostImpact(delayReduction, throughputGain) {
    // Simplified cost calculation
    const delayValue = 100; // $ per minute of delay saved
    const throughputValue = 50; // $ per percentage point of throughput gained
    
    return -(delayReduction * delayValue + throughputGain * throughputValue);
  }

  // Generate unique conflict ID
  generateConflictId() {
    return `C${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }

  // Save conflict to database
  async saveConflict(conflictData) {
    try {
      const conflict = new Conflict(conflictData);
      return await conflict.save();
    } catch (error) {
      logger.error(`Error saving conflict: ${error.message}`);
      return null;
    }
  }

  // Resolve a conflict
  async resolveConflict(conflictId, resolution) {
    try {
      const conflict = await Conflict.findById(conflictId);
      
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      conflict.status = 'RESOLVED';
      conflict.timeline.resolutionTime = new Date();
      conflict.resolution = {
        ...resolution,
        impact: {
          delayReduction: resolution.delayReduction || 0,
          throughputGain: resolution.throughputGain || 0,
          costImpact: resolution.costImpact || 0
        }
      };

      await conflict.save();

      logger.info(`Conflict ${conflictId} resolved with action: ${resolution.type}`);

      return conflict;
    } catch (error) {
      logger.error(`Error resolving conflict ${conflictId}: ${error.message}`);
      throw error;
    }
  }

  // Get active conflicts for a simulation
  async getActiveConflicts(simulationId) {
    return await Conflict.find({
      simulationId,
      status: 'ACTIVE'
    })
    .populate('trains.train', 'id name number priority')
    .populate('trains.schedule', 'timings status')
    .populate('track', 'name type')
    .sort({ 'timeline.estimatedConflictTime': 1 });
  }

  // Get conflict statistics
  async getConflictStatistics(simulationId) {
    const stats = await Conflict.aggregate([
      { $match: { simulationId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $ne: ['$timeline.resolutionTime', null] },
                { $subtract: ['$timeline.resolutionTime', '$timeline.detectedAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    const typeBreakdown = await Conflict.aggregate([
      { $match: { simulationId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgResolutionImpact: { $avg: '$resolution.impact.delayReduction' }
        }
      }
    ]);

    return {
      summary: stats[0] || {},
      typeBreakdown
    };
  }
}

export default ConflictDetectionEngine;
