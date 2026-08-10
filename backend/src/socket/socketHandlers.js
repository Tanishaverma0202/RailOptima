import jwt from 'jsonwebtoken';
import User from '../database/models/User.js';
import { logger } from '../utils/logger.js';
import ConflictDetectionEngine from '../algorithms/conflictDetection.js';

const connectedUsers = new Map();
const simulationRooms = new Map();

export const initializeSocketHandlers = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || user.status !== 'active') {
        return next(new Error('Invalid or inactive user'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Store user connection
    connectedUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their role-based room
    socket.join(`role_${socket.user.role}`);
    socket.join(`user_${socket.user._id}`);

    // Handle joining simulation rooms
    socket.on('join_simulation', (simulationId) => {
      if (socket.user.hasPermission('view_dashboard')) {
        socket.join(`simulation_${simulationId}`);
        
        if (!simulationRooms.has(simulationId)) {
          simulationRooms.set(simulationId, new Set());
        }
        simulationRooms.get(simulationId).add(socket.user._id);
        
        logger.info(`User ${socket.user.username} joined simulation ${simulationId}`);
        
        socket.emit('joined_simulation', { simulationId });
      } else {
        socket.emit('error', { message: 'Permission denied' });
      }
    });

    // Handle leaving simulation rooms
    socket.on('leave_simulation', (simulationId) => {
      socket.leave(`simulation_${simulationId}`);
      
      if (simulationRooms.has(simulationId)) {
        simulationRooms.get(simulationId).delete(socket.user._id);
        if (simulationRooms.get(simulationId).size === 0) {
          simulationRooms.delete(simulationId);
        }
      }
      
      logger.info(`User ${socket.user.username} left simulation ${simulationId}`);
      socket.emit('left_simulation', { simulationId });
    });

    // Handle real-time train position updates
    socket.on('update_train_position', async (data) => {
      try {
        if (!socket.user.hasPermission('override_schedule')) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { trainId, position, simulationId } = data;
        
        // Update train position in database
        const Train = (await import('../database/models/Train.js')).default;
        const train = await Train.findById(trainId);
        
        if (train) {
          train.currentPosition = { ...train.currentPosition, ...position };
          await train.save();

          // Broadcast to simulation room
          if (simulationId) {
            io.to(`simulation_${simulationId}`).emit('train_position_updated', {
              trainId,
              position: train.currentPosition,
              updatedBy: socket.user.username,
              timestamp: new Date()
            });
          }

          logger.info(`Train position updated: ${trainId} by ${socket.user.username}`);
        }
      } catch (error) {
        logger.error(`Error updating train position: ${error.message}`);
        socket.emit('error', { message: 'Failed to update train position' });
      }
    });

    // Handle conflict resolution
    socket.on('resolve_conflict', async (data) => {
      try {
        if (!socket.user.hasPermission('manage_conflicts')) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { conflictId, resolution, simulationId } = data;
        
        const conflictEngine = new ConflictDetectionEngine();
        const resolvedConflict = await conflictEngine.resolveConflict(conflictId, resolution);

        // Broadcast to simulation room
        if (simulationId) {
          io.to(`simulation_${simulationId}`).emit('conflict_resolved', {
            conflict: resolvedConflict,
            resolvedBy: socket.user.username,
            timestamp: new Date()
          });
        }

        logger.info(`Conflict resolved: ${conflictId} by ${socket.user.username}`);
      } catch (error) {
        logger.error(`Error resolving conflict: ${error.message}`);
        socket.emit('error', { message: 'Failed to resolve conflict' });
      }
    });

    // Handle schedule updates
    socket.on('update_schedule', async (data) => {
      try {
        if (!socket.user.hasPermission('override_schedule')) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { scheduleId, updates, simulationId } = data;
        
        const Schedule = (await import('../database/models/Schedule.js')).default;
        const schedule = await Schedule.findByIdAndUpdate(
          scheduleId,
          updates,
          { new: true }
        ).populate(['train', 'track']);

        if (schedule) {
          // Broadcast to simulation room
          if (simulationId) {
            io.to(`simulation_${simulationId}`).emit('schedule_updated', {
              schedule,
              updatedBy: socket.user.username,
              timestamp: new Date()
            });
          }

          logger.info(`Schedule updated: ${scheduleId} by ${socket.user.username}`);
        }
      } catch (error) {
        logger.error(`Error updating schedule: ${error.message}`);
        socket.emit('error', { message: 'Failed to update schedule' });
      }
    });

    // Handle simulation status updates
    socket.on('simulation_status_update', async (data) => {
      try {
        if (!socket.user.hasPermission('run_simulation')) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { simulationId, status } = data;
        
        const Simulation = (await import('../database/models/Simulation.js')).default;
        const simulation = await Simulation.findByIdAndUpdate(
          simulationId,
          { status },
          { new: true }
        );

        if (simulation) {
          // Broadcast to simulation room
          io.to(`simulation_${simulationId}`).emit('simulation_status_updated', {
            simulationId,
            status,
            updatedBy: socket.user.username,
            timestamp: new Date()
          });

          logger.info(`Simulation status updated: ${simulationId} -> ${status} by ${socket.user.username}`);
        }
      } catch (error) {
        logger.error(`Error updating simulation status: ${error.message}`);
        socket.emit('error', { message: 'Failed to update simulation status' });
      }
    });

    // Handle real-time chat (for collaboration)
    socket.on('send_message', (data) => {
      const { message, simulationId, type = 'general' } = data;
      
      const messageData = {
        id: Date.now().toString(),
        user: {
          id: socket.user._id,
          username: socket.user.username,
          role: socket.user.role
        },
        message,
        type,
        timestamp: new Date()
      };

      // Broadcast to appropriate room
      if (simulationId) {
        io.to(`simulation_${simulationId}`).emit('new_message', messageData);
      } else {
        io.to(`role_${socket.user.role}`).emit('new_message', messageData);
      }

      logger.info(`Message sent by ${socket.user.username}: ${message}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { simulationId } = data;
      const room = simulationId ? `simulation_${simulationId}` : `role_${socket.user.role}`;
      
      socket.to(room).emit('user_typing', {
        user: socket.user.username,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { simulationId } = data;
      const room = simulationId ? `simulation_${simulationId}` : `role_${socket.user.role}`;
      
      socket.to(room).emit('user_typing', {
        user: socket.user.username,
        isTyping: false
      });
    });

    // Handle live data requests
    socket.on('request_live_data', async (data) => {
      try {
        const { type, simulationId } = data;
        
        let liveData;
        
        switch (type) {
          case 'trains':
            const Train = (await import('../database/models/Train.js')).default;
            liveData = await Train.find({ status: 'ACTIVE' })
              .populate('currentPosition.stationId', 'name code')
              .populate('currentPosition.trackId', 'name');
            break;
            
          case 'conflicts':
            const Conflict = (await import('../database/models/Conflict.js')).default;
            liveData = await Conflict.find({ 
              simulationId: simulationId || { $exists: false },
              status: 'ACTIVE'
            })
            .populate('trains.train', 'name number')
            .populate('track', 'name');
            break;
            
          case 'schedules':
            const Schedule = (await import('../database/models/Schedule.js')).default;
            liveData = await Schedule.find({ 
              simulationId: simulationId || { $exists: false },
              status: { $in: ['SCHEDULED', 'IN_TRANSIT'] }
            })
            .populate('train', 'name number priority')
            .populate('track', 'name');
            break;
            
          default:
            liveData = { message: 'Unknown data type requested' };
        }

        socket.emit('live_data', {
          type,
          data: liveData,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error(`Error fetching live data: ${error.message}`);
        socket.emit('error', { message: 'Failed to fetch live data' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.username} (${socket.id})`);
      
      // Remove user from connected users
      connectedUsers.delete(socket.user._id.toString());
      
      // Remove user from simulation rooms
      for (const [simulationId, users] of simulationRooms.entries()) {
        users.delete(socket.user._id);
        if (users.size === 0) {
          simulationRooms.delete(simulationId);
        }
      }

      // Notify other users about disconnection
      socket.broadcast.emit('user_disconnected', {
        user: {
          id: socket.user._id,
          username: socket.user.username
        },
        timestamp: new Date()
      });
    });

    // Send initial connection confirmation
    socket.emit('connected', {
      user: {
        id: socket.user._id,
        username: socket.user.username,
        role: socket.user.role,
        permissions: socket.user.permissions
      },
      timestamp: new Date()
    });
  });

  // Periodic data broadcasting - disabled for mock mode
// setInterval(async () => {
//   try {
//     // Broadcast active conflicts to all simulation rooms
//     const Conflict = (await import('../database/models/Conflict.js')).default;
//     const activeConflicts = await Conflict.find({ status: 'ACTIVE' })
//       .populate('trains.train', 'name number')
//       .populate('track', 'name');

//     for (const [simulationId, users] of simulationRooms.entries()) {
//       const simConflicts = activeConflicts.filter(c => 
//         c.simulationId === simulationId || !c.simulationId
//       );
      
//       io.to(`simulation_${simulationId}`).emit('active_conflicts_update', {
//         conflicts: simConflicts,
//         timestamp: new Date()
//       });
//     }

//     // Broadcast system status to all connected users
//     const systemStatus = await getSystemStatus();
//     io.emit('system_status_update', systemStatus);
    
//   } catch (error) {
//     logger.error(`Error in periodic broadcast: ${error.message}`);
//   }
// }, 30000); // Every 30 seconds
};

