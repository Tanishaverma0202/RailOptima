// Dashboard component with backend integration

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useSocket } from '../hooks/useSocket.js';
import { useRailwayData } from '../hooks/useRailwayData.js';
import {
  Train, Trophy, Clock, TrendingUp, AlertTriangle, CheckCircle,
  Play, RefreshCw, Map, Table, BarChart2, Settings,
  LogOut, Activity, Zap, Users, Gauge
} from 'lucide-react';

const KPICard = ({ title, value, unit, icon: Icon, color, trend }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </div>
      {trend && (
        <span style={{
          fontSize: '12px',
          color: trend > 0 ? '#10b981' : '#ef4444',
          fontWeight: '600'
        }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
      {value}{unit && <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '400' }}> {unit}</span>}
    </div>
    <div style={{ fontSize: '12px', color: '#6b7280' }}>{title}</div>
  </div>
);

const ConflictItem = ({ conflict, onResolve }) => (
  <div style={{
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    marginBottom: '12px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} color={conflict.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b'} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
          {conflict.type.replace('_', ' ')}
        </span>
      </div>
      <span style={{
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: conflict.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
        color: conflict.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b',
        fontWeight: '500'
      }}>
        {conflict.severity}
      </span>
    </div>
    
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
      {conflict.trains?.map(t => t.train?.name || `Train ${t.train}`).join(' vs ')}
    </div>
    
    {conflict.aiSuggestion && (
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '6px',
        padding: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '500', marginBottom: '4px' }}>
          AI Suggestion:
        </div>
        <div style={{ fontSize: '12px', color: '#0c4a6e' }}>
          {conflict.aiSuggestion.action} - {conflict.aiSuggestion.reason}
        </div>
      </div>
    )}
    
    <button
      onClick={() => onResolve(conflict._id)}
      style={{
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer'
      }}
    >
      Resolve
    </button>
  </div>
);

const TrainItem = ({ train }) => (
  <div style={{
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Train size={20} color="#3b82f6" />
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
          {train.name}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {train.origin} → {train.destination}
        </div>
      </div>
    </div>
    
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: train.performance.delay === 0 ? '#f0fdf4' : '#fef2f2',
        color: train.performance.delay === 0 ? '#16a34a' : '#dc2626',
        fontWeight: '500',
        marginBottom: '4px'
      }}>
        {train.performance.delay === 0 ? 'On Time' : `${train.performance.delay} min delay`}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>
        Priority: {train.priority}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, logout, hasPermission } = useAuth();
  const { 
    connected, 
    activeConflicts, 
    systemStatus, 
    resolveConflict,
    updateTrainPosition 
  } = useSocket();
  
  const {
    trains,
    stations,
    tracks,
    schedules,
    simulations,
    loading,
    error,
    fetchTrains,
    fetchStations,
    fetchTracks,
    fetchSchedules,
    fetchSimulations,
    fetchStats,
    createSimulation,
    runSimulation
  } = useRailwayData();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [currentSimulation, setCurrentSimulation] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchTrains(),
          fetchStations(),
          fetchTracks(),
          fetchSchedules(),
          fetchSimulations()
        ]);
        
        const statsData = await fetchStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!loading) {
        try {
          const statsData = await fetchStats();
          setStats(statsData);
        } catch (error) {
          console.error('Failed to refresh stats:', error);
        }
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loading, fetchStats]);

  const handleRunSimulation = async () => {
    try {
      const simulationData = {
        name: `Simulation ${new Date().toLocaleString()}`,
        description: 'AI-powered railway optimization',
        configuration: {
          algorithm: 'genetic',
          parameters: {
            populationSize: 100,
            generations: 50
          }
        }
      };

      const simulation = await createSimulation(simulationData);
      setCurrentSimulation(simulation);
      
      // Run the simulation
      await runSimulation(simulation._id);
      
      // Refresh simulations list
      await fetchSimulations();
    } catch (error) {
      console.error('Failed to run simulation:', error);
    }
  };

  const handleResolveConflict = async (conflictId) => {
    try {
      await resolveConflict(conflictId, {
        type: 'REASSIGNMENT',
        details: {
          reason: 'AI optimization suggestion'
        }
      });
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const handleTrainPositionUpdate = async (trainId, position) => {
    try {
      await updateTrainPosition(trainId, position);
    } catch (error) {
      console.error('Failed to update train position:', error);
    }
  };



  if (loading && trains.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '16px', color: '#6b7280' }}>Loading RailOptima...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Train size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: '0' }}>
              RailOptima Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
              Railway Optimization System
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? '#10b981' : '#ef4444'
            }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
              {user?.fullName || user?.username}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {user?.role}
            </div>
          </div>
          
          <button
            onClick={logout}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { id: 'overview', label: 'Overview', icon: Gauge },
            { id: 'trains', label: 'Trains', icon: Train },
            { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
            { id: 'simulation', label: 'Simulation', icon: Play },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 0',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: '24px' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <KPICard
                title="Active Trains"
                value={trains.filter(t => t.status === 'ACTIVE').length}
                icon={Train}
                color="#3b82f6"
              />
              <KPICard
                title="Active Conflicts"
                value={activeConflicts.length}
                icon={AlertTriangle}
                color="#ef4444"
              />
              <KPICard
                title="Stations"
                value={stations.length}
                icon={Map}
                color="#10b981"
              />
              <KPICard
                title="System Efficiency"
                value={stats.schedules?.avgPunctuality?.toFixed(1) || 0}
                unit="%"
                icon={TrendingUp}
                color="#f59e0b"
              />
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                Recent Activity
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                    Latest Trains
                  </h3>
                  {trains.slice(0, 3).map(train => (
                    <TrainItem key={train._id} train={train} />
                  ))}
                </div>
                
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                    Active Conflicts
                  </h3>
                  {activeConflicts.slice(0, 3).map(conflict => (
                    <ConflictItem key={conflict._id} conflict={conflict} onResolve={handleResolveConflict} />
                  ))}
                  {activeConflicts.length === 0 && (
                    <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                      No active conflicts
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trains Tab */}
        {activeTab === 'trains' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              Train Fleet
            </h2>
            {trains.map(train => (
              <TrainItem key={train._id} train={train} />
            ))}
          </div>
        )}

        {/* Conflicts Tab */}
        {activeTab === 'conflicts' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              Active Conflicts
            </h2>
            {activeConflicts.map(conflict => (
              <ConflictItem key={conflict._id} conflict={conflict} onResolve={handleResolveConflict} />
            ))}
            {activeConflicts.length === 0 && (
              <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
                No active conflicts detected
              </div>
            )}
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === 'simulation' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                AI Optimization Simulation
              </h2>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={loading}
                  style={{
                    background: loading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Play size={16} />
                  {loading ? 'Running...' : 'Run Simulation'}
                </button>
                
                <button
                  onClick={() => fetchSimulations()}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              {currentSimulation && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
                    Current Simulation: {currentSimulation.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#0c4a6e' }}>
                    Status: {currentSimulation.status}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                Simulation History
              </h3>
              {simulations.map(sim => (
                <div key={sim._id} style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {sim.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {sim.status} • Score: {sim.metrics?.kpis?.rewardScore?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: sim.status === 'COMPLETED' ? '#f0fdf4' : '#fffbeb',
                      color: sim.status === 'COMPLETED' ? '#16a34a' : '#f59e0b',
                      fontWeight: '500'
                    }}>
                      {sim.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              Performance Analytics
            </h2>
            
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              Advanced analytics features coming soon...
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
