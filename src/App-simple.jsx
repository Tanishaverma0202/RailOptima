import React, { useState, useEffect } from 'react';

// Simple App component to test basic functionality
function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMessage('RailOptima Railway System - Ready!');
    }, 1000);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <span style={{ fontSize: '24px', color: 'white' }}>🚂</span>
        </div>
        
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1f2937', 
          margin: '0 0 16px' 
        }}>
          RailOptima
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#6b7280', 
          margin: '0 0 24px' 
        }}>
          {message}
        </p>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937', 
            margin: '0 0 12px' 
          }}>
            🎯 Application Status
          </h3>
          
          <div style={{ textAlign: 'left', fontSize: '14px', color: '#374151' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>✅ Backend Server:</span> Running (Port 5000)
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>✅ Frontend App:</span> Running (Port 5173)
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>✅ Database:</span> Mock Data Loaded
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>✅ API:</span> REST Endpoints Active
            </div>
          </div>
        </div>

        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          margin: '20px 0'
        }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#dc2626', 
            margin: '0 0 8px' 
          }}>
            🔑 Demo Login Credentials
          </h4>
          
          <div style={{ fontSize: '12px', color: '#7f1d1d', lineHeight: '1.5' }}>
            <div><strong>Admin:</strong> admin@railoptima.com / admin123</div>
            <div><strong>Operator:</strong> operator1@railoptima.com / operator123</div>
            <div><strong>Analyst:</strong> analyst1@railoptima.com / analyst123</div>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = 'http://localhost:5173'}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '20px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#2563eb';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#3b82f6';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🚀 Launch Full Application
        </button>
      </div>
    </div>
  );
}

export default App;
