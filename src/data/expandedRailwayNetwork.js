// 🚂 EXPANDED RAILWAY NETWORK
// Comprehensive railway system for enhanced simulation and training

// 🏢 EXPANDED STATIONS (20 stations)
export const STATIONS = [
  // Major Hub Stations
  { id: "STN001", name: "Central Terminal", type: "hub", capacity: 50, lat: 40.7128, lng: -74.0060 },
  { id: "STN002", name: "North Junction", type: "hub", capacity: 40, lat: 40.7580, lng: -73.9855 },
  { id: "STN003", name: "South Terminal", type: "hub", capacity: 45, lat: 40.6892, lng: -74.0445 },
  { id: "STN004", name: "East Gateway", type: "hub", capacity: 35, lat: 40.7489, lng: -73.9680 },
  { id: "STN005", name: "West Plaza", type: "hub", capacity: 38, lat: 40.7614, lng: -74.0764 },
  
  // Regional Stations
  { id: "STN006", name: "Riverside Station", type: "regional", capacity: 25, lat: 40.7282, lng: -73.9942 },
  { id: "STN007", name: "Mountain View", type: "regional", capacity: 20, lat: 40.7831, lng: -73.9712 },
  { id: "STN008", name: "Lakeside Terminal", type: "regional", capacity: 22, lat: 40.6995, lng: -74.0208 },
  { id: "STN009", name: "Forest Park", type: "regional", capacity: 18, lat: 40.7744, lng: -73.9568 },
  { id: "STN010", name: "Harbor Point", type: "regional", capacity: 24, lat: 40.7056, lng: -74.0134 },
  
  // Local Stations
  { id: "STN011", name: "Downtown Crossing", type: "local", capacity: 15, lat: 40.7350, lng: -73.9900 },
  { id: "STN012", name: "University Station", type: "local", capacity: 20, lat: 40.7680, lng: -73.9600 },
  { id: "STN013", name: "Medical Center", type: "local", capacity: 12, lat: 40.7200, lng: -74.0100 },
  { id: "STN014", name: "Tech Park", type: "local", capacity: 18, lat: 40.7800, lng: -73.9800 },
  { id: "STN015", name: "Shopping District", type: "local", capacity: 16, lat: 40.7100, lng: -74.0200 },
  
  // Specialized Stations
  { id: "STN016", name: "Freight Terminal", type: "freight", capacity: 30, lat: 40.6900, lng: -74.0300 },
  { id: "STN017", name: "Airport Express", type: "express", capacity: 28, lat: 40.6413, lng: -73.7781 },
  { id: "STN018", name: "Industrial Zone", type: "freight", capacity: 25, lat: 40.7500, lng: -74.0500 },
  { id: "STN019", name: "Stadium Station", type: "event", capacity: 35, lat: 40.7505, lng: -73.9934 },
  { id: "STN020", name: "Convention Center", type: "event", capacity: 32, lat: 40.7650, lng: -73.9750 }
];

