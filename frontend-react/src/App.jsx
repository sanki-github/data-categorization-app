import React, { useState, useEffect } from 'react'
import Health from './components/Health.jsx'
import Login from './components/Login.jsx'
import config from './config.js'

export default function App(){
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const apiBase = config.API_BASE_URL;
  
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
          <h1>🚀 Data Categorization Dashboard</h1>
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
          <h3>🎉 Azure Deployment Success!</h3>
          <p><strong>Frontend:</strong> React SPA on Azure Static Web Apps</p>
          <p><strong>Backend:</strong> Node.js Express on Azure Container Apps</p>
          <p><strong>API Base:</strong> <code>{apiBase}</code></p>
          <p><strong>Status:</strong> Both frontend and backend are live and connected!</p>
        </div>
      </main>
    );
  }
  
  return (
    <main style={{fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 900, margin: '32px auto'}}>
      <h1>🚀 Data Categorization Application</h1>
      <p>✨ Successfully deployed to Azure Cloud with modern architecture!</p>
      
      <Health />
      
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        backgroundColor: 'white'
      }}>
        <h3>Get Started</h3>
        <p>This React frontend is now connected to the live Azure backend API.</p>
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
        <h3>🎉 Azure Cloud Architecture</h3>
        <p><strong>Backend:</strong> Node.js Express on Azure Container Apps</p>
        <p><strong>Frontend:</strong> React SPA on Azure Static Web Apps</p>
        <p><strong>Container Registry:</strong> Azure Container Registry</p>
        <p><strong>CI/CD:</strong> GitHub Actions</p>
        <p><strong>API Endpoint:</strong> <code>{apiBase || 'Not configured'}</code></p>
        <p><strong>Status:</strong> Both frontend and backend are live and connected!</p>
      </div>
      
      <p>
        <a href="https://github.com/sanki-github/data-categorization-app" target="_blank" style={{color: '#0066cc'}}>
          View source code on GitHub →
        </a>
      </p>
    </main>
  )
}