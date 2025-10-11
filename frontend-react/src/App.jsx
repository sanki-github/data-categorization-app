import React, { useState, useEffect } from 'react'
import Health from './components/Health.jsx'
import Login from './components/Login.jsx'

export default function App(){
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const apiBase = import.meta.env.VITE_API_BASE || '';
  
  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (currentView === 'dashboard' && user) {
    return (
      <main style={{fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 900, margin: '32px auto'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Data Categorization Dashboard</h1>
          <div>
            <span style={{ marginRight: '16px' }}>Welcome, {user.email}</span>
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <Health />

        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          backgroundColor: 'white'
        }}>
          <h3>Application Features</h3>
          <ul>
            <li>✅ User authentication system</li>
            <li>✅ Backend API connection</li>
            <li>✅ Health monitoring</li>
            <li>🔄 Item management (coming soon)</li>
            <li>🔄 Category assignment (coming soon)</li>
            <li>🔄 Bulk CSV/XLSX upload (coming soon)</li>
          </ul>
        </div>

        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          backgroundColor: '#e8f4fd'
        }}>
          <h3>🎉 Deployment Success!</h3>
          <p><strong>Frontend:</strong> React SPA on AWS S3</p>
          <p><strong>Backend:</strong> Node.js Lambda with API Gateway</p>
          <p><strong>API Base:</strong> <code>{apiBase}</code></p>
          <p><strong>Status:</strong> Both frontend and backend are live and connected!</p>
        </div>
      </main>
    );
  }
  
  return (
    <main style={{fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 900, margin: '32px auto'}}>
      <h1>Data Categorization Application</h1>
      <p>🎉 Successfully deployed to AWS with serverless architecture!</p>
      
      <Health />
      
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        backgroundColor: 'white'
      }}>
        <h3>Get Started</h3>
        <p>This React frontend is now connected to the live backend API.</p>
        <button
          onClick={() => setCurrentView('login')}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '12px'
          }}
        >
          Login to Dashboard
        </button>
      </div>
      
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        backgroundColor: '#f8f9fa'
      }}>
        <h3>Application Features</h3>
        <ul>
          <li>User registration, login, and password reset</li>
          <li>Item management with category assignment</li>
          <li>Bulk CSV/XLSX upload processing</li>
          <li>Role-based access control (annotator/admin)</li>
          <li>Audit trails and per-row reporting</li>
        </ul>
      </div>
      
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        backgroundColor: '#e8f4fd'
      }}>
        <h3>Architecture</h3>
        <p><strong>Backend:</strong> Node.js + Express running on AWS Lambda</p>
        <p><strong>Frontend:</strong> React + Vite hosted on AWS S3</p>
        <p><strong>API Gateway:</strong> RESTful API routing</p>
        <p><strong>Database:</strong> SQLite with migration system</p>
        <p><strong>API Endpoint:</strong> <code>{apiBase || 'Not configured'}</code></p>
      </div>
      
      <p>
        <a href="https://github.com/your-repo" target="_blank" style={{color: '#0066cc'}}>
          View source code on GitHub →
        </a>
      </p>
    </main>
  )
}