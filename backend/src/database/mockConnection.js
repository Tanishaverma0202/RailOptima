// Mock database connection for demo purposes
import { logger } from '../utils/logger.js';

let mockData = {
  users: [],
  trains: [],
  stations: [],
  tracks: [],
  schedules: [],
  conflicts: [],
  simulations: []
};

export const connectDB = async () => {
  logger.info('🚀 Mock Database Connected - Running in Demo Mode');
  return Promise.resolve();
};

export const disconnectDB = async () => {
  logger.info('Mock Database Disconnected');
  return Promise.resolve();
};

// Mock model functions
export const createMockModel = (collectionName) => {
  return {
    find: (query = {}) => Promise.resolve({ success: true, data: { [collectionName]: mockData[collectionName] } }),
    findById: (id) => {
      const item = mockData[collectionName].find(item => item.id === id || item._id === id);
      return Promise.resolve(item ? { success: true, data: { [collectionName.slice(0, -1)]: item } } : null);
    },
    create: (data) => {
      const newItem = { ...data, _id: Date.now().toString(), id: data.id || Date.now().toString() };
      mockData[collectionName].push(newItem);
      return Promise.resolve({ success: true, data: { [collectionName.slice(0, -1)]: newItem } });
    },
    updateOne: (query, update) => {
      const index = mockData[collectionName].findIndex(item => 
        item.id === query.id || item._id === query._id || item._id === query.id
      );
      if (index !== -1) {
        mockData[collectionName][index] = { ...mockData[collectionName][index], ...update.$set || update };
        return Promise.resolve({ success: true, data: { [collectionName.slice(0, -1)]: mockData[collectionName][index] } });
      }
      return Promise.resolve(null);
    },
    deleteOne: (query) => {
      const index = mockData[collectionName].findIndex(item => 
        item.id === query.id || item._id === query._id || item._id === query.id
      );
      if (index !== -1) {
        mockData[collectionName].splice(index, 1);
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false });
    },
    countDocuments: () => Promise.resolve(mockData[collectionName].length),
    aggregate: (pipeline) => {
      // Simple mock aggregation
      if (pipeline.length === 0) {
        return Promise.resolve([{ _id: null, count: mockData[collectionName].length }]);
      }
      return Promise.resolve([{ _id: null, count: mockData[collectionName].length }]);
    }
  };
};

// Initialize with sample data
export const initializeMockData = () => {
  mockData = {
    users: [
      {
        _id: '1',
        id: '1',
        username: 'admin',
        email: 'admin@railoptima.com',
        role: 'admin',
        permissions: ['view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks', 'run_simulation', 'view_analytics', 'manage_conflicts', 'admin_access'],
        status: 'active',
        profile: { firstName: 'Admin', lastName: 'User' }
      },
      {
        _id: '2',
        id: '2',
        username: 'operator1',
        email: 'operator1@railoptima.com',
        role: 'operator',
        permissions: ['view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks', 'run_simulation', 'view_analytics', 'manage_conflicts'],
        status: 'active',
        profile: { firstName: 'Operator', lastName: 'User' }
      }
    ],
    trains: [
      {
        _id: 'T01',
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
        },
        currentPosition: { x: 560, y: 100, progress: 0.3 }
      },
      {
        _id: 'T02',
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
        },
        currentPosition: { x: 140, y: 280, progress: 0.6 }
      }
    ],
    stations: [
      {
        _id: 'S1',
        id: 'S1',
        name: 'New Delhi',
        code: 'NDLS',
        location: { x: 320, y: 80, city: 'New Delhi', state: 'Delhi' },
        capacity: { platforms: 16, maxTrains: 200, passengers: 50000 },
        status: 'ACTIVE',
        traffic: { dailyTrains: 180, averageDelay: 8 }
      },
      {
        _id: 'S2',
        id: 'S2',
        name: 'Mumbai Central',
        code: 'MMCT',
        location: { x: 120, y: 280, city: 'Mumbai', state: 'Maharashtra' },
        capacity: { platforms: 12, maxTrains: 150, passengers: 40000 },
        status: 'ACTIVE',
        traffic: { dailyTrains: 140, averageDelay: 12 }
      }
    ],
    tracks: [
      {
        _id: 'Track-A',
        id: 'Track-A',
        name: 'Northern Main Line',
        type: 'MAIN',
        endpoints: [
          { coordinates: { x: 320, y: 80 } },
          { coordinates: { x: 280, y: 200 } }
        ],
        specifications: { length: 700, gauge: 'BROAD', electrified: true, maxSpeed: 130, capacity: 2 },
        status: 'ACTIVE',
        occupancy: { utilization: 75, currentTrains: ['T01'] }
      }
    ],
    schedules: [],
    conflicts: [],
    simulations: []
  };
};

// Initialize mock data on import
initializeMockData();
