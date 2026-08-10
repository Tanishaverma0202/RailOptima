// Custom hook for railway data management

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.js';

export const useRailwayData = () => {
  const [trains, setTrains] = useState([]);
  const [stations, setStations] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic data fetcher
  const fetchData = useCallback(async (fetcher, setter, errorMessage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetcher();
      if (response.success) {
        setter(response.data.trains || response.data.stations || response.data.tracks || 
               response.data.schedules || response.data.simulations || response.data.conflicts || response.data);
      } else {
        throw new Error(response.message || errorMessage);
      }
    } catch (err) {
      setError(err.message);
      console.error(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trains
  const fetchTrains = useCallback(async (params = {}) => {
    return fetchData(
      () => apiService.getTrains(params),
      setTrains,
      'Failed to fetch trains'
    );
  }, [fetchData]);

  const createTrain = useCallback(async (trainData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createTrain(trainData);
      if (response.success) {
        setTrains(prev => [...prev, response.data.train]);
        return response.data.train;
      } else {
        throw new Error(response.message || 'Failed to create train');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTrain = useCallback(async (id, trainData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.updateTrain(id, trainData);
      if (response.success) {
        setTrains(prev => prev.map(train => 
          train._id === id ? response.data.train : train
        ));
        return response.data.train;
      } else {
        throw new Error(response.message || 'Failed to update train');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTrain = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteTrain(id);
      setTrains(prev => prev.filter(train => train._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Stations
  const fetchStations = useCallback(async (params = {}) => {
    return fetchData(
      () => apiService.getStations(params),
      setStations,
      'Failed to fetch stations'
    );
  }, [fetchData]);

  const createStation = useCallback(async (stationData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createStation(stationData);
      if (response.success) {
        setStations(prev => [...prev, response.data.station]);
        return response.data.station;
      } else {
        throw new Error(response.message || 'Failed to create station');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStation = useCallback(async (id, stationData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.updateStation(id, stationData);
      if (response.success) {
        setStations(prev => prev.map(station => 
          station._id === id ? response.data.station : station
        ));
        return response.data.station;
      } else {
        throw new Error(response.message || 'Failed to update station');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tracks
  const fetchTracks = useCallback(async (params = {}) => {
    return fetchData(
      () => apiService.getTracks(params),
      setTracks,
      'Failed to fetch tracks'
    );
  }, [fetchData]);

  const createTrack = useCallback(async (trackData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createTrack(trackData);
      if (response.success) {
        setTracks(prev => [...prev, response.data.track]);
        return response.data.track;
      } else {
        throw new Error(response.message || 'Failed to create track');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTrack = useCallback(async (id, trackData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.updateTrack(id, trackData);
      if (response.success) {
        setTracks(prev => prev.map(track => 
          track._id === id ? response.data.track : track
        ));
        return response.data.track;
      } else {
        throw new Error(response.message || 'Failed to update track');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Schedules
  const fetchSchedules = useCallback(async (params = {}) => {
    return fetchData(
      () => apiService.getSchedules(params),
      setSchedules,
      'Failed to fetch schedules'
    );
  }, [fetchData]);

  const createSchedule = useCallback(async (scheduleData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createSchedule(scheduleData);
      if (response.success) {
        setSchedules(prev => [...prev, response.data.schedule]);
        return response.data.schedule;
      } else {
        throw new Error(response.message || 'Failed to create schedule');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSchedule = useCallback(async (id, scheduleData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.updateSchedule(id, scheduleData);
      if (response.success) {
        setSchedules(prev => prev.map(schedule => 
          schedule._id === id ? response.data.schedule : schedule
        ));
        return response.data.schedule;
      } else {
        throw new Error(response.message || 'Failed to update schedule');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Simulations
  const fetchSimulations = useCallback(async (params = {}) => {
    return fetchData(
      () => apiService.getSimulations(params),
      setSimulations,
      'Failed to fetch simulations'
    );
  }, [fetchData]);

  const createSimulation = useCallback(async (simulationData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createSimulation(simulationData);
      if (response.success) {
        setSimulations(prev => [...prev, response.data.simulation]);
        return response.data.simulation;
      } else {
        throw new Error(response.message || 'Failed to create simulation');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.runSimulation(id);
      if (response.success) {
        setSimulations(prev => prev.map(sim => 
          sim._id === id ? response.data.simulation : sim
        ));
        return response.data.simulation;
      } else {
        throw new Error(response.message || 'Failed to run simulation');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Conflicts
  const fetchConflicts = useCallback(async (simulationId) => {
    return fetchData(
      () => apiService.getActiveConflicts(simulationId),
      setConflicts,
      'Failed to fetch conflicts'
    );
  }, [fetchData]);

  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.resolveConflict(conflictId, resolution);
      if (response.success) {
        setConflicts(prev => prev.map(conflict => 
          conflict._id === conflictId ? response.data.conflict : conflict
        ));
        return response.data.conflict;
      } else {
        throw new Error(response.message || 'Failed to resolve conflict');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Map data
  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [stationsResponse, tracksResponse] = await Promise.all([
        apiService.getStationsForMap(),
        apiService.getTracksForMap()
      ]);

      if (stationsResponse.success && tracksResponse.success) {
        return {
          stations: stationsResponse.data.stations,
          tracks: tracksResponse.data.tracks
        };
      } else {
        throw new Error('Failed to fetch map data');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Statistics
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [trainStats, stationStats, trackStats, scheduleStats] = await Promise.all([
        apiService.getTrainStats(),
        apiService.getStationStats(),
        apiService.getTrackStats(),
        apiService.getScheduleStats()
      ]);

      return {
        trains: trainStats.success ? trainStats.data.summary : {},
        stations: stationStats.success ? stationStats.data.summary : {},
        tracks: trackStats.success ? trackStats.data.summary : {},
        schedules: scheduleStats.success ? scheduleStats.data.summary : {}
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchTrains(),
      fetchStations(),
      fetchTracks(),
      fetchSchedules(),
      fetchSimulations()
    ]);
  }, [fetchTrains, fetchStations, fetchTracks, fetchSchedules, fetchSimulations]);

  return {
    // Data
    trains,
    stations,
    tracks,
    schedules,
    simulations,
    conflicts,
    loading,
    error,

    // Train methods
    fetchTrains,
    createTrain,
    updateTrain,
    deleteTrain,

    // Station methods
    fetchStations,
    createStation,
    updateStation,

    // Track methods
    fetchTracks,
    createTrack,
    updateTrack,

    // Schedule methods
    fetchSchedules,
    createSchedule,
    updateSchedule,

    // Simulation methods
    fetchSimulations,
    createSimulation,
    runSimulation,

    // Conflict methods
    fetchConflicts,
    resolveConflict,

    // Utility methods
    fetchMapData,
    fetchStats,
    clearError,
    refreshAll
  };
};

export default useRailwayData;
