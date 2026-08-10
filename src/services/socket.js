// Socket.IO service for real-time communication

import { io } from 'socket.io-client';
import apiService from './api.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.user = null;
    this.currentSimulation = null;
    this.eventListeners = new Map();
  }

  // Connect to socket server
  connect(token = null) {
    if (this.socket && this.connected) {
      return Promise.resolve();
    }

    const authToken = token || apiService.token;
    if (!authToken) {
      return Promise.reject(new Error('No authentication token available'));
    }

    return new Promise((resolve, reject) => {
      const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      
      this.socket = io(socketURL, {
        auth: { token: authToken },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Connected to RailOptima socket server');
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('Disconnected from RailOptima socket server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('connected', (data) => {
        this.user = data.user;
        this.emit('user_connected', data);
      });

      // Set up default event listeners
      this.setupDefaultListeners();
    });
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.user = null;
      this.currentSimulation = null;
    }
  }

  // Setup default event listeners
  setupDefaultListeners() {
    if (!this.socket) return;

    // Train position updates
    this.socket.on('train_position_updated', (data) => {
      this.emit('train_position_updated', data);
    });

    // Conflict resolution
    this.socket.on('conflict_resolved', (data) => {
      this.emit('conflict_resolved', data);
    });

    // Schedule updates
    this.socket.on('schedule_updated', (data) => {
      this.emit('schedule_updated', data);
    });

    // Simulation status updates
    this.socket.on('simulation_status_updated', (data) => {
      this.emit('simulation_status_updated', data);
    });

    // Chat messages
    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    // Live data updates
    this.socket.on('live_data', (data) => {
      this.emit('live_data', data);
    });

    // Active conflicts updates
    this.socket.on('active_conflicts_update', (data) => {
      this.emit('active_conflicts_update', data);
    });

    // System status updates
    this.socket.on('system_status_update', (data) => {
      this.emit('system_status_update', data);
    });

    // User connection events
    this.socket.on('user_disconnected', (data) => {
      this.emit('user_disconnected', data);
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
      this.emit('socket_error', data);
    });
  }

  // Join simulation room
  joinSimulation(simulationId) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('join_simulation', simulationId, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          this.currentSimulation = simulationId;
          resolve(response);
        }
      });
    });
  }

  // Leave simulation room
  leaveSimulation(simulationId) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('leave_simulation', simulationId, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          if (this.currentSimulation === simulationId) {
            this.currentSimulation = null;
          }
          resolve(response);
        }
      });
    });
  }

  // Update train position
  updateTrainPosition(trainId, position, simulationId = null) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('update_train_position', {
        trainId,
        position,
        simulationId: simulationId || this.currentSimulation
      }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Resolve conflict
  resolveConflict(conflictId, resolution, simulationId = null) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('resolve_conflict', {
        conflictId,
        resolution,
        simulationId: simulationId || this.currentSimulation
      }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Update schedule
  updateSchedule(scheduleId, updates, simulationId = null) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('update_schedule', {
        scheduleId,
        updates,
        simulationId: simulationId || this.currentSimulation
      }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Update simulation status
  updateSimulationStatus(simulationId, status) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('simulation_status_update', {
        simulationId,
        status
      }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Send chat message
  sendMessage(message, simulationId = null, type = 'general') {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('send_message', {
        message,
        simulationId: simulationId || this.currentSimulation,
        type
      }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Start typing indicator
  startTyping(simulationId = null) {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit('typing_start', {
      simulationId: simulationId || this.currentSimulation
    });
  }

  // Stop typing indicator
  stopTyping(simulationId = null) {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit('typing_stop', {
      simulationId: simulationId || this.currentSimulation
    });
  }

  // Request live data
  requestLiveData(type, simulationId = null) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Not connected to socket server'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('request_live_data', {
        type,
        simulationId: simulationId || this.currentSimulation
      }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Event listener management
  on(event, callback) {
    this.eventListeners.set(event, callback);
  }

  off(event) {
    this.eventListeners.delete(event);
  }

  emit(event, data) {
    const callback = this.eventListeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  // Get connection status
  isConnected() {
    return this.connected;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Get current simulation
  getCurrentSimulation() {
    return this.currentSimulation;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
