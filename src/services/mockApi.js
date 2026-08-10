// Mock API service for demo purposes

const mockData = {
  users: [
    {
      _id: '1',
      username: 'admin',
      email: 'admin@railoptima.com',
      role: 'admin',
      permissions: ['view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks', 'run_simulation', 'view_analytics', 'manage_conflicts', 'admin_access'],
      profile: { firstName: 'Admin', lastName: 'User' }
    },
    {
      _id: '2',
      username: 'operator1',
      email: 'operator1@railoptima.com',
      role: 'operator',
      permissions: ['view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks', 'run_simulation', 'view_analytics', 'manage_conflicts'],
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
  conflicts: [],
  simulations: []
};

class MockApiService {
  constructor() {
    this.token = localStorage.getItem('railoptima_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('railoptima_token', token);
    } else {
      localStorage.removeItem('railoptima_token');
    }
  }

  async request(endpoint, options = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const [resource, id] = endpoint.replace('/api/', '').split('/');
        
        let data = null;
        let success = true;
        
        switch (resource) {
          case 'auth':
            if (endpoint.includes('login')) {
              const { email, password } = JSON.parse(options.body);
              const user = mockData.users.find(u => u.email === email);
              if (user && (password === 'admin123' || password === 'operator123')) {
                this.setToken('mock-jwt-token');
                resolve({ success: true, data: { user, token: 'mock-jwt-token' } });
              } else {
                resolve({ success: false, message: 'Invalid credentials' });
              }
              return;
            } else if (endpoint.includes('me')) {
              const user = mockData.users[0]; // Return admin user
              resolve({ success: true, data: { user } });
              return;
            }
            break;
            
          case 'trains':
            data = mockData.trains;
            break;
            
          case 'stations':
            data = mockData.stations;
            break;
            
          case 'tracks':
            data = mockData.tracks;
            break;
            
          case 'simulation':
            data = mockData.simulations;
            break;
            
          default:
            data = [];
        }
        
        resolve({ success, data: { [resource]: data } });
      }, 300); // Simulate network delay
    });
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async logout() {
    this.setToken(null);
    return Promise.resolve({ success: true });
  }

  // Data methods
  async getTrains() {
    return this.get('/trains');
  }

  async getStations() {
    return this.get('/stations');
  }

  async getTracks() {
    return this.get('/tracks');
  }

  async getSimulations() {
    return this.get('/simulation');
  }

  async createSimulation(simulationData) {
    const newSimulation = {
      _id: Date.now().toString(),
      ...simulationData,
      status: 'RUNNING',
      createdAt: new Date().toISOString(),
      metrics: { kpis: { rewardScore: 8.5 } }
    };
    mockData.simulations.push(newSimulation);
    return Promise.resolve({ success: true, data: { simulation: newSimulation } });
  }

  async runSimulation(id) {
    const simulation = mockData.simulations.find(s => s._id === id);
    if (simulation) {
      simulation.status = 'COMPLETED';
      simulation.metrics.kpis.rewardScore = Math.random() * 10 + 5;
    }
    return Promise.resolve({ success: true, data: { simulation } });
  }
}

const mockApiService = new MockApiService();
export default mockApiService;
