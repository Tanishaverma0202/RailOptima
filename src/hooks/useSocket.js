// Custom hook for Socket.IO integration

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import socketService from '../services/socket.js';

export const useSocket = (simulationId = null) => {
  const { isAuthenticated, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [liveData, setLiveData] = useState({});
  const [activeConflicts, setActiveConflicts] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && !connected) {
      socketService.connect()
        .then(() => {
          setConnected(true);
        })
        .catch((error) => {
          console.error('Socket connection failed:', error);
        });
    }

    return () => {
      if (connected) {
        socketService.disconnect();
        setConnected(false);
      }
    };
  }, [isAuthenticated, connected]);

  // Join/leave simulation room
  useEffect(() => {
    if (connected && simulationId && simulationId !== currentSimulation) {
      // Leave current simulation if any
      if (currentSimulation) {
        socketService.leaveSimulation(currentSimulation);
      }

      // Join new simulation
      socketService.joinSimulation(simulationId)
        .then(() => {
          setCurrentSimulation(simulationId);
        })
        .catch((error) => {
          console.error('Failed to join simulation:', error);
        });
    }

    return () => {
      if (currentSimulation) {
        socketService.leaveSimulation(currentSimulation);
        setCurrentSimulation(null);
      }
    };
  }, [connected, simulationId, currentSimulation]);

  // Setup event listeners
  useEffect(() => {
    if (!connected) return;

    // Train position updates
    socketService.on('train_position_updated', (data) => {
      // Handle train position updates
      console.log('Train position updated:', data);
    });

    // Conflict resolution
    socketService.on('conflict_resolved', (data) => {
      // Handle conflict resolution
      console.log('Conflict resolved:', data);
    });

    // Schedule updates
    socketService.on('schedule_updated', (data) => {
      // Handle schedule updates
      console.log('Schedule updated:', data);
    });

    // Simulation status updates
    socketService.on('simulation_status_updated', (data) => {
      // Handle simulation status updates
      console.log('Simulation status updated:', data);
    });

    // Chat messages
    socketService.on('new_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // Typing indicators
    socketService.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const newTypingUsers = new Set(prev);
        if (data.isTyping) {
          newTypingUsers.add(data.user);
        } else {
          newTypingUsers.delete(data.user);
        }
        return newTypingUsers;
      });
    });

    // Live data updates
    socketService.on('live_data', (data) => {
      setLiveData(prev => ({
        ...prev,
        [data.type]: data.data
      }));
    });

    // Active conflicts updates
    socketService.on('active_conflicts_update', (data) => {
      setActiveConflicts(data.conflicts);
    });

    // System status updates
    socketService.on('system_status_update', (data) => {
      setSystemStatus(data);
    });

    // User connection events
    socketService.on('user_disconnected', (data) => {
      console.log('User disconnected:', data);
    });

    // Error handling
    socketService.on('socket_error', (data) => {
      console.error('Socket error:', data);
    });

    return () => {
      // Clean up event listeners
      socketService.off('train_position_updated');
      socketService.off('conflict_resolved');
      socketService.off('schedule_updated');
      socketService.off('simulation_status_updated');
      socketService.off('new_message');
      socketService.off('user_typing');
      socketService.off('live_data');
      socketService.off('active_conflicts_update');
      socketService.off('system_status_update');
      socketService.off('user_disconnected');
      socketService.off('socket_error');
    };
  }, [connected]);

  // Update train position
  const updateTrainPosition = useCallback(async (trainId, position) => {
    try {
      await socketService.updateTrainPosition(trainId, position, simulationId);
    } catch (error) {
      console.error('Failed to update train position:', error);
      throw error;
    }
  }, [simulationId]);

  // Resolve conflict
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      await socketService.resolveConflict(conflictId, resolution, simulationId);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }, [simulationId]);

  // Update schedule
  const updateSchedule = useCallback(async (scheduleId, updates) => {
    try {
      await socketService.updateSchedule(scheduleId, updates, simulationId);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  }, [simulationId]);

  // Update simulation status
  const updateSimulationStatus = useCallback(async (simId, status) => {
    try {
      await socketService.updateSimulationStatus(simId, status);
    } catch (error) {
      console.error('Failed to update simulation status:', error);
      throw error;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (message, type = 'general') => {
    try {
      await socketService.sendMessage(message, simulationId, type);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [simulationId]);

  // Typing indicators
  const startTyping = useCallback(() => {
    socketService.startTyping(simulationId);
  }, [simulationId]);

  const stopTyping = useCallback(() => {
    socketService.stopTyping(simulationId);
  }, [simulationId]);

  // Request live data
  const requestLiveData = useCallback(async (type) => {
    try {
      await socketService.requestLiveData(type, simulationId);
    } catch (error) {
      console.error('Failed to request live data:', error);
      throw error;
    }
  }, [simulationId]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    connected,
    currentSimulation,
    messages,
    typingUsers,
    liveData,
    activeConflicts,
    systemStatus,
    updateTrainPosition,
    resolveConflict,
    updateSchedule,
    updateSimulationStatus,
    sendMessage,
    startTyping,
    stopTyping,
    requestLiveData,
    clearMessages
  };
};

export default useSocket;
