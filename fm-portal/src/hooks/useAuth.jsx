import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (!token) localStorage.removeItem('token');
  else localStorage.setItem('token', token);
}

/**
 * Centralized auth hook.
 *
 * Contract:
 * - Token stored in localStorage under key: `token`
 * - Exposes in-memory `user` (whatever backend returns)
 *
 * NOTE:
 * Endpoints used here are placeholders. Phase 4 will migrate portal login/signup
 * to the exact backend endpoints and response shape.
 */
export function useAuth() {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError(null);

    // Placeholder: replace with exact portal login endpoint in Phase 4
    const res = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const nextToken =
      res?.token ?? res?.accessToken ?? res?.data?.token ?? null;

    if (!nextToken) throw new Error('Login succeeded but token missing');

    setToken(nextToken);
    setTokenState(nextToken);
    setUser(res?.user ?? res?.data?.user ?? null);

    setAuthLoading(false);
    return res;
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    setAuthLoading(true);
    setAuthError(null);

    // Placeholder: replace with exact portal signup endpoint in Phase 4
    const res = await apiClient('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    const nextToken =
      res?.token ?? res?.accessToken ?? res?.data?.token ?? null;

    if (nextToken) {
      setToken(nextToken);
      setTokenState(nextToken);
    }

    setUser(res?.user ?? res?.data?.user ?? null);
    setAuthLoading(false);
    return res;
  }, []);

  const refreshUser = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    // Placeholder: Phase 6 will align to exact existing endpoint.
    // We try common patterns.
    const candidates = ['/auth/me', '/me', '/user', '/auth/user'];
    let lastErr;

    for (const endpoint of candidates) {
      try {
        const data = await apiClient(endpoint);
        setUser(data?.user ?? data);
        setAuthLoading(false);
        return;
      } catch (e) {
        lastErr = e;
      }
    }

    setAuthLoading(false);
    setAuthError(lastErr?.message || 'Unable to refresh user');
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token') {
        setTokenState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const isAuthenticated = useMemo(() => !!token, [token]);

  return {
    token,
    user,
    isAuthenticated,
    authLoading,
    authError,
    login,
    signup,
    logout,
    refreshUser,
  };
}

