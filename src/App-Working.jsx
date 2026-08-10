import React, { useState, useEffect } from 'react';

// Mock authentication context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('railoptima_token');
    if (token) {
      // Mock user data
      setUser({
        _id: '1',
        username: 'admin',
        email: 'admin@railoptima.com',
        role: 'admin',
        permissions: ['view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks', 'run_simulation', 'view_analytics', 'manage_conflicts', 'admin_access'],
        profile: { firstName: 'Admin', lastName: 'User' }
      });
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login
    if ((email === 'admin@railoptima.com' && password === 'admin123') ||
        (email === 'operator1@railoptima.com' && password === 'operator123') ||
        (email === 'analyst1@railoptima.com' && password === 'analyst123')) {
      
      const userData = {
        _id: '1',
        username: email.split('@')[0],
        email: email,
        role: email === 'admin@railoptima.com' ? 'admin' : email === 'operator1@railoptima.com' ? 'operator' : 'analyst',
        permissions: ['view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks', 'run_simulation', 'view_analytics', 'manage_conflicts'],
        profile: { firstName: 'Demo', lastName: 'User' }
      };
      
      localStorage.setItem('railoptima_token', 'mock-token');
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('railoptima_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Role Selection Component
const RoleSelection = () => {
  const { login } = React.useContext(AuthContext);

  const selectRole = (role) => {
    const credentials = {
      admin: { email: 'admin@railoptima.com', password: 'admin123' },
      operator: { email: 'operator1@railoptima.com', password: 'operator123' },
      analyst: { email: 'analyst1@railoptima.com', password: 'analyst123' }
    };
    
    login(credentials[role].email, credentials[role].password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '600px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ fontSize: '36px', color: 'white' }}>🚂</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px' }}>
            RailOptima
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: '0' }}>
            Railway Optimization System
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '8px 0 0' }}>
            Select your role to continue
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Admin Role */}
          <button
            onClick={() => selectRole('admin')}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '24px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '32px' }}>👑</span>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Administrator</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Full System Access</div>
          </button>

          {/* Operator Role */}
          <button
            onClick={() => selectRole('operator')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '24px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '32px' }}>🚂</span>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Operator</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Train Management</div>
          </button>

          {/* Analyst Role */}
          <button
            onClick={() => selectRole('analyst')}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '24px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(16, 185, 129, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '32px' }}>📊</span>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Analyst</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Analytics & Reports</div>
          </button>
        </div>

        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '12px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Role Permissions:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'left' }}>
            <div>
              <strong>👑 Admin:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Full access</li>
                <li>User management</li>
                <li>System settings</li>
              </ul>
            </div>
            <div>
              <strong>🚂 Operator:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Train control</li>
                <li>Schedule management</li>
                <li>Conflict resolution</li>
              </ul>
            </div>
            <div>
              <strong>📊 Analyst:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>View reports</li>
                <li>Performance metrics</li>
                <li>Data analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [trains] = useState([
    { _id: 'T01', name: 'Howrah Rajdhani', status: 'ACTIVE', delay: 0, priority: 'HIGH' },
    { _id: 'T02', name: 'Mumbai Rajdhani', status: 'ACTIVE', delay: 5, priority: 'HIGH' }
  ]);
  const [stations] = useState([
    { _id: 'S1', name: 'New Delhi', code: 'NDLS', dailyTrains: 180 },
    { _id: 'S2', name: 'Mumbai Central', code: 'MMCT', dailyTrains: 140 }
  ]);

  // Get role-specific tabs
  const getAvailableTabs = () => {
    const baseTabs = ['overview'];
    
    switch(user?.role) {
      case 'admin':
        return [...baseTabs, 'trains', 'stations', 'users', 'settings', 'analytics'];
      case 'operator':
        return [...baseTabs, 'trains', 'stations', 'conflicts', 'simulation'];
      case 'analyst':
        return [...baseTabs, 'analytics', 'reports', 'performance'];
      default:
        return baseTabs;
    }
  };

  const availableTabs = getAvailableTabs();

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
            <span style={{ fontSize: '20px', color: 'white' }}>🚂</span>
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
          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: user?.role === 'admin' ? '#fef2f2' : 
                           user?.role === 'operator' ? '#eff6ff' : 
                           '#f0fdf4',
            color: user?.role === 'admin' ? '#dc2626' : 
                   user?.role === 'operator' ? '#2563eb' : 
                   '#16a34a'
          }}>
            {user?.role === 'admin' ? '👑 Administrator' : 
             user?.role === 'operator' ? '🚂 Operator' : 
             '📊 Analyst'}
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
              cursor: 'pointer'
            }}
          >
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
          {availableTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 0',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab ? '#3b82f6' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: '24px' }}>
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                  {trains.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Active Trains</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                  {stations.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Stations</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                  98%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Efficiency</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                  {user?.role === 'admin' ? 'Full' : user?.role === 'operator' ? 'High' : 'Read'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Access Level</div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                Welcome, {user?.username}! 
                <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                  ({user?.role} mode)
                </span>
              </h2>
              <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
                🎉 RailOptima Railway System is running successfully!
                <br />
                <br />
                <strong>Your available features:</strong>
                <br />
                {user?.role === 'admin' && 'Full system management, user control, settings, analytics'}
                {user?.role === 'operator' && 'Train management, scheduling, conflict resolution'}
                {user?.role === 'analyst' && 'Performance analytics, reports, data analysis'}
                <br />
                <br />
                Backend: http://localhost:5000 | Frontend: http://localhost:5173
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trains' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              🚂 Train Fleet Management
              <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                ({user?.role} access)
              </span>
            </h2>
            {trains.map(train => (
              <div key={train._id} style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {train.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Priority: {train.priority}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: train.delay === 0 ? '#f0fdf4' : '#fef2f2',
                    color: train.delay === 0 ? '#16a34a' : '#dc2626',
                    fontWeight: '500'
                  }}>
                    {train.delay === 0 ? 'On Time' : `${train.delay} min delay`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stations' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              🏢 Railway Stations
              <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                ({user?.role} access)
              </span>
            </h2>
            {stations.map(station => (
              <div key={station._id} style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                  {station.name} ({station.code})
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Daily Trains: {station.dailyTrains}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && user?.role === 'admin' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              👥 User Management
            </h2>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              User management features coming soon...
              <br />
              Admin-only functionality for managing system users.
            </div>
          </div>
        )}

        {activeTab === 'settings' && user?.role === 'admin' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              ⚙️ System Settings
            </h2>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              System configuration features coming soon...
              <br />
              Admin-only functionality for system settings and configuration.
            </div>
          </div>
        )}

        {activeTab === 'conflicts' && user?.role === 'operator' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              ⚠️ Conflict Resolution
            </h2>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              Conflict management features coming soon...
              <br />
              Operator functionality for resolving train scheduling conflicts.
            </div>
          </div>
        )}

        {activeTab === 'simulation' && user?.role === 'operator' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              🎮 Simulation Control
            </h2>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              Railway simulation features coming soon...
              <br />
              Operator functionality for running optimization simulations.
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              📊 Analytics Dashboard
            </h2>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              Advanced analytics features coming soon...
              <br />
              {user?.role === 'admin' && 'Admin: Full system analytics and reports'}
              {user?.role === 'operator' && 'Operator: Performance metrics and operational analytics'}
              {user?.role === 'analyst' && 'Analyst: Deep data analysis and reporting tools'}
            </div>
          </div>
        )}

        {activeTab === 'reports' && user?.role === 'analyst' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              📈 Reports & Analysis
            </h2>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              Advanced reporting features coming soon...
              <br />
              Analyst-specific reporting and data analysis tools.
            </div>
          </div>
        )}

        {activeTab === 'performance' && user?.role === 'analyst' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              📊 Performance Metrics
            </h2>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              Performance monitoring features coming soon...
              <br />
              Analyst tools for detailed performance analysis.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('railoptima_token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ marginTop: '16px', color: '#6b7280' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      {isAuthenticated ? <Dashboard /> : <RoleSelection />}
    </AuthProvider>
  );
}

export default App;