// 🛤️ EXPANDED TRACKS (35 tracks including express, local, and freight)
export const TRACKS = [
  // Main Line Tracks (High Priority)
  { id: "TRACK-MAIN-01", name: "Central Express", type: "express", capacity: 8, priority: 1, stations: ["STN001", "STN002", "STN004"] },
  { id: "TRACK-MAIN-02", name: "North-South Corridor", type: "express", capacity: 7, priority: 1, stations: ["STN002", "STN001", "STN003", "STN005"] },
  { id: "TRACK-MAIN-03", name: "East-West Link", type: "express", capacity: 6, priority: 1, stations: ["STN004", "STN001", "STN005"] },
  { id: "TRACK-MAIN-04", name: "Central Loop", type: "express", capacity: 5, priority: 2, stations: ["STN001", "STN006", "STN008", "STN003"] },
  
  // Regional Tracks (Medium Priority)
  { id: "TRACK-REG-01", name: "Riverside Line", type: "regional", capacity: 4, priority: 2, stations: ["STN001", "STN006", "STN011"] },
  { id: "TRACK-REG-02", name: "Mountain Route", type: "regional", capacity: 4, priority: 2, stations: ["STN002", "STN007", "STN009"] },
  { id: "TRACK-REG-03", name: "Lakeside Connection", type: "regional", capacity: 3, priority: 2, stations: ["STN003", "STN008", "STN015"] },
  { id: "TRACK-REG-04", name: "Forest Park Line", type: "regional", capacity: 3, priority: 2, stations: ["STN004", "STN009", "STN012"] },
  { id: "TRACK-REG-05", name: "Harbor Branch", type: "regional", capacity: 3, priority: 2, stations: ["STN005", "STN010", "STN013"] },
  
  // Local Tracks (Lower Priority)
  { id: "TRACK-LOC-01", name: "Downtown Shuttle", type: "local", capacity: 2, priority: 3, stations: ["STN001", "STN011", "STN006"] },
  { id: "TRACK-LOC-02", name: "University Connector", type: "local", capacity: 2, priority: 3, stations: ["STN002", "STN012", "STN007"] },
  { id: "TRACK-LOC-03", name: "Medical Link", type: "local", capacity: 2, priority: 3, stations: ["STN003", "STN013", "STN008"] },
  { id: "TRACK-LOC-04", name: "Tech Park Route", type: "local", capacity: 2, priority: 3, stations: ["STN004", "STN014", "STN009"] },
  { id: "TRACK-LOC-05", name: "Shopping Express", type: "local", capacity: 2, priority: 3, stations: ["STN005", "STN015", "STN010"] },
  
  // Freight Tracks (Special Priority)
  { id: "TRACK-FRG-01", name: "Freight Main Line", type: "freight", capacity: 6, priority: 2, stations: ["STN016", "STN001", "STN018"] },
  { id: "TRACK-FRG-02", name: "Industrial Route", type: "freight", capacity: 4, priority: 2, stations: ["STN018", "STN005", "STN016"] },
  { id: "TRACK-FRG-03", name: "Harbor Freight", type: "freight", capacity: 3, priority: 3, stations: ["STN010", "STN016", "STN003"] },
  
  // Express Tracks (High Speed)
  { id: "TRACK-EXP-01", name: "Airport Express", type: "express", capacity: 4, priority: 1, stations: ["STN001", "STN017"] },
  { id: "TRACK-EXP-02", name: "Stadium Special", type: "express", capacity: 3, priority: 1, stations: ["STN002", "STN019", "STN004"] },
  { id: "TRACK-EXP-03", name: "Convention Link", type: "express", capacity: 3, priority: 1, stations: ["STN003", "STN020", "STN005"] },
  
  // Connector Tracks (Network Integration)
  { id: "TRACK-CON-01", name: "North Connector", type: "connector", capacity: 2, priority: 2, stations: ["STN002", "STN006", "STN001"] },
  { id: "TRACK-CON-02", name: "South Connector", type: "connector", capacity: 2, priority: 2, stations: ["STN003", "STN010", "STN005"] },
  { id: "TRACK-CON-03", name: "East Connector", type: "connector", capacity: 2, priority: 2, stations: ["STN004", "STN011", "STN001"] },
  { id: "TRACK-CON-04", name: "West Connector", type: "connector", capacity: 2, priority: 2, stations: ["STN005", "STN013", "STN003"] },
  
  // Relief Tracks (Backup Routes)
  { id: "TRACK-REL-01", name: "Central Relief", type: "relief", capacity: 3, priority: 3, stations: ["STN001", "STN012", "STN002"] },
  { id: "TRACK-REL-02", name: "East Relief", type: "relief", capacity: 2, priority: 3, stations: ["STN004", "STN014", "STN009"] },
  { id: "TRACK-REL-03", name: "West Relief", type: "relief", capacity: 2, priority: 3, stations: ["STN005", "STN015", "STN010"] },
  
  // Special Purpose Tracks
  { id: "TRACK-SPEC-01", name: "Maintenance Track", type: "maintenance", capacity: 1, priority: 4, stations: ["STN001", "STN016"] },
  { id: "TRACK-SPEC-02", name: "Testing Track", type: "testing", capacity: 1, priority: 4, stations: ["STN002", "STN018"] },
  { id: "TRACK-SPEC-03", name: "Emergency Route", type: "emergency", capacity: 2, priority: 1, stations: ["STN001", "STN003", "STN005"] }
];

