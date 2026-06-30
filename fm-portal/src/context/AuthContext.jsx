// src/context/AuthContext.jsx
// This is the login brain of your entire React app.
// It remembers who is logged in across all 6 apps.

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

// Create the context — think of this as a shared memory box
const AuthContext = createContext(null);

// This wraps your entire app so every page can access login info
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // the logged-in user object
  const [loading, setLoading] = useState(true);   // true while checking login status

  // When the app first loads, check if there is already a saved login
  useEffect(() => {
    const savedUser  = localStorage.getItem('fm_user');
    const savedToken = localStorage.getItem('fm_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // If the saved data is corrupted, clear it
        localStorage.removeItem('fm_user');
        localStorage.removeItem('fm_token');
      }
    }
    setLoading(false);
  }, []);

  // Called when the user successfully logs in
  // Saves the token and user info, same as your current HTML portal does
  function login(token, userData) {
    localStorage.setItem('fm_token', token);
    localStorage.setItem('fm_user', JSON.stringify(userData));
    setUser(userData);
  }

  // Called when the user clicks Log Out
  function logout() {
    localStorage.removeItem('fm_token');
    localStorage.removeItem('fm_user');
    setUser(null);
  }

  // Check if the user has access to a specific app
  // Matches your server.js effectivePermissions() logic exactly
  function canAccessApp(appKey) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.[appKey] === true;
  }

  // Check the user's access level for a specific module within an app
  // Returns 'edit', 'view', or 'none' — matches your MODULE_DEFS logic
  function getModuleAccess(appKey, moduleKey) {
    if (!user) return 'none';
    if (user.role === 'admin') return 'edit';
    return user.modulePermissions?.[appKey]?.[moduleKey] || 'none';
  }

  const value = {
    user,           // the full user object (name, role, permissions, etc.)
    loading,        // true while the app is checking login status on first load
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    canAccessApp,
    getModuleAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// This is what every page uses: const { user, isLoggedIn } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
