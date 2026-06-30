// src/components/ProtectedRoute.jsx
// The door guard for every app page.
// Not logged in? → Goes to /portal
// Logged in but no permission? → Shows Access Denied

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, appKey }) {
  const { isLoggedIn, loading, canAccessApp } = useAuth();

  // While checking login status, show a loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a1628',
        color: '#8fa3bf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in → redirect to portal login page
  if (!isLoggedIn) {
    return <Navigate to="/portal" replace />;
  }

  // Logged in but no access to this specific app
  if (appKey && !canAccessApp(appKey)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a1628',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        padding: '24px',
      }}>
        <div style={{
          background: '#0f1f3d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '420px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: '#e8edf5', margin: '0 0 12px' }}>Access Restricted</h2>
          <p style={{ color: '#8fa3bf', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
            Your account does not have access to this tool.
            {' '}Ask your organisation admin to enable it in Team &amp; Permissions.
          </p>
          
            href="/portal"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#00c9a7',
              color: '#0a1628',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '13px',
            }}
          >
            Back to Portal
          </a>
        </div>
      </div>
    );
  }

  // All good — show the page
  return children;
}