// 🚂 EXPANDED TRAIN TYPES AND PROFILES
export const TRAIN_TYPES = [
  // High-Speed Trains
  { type: "express", name: "Express Train", speed: 120, capacity: 300, frequency: 15 },
  { type: "bullet", name: "Bullet Train", speed: 150, capacity: 250, frequency: 30 },
  
  // Regional Trains
  { type: "regional", name: "Regional Train", speed: 80, capacity: 200, frequency: 20 },
  { type: "intercity", name: "Intercity Train", speed: 100, capacity: 180, frequency: 25 },
  
  // Local Trains
  { type: "local", name: "Local Train", speed: 60, capacity: 150, frequency: 10 },
  { type: "shuttle", name: "Shuttle Train", speed: 50, capacity: 100, frequency: 8 },
  
  // Freight Trains
  { type: "freight", name: "Freight Train", speed: 40, capacity: 500, frequency: 45 },
  { type: "container", name: "Container Train", speed: 45, capacity: 600, frequency: 60 },
  
  // Special Trains
  { type: "airport", name: "Airport Express", speed: 110, capacity: 220, frequency: 20 },
  { type: "stadium", name: "Stadium Special", speed: 70, capacity: 280, frequency: 35 },
  { type: "convention", name: "Convention Center", speed: 75, capacity: 260, frequency: 40 }
];

