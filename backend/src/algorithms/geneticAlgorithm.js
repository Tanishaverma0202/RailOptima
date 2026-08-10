import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

class GeneticAlgorithm {
  constructor(config) {
    this.populationSize = config.populationSize || 100;
    this.generations = config.generations || 50;
    this.mutationRate = config.mutationRate || 0.1;
    this.crossoverRate = config.crossoverRate || 0.8;
    this.elitismRate = config.elitismRate || 0.1;
    this.constraints = config.constraints || {};
    this.weights = config.weights || {};
  }

  // Initialize population with random schedules
  initializePopulation(trains, tracks, stations) {
    const population = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const individual = this.generateRandomSchedule(trains, tracks, stations);
      population.push(individual);
    }
    
    return population;
  }

  // Generate a random schedule for all trains
  generateRandomSchedule(trains, tracks, stations) {
    const schedule = {
      id: uuidv4(),
      assignments: [],
      fitness: 0
    };

    // Shuffle trains for random assignment
    const shuffledTrains = [...trains].sort(() => Math.random() - 0.5);

    for (const train of shuffledTrains) {
      // Find compatible tracks
      const compatibleTracks = tracks.filter(track => 
        track.status === 'ACTIVE' && 
        this.isTrackCompatible(train, track)
      );

      if (compatibleTracks.length === 0) continue;

      // Select random track
      const selectedTrack = compatibleTracks[Math.floor(Math.random() * compatibleTracks.length)];
      
      // Generate random time slot
      const timeSlot = this.generateRandomTimeSlot(train, selectedTrack, schedule.assignments);

      schedule.assignments.push({
        trainId: train._id,
        trackId: selectedTrack._id,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        priority: train.priority,
        estimatedDelay: this.calculateEstimatedDelay(train, selectedTrack)
      });
    }

    return schedule;
  }

  // Check if train is compatible with track
  isTrackCompatible(train, track) {
    // Basic compatibility checks
    if (train.speed.max > track.specifications.maxSpeed) return false;
    if (track.specifications.gauge !== 'BROAD' && train.type === 'Rajdhani') return false;
    return true;
  }

  // Generate random time slot for train on track
  generateRandomTimeSlot(train, track, existingAssignments) {
    const now = new Date();
    const trainDuration = this.calculateTrainDuration(train, track);
    
    // Try to find a non-conflicting time slot
    for (let attempt = 0; attempt < 50; attempt++) {
      const startHour = 5 + Math.floor(Math.random() * 16); // 5 AM to 9 PM
      const startTime = new Date(now);
      startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);
      
      const endTime = new Date(startTime.getTime() + trainDuration * 60 * 1000);

      // Check for conflicts
      const hasConflict = existingAssignments.some(assignment => 
        assignment.trackId.toString() === track._id.toString() &&
        this.timeRangesOverlap(
          { start: startTime, end: endTime },
          { start: new Date(assignment.startTime), end: new Date(assignment.endTime) }
        )
      );

      if (!hasConflict) {
        return { startTime, endTime };
      }
    }

    // Fallback: assign anyway (will be penalized in fitness)
    const startHour = 5 + Math.floor(Math.random() * 16);
    const startTime = new Date(now);
    startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);
    const endTime = new Date(startTime.getTime() + trainDuration * 60 * 1000);

    return { startTime, endTime };
  }

  // Check if two time ranges overlap
  timeRangesOverlap(range1, range2) {
    return range1.start < range2.end && range2.start < range1.end;
  }

  // Calculate train duration on track (in hours)
  calculateTrainDuration(train, track) {
    const avgSpeed = Math.min(train.speed.average, track.specifications.maxSpeed);
    const distance = track.specifications.length;
    return distance / avgSpeed;
  }

  // Calculate estimated delay
  calculateEstimatedDelay(train, track) {
    const baseDelay = Math.random() * 10; // Base random delay
    const priorityMultiplier = train.priority === 'HIGH' ? 0.3 : 
                              train.priority === 'MEDIUM' ? 0.5 : 0.8;
    const trackCondition = track.maintenance.condition === 'EXCELLENT' ? 0 :
                         track.maintenance.condition === 'GOOD' ? 5 :
                         track.maintenance.condition === 'FAIR' ? 15 : 30;
    
    return baseDelay * priorityMultiplier + trackCondition;
  }

  // Calculate fitness of an individual schedule
  calculateFitness(individual, constraints = {}) {
    let fitness = 0;
    let totalDelay = 0;
    let conflicts = 0;
    let throughput = 0;

    const assignments = individual.assignments;

    // Calculate delay penalty
    for (const assignment of assignments) {
      totalDelay += assignment.estimatedDelay || 0;
      
      // Reward on-time performance
      if (assignment.estimatedDelay === 0) {
        throughput += 1;
      }
    }

    // Detect and penalize conflicts
    const trackAssignments = {};
    for (const assignment of assignments) {
      const trackKey = assignment.trackId.toString();
      if (!trackAssignments[trackKey]) {
        trackAssignments[trackKey] = [];
      }
      trackAssignments[trackKey].push(assignment);
    }

    for (const trackId in trackAssignments) {
      const trackAssignmentsList = trackAssignments[trackId];
      
      // Check for overlapping assignments on same track
      for (let i = 0; i < trackAssignmentsList.length; i++) {
        for (let j = i + 1; j < trackAssignmentsList.length; j++) {
          const assignment1 = trackAssignmentsList[i];
          const assignment2 = trackAssignmentsList[j];
          
          if (this.timeRangesOverlap(
            { start: new Date(assignment1.startTime), end: new Date(assignment1.endTime) },
            { start: new Date(assignment2.startTime), end: new Date(assignment2.endTime) }
          )) {
            conflicts++;
          }
        }
      }
    }

    // Calculate weighted fitness
    const delayPenalty = totalDelay * (this.weights.delay || 0.4);
    const conflictPenalty = conflicts * (this.weights.conflicts || 2.0);
    const throughputReward = (throughput / assignments.length) * 100 * (this.weights.throughput || 0.3);
    const priorityBonus = this.calculatePriorityBonus(assignments) * (this.weights.priority || 0.1);

    fitness = 100 - delayPenalty - conflictPenalty + throughputReward + priorityBonus;

    // Apply constraints
    if (constraints.maxDelay && totalDelay > constraints.maxDelay) {
      fitness -= (totalDelay - constraints.maxDelay) * 2;
    }

    if (constraints.maxConflictsPerTrack) {
      for (const trackId in trackAssignments) {
        const trackConflicts = this.countTrackConflicts(trackAssignments[trackId]);
        if (trackConflicts > constraints.maxConflictsPerTrack) {
          fitness -= (trackConflicts - constraints.maxConflictsPerTrack) * 5;
        }
      }
    }

    individual.fitness = Math.max(0, fitness);
    individual.metrics = {
      totalDelay,
      conflicts,
      throughput,
      punctuality: (throughput / assignments.length) * 100
    };

    return individual.fitness;
  }

  // Count conflicts on a specific track
  countTrackConflicts(assignments) {
    let conflicts = 0;
    
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const assignment1 = assignments[i];
        const assignment2 = assignments[j];
        
        if (this.timeRangesOverlap(
          { start: new Date(assignment1.startTime), end: new Date(assignment1.endTime) },
          { start: new Date(assignment2.startTime), end: new Date(assignment2.endTime) }
        )) {
          conflicts++;
        }
      }
    }
    
    return conflicts;
  }

  // Calculate priority bonus
  calculatePriorityBonus(assignments) {
    let bonus = 0;
    
    for (const assignment of assignments) {
      if (assignment.priority === 'HIGH' && assignment.estimatedDelay === 0) {
        bonus += 10;
      } else if (assignment.priority === 'MEDIUM' && assignment.estimatedDelay <= 5) {
        bonus += 5;
      } else if (assignment.priority === 'LOW' && assignment.estimatedDelay <= 15) {
        bonus += 2;
      }
    }
    
    return bonus;
  }

  // Tournament selection
  selectParents(population) {
    const tournamentSize = 3;
    const parents = [];

    for (let i = 0; i < 2; i++) {
      const tournament = [];
      
      // Random selection for tournament
      for (let j = 0; j < tournamentSize; j++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIndex]);
      }

      // Select best from tournament
      tournament.sort((a, b) => b.fitness - a.fitness);
      parents.push(tournament[0]);
    }

    return parents;
  }

  // Crossover operation
  crossover(parent1, parent2) {
    if (Math.random() > this.crossoverRate) {
      return [parent1, parent2];
    }

    const child1 = { id: uuidv4(), assignments: [], fitness: 0 };
    const child2 = { id: uuidv4(), assignments: [], fitness: 0 };

    // Uniform crossover
    for (let i = 0; i < Math.max(parent1.assignments.length, parent2.assignments.length); i++) {
      if (i < parent1.assignments.length && i < parent2.assignments.length) {
        if (Math.random() < 0.5) {
          child1.assignments.push({ ...parent1.assignments[i] });
          child2.assignments.push({ ...parent2.assignments[i] });
        } else {
          child1.assignments.push({ ...parent2.assignments[i] });
          child2.assignments.push({ ...parent1.assignments[i] });
        }
      } else if (i < parent1.assignments.length) {
        child1.assignments.push({ ...parent1.assignments[i] });
      } else if (i < parent2.assignments.length) {
        child2.assignments.push({ ...parent2.assignments[i] });
      }
    }

    return [child1, child2];
  }

  // Mutation operation
  mutate(individual, tracks) {
    for (const assignment of individual.assignments) {
      if (Math.random() < this.mutationRate) {
        // Mutate track assignment
        const compatibleTracks = tracks.filter(track => 
          track.status === 'ACTIVE' && 
          track._id.toString() !== assignment.trackId.toString()
        );

        if (compatibleTracks.length > 0) {
          const newTrack = compatibleTracks[Math.floor(Math.random() * compatibleTracks.length)];
          assignment.trackId = newTrack._id;
          
          // Recalculate delay for new track
          assignment.estimatedDelay = this.calculateEstimatedDelay(
            { priority: assignment.priority, speed: { average: 80 } },
            newTrack
          );
        }
      }

      if (Math.random() < this.mutationRate) {
        // Mutate time slot (small adjustment)
        const timeAdjustment = (Math.random() - 0.5) * 2 * 60 * 60 * 1000; // ±2 hours
        assignment.startTime = new Date(new Date(assignment.startTime).getTime() + timeAdjustment);
        assignment.endTime = new Date(new Date(assignment.endTime).getTime() + timeAdjustment);
      }
    }

    return individual;
  }

  // Main evolution loop
  async evolve(trains, tracks, stations, onGeneration = null) {
    logger.info(`Starting genetic algorithm with ${this.populationSize} individuals for ${this.generations} generations`);

    let population = this.initializePopulation(trains, tracks, stations);
    
    // Calculate initial fitness
    for (const individual of population) {
      this.calculateFitness(individual, this.constraints);
    }

    let bestIndividual = population.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );

    const evolutionHistory = [];

    for (let generation = 0; generation < this.generations; generation++) {
      const newPopulation = [];

      // Elitism - keep best individuals
      const eliteCount = Math.floor(this.populationSize * this.elitismRate);
      population.sort((a, b) => b.fitness - a.fitness);
      
      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push({ ...population[i], id: uuidv4() });
      }

      // Generate offspring
      while (newPopulation.length < this.populationSize) {
        const parents = this.selectParents(population);
        const [child1, child2] = this.crossover(parents[0], parents[1]);
        
        this.mutate(child1, tracks);
        this.mutate(child2, tracks);
        
        this.calculateFitness(child1, this.constraints);
        this.calculateFitness(child2, this.constraints);
        
        newPopulation.push(child1, child2);
      }

      population = newPopulation.slice(0, this.populationSize);

      // Track best individual
      const currentBest = population.reduce((best, current) => 
        current.fitness > best.fitness ? current : best
      );

      if (currentBest.fitness > bestIndividual.fitness) {
        bestIndividual = currentBest;
      }

      // Record generation statistics
      const avgFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
      const totalConflicts = population.reduce((sum, ind) => sum + (ind.metrics?.conflicts || 0), 0);
      const avgThroughput = population.reduce((sum, ind) => sum + (ind.metrics?.throughput || 0), 0) / population.length;

      evolutionHistory.push({
        generation,
        bestFitness: bestIndividual.fitness,
        averageFitness: avgFitness,
        conflicts: totalConflicts,
        throughput: avgThroughput
      });

      // Callback for progress tracking
      if (onGeneration) {
        await onGeneration({
          generation,
          bestIndividual,
          population,
          history: evolutionHistory
        });
      }

      logger.debug(`Generation ${generation + 1}/${this.generations} - Best Fitness: ${bestIndividual.fitness.toFixed(2)}`);
    }

    logger.info(`Genetic algorithm completed. Best fitness: ${bestIndividual.fitness.toFixed(2)}`);

    return {
      bestSolution: bestIndividual,
      evolutionHistory,
      finalPopulation: population
    };
  }
}

export default GeneticAlgorithm;
