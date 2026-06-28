import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

function normalizePermissions(user) {
  if (!user) return new Set();

  const out = new Set();

  // Common backend shapes
  const candidates = [
    user.permissions,
    user.permission,
    user.roles,
    user.role,
    user.scopes,
    user.grants,
  ];

  for (const c of candidates) {
    if (!c) continue;

    if (Array.isArray(c)) {
      for (const item of c) {
        if (typeof item === 'string') out.add(item);
        else if (item && typeof item === 'object') {
          if (typeof item.name === 'string') out.add(item.name);
          else if (typeof item.value === 'string') out.add(item.value);
          else if (typeof item.permission === 'string') out.add(item.permission);
        }
      }
      continue;
    }

    if (typeof c === 'object') {
      for (const [k, v] of Object.entries(c)) {
        if (v === true) out.add(k);
      }
    }
  }

  return out;
}

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  const permissions = useMemo(() => normalizePermissions(user), [user]);

  const hasPermission = useCallback(
    (perm) => {
      if (!isAuthenticated) return false;
      if (!perm) return false;
      return permissions.has(perm);
    },
    [isAuthenticated, permissions]
  );

  const hasAnyPermission = useCallback(
    (perms) => {
      if (!isAuthenticated) return false;
      if (!Array.isArray(perms)) return false;
      return perms.some((p) => permissions.has(p));
    },
    [isAuthenticated, permissions]
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
  };
}