// 🚂 EXPANDED TRAIN FLEET (50 trains)
export const TRAINS = [
  // Express Fleet (10 trains)
  { id: "EXP001", name: "Lightning Express", type: "express", homeStation: "STN001", route: ["STN001", "STN002", "STN004"] },
  { id: "EXP002", name: "Thunder Bolt", type: "express", homeStation: "STN002", route: ["STN002", "STN001", "STN003"] },
  { id: "EXP003", name: "Silver Arrow", type: "express", homeStation: "STN003", route: ["STN003", "STN001", "STN005"] },
  { id: "EXP004", name: "Golden Rush", type: "express", homeStation: "STN004", route: ["STN004", "STN001", "STN002"] },
  { id: "EXP005", name: "Blue Comet", type: "express", homeStation: "STN005", route: ["STN005", "STN001", "STN004"] },
  { id: "EXP006", name: "Red Rocket", type: "bullet", homeStation: "STN001", route: ["STN001", "STN017"] },
  { id: "EXP007", name: "Green Flash", type: "bullet", homeStation: "STN002", route: ["STN002", "STN019", "STN004"] },
  { id: "EXP008", name: "Purple Lightning", type: "express", homeStation: "STN003", route: ["STN003", "STN020", "STN005"] },
  { id: "EXP009", name: "Orange Storm", type: "express", homeStation: "STN004", route: ["STN004", "STN001", "STN003"] },
  { id: "EXP010", name: "Pink Diamond", type: "express", homeStation: "STN005", route: ["STN005", "STN002", "STN001"] },
  
  // Regional Fleet (15 trains)
  { id: "REG001", name: "Mountain Regional", type: "regional", homeStation: "STN002", route: ["STN002", "STN007", "STN009"] },
  { id: "REG002", name: "Riverside Runner", type: "regional", homeStation: "STN001", route: ["STN001", "STN006", "STN011"] },
  { id: "REG003", name: "Lakeside Liner", type: "regional", homeStation: "STN003", route: ["STN003", "STN008", "STN015"] },
  { id: "REG004", name: "Forest Flyer", type: "regional", homeStation: "STN004", route: ["STN004", "STN009", "STN012"] },
  { id: "REG005", name: "Harbor Hopper", type: "regional", homeStation: "STN005", route: ["STN005", "STN010", "STN013"] },
  { id: "REG006", name: "City Connector", type: "intercity", homeStation: "STN001", route: ["STN001", "STN002", "STN003", "STN004"] },
  { id: "REG007", name: "Suburban Express", type: "intercity", homeStation: "STN002", route: ["STN002", "STN004", "STN005", "STN001"] },
  { id: "REG008", name: "Metro Link", type: "intercity", homeStation: "STN003", route: ["STN003", "STN005", "STN001", "STN002"] },
  { id: "REG009", name: "Township Traveler", type: "regional", homeStation: "STN004", route: ["STN004", "STN012", "STN014"] },
  { id: "REG010", name: "Valley Voyager", type: "regional", homeStation: "STN005", route: ["STN005", "STN015", "STN010"] },
  { id: "REG011", name: "Hillside Hauler", type: "regional", homeStation: "STN006", route: ["STN006", "STN011", "STN001"] },
  { id: "REG012", name: "Coastal Cruiser", type: "intercity", homeStation: "STN007", route: ["STN007", "STN009", "STN012", "STN002"] },
  { id: "REG013", name: "Plains Pioneer", type: "regional", homeStation: "STN008", route: ["STN008", "STN013", "STN003"] },
  { id: "REG014", name: "River Runner", type: "regional", homeStation: "STN009", route: ["STN009", "STN014", "STN004"] },
  { id: "REG015", name: "Mountain Express", type: "intercity", homeStation: "STN010", route: ["STN010", "STN015", "STN005", "STN003"] },
  
  // Local Fleet (15 trains)
  { id: "LOC001", name: "Downtown Shuttle", type: "local", homeStation: "STN001", route: ["STN001", "STN011", "STN006"] },
  { id: "LOC002", name: "University Express", type: "local", homeStation: "STN002", route: ["STN002", "STN012", "STN007"] },
  { id: "LOC003", name: "Medical Link", type: "local", homeStation: "STN003", route: ["STN003", "STN013", "STN008"] },
  { id: "LOC004", name: "Tech Park Connector", type: "local", homeStation: "STN004", route: ["STN004", "STN014", "STN009"] },
  { id: "LOC005", name: "Shopping District", type: "local", homeStation: "STN005", route: ["STN005", "STN015", "STN010"] },
  { id: "LOC006", name: "City Loop", type: "shuttle", homeStation: "STN001", route: ["STN001", "STN011", "STN012", "STN001"] },
  { id: "LOC007", name: "Campus Cruiser", type: "shuttle", homeStation: "STN002", route: ["STN002", "STN012", "STN007", "STN002"] },
  { id: "LOC008", name: "Hospital Hopper", type: "shuttle", homeStation: "STN003", route: ["STN003", "STN013", "STN008", "STN003"] },
  { id: "LOC009", name: "Business District", type: "local", homeStation: "STN004", route: ["STN004", "STN014", "STN009", "STN004"] },
  { id: "LOC010", name: "Residential Route", type: "local", homeStation: "STN005", route: ["STN005", "STN015", "STN010", "STN005"] },
  { id: "LOC011", name: "Market Street", type: "shuttle", homeStation: "STN006", route: ["STN006", "STN011", "STN001", "STN006"] },
  { id: "LOC012", name: "Park Avenue", type: "shuttle", homeStation: "STN007", route: ["STN007", "STN012", "STN002", "STN007"] },
  { id: "LOC013", name: "Main Street", type: "local", homeStation: "STN008", route: ["STN008", "STN013", "STN003", "STN008"] },
  { id: "LOC014", name: "Elm Street", type: "shuttle", homeStation: "STN009", route: ["STN009", "STN014", "STN004", "STN009"] },
  { id: "LOC015", name: "Oak Avenue", type: "local", homeStation: "STN010", route: ["STN010", "STN015", "STN005", "STN010"] },
  
  // Freight Fleet (5 trains)
  { id: "FRG001", name: "Heavy Hauler", type: "freight", homeStation: "STN016", route: ["STN016", "STN001", "STN018"] },
  { id: "FRG002", name: "Container Carrier", type: "container", homeStation: "STN018", route: ["STN018", "STN005", "STN016"] },
  { id: "FRG003", name: "Industrial Express", type: "freight", homeStation: "STN010", route: ["STN010", "STN016", "STN003"] },
  { id: "FRG004", name: "Cargo Master", type: "container", homeStation: "STN016", route: ["STN016", "STN002", "STN018"] },
  { id: "FRG005", name: "Freight Runner", type: "freight", homeStation: "STN018", route: ["STN018", "STN004", "STN016"] },
  
  // Special Fleet (5 trains)
  { id: "SPC001", name: "Airport Express", type: "airport", homeStation: "STN001", route: ["STN001", "STN017"] },
  { id: "SPC002", name: "Stadium Special", type: "stadium", homeStation: "STN002", route: ["STN002", "STN019", "STN004"] },
  { id: "SPC003", name: "Convention Center", type: "convention", homeStation: "STN003", route: ["STN003", "STN020", "STN005"] },
  { id: "SPC004", name: "Event Express", type: "stadium", homeStation: "STN004", route: ["STN004", "STN019", "STN001"] },
  { id: "SPC005", name: "Conference Connector", type: "convention", homeStation: "STN005", route: ["STN005", "STN020", "STN002"] }
];

