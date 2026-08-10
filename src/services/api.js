// API service for RailOptima backend integration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('railoptima_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('railoptima_token', token);
    } else {
      localStorage.removeItem('railoptima_token');
    }
  }

  // Get auth headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // Train methods
  async getTrains(params = {}) {
    return this.get('/trains', params);
  }

  async getTrain(id) {
    return this.get(`/trains/${id}`);
  }

  async createTrain(trainData) {
    return this.post('/trains', trainData);
  }

  async updateTrain(id, trainData) {
    return this.put(`/trains/${id}`, trainData);
  }

  async updateTrainPosition(id, position) {
    return this.put(`/trains/${id}/position`, position);
  }

  async updateTrainPerformance(id, performance) {
    return this.put(`/trains/${id}/performance`, performance);
  }

  async deleteTrain(id) {
    return this.delete(`/trains/${id}`);
  }

  async getTrainStats() {
    return this.get('/trains/stats/summary');
  }

  // Station methods
  async getStations(params = {}) {
    return this.get('/stations', params);
  }

  async getStation(id) {
    return this.get(`/stations/${id}`);
  }

  async createStation(stationData) {
    return this.post('/stations', stationData);
  }

  async updateStation(id, stationData) {
    return this.put(`/stations/${id}`, stationData);
  }

  async updateStationTraffic(id, traffic) {
    return this.put(`/stations/${id}/traffic`, traffic);
  }

  async deleteStation(id) {
    return this.delete(`/stations/${id}`);
  }

  async getStationsForMap() {
    return this.get('/stations/map/all');
  }

  async getStationStats() {
    return this.get('/stations/stats/summary');
  }

  // Track methods
  async getTracks(params = {}) {
    return this.get('/tracks', params);
  }

  async getTrack(id) {
    return this.get(`/tracks/${id}`);
  }

  async createTrack(trackData) {
    return this.post('/tracks', trackData);
  }

  async updateTrack(id, trackData) {
    return this.put(`/tracks/${id}`, trackData);
  }

  async updateTrackOccupancy(id, occupancy) {
    return this.put(`/tracks/${id}/occupancy`, occupancy);
  }

  async addTrainToTrack(trackId, trainId) {
    return this.post(`/tracks/${trackId}/trains/${trainId}`);
  }

  async removeTrainFromTrack(trackId, trainId) {
    return this.delete(`/tracks/${trackId}/trains/${trainId}`);
  }

  async deleteTrack(id) {
    return this.delete(`/tracks/${id}`);
  }

  async getTracksForMap() {
    return this.get('/tracks/map/all');
  }

  async getTrackStats() {
    return this.get('/tracks/stats/summary');
  }

  // Schedule methods
  async getSchedules(params = {}) {
    return this.get('/schedules', params);
  }

  async getSchedule(id) {
    return this.get(`/schedules/${id}`);
  }

  async createSchedule(scheduleData) {
    return this.post('/schedules', scheduleData);
  }

  async updateSchedule(id, scheduleData) {
    return this.put(`/schedules/${id}`, scheduleData);
  }

  async updateSchedulePosition(id, position) {
    return this.put(`/schedules/${id}/position`, position);
  }

  async updateScheduleStatus(id, status) {
    return this.put(`/schedules/${id}/status`, status);
  }

  async reassignSchedule(id, newTrackId, reason) {
    return this.put(`/schedules/${id}/reassign`, { newTrackId, reason });
  }

  async deleteSchedule(id) {
    return this.delete(`/schedules/${id}`);
  }

  async getSchedulesBySimulation(simulationId) {
    return this.get(`/schedules/simulation/${simulationId}`);
  }

  async getScheduleStats() {
    return this.get('/schedules/stats/summary');
  }

  // Simulation methods
  async getSimulations(params = {}) {
    return this.get('/simulation', params);
  }

  async getSimulation(id) {
    return this.get(`/simulation/${id}`);
  }

  async createSimulation(simulationData) {
    return this.post('/simulation', simulationData);
  }

  async runSimulation(id) {
    return this.post(`/simulation/${id}/run`);
  }

  async getSimulationResults(id) {
    return this.get(`/simulation/${id}/results`);
  }

  async cancelSimulation(id) {
    return this.post(`/simulation/${id}/cancel`);
  }

  async getSimulationStats() {
    return this.get('/simulation/stats/summary');
  }

  // Conflict methods
  async getActiveConflicts(simulationId) {
    return this.get('/conflicts/active', { simulationId });
  }

  async resolveConflict(conflictId, resolution) {
    return this.put(`/conflicts/${conflictId}/resolve`, resolution);
  }

  async getConflictStats(simulationId) {
    return this.get('/conflicts/stats', { simulationId });
  }

  // Analytics methods
  async getDashboardAnalytics(timeframe = '24h', simulationId) {
    return this.get('/analytics/dashboard', { timeframe, simulationId });
  }

  async getPerformanceTrends(metric = 'rewardScore', period = '7d', simulationId) {
    return this.get('/analytics/trends', { metric, period, simulationId });
  }

  async getConflictAnalytics(timeframe = '24h', simulationId) {
    return this.get('/analytics/conflicts', { timeframe, simulationId });
  }

  async getTrainAnalytics(timeframe = '24h') {
    return this.get('/analytics/trains', { timeframe });
  }

  async getNetworkAnalytics(timeframe = '24h') {
    return this.get('/analytics/network', { timeframe });
  }

  async exportAnalytics(format = 'json', type = 'summary', simulationId) {
    return this.get('/analytics/export', { format, type, simulationId });
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
