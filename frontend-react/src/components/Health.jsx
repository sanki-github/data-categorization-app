import React, { useState, useEffect } from 'react';

export default function Health() {
  const [healthStatus, setHealthStatus] = useState('checking...');
  const [backendInfo, setBackendInfo] = useState(null);
  const [error, setError] = useState(null);

  const apiBase = import.meta.env.VITE_API_BASE || '';

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setHealthStatus('checking...');
      setError(null);
      
      const response = await fetch(`${apiBase}/health`);
      if (response.ok) {
        const data = await response.json();
        setHealthStatus('healthy');
        setBackendInfo(data);
      } else {
        setHealthStatus('unhealthy');
        setError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setHealthStatus('error');
      setError(err.message);
    }
  };

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return '#28a745';
      case 'unhealthy': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      backgroundColor: '#f8f9fa'
    }}>
      <h3>Backend Health Status</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(),
          marginRight: '8px'
        }}></div>
        <strong>Status: {healthStatus}</strong>
      </div>

      <p><strong>API Endpoint:</strong> {apiBase || 'Not configured'}</p>

      {backendInfo && (
        <div>
          <p><strong>Last Check:</strong> {new Date(backendInfo.timestamp).toLocaleString()}</p>
          <p><strong>Message:</strong> {backendInfo.message}</p>
          {backendInfo.path && <p><strong>Path:</strong> {backendInfo.path}</p>}
          {backendInfo.method && <p><strong>Method:</strong> {backendInfo.method}</p>}
        </div>
      )}

      {error && (
        <div style={{ color: '#dc3545', marginTop: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <button 
        onClick={checkHealth}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '12px'
        }}
      >
        Refresh Status
      </button>
    </div>
  );
}