// 🕐 TIME PATTERNS AND SCHEDULES
export const TIME_PATTERNS = {
  peakHours: {
    morning: { start: "06:00", end: "09:00", multiplier: 1.5 },
    evening: { start: "17:00", end: "20:00", multiplier: 1.4 }
  },
  offPeak: {
    midday: { start: "09:00", end: "17:00", multiplier: 0.8 },
    night: { start: "20:00", end: "06:00", multiplier: 0.6 }
  },
  weekend: {
    saturday: { multiplier: 0.9 },
    sunday: { multiplier: 0.7 }
  },
  events: {
    stadium: { multiplier: 2.0, duration: 4 },
    convention: { multiplier: 1.8, duration: 6 },
    airport: { multiplier: 1.3, duration: 24 }
  }
};

// 🎯 NETWORK OPTIMIZATION TARGETS
export const OPTIMIZATION_TARGETS = {
  efficiency: {
    targetThroughput: 85, // % of trains on time
    targetDelayReduction: 75, // % reduction from baseline
    targetConflictResolution: 90, // % of conflicts resolved
    targetResourceUtilization: 80 // % optimal track usage
  },
  capacity: {
    maxTrainsPerHour: 12,
    maxTrainsPerTrack: 8,
    minTurnaroundTime: 15, // minutes
    maxStationCapacity: 0.9 // 90% of station capacity
  },
  performance: {
    maxAverageDelay: 5, // minutes
    maxConflictRate: 0.05, // 5% of trains
    minRewardScore: 75,
    targetCompletionRate: 95 // %
  }
};

// 🤖 AI TRAINING PARAMETERS
export const TRAINING_PARAMETERS = {
  modelUpdateFrequency: 10, // Update model every 10 simulations
  trainingDataSize: 100, // Use last 100 simulations for training
  validationSplit: 0.2, // 20% for validation
  learningRate: 0.001,
  batchSize: 32,
  epochs: 50,
  earlyStoppingPatience: 10,
  performanceMetrics: [
    'rewardScore',
    'throughput',
    'conflictResolution',
    'delayReduction',
    'resourceOptimization'
  ]
};

// 📊 NETWORK ANALYSIS TOOLS
export const NETWORK_ANALYSIS = {
  calculateNetworkEfficiency: (simulations) => {
    if (!simulations.length) return 0;
    
    const recentSims = simulations.slice(0, 10);
    const avgRewardScore = recentSims.reduce((sum, sim) => sum + (sim.kpis?.rewardScore || 0), 0) / recentSims.length;
    const avgThroughput = recentSims.reduce((sum, sim) => sum + (sim.kpis?.maxThroughput || 0), 0) / recentSims.length;
    const avgConflictResolution = recentSims.reduce((sum, sim) => sum + (sim.efficiency || 0), 0) / recentSims.length;
    
    return (avgRewardScore + avgThroughput + avgConflictResolution) / 3;
  },
  
  identifyBottlenecks: (simulations) => {
    const bottlenecks = [];
    const trackConflicts = {};
    
    simulations.forEach(sim => {
      sim.conflicts?.forEach(conflict => {
        if (!trackConflicts[conflict.track]) {
          trackConflicts[conflict.track] = 0;
        }
        trackConflicts[conflict.track]++;
      });
    });
    
    Object.entries(trackConflicts).forEach(([track, count]) => {
      if (count > simulations.length * 0.3) { // More than 30% of simulations
        bottlenecks.push({ track, conflictRate: count / simulations.length });
      }
    });
    
    return bottlenecks.sort((a, b) => b.conflictRate - a.conflictRate);
  },
  
  suggestOptimizations: (simulations) => {
    const suggestions = [];
    const bottlenecks = NETWORK_ANALYSIS.identifyBottlenecks(simulations);
    
    bottlenecks.forEach(bottleneck => {
      suggestions.push({
        type: 'track_optimization',
        target: bottleneck.track,
        description: `High conflict rate on ${bottleneck.track}`,
        priority: bottleneck.conflictRate > 0.5 ? 'high' : 'medium'
      });
    });
    
    return suggestions;
  }
};

export default {
  STATIONS,
  TRACKS,
  TRAINS,
  TRAIN_TYPES,
  TIME_PATTERNS,
  OPTIMIZATION_TARGETS,
  TRAINING_PARAMETERS,
  NETWORK_ANALYSIS
};