// Helper function to get system status
async function getSystemStatus() {
  try {
    // Return mock status for demo mode
    return {
      connectedUsers: connectedUsers.size,
      activeSimulations: simulationRooms.size,
      activeTrains: 2,
      activeTracks: 1,
      activeStations: 2,
      activeSchedules: 0,
      activeConflicts: 0,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error(`Error getting system status: ${error.message}`);
    return {
      error: 'Failed to get system status',
      timestamp: new Date()
    };
  }
}

// Utility functions for external use
export const broadcastToSimulation = (io, simulationId, event, data) => {
  io.to(`simulation_${simulationId}`).emit(event, {
    ...data,
    timestamp: new Date()
  });
};

export const broadcastToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, {
    ...data,
    timestamp: new Date()
  });
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values()).map(conn => ({
    socketId: conn.socketId,
    user: {
      id: conn.user._id,
      username: conn.user.username,
      role: conn.user.role
    },
    connectedAt: conn.connectedAt
  }));
};

export const getSimulationUsers = (simulationId) => {
  const userIds = simulationRooms.get(simulationId) || new Set();
  return Array.from(userIds).map(userId => {
    const connection = connectedUsers.get(userId);
    return connection ? {
      id: connection.user._id,
      username: connection.user.username,
      role: connection.user.role,
      connectedAt: connection.connectedAt
    } : null;
  }).filter(Boolean);
};
