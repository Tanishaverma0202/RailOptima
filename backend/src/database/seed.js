import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

// Import models
import User from './models/User.js';
import Train from './models/Train.js';
import Station from './models/Station.js';
import Track from './models/Track.js';

dotenv.config();

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@railoptima.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT'
    },
    permissions: [
      'view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks',
      'run_simulation', 'view_analytics', 'manage_conflicts', 'admin_access',
      'export_data', 'import_data', 'override_schedule', 'manage_users'
    ]
  },
  {
    username: 'operator1',
    email: 'operator1@railoptima.com',
    password: 'operator123',
    role: 'operator',
    profile: {
      firstName: 'Railway',
      lastName: 'Operator',
      department: 'Operations'
    },
    permissions: [
      'view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks',
      'run_simulation', 'view_analytics', 'manage_conflicts', 'override_schedule'
    ]
  },
  {
    username: 'analyst1',
    email: 'analyst1@railoptima.com',
    password: 'analyst123',
    role: 'analyst',
    profile: {
      firstName: 'Data',
      lastName: 'Analyst',
      department: 'Analytics'
    },
    permissions: [
      'view_dashboard', 'view_analytics', 'export_data'
    ]
  }
];

const sampleStations = [
  {
    id: 'S1',
    name: 'New Delhi',
    code: 'NDLS',
    location: {
      x: 320,
      y: 80,
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India'
    },
    capacity: {
      platforms: 16,
      maxTrains: 200,
      passengers: 50000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage', 'atm', 'medical'],
    traffic: {
      dailyTrains: 180,
      peakHours: [6, 7, 8, 17, 18, 19, 20],
      averageDelay: 8
    }
  },
  {
    id: 'S2',
    name: 'Mumbai Central',
    code: 'MMCT',
    location: {
      x: 120,
      y: 280,
      latitude: 18.9750,
      longitude: 72.8258,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    capacity: {
      platforms: 12,
      maxTrains: 150,
      passengers: 40000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage', 'atm'],
    traffic: {
      dailyTrains: 140,
      peakHours: [7, 8, 9, 18, 19, 20],
      averageDelay: 12
    }
  },
  {
    id: 'S3',
    name: 'Howrah',
    code: 'HWH',
    location: {
      x: 560,
      y: 100,
      latitude: 22.5888,
      longitude: 88.3431,
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India'
    },
    capacity: {
      platforms: 23,
      maxTrains: 250,
      passengers: 60000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage', 'atm', 'medical'],
    traffic: {
      dailyTrains: 200,
      peakHours: [6, 7, 8, 17, 18, 19, 20],
      averageDelay: 10
    }
  },
  {
    id: 'S4',
    name: 'Chennai Central',
    code: 'MAS',
    location: {
      x: 340,
      y: 420,
      latitude: 13.0827,
      longitude: 80.2707,
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India'
    },
    capacity: {
      platforms: 17,
      maxTrains: 180,
      passengers: 45000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage', 'atm'],
    traffic: {
      dailyTrains: 160,
      peakHours: [7, 8, 9, 17, 18, 19],
      averageDelay: 9
    }
  },
  {
    id: 'S5',
    name: 'KSR Bengaluru',
    code: 'SBC',
    location: {
      x: 240,
      y: 380,
      latitude: 12.9716,
      longitude: 77.5946,
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India'
    },
    capacity: {
      platforms: 10,
      maxTrains: 120,
      passengers: 35000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage', 'atm'],
    traffic: {
      dailyTrains: 100,
      peakHours: [7, 8, 9, 17, 18, 19],
      averageDelay: 7
    }
  },
  {
    id: 'S6',
    name: 'Hyderabad Deccan',
    code: 'HYB',
    location: {
      x: 300,
      y: 310,
      latitude: 17.3850,
      longitude: 78.4867,
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India'
    },
    capacity: {
      platforms: 8,
      maxTrains: 100,
      passengers: 25000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage'],
    traffic: {
      dailyTrains: 80,
      peakHours: [7, 8, 9, 17, 18, 19],
      averageDelay: 6
    }
  },
  {
    id: 'S7',
    name: 'Ahmedabad',
    code: 'ADI',
    location: {
      x: 140,
      y: 170,
      latitude: 23.0225,
      longitude: 72.5714,
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India'
    },
    capacity: {
      platforms: 8,
      maxTrains: 90,
      passengers: 20000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi'],
    traffic: {
      dailyTrains: 70,
      peakHours: [7, 8, 9, 18, 19],
      averageDelay: 8
    }
  },
  {
    id: 'S8',
    name: 'Bhopal',
    code: 'BPL',
    location: {
      x: 280,
      y: 200,
      latitude: 23.2599,
      longitude: 77.4126,
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      country: 'India'
    },
    capacity: {
      platforms: 7,
      maxTrains: 80,
      passengers: 18000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi'],
    traffic: {
      dailyTrains: 60,
      peakHours: [7, 8, 9, 17, 18, 19],
      averageDelay: 5
    }
  },
  {
    id: 'S9',
    name: 'Nagpur',
    code: 'NGP',
    location: {
      x: 330,
      y: 260,
      latitude: 21.1458,
      longitude: 79.0882,
      city: 'Nagpur',
      state: 'Maharashtra',
      country: 'India'
    },
    capacity: {
      platforms: 8,
      maxTrains: 85,
      passengers: 22000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage'],
    traffic: {
      dailyTrains: 75,
      peakHours: [7, 8, 9, 17, 18, 19],
      averageDelay: 6
    }
  },
  {
    id: 'S10',
    name: 'Patna',
    code: 'PNBE',
    location: {
      x: 450,
      y: 140,
      latitude: 25.5941,
      longitude: 85.1376,
      city: 'Patna',
      state: 'Bihar',
      country: 'India'
    },
    capacity: {
      platforms: 10,
      maxTrains: 110,
      passengers: 28000
    },
    facilities: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage', 'atm'],
    traffic: {
      dailyTrains: 90,
      peakHours: [6, 7, 8, 17, 18, 19, 20],
      averageDelay: 9
    }
  }
];

const sampleTrains = [
  {
    id: 'T01',
    number: '12301',
    name: 'Howrah Rajdhani',
    origin: 'Howrah',
    destination: 'New Delhi',
    priority: 'HIGH',
    type: 'Rajdhani',
    status: 'ACTIVE',
    capacity: { passengers: 750, freight: 0 },
    speed: { max: 130, average: 110 },
    performance: {
      delay: 0,
      statusCode: 'ON_TIME',
      rewardContrib: 10.0,
      onTimePerformance: 100
    }
  },
  {
    id: 'T02',
    number: '12951',
    name: 'Mumbai Rajdhani',
    origin: 'Mumbai Central',
    destination: 'New Delhi',
    priority: 'HIGH',
    type: 'Rajdhani',
    status: 'ACTIVE',
    capacity: { passengers: 750, freight: 0 },
    speed: { max: 130, average: 110 },
    performance: {
      delay: 5,
      statusCode: 'MINOR_DELAY',
      rewardContrib: 9.5,
      onTimePerformance: 95
    }
  },
  {
    id: 'T03',
    number: '22691',
    name: 'Rajdhani Express',
    origin: 'KSR Bengaluru',
    destination: 'Hazrat Nizamuddin',
    priority: 'HIGH',
    type: 'Rajdhani',
    status: 'ACTIVE',
    capacity: { passengers: 750, freight: 0 },
    speed: { max: 130, average: 105 },
    performance: {
      delay: 0,
      statusCode: 'ON_TIME',
      rewardContrib: 10.0,
      onTimePerformance: 100
    }
  },
  {
    id: 'T04',
    number: '12002',
    name: 'Bhopal Shatabdi',
    origin: 'New Delhi',
    destination: 'Habibganj',
    priority: 'MEDIUM',
    type: 'Shatabdi',
    status: 'ACTIVE',
    capacity: { passengers: 500, freight: 0 },
    speed: { max: 150, average: 120 },
    performance: {
      delay: 0,
      statusCode: 'ON_TIME',
      rewardContrib: 8.0,
      onTimePerformance: 100
    }
  },
  {
    id: 'T05',
    number: '12009',
    name: 'Mumbai Shatabdi',
    origin: 'Mumbai Central',
    destination: 'Ahmedabad',
    priority: 'MEDIUM',
    type: 'Shatabdi',
    status: 'ACTIVE',
    capacity: { passengers: 500, freight: 0 },
    speed: { max: 150, average: 115 },
    performance: {
      delay: 12,
      statusCode: 'MINOR_DELAY',
      rewardContrib: 7.0,
      onTimePerformance: 88
    }
  },
  {
    id: 'T06',
    number: '12051',
    name: 'Janshatabdi Exp',
    origin: 'Dadar',
    destination: 'Madgaon',
    priority: 'MEDIUM',
    type: 'Shatabdi',
    status: 'ACTIVE',
    capacity: { passengers: 400, freight: 0 },
    speed: { max: 130, average: 100 },
    performance: {
      delay: 8,
      statusCode: 'MINOR_DELAY',
      rewardContrib: 7.5,
      onTimePerformance: 92
    }
  },
  {
    id: 'T07',
    number: '11001',
    name: 'Udyan Express',
    origin: 'Mumbai CST',
    destination: 'KSR Bengaluru',
    priority: 'LOW',
    type: 'Express',
    status: 'ACTIVE',
    capacity: { passengers: 600, freight: 100 },
    speed: { max: 110, average: 80 },
    performance: {
      delay: 25,
      statusCode: 'MAJOR_DELAY',
      rewardContrib: 5.0,
      onTimePerformance: 75
    }
  },
  {
    id: 'T08',
    number: '12629',
    name: 'Karnataka Express',
    origin: 'New Delhi',
    destination: 'KSR Bengaluru',
    priority: 'LOW',
    type: 'Express',
    status: 'ACTIVE',
    capacity: { passengers: 650, freight: 150 },
    speed: { max: 110, average: 75 },
    performance: {
      delay: 18,
      statusCode: 'MAJOR_DELAY',
      rewardContrib: 6.0,
      onTimePerformance: 82
    }
  },
  {
    id: 'T09',
    number: '12721',
    name: 'Dakshin Express',
    origin: 'Hazrat Nizamuddin',
    destination: 'Hyderabad',
    priority: 'LOW',
    type: 'Express',
    status: 'ACTIVE',
    capacity: { passengers: 550, freight: 80 },
    speed: { max: 110, average: 78 },
    performance: {
      delay: 0,
      statusCode: 'ON_TIME',
      rewardContrib: 7.0,
      onTimePerformance: 100
    }
  },
  {
    id: 'T10',
    number: '13151',
    name: 'Kolkata Express',
    origin: 'Jammu Tawi',
    destination: 'Kolkata',
    priority: 'LOW',
    type: 'Express',
    status: 'ACTIVE',
    capacity: { passengers: 700, freight: 120 },
    speed: { max: 100, average: 70 },
    performance: {
      delay: 35,
      statusCode: 'MAJOR_DELAY',
      rewardContrib: 4.0,
      onTimePerformance: 65
    }
  }
];

const sampleTracks = [
  {
    id: 'Track-A',
    name: 'Northern Main Line',
    type: 'MAIN',
    endpoints: [
      { stationId: null, coordinates: { x: 320, y: 80 } },  // New Delhi
      { stationId: null, coordinates: { x: 280, y: 200 } }   // Bhopal
    ],
    specifications: {
      length: 700,
      gauge: 'BROAD',
      electrified: true,
      maxSpeed: 130,
      capacity: 2
    },
    signaling: {
      system: 'AUTOMATIC',
      blocks: ['Block-A1', 'Block-A2', 'Block-A3'],
      interlocking: true
    },
    maintenance: {
      condition: 'GOOD',
      nextInspection: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'Track-B',
    name: 'Eastern Corridor',
    type: 'MAIN',
    endpoints: [
      { stationId: null, coordinates: { x: 320, y: 80 } },   // New Delhi
      { stationId: null, coordinates: { x: 450, y: 140 } }  // Patna
    ],
    specifications: {
      length: 800,
      gauge: 'BROAD',
      electrified: true,
      maxSpeed: 120,
      capacity: 2
    },
    signaling: {
      system: 'AUTOMATIC',
      blocks: ['Block-B1', 'Block-B2', 'Block-B3', 'Block-B4'],
      interlocking: true
    },
    maintenance: {
      condition: 'EXCELLENT',
      nextInspection: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'Track-C',
    name: 'Western Line',
    type: 'MAIN',
    endpoints: [
      { stationId: null, coordinates: { x: 320, y: 80 } },   // New Delhi
      { stationId: null, coordinates: { x: 140, y: 170 } }  // Ahmedabad
    ],
    specifications: {
      length: 900,
      gauge: 'BROAD',
      electrified: true,
      maxSpeed: 130,
      capacity: 2
    },
    signaling: {
      system: 'AUTOMATIC',
      blocks: ['Block-C1', 'Block-C2', 'Block-C3', 'Block-C4', 'Block-C5'],
      interlocking: true
    },
    maintenance: {
      condition: 'GOOD',
      nextInspection: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'Track-D',
    name: 'Central Route',
    type: 'MAIN',
    endpoints: [
      { stationId: null, coordinates: { x: 120, y: 280 } },  // Mumbai
      { stationId: null, coordinates: { x: 330, y: 260 } }  // Nagpur
    ],
    specifications: {
      length: 650,
      gauge: 'BROAD',
      electrified: true,
      maxSpeed: 110,
      capacity: 2
    },
    signaling: {
      system: 'SEMI_AUTOMATIC',
      blocks: ['Block-D1', 'Block-D2', 'Block-D3'],
      interlocking: true
    },
    maintenance: {
      condition: 'FAIR',
      nextInspection: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'Track-E',
    name: 'Southern Line',
    type: 'MAIN',
    endpoints: [
      { stationId: null, coordinates: { x: 300, y: 310 } },  // Hyderabad
      { stationId: null, coordinates: { x: 240, y: 380 } }  // Bengaluru
    ],
    specifications: {
      length: 400,
      gauge: 'BROAD',
      electrified: true,
      maxSpeed: 100,
      capacity: 1
    },
    signaling: {
      system: 'AUTOMATIC',
      blocks: ['Block-E1', 'Block-E2'],
      interlocking: true
    },
    maintenance: {
      condition: 'EXCELLENT',
      nextInspection: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    }
  }
];

// Seed function
async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Train.deleteMany({});
    await Station.deleteMany({});
    await Track.deleteMany({});

    logger.info('Cleared existing data');

    // Seed users
    const createdUsers = await User.create(sampleUsers);
    logger.info(`Created ${createdUsers.length} users`);

    // Seed stations
    const createdStations = await Station.create(sampleStations);
    logger.info(`Created ${createdStations.length} stations`);

    // Create station mapping for tracks
    const stationMap = {};
    createdStations.forEach(station => {
      stationMap[station.id] = station._id;
    });

    // Update tracks with station references
    const tracksWithStationIds = sampleTracks.map((track, index) => {
      const trackWithStations = { ...track };
      
      // Map coordinates to actual station IDs
      if (index === 0) { // Track-A: New Delhi to Bhopal
        trackWithStations.endpoints[0].stationId = stationMap['S1']; // New Delhi
        trackWithStations.endpoints[1].stationId = stationMap['S8']; // Bhopal
      } else if (index === 1) { // Track-B: New Delhi to Patna
        trackWithStations.endpoints[0].stationId = stationMap['S1']; // New Delhi
        trackWithStations.endpoints[1].stationId = stationMap['S10']; // Patna
      } else if (index === 2) { // Track-C: New Delhi to Ahmedabad
        trackWithStations.endpoints[0].stationId = stationMap['S1']; // New Delhi
        trackWithStations.endpoints[1].stationId = stationMap['S7']; // Ahmedabad
      } else if (index === 3) { // Track-D: Mumbai to Nagpur
        trackWithStations.endpoints[0].stationId = stationMap['S2']; // Mumbai
        trackWithStations.endpoints[1].stationId = stationMap['S9']; // Nagpur
      } else if (index === 4) { // Track-E: Hyderabad to Bengaluru
        trackWithStations.endpoints[0].stationId = stationMap['S6']; // Hyderabad
        trackWithStations.endpoints[1].stationId = stationMap['S5']; // Bengaluru
      }
      
      return trackWithStations;
    });

    const createdTracks = await Track.create(tracksWithStationIds);
    logger.info(`Created ${createdTracks.length} tracks`);

    // Update stations with track connectivity
    for (const track of createdTracks) {
      const stationIds = track.endpoints.map(ep => ep.stationId);
      await Station.updateMany(
        { _id: { $in: stationIds } },
        { $push: { 'connectivity.tracks': track._id } }
      );
    }

    // Connect stations to each other
    const stationConnections = [
      ['S1', 'S8'], ['S1', 'S10'], ['S1', 'S7'],  // New Delhi connections
      ['S2', 'S9'], ['S7', 'S2'],                  // Mumbai connections
      ['S10', 'S3'],                               // Patna to Howrah
      ['S8', 'S9'],                                // Bhopal to Nagpur
      ['S9', 'S6'],                                // Nagpur to Hyderabad
      ['S6', 'S5'], ['S5', 'S4'], ['S6', 'S4']   // South connections
    ];

    for (const [station1Id, station2Id] of stationConnections) {
      const station1 = createdStations.find(s => s.id === station1Id);
      const station2 = createdStations.find(s => s.id === station2Id);
      
      if (station1 && station2) {
        await Station.updateOne(
          { _id: station1._id },
          { $addToSet: { 'connectivity.connectedStations': station2._id } }
        );
        await Station.updateOne(
          { _id: station2._id },
          { $addToSet: { 'connectivity.connectedStations': station1._id } }
        );
      }
    }

    // Seed trains
    const createdTrains = await Train.create(sampleTrains);
    logger.info(`Created ${createdTrains.length} trains`);

    // Set initial train positions
    const trackMap = {};
    createdTracks.forEach(track => {
      trackMap[track.id] = track._id;
    });

    // Assign some trains to tracks
    const trainTrackAssignments = [
      { trainId: 'T01', trackId: 'Track-B', progress: 0.3 },
      { trainId: 'T02', trackId: 'Track-C', progress: 0.6 },
      { trainId: 'T03', trackId: 'Track-E', progress: 0.2 },
      { trainId: 'T04', trackId: 'Track-A', progress: 0.8 },
      { trainId: 'T05', trackId: 'Track-D', progress: 0.4 }
    ];

    for (const assignment of trainTrackAssignments) {
      const train = createdTrains.find(t => t.id === assignment.trainId);
      const track = createdTracks.find(t => t.id === assignment.trackId);
      
      if (train && track) {
        // Calculate position based on track endpoints
        const startEndpoint = track.endpoints[0];
        const endEndpoint = track.endpoints[1];
        
        const x = startEndpoint.coordinates.x + 
                  (endEndpoint.coordinates.x - startEndpoint.coordinates.x) * assignment.progress;
        const y = startEndpoint.coordinates.y + 
                  (endEndpoint.coordinates.y - startEndpoint.coordinates.y) * assignment.progress;

        await Train.updateOne(
          { _id: train._id },
          {
            'currentPosition.trackId': track._id,
            'currentPosition.x': x,
            'currentPosition.y': y,
            'currentPosition.progress': assignment.progress
          }
        );

        // Update track occupancy
        await Track.updateOne(
          { _id: track._id },
          {
            $push: { 'occupancy.currentTrains': train._id },
            $set: { 
              'occupancy.utilization': (track.occupancy.currentTrains.length + 1) / track.specifications.capacity * 100,
              'occupancy.lastUpdated': new Date()
            }
          }
        );
      }
    }

    logger.info('Database seeding completed successfully!');
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Stations: ${createdStations.length}`);
    console.log(`   Tracks: ${createdTracks.length}`);
    console.log(`   Trains: ${createdTrains.length}`);
    
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@railoptima.com / admin123');
    console.log('   Operator: operator1@railoptima.com / operator123');
    console.log('   Analyst: analyst1@railoptima.com / analyst123');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Connect to database
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/railoptima';
  
  mongoose.connect(mongoURI)
    .then(() => {
      logger.info('Connected to MongoDB for seeding');
      seedDatabase().then(() => {
        mongoose.disconnect();
        process.exit(0);
      });
    })
    .catch((error) => {
      logger.error('MongoDB connection failed:', error);
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    });
}

export default seedDatabase;
