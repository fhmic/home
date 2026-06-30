// src/App.jsx
// The master switchboard. Every URL maps to a page here.
// You will uncomment each app as you build it.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages — uncomment each one as you build it
import HomePage      from './pages/HomePage';
import PortalPage    from './pages/PortalPage';
import JobsPage      from './pages/JobsPage';
import BankReconPage from './pages/BankReconPage';
// import ReceivablesPage from './pages/ReceivablesPage';
// import TreasuryPage  from './pages/TreasuryPage';
// import MarketsPage   from './pages/MarketsPage';
// import CapMaxPage    from './pages/CapMaxPage';

// Temporary placeholder while you build each page
function ComingSoon({ name }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0a1628',
      color: '#8fa3bf', fontFamily: 'Arial', fontSize: '16px',
    }}>
      {name} — coming soon
    </div>
  );
}

export default function App() {
  return (
    // AuthProvider wraps everything so every page can access login info
    <AuthProvider>
      <BrowserRouter basename="/fm-portal"> {/* ← change "fm-portal" to your GitHub repo name */}
        <Routes>

          {/* Public pages — no login required */}
          <Route path="/"       element={<HomePage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/portal/dashboard" element={<PortalPage />} />

          {/* Protected app pages — login required */}
          {/* Each one checks app-level permission before showing the page */}

            
            <Route path="/jobs" element={
              <ProtectedRoute appKey="jobs">
                <JobsPage />
              </ProtectedRoute>
            } />
          
          <Route path="/bankrecon" element={
            <ProtectedRoute appKey="bankrecon">
              <BankReconPage />
            </ProtectedRoute>
          } />

          <Route path="/receivables" element={
            <ProtectedRoute appKey="receivables">
              <ComingSoon name="Receivables App" />
            </ProtectedRoute>
          } />

          <Route path="/treasury" element={
            <ProtectedRoute appKey="treasury">
              <ComingSoon name="Treasury App" />
            </ProtectedRoute>
          } />

          <Route path="/markets" element={
            <ProtectedRoute appKey="markets">
              <ComingSoon name="Markets App" />
            </ProtectedRoute>
          } />

          <Route path="/capmax" element={
            <ProtectedRoute appKey="capmax">
              <ComingSoon name="CapMax App" />
            </ProtectedRoute>
          } />

          {/* Any unknown URL → redirect to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
