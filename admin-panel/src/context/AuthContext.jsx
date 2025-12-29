import React, { createContext, useContext, useState } from 'react';

// RBAC System - Industry Grade Admin Roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    displayName: 'Super Admin',
    level: 1,
    permissions: ['*'] // Full access
  },
  ADMIN: {
    name: 'ADMIN',
    displayName: 'Platform Manager',
    level: 2,
    permissions: ['users:*', 'teams:*', 'domains:*', 'links:*', 'qr:*', 'files:*', 'resources:*', 'support:*', 'analytics:read', 'billing:read']
  },
  SUPPORT_ADMIN: {
    name: 'SUPPORT_ADMIN',
    displayName: 'Support Admin',
    level: 3,
    permissions: ['users:read', 'users:impersonate', 'links:read', 'qr:read', 'files:read', 'support:*', 'tickets:*', 'analytics:read']
  },
  BILLING_ADMIN: {
    name: 'BILLING_ADMIN',
    displayName: 'Billing Manager',
    level: 3,
    permissions: ['billing:*', 'subscriptions:*', 'coupons:*', 'analytics:billing', 'users:read', 'resources:read']
  },
  TECH_ADMIN: {
    name: 'TECH_ADMIN',
    displayName: 'Technical Admin',
    level: 3,
    permissions: ['system:*', 'resources:*', 'files:*', 'qr:read', 'domains:verify', 'ssl:*', 'cache:*', 'jobs:*', 'analytics:system']
  },
  MODERATOR: {
    name: 'MODERATOR',
    displayName: 'Content Moderator',
    level: 4,
    permissions: ['links:moderate', 'qr:read', 'files:read', 'domains:moderate', 'users:read', 'reports:*']
  },
  AUDITOR: {
    name: 'AUDITOR',
    displayName: 'Read-Only Auditor',
    level: 5,
    permissions: ['*:read', 'audit:*', 'export:*']
  }
};

// Mock users with different roles
export const MOCK_USERS = {
  'admin@tinyslash.com': { password: 'admin123', role: ADMIN_ROLES.SUPER_ADMIN, name: 'John Doe' },
  'support@tinyslash.com': { password: 'support123', role: ADMIN_ROLES.SUPPORT_ADMIN, name: 'Jane Smith' },
  'billing@tinyslash.com': { password: 'billing123', role: ADMIN_ROLES.BILLING_ADMIN, name: 'Mike Johnson' },
  'tech@tinyslash.com': { password: 'tech123', role: ADMIN_ROLES.TECH_ADMIN, name: 'Sarah Wilson' },
  'moderator@tinyslash.com': { password: 'mod123', role: ADMIN_ROLES.MODERATOR, name: 'Alex Brown' },
  'auditor@tinyslash.com': { password: 'audit123', role: ADMIN_ROLES.AUDITOR, name: 'Emma Davis' }
};

// Permission checker
const hasPermission = (userRole, resource, action) => {
  if (!userRole || !userRole.permissions) return false;

  // Super admin has all permissions
  if (userRole.permissions.includes('*')) return true;

  // Check specific permissions
  const fullPermission = `${resource}:${action}`;
  const resourceWildcard = `${resource}:*`;
  const actionWildcard = `*:${action}`;

  return userRole.permissions.some(permission =>
    permission === fullPermission ||
    permission === resourceWildcard ||
    permission === actionWildcard
  );
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    const mockUser = MOCK_USERS[email];
    if (mockUser && mockUser.password === password) {
      setUser({
        name: mockUser.name,
        email: email,
        role: mockUser.role,
        avatar: mockUser.name.charAt(0),
        permissions: mockUser.role.permissions
      });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const checkPermission = (resource, action) => {
    return hasPermission(user?.role, resource, action);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, hasPermission: checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
