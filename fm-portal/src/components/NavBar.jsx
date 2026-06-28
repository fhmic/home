import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

export default function NavBar() {
  const { isAuthenticated, logout, authLoading } = useAuth();
  // Not strictly required yet, but kept for Phase 2 compliance and future use.
  const { hasPermission } = usePermissions();

  const activeStyle = {
    fontWeight: 700,
    textDecoration: 'underline',
  };

  // Example permission gates (will be aligned to real backend rules in Phase 5+)
  const canAccessPortal = isAuthenticated || hasPermission('portal:access');

  return (
    <header style={{ padding: 12, borderBottom: '1px solid #e5e5e5' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/">Home</Link>

        <NavLink
          to="/portal"
          style={({ isActive }) => (isActive ? activeStyle : undefined)}
        >
          Portal
        </NavLink>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {authLoading ? (
            <span>Loading...</span>
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              style={{ cursor: 'pointer' }}
            >
              Logout
            </button>
          ) : (
            <Link to="/portal">Login</Link>
          )}
        </div>
      </nav>

      {!canAccessPortal ? (
        <div style={{ paddingTop: 8, opacity: 0.8, fontSize: 12 }}>
          You may not have access to the portal.
        </div>
      ) : null}
    </header>
  );
}

