import React, { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Try a quick health check against the server (relative url)
    const check = async () => {
      setStatus('checking');
      try {
        const res = await fetch('/');
        setMessage(`HTTP ${res.status}`);
        setStatus(res.ok ? 'ok' : 'error');
      } catch (err) {
        setMessage(err.message);
        setStatus('error');
      }
    };
    check();
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 20 }}>
      <h1>BDCA App — Frontend</h1>
      <p>Auto-reload detected: saved <code>src/App.js</code>.</p>
      <div>
        <strong>Server check:</strong>
        <div>Status: <span style={{ fontWeight: 700 }}>{status}</span></div>
        <div>Message: <code>{message}</code></div>
      </div>
      <hr />
      <p>If this is a React app, run your dev server (e.g. <code>npm start</code>) to see live reload.</p>
    </div>
  );
}
