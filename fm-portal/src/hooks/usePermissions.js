// src/hooks/usePermissions.js
// Replaces fmCanView / fmCanEdit / applyModulePermissions from your HTML files.
// Every app page calls this to know what buttons to show.

import { useAuth } from '../context/AuthContext';

// Usage in any page:
//   const { canView, canEdit } = usePermissions('treasury');
//   const { canView, canEdit } = usePermissions('treasury', 'investments');

export function usePermissions(appKey, moduleKey = null) {
  const { user, canAccessApp, getModuleAccess } = useAuth();

  if (!user) {
    return { canView: false, canEdit: false, hasAccess: false };
  }

  // Admin can always do everything
  if (user.role === 'admin') {
    return { canView: true, canEdit: true, hasAccess: true };
  }

  // Check app-level access first
  const hasAppAccess = canAccessApp(appKey);
  if (!hasAppAccess) {
    return { canView: false, canEdit: false, hasAccess: false };
  }

  // If no specific module is requested, app access = can view
  if (!moduleKey) {
    return { canView: true, canEdit: true, hasAccess: true };
  }

  // Check module-level access (none / view / edit)
  const level = getModuleAccess(appKey, moduleKey);

  return {
    hasAccess: level !== 'none',
    canView:   level === 'view' || level === 'edit',
    canEdit:   level === 'edit',
    level,     // 'none', 'view', or 'edit' — in case you need the raw value
  };
}
