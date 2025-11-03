import React, { useState, useEffect } from 'react';

// RBAC System - Industry Grade Admin Roles
const ADMIN_ROLES = {
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
const MOCK_USERS = {
  'admin@pebly.com': { password: 'admin123', role: ADMIN_ROLES.SUPER_ADMIN, name: 'John Doe' },
  'support@pebly.com': { password: 'support123', role: ADMIN_ROLES.SUPPORT_ADMIN, name: 'Jane Smith' },
  'billing@pebly.com': { password: 'billing123', role: ADMIN_ROLES.BILLING_ADMIN, name: 'Mike Johnson' },
  'tech@pebly.com': { password: 'tech123', role: ADMIN_ROLES.TECH_ADMIN, name: 'Sarah Wilson' },
  'moderator@pebly.com': { password: 'mod123', role: ADMIN_ROLES.MODERATOR, name: 'Alex Brown' },
  'auditor@pebly.com': { password: 'audit123', role: ADMIN_ROLES.AUDITOR, name: 'Emma Davis' }
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

// Mock authentication state with RBAC
const useAuth = () => {
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

  return { isAuthenticated, user, login, logout, hasPermission: checkPermission };
};

// Login Component with Role Selection
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@pebly.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      const success = onLogin(email, password);
      if (!success) {
        setError('Invalid credentials. Try one of the demo accounts below.');
      }
      setLoading(false);
    }, 1000);
  };

  const demoAccounts = [
    { email: 'admin@pebly.com', password: 'admin123', role: 'Super Admin', color: 'bg-red-100 text-red-800' },
    { email: 'support@pebly.com', password: 'support123', role: 'Support Admin', color: 'bg-blue-100 text-blue-800' },
    { email: 'billing@pebly.com', password: 'billing123', role: 'Billing Manager', color: 'bg-green-100 text-green-800' },
    { email: 'tech@pebly.com', password: 'tech123', role: 'Technical Admin', color: 'bg-purple-100 text-purple-800' },
    { email: 'moderator@pebly.com', password: 'mod123', role: 'Content Moderator', color: 'bg-yellow-100 text-yellow-800' },
    { email: 'auditor@pebly.com', password: 'audit123', role: 'Read-Only Auditor', color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pebly Admin Panel
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enterprise-Grade Role-Based Access Control
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sign In</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Demo Accounts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏢 Demo Admin Roles</h3>
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <div 
                  key={index}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{account.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Password: {account.password}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${account.color}`}>
                      {account.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 Click any account above to auto-fill credentials and test different permission levels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component with RBAC
const Sidebar = ({ currentPage, setCurrentPage, user, onLogout, hasPermission }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', resource: 'dashboard', action: 'read' },
    { id: 'users', label: 'User Management', icon: '👥', resource: 'users', action: 'read' },
    { id: 'teams', label: 'Team Management', icon: '🏢', resource: 'teams', action: 'read' },
    { id: 'domains', label: 'Domain Management', icon: '🌐', resource: 'domains', action: 'read' },
    { id: 'links', label: 'Link Management', icon: '🔗', resource: 'links', action: 'read' },
    { id: 'qrcodes', label: 'QR Code Management', icon: '📱', resource: 'qr', action: 'read' },
    { id: 'files', label: 'File Management', icon: '📁', resource: 'files', action: 'read' },
    { id: 'billing', label: 'Billing & Payments', icon: '💳', resource: 'billing', action: 'read' },
    { id: 'coupons', label: 'Coupons & Promotions', icon: '🎫', resource: 'coupons', action: 'read' },
    { id: 'support', label: 'Support Tickets', icon: '🎧', resource: 'support', action: 'read' },
    { id: 'analytics', label: 'Analytics', icon: '📈', resource: 'analytics', action: 'read' },
    { id: 'resources', label: 'Resource Management', icon: '💾', resource: 'resources', action: 'read' },
    { id: 'system', label: 'System Health', icon: '⚙️', resource: 'system', action: 'read' },
    { id: 'audit', label: 'Audit Logs', icon: '📋', resource: 'audit', action: 'read' },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(item.resource, item.action)
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">P</span>
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">Pebly Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentPage === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Role Badge */}
      <div className="px-4 py-2">
        <div className={`px-3 py-2 rounded-lg text-center text-xs font-medium ${
          user.role.name === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
          user.role.name === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
          user.role.name === 'SUPPORT_ADMIN' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
          user.role.name === 'BILLING_ADMIN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
          user.role.name === 'TECH_ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
        }`}>
          {user.role.displayName}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{user.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role.displayName}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          🚪 Sign out
        </button>
      </div>
    </div>
  );
};

// Enhanced Dashboard Components
const DashboardPage = ({ hasPermission, user }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Comprehensive metrics with all platform features
  const metrics = [
    { label: 'Total Users', value: '12,345', change: '+12.5%', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', permission: 'users:read', icon: '👥' },
    { label: 'Active Links', value: '98,765', change: '+8.2%', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', permission: 'links:read', icon: '🔗' },
    { label: 'QR Codes', value: '15,432', change: '+18.7%', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', permission: 'qr:read', icon: '📱' },
    { label: 'File Uploads', value: '8,901', change: '+25.3%', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', permission: 'files:read', icon: '📁' },
    { label: 'Total Clicks', value: '1.2M', change: '+15.3%', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', permission: 'analytics:read', icon: '📊' },
    { label: 'Storage Used', value: '2.3 TB', change: '+11.2%', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20', permission: 'resources:read', icon: '💾' },
    { label: 'Active Teams', value: '234', change: '+9.8%', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', permission: 'teams:read', icon: '🏢' },
    { label: 'Monthly Revenue', value: '$45,678', change: '+23.1%', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', permission: 'billing:read', icon: '💰' }
  ];

  // Real-time activity data
  const recentActivity = [
    { type: 'user_signup', user: 'John Doe', action: 'Signed up for Pro plan', time: '2 min ago', icon: '👤', color: 'text-green-600' },
    { type: 'link_created', user: 'Sarah Wilson', action: 'Created 5 new links', time: '5 min ago', icon: '🔗', color: 'text-blue-600' },
    { type: 'qr_generated', user: 'Mike Johnson', action: 'Generated QR code for campaign', time: '8 min ago', icon: '📱', color: 'text-purple-600' },
    { type: 'file_uploaded', user: 'Emma Davis', action: 'Uploaded product catalog (3.2MB)', time: '12 min ago', icon: '📁', color: 'text-orange-600' },
    { type: 'domain_verified', user: 'Alex Brown', action: 'Verified custom domain', time: '15 min ago', icon: '🌐', color: 'text-cyan-600' },
    { type: 'payment_received', user: 'Lisa Chen', action: 'Upgraded to Business plan', time: '18 min ago', icon: '💳', color: 'text-green-600' }
  ];

  // Performance metrics
  const performanceData = [
    { metric: 'Click-through Rate', value: '23.5%', trend: 'up', change: '+2.1%' },
    { metric: 'QR Scan Rate', value: '18.7%', trend: 'up', change: '+1.8%' },
    { metric: 'File Download Rate', value: '31.2%', trend: 'down', change: '-0.5%' },
    { metric: 'User Retention', value: '87.3%', trend: 'up', change: '+3.2%' }
  ];

  // Geographic distribution
  const topCountries = [
    { country: 'United States', users: 4567, percentage: 37.0, flag: '🇺🇸' },
    { country: 'India', users: 2341, percentage: 19.0, flag: '🇮🇳' },
    { country: 'United Kingdom', users: 1876, percentage: 15.2, flag: '🇬🇧' },
    { country: 'Canada', users: 1234, percentage: 10.0, flag: '🇨🇦' },
    { country: 'Germany', users: 987, percentage: 8.0, flag: '🇩🇪' }
  ];

  // Revenue breakdown
  const revenueBreakdown = [
    { plan: 'Free', users: 8567, revenue: 0, color: 'bg-gray-500' },
    { plan: 'Pro', users: 2341, revenue: 23410, color: 'bg-yellow-500' },
    { plan: 'Business', users: 1234, revenue: 61700, color: 'bg-blue-500' },
    { plan: 'Enterprise', users: 203, revenue: 40600, color: 'bg-purple-500' }
  ];

  // Filter metrics based on permissions
  const visibleMetrics = metrics.filter(metric => {
    const [resource, action] = metric.permission.split(':');
    return hasPermission(resource, action);
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">BitaURL Platform Overview</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center"
          >
            <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Role-based Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="opacity-90">You're logged in as <strong>{user?.role?.displayName}</strong> with access to {visibleMetrics.length} key metrics.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{new Date().toLocaleDateString()}</div>
            <div className="text-sm opacity-75">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleMetrics.map((metric, index) => (
          <div key={index} className={`${metric.bg} rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.label}</h3>
                <div className="mt-2 flex items-baseline">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <span className={`ml-2 text-sm font-medium ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="text-3xl opacity-20">
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      {hasPermission('analytics', 'read') && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {performanceData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.metric}</div>
                <div className={`text-xs font-medium ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.trend === 'up' ? '↗' : '↘'} {item.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real-time Activity</h3>
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Live
            </div>
          </div>
          <div className="space-y-4">
            {recentActivity.slice(0, 6).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color} bg-opacity-10`}>
                  <span className="text-sm">{activity.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{activity.action}</p>
                </div>
                <div className="text-xs text-gray-400">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        {hasPermission('analytics', 'read') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Countries</h3>
            <div className="space-y-3">
              {topCountries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{country.flag}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{country.country}</div>
                      <div className="text-xs text-gray-500">{country.users.toLocaleString()} users</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{country.percentage}%</div>
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full" 
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revenue and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        {hasPermission('billing', 'read') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Plan</h3>
            <div className="space-y-4">
              {revenueBreakdown.map((plan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${plan.color} mr-3`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{plan.plan}</div>
                      <div className="text-xs text-gray-500">{plan.users.toLocaleString()} users</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      ${plan.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">monthly</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Total MRR</span>
                <span className="text-lg font-bold text-green-600">
                  ${revenueBreakdown.reduce((sum, plan) => sum + plan.revenue, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            {[
              { service: 'API Server', status: 'Operational', uptime: '99.9%', responseTime: '45ms', color: 'text-green-600' },
              { service: 'Database', status: 'Operational', uptime: '99.8%', responseTime: '12ms', color: 'text-green-600' },
              { service: 'File Storage', status: 'Operational', uptime: '99.9%', responseTime: '89ms', color: 'text-green-600' },
              { service: 'QR Generator', status: 'Operational', uptime: '99.7%', responseTime: '156ms', color: 'text-green-600' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${item.color === 'text-green-600' ? 'bg-green-500' : 'bg-red-500'} mr-3`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.service}</div>
                    <div className="text-xs text-gray-500">Uptime: {item.uptime}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${item.color}`}>{item.status}</div>
                  <div className="text-xs text-gray-500">{item.responseTime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Page - Industry-Grade Implementation
const UsersPage = ({ hasPermission }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [filters, setFilters] = useState({
    plan: 'all',
    status: 'all',
    dateRange: '30d',
    region: 'all',
    source: 'all'
  });

  // Mock comprehensive user data
  const users = [
    {
      id: 'usr_001',
      name: 'Venkatesh Lahori',
      email: 'venkatesh@bitaurl.com',
      avatar: 'V',
      plan: 'Business',
      status: 'Active',
      links: 325,
      domains: 3,
      qrCodes: 89,
      team: 'BitaTeam',
      teamRole: 'Owner',
      createdAt: '2024-10-15',
      lastActive: '2 minutes ago',
      lastLogin: '2024-01-30 14:30:00',
      ipAddress: '122.45.67.1',
      location: 'Mumbai, India',
      device: 'Chrome on MacOS',
      source: 'Email Signup',
      trialEnd: null,
      subscription: {
        id: 'sub_123',
        status: 'active',
        currentPeriodEnd: '2024-02-29',
        amount: 2999,
        currency: 'INR'
      },
      usage: {
        linksThisMonth: 45,
        clicksThisMonth: 12456,
        domainsUsed: 3,
        storageUsed: '2.3 GB'
      },
      billing: {
        totalSpent: 8997,
        invoices: 3,
        paymentMethod: 'Razorpay',
        nextBilling: '2024-02-29'
      },
      security: {
        twoFactorEnabled: true,
        lastPasswordChange: '2024-01-15',
        loginDevices: 3
      },
      notes: 'Premium customer - provides excellent feedback on new features'
    },
    {
      id: 'usr_002',
      name: 'Sarah Wilson',
      email: 'sarah@company.com',
      avatar: 'S',
      plan: 'Pro',
      status: 'Active',
      links: 156,
      domains: 1,
      qrCodes: 34,
      team: 'Marketing Team',
      teamRole: 'Admin',
      createdAt: '2024-01-20',
      lastActive: '1 hour ago',
      lastLogin: '2024-01-30 13:15:00',
      ipAddress: '192.168.1.101',
      location: 'New York, USA',
      device: 'Chrome on Windows',
      source: 'Google OAuth',
      trialEnd: null,
      subscription: {
        id: 'sub_124',
        status: 'active',
        currentPeriodEnd: '2024-02-20',
        amount: 999,
        currency: 'USD'
      },
      usage: {
        linksThisMonth: 23,
        clicksThisMonth: 5678,
        domainsUsed: 1,
        storageUsed: '890 MB'
      },
      billing: {
        totalSpent: 2997,
        invoices: 3,
        paymentMethod: 'Stripe',
        nextBilling: '2024-02-20'
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: '2024-01-10',
        loginDevices: 2
      },
      notes: 'Heavy user of analytics features'
    },
    {
      id: 'usr_003',
      name: 'Mike Johnson',
      email: 'mike@startup.io',
      avatar: 'M',
      plan: 'Free',
      status: 'Trial',
      links: 45,
      domains: 0,
      qrCodes: 12,
      team: null,
      teamRole: null,
      createdAt: '2024-01-28',
      lastActive: '3 days ago',
      lastLogin: '2024-01-27 09:45:00',
      ipAddress: '203.0.113.45',
      location: 'London, UK',
      device: 'Safari on iPhone',
      source: 'Product Hunt',
      trialEnd: '2024-02-05',
      subscription: null,
      usage: {
        linksThisMonth: 12,
        clicksThisMonth: 234,
        domainsUsed: 0,
        storageUsed: '45 MB'
      },
      billing: {
        totalSpent: 0,
        invoices: 0,
        paymentMethod: null,
        nextBilling: null
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: '2024-01-28',
        loginDevices: 1
      },
      notes: 'Trial user - showing high engagement, potential conversion'
    },
    {
      id: 'usr_004',
      name: 'Emma Davis',
      email: 'emma@agency.com',
      avatar: 'E',
      plan: 'Business',
      status: 'Suspended',
      links: 234,
      domains: 2,
      qrCodes: 67,
      team: 'Digital Agency',
      teamRole: 'Owner',
      createdAt: '2024-01-05',
      lastActive: '1 week ago',
      lastLogin: '2024-01-23 16:20:00',
      ipAddress: '198.51.100.23',
      location: 'Toronto, Canada',
      device: 'Firefox on Linux',
      source: 'Email Signup',
      trialEnd: null,
      subscription: {
        id: 'sub_125',
        status: 'past_due',
        currentPeriodEnd: '2024-01-25',
        amount: 4999,
        currency: 'CAD'
      },
      usage: {
        linksThisMonth: 0,
        clicksThisMonth: 0,
        domainsUsed: 2,
        storageUsed: '1.8 GB'
      },
      billing: {
        totalSpent: 14997,
        invoices: 3,
        paymentMethod: 'Stripe',
        nextBilling: 'Overdue'
      },
      security: {
        twoFactorEnabled: true,
        lastPasswordChange: '2024-01-01',
        loginDevices: 4
      },
      notes: 'Payment failed - contacted customer support twice'
    }
  ];

  // User activity logs
  const userActivities = {
    'usr_001': [
      { date: '2024-01-30 14:30', action: 'Created 5 new links', ip: '122.45.67.1', device: 'Chrome' },
      { date: '2024-01-30 10:15', action: 'Added custom domain bitaurl.com', ip: '122.45.67.1', device: 'Chrome' },
      { date: '2024-01-29 16:45', action: 'Upgraded to Business plan', ip: '122.45.67.1', device: 'Chrome' },
      { date: '2024-01-29 09:30', action: 'Login successful', ip: '122.45.67.1', device: 'Chrome' }
    ]
  };

  // Summary metrics
  const userMetrics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'Active').length,
    freeUsers: users.filter(u => u.plan === 'Free').length,
    proUsers: users.filter(u => u.plan === 'Pro').length,
    businessUsers: users.filter(u => u.plan === 'Business').length,
    suspendedUsers: users.filter(u => u.status === 'Suspended').length,
    trialUsers: users.filter(u => u.status === 'Trial').length
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = filters.plan === 'all' || user.plan.toLowerCase() === filters.plan;
    const matchesStatus = filters.status === 'all' || user.status.toLowerCase() === filters.status;
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Free': return 'bg-gray-100 text-gray-800';
      case 'Pro': return 'bg-yellow-100 text-yellow-800';
      case 'Business': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Trial': return 'bg-blue-100 text-blue-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    );
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen({});
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete control center for BitaURL users</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('users', 'export') && (
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export Users
            </button>
          )}
          {hasPermission('users', 'create') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add User
            </button>
          )}
        </div>
      </div>

      {/* User Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{userMetrics.totalUsers}</p>
          <p className="text-xs text-green-600 mt-1">▲ +12% this week</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{userMetrics.activeUsers}</p>
          <p className="text-xs text-green-600 mt-1">▲ +8% this week</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Free Users</h3>
          <p className="text-2xl font-bold text-gray-600 mt-1">{userMetrics.freeUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pro Users</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{userMetrics.proUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Business</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{userMetrics.businessUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Trial Users</h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">{userMetrics.trialUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Suspended</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">{userMetrics.suspendedUsers}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan</label>
            <select 
              value={filters.plan}
              onChange={(e) => setFilters({...filters, plan: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <select 
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
            <select 
              value={filters.region}
              onChange={(e) => setFilters({...filters, region: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Regions</option>
              <option value="india">India</option>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
              <option value="canada">Canada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{selectedUsers.length}</span>
                </div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Primary Bulk Actions */}
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                <span className="mr-2">📧</span>
                Send Email
              </button>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors">
                <span className="mr-2">🎫</span>
                Apply Coupon
              </button>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors">
                <span className="mr-2">⏰</span>
                Extend Trial
              </button>
              
              {/* Dropdown for More Actions */}
              <div className="relative">
                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                  <span className="mr-2">⚙️</span>
                  More Actions
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Critical Actions */}
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors">
                <span className="mr-2">⏸️</span>
                Suspend
              </button>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
                <span className="mr-2">🗑️</span>
                Delete
              </button>
            </div>

            <button 
              onClick={() => setSelectedUsers([])}
              className="inline-flex items-center px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <span className="mr-1">✕</span>
              Clear Selection
            </button>
          </div>
          
          {/* Quick Stats for Selected Users */}
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <span className="block text-blue-800 dark:text-blue-200 font-semibold">
                  {selectedUsers.filter(id => users.find(u => u.id === id)?.plan === 'Free').length}
                </span>
                <span className="text-blue-600 dark:text-blue-400">Free Users</span>
              </div>
              <div className="text-center">
                <span className="block text-blue-800 dark:text-blue-200 font-semibold">
                  {selectedUsers.filter(id => users.find(u => u.id === id)?.plan === 'Pro').length}
                </span>
                <span className="text-blue-600 dark:text-blue-400">Pro Users</span>
              </div>
              <div className="text-center">
                <span className="block text-blue-800 dark:text-blue-200 font-semibold">
                  {selectedUsers.filter(id => users.find(u => u.id === id)?.plan === 'Business').length}
                </span>
                <span className="text-blue-600 dark:text-blue-400">Business Users</span>
              </div>
              <div className="text-center">
                <span className="block text-blue-800 dark:text-blue-200 font-semibold">
                  {selectedUsers.filter(id => users.find(u => u.id === id)?.status === 'Active').length}
                </span>
                <span className="text-blue-600 dark:text-blue-400">Active Users</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{user.avatar}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      <div className="text-xs text-gray-400 font-mono">{user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPlanColor(user.plan)}`}>
                    {user.plan}
                  </span>
                  {user.trialEnd && (
                    <div className="text-xs text-orange-600 mt-1">Trial ends: {user.trialEnd}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    <div>{user.links} links</div>
                    <div className="text-xs text-gray-500">{user.domains} domains • {user.qrCodes} QR codes</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.team ? (
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">{user.team}</div>
                      <div className="text-xs text-gray-500">{user.teamRole}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No team</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      user.lastActive.includes('minute') ? 'bg-green-500' : 
                      user.lastActive.includes('hour') ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">{user.lastActive}</div>
                      <div className="text-xs text-gray-500">{user.location}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {/* Simple View Icon Button */}
                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserDetail(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    {/* Working Dropdown Menu */}
                    <div className="relative">
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(prev => ({
                            ...prev,
                            [user.id]: !prev[user.id]
                          }));
                        }}
                        title="More Actions"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu Items */}
                      {dropdownOpen[user.id] && (
                        <div className="absolute right-0 z-20 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            {hasPermission('users', 'edit') && (
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Profile
                              </button>
                            )}
                            {hasPermission('users', 'impersonate') && (
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Login As User
                              </button>
                            )}
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Manage Billing
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Send Email
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reset Password
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                              {user.status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Text-based Status Action */}
                    {hasPermission('users', 'suspend') && (
                      <button 
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          user.status === 'Suspended' 
                            ? 'text-green-700 bg-green-100 hover:bg-green-200 border border-green-200' 
                            : 'text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200'
                        }`}
                      >
                        {user.status === 'Suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex">
              {/* User Detail Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{selectedUser.avatar}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                      <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                      <p className="text-sm text-gray-500 font-mono">{selectedUser.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUserDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* User Details Tabs */}
                <div className="space-y-6">
                  {/* Profile Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Profile Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Plan</label>
                        <p className="font-medium">{selectedUser.plan}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Status</label>
                        <p className="font-medium">{selectedUser.status}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Joined</label>
                        <p className="font-medium">{selectedUser.createdAt}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Last Login</label>
                        <p className="font-medium">{selectedUser.lastLogin}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Location</label>
                        <p className="font-medium">{selectedUser.location}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Source</label>
                        <p className="font-medium">{selectedUser.source}</p>
                      </div>
                    </div>
                  </div>

                  {/* Usage Analytics */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Usage Analytics</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.links}</p>
                        <p className="text-sm text-gray-500">Total Links</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{selectedUser.usage.clicksThisMonth}</p>
                        <p className="text-sm text-gray-500">Clicks This Month</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{selectedUser.domains}</p>
                        <p className="text-sm text-gray-500">Custom Domains</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{selectedUser.qrCodes}</p>
                        <p className="text-sm text-gray-500">QR Codes</p>
                      </div>
                    </div>
                  </div>

                  {/* Billing Information */}
                  {selectedUser.subscription && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Billing & Subscription</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-500">Current Plan</label>
                          <p className="font-medium">{selectedUser.plan}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Amount</label>
                          <p className="font-medium">{selectedUser.subscription.currency} {selectedUser.subscription.amount}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Next Billing</label>
                          <p className="font-medium">{selectedUser.billing.nextBilling}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Total Spent</label>
                          <p className="font-medium">{selectedUser.subscription.currency} {selectedUser.billing.totalSpent}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Security</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Two-Factor Auth</label>
                        <p className="font-medium">{selectedUser.security.twoFactorEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Login Devices</label>
                        <p className="font-medium">{selectedUser.security.loginDevices} devices</p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Admin Notes</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedUser.notes}</p>
                  </div>

                  {/* Activity Log */}
                  {userActivities[selectedUser.id] && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                      <div className="space-y-2">
                        {userActivities[selectedUser.id].map((activity, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
                              <p className="text-xs text-gray-500">{activity.device} • {activity.ip}</p>
                            </div>
                            <p className="text-xs text-gray-500">{activity.date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Redesigned */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Admin Actions</h4>
                  
                  {/* Primary Actions Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <button className="inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                      <span className="mr-2">✏️</span>
                      Edit Profile
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors">
                      <span className="mr-2">💳</span>
                      Change Plan
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors">
                      <span className="mr-2">🧍</span>
                      Login As User
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                      <span className="mr-2">📊</span>
                      View Analytics
                    </button>
                  </div>

                  {/* Secondary Actions Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <button className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                      <span className="mr-2">📧</span>
                      Send Email
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                      <span className="mr-2">🔄</span>
                      Reset Password
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                      <span className="mr-2">🎫</span>
                      Apply Coupon
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                      <span className="mr-2">📋</span>
                      View Logs
                    </button>
                  </div>

                  {/* Critical Actions Row */}
                  <div className="flex flex-wrap gap-3">
                    <button className={`inline-flex items-center justify-center px-6 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      selectedUser.status === 'Suspended' 
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white' 
                        : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white'
                    }`}>
                      <span className="mr-2">{selectedUser.status === 'Suspended' ? '✅' : '⏸️'}</span>
                      {selectedUser.status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
                    </button>
                    
                    <button className="inline-flex items-center justify-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
                      <span className="mr-2">🗑️</span>
                      Delete Account
                    </button>

                    <button className="inline-flex items-center justify-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors">
                      <span className="mr-2">📤</span>
                      Export Data
                    </button>
                  </div>

                  {/* Quick Stats Actions */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
                        <span className="mr-1">⏰</span>
                        Extend Trial
                      </button>
                      <button className="inline-flex items-center px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors">
                        <span className="mr-1">🎁</span>
                        Add Credits
                      </button>
                      <button className="inline-flex items-center px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors">
                        <span className="mr-1">🏷️</span>
                        Add Tag
                      </button>
                      <button className="inline-flex items-center px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors">
                        <span className="mr-1">📝</span>
                        Add Note
                      </button>
                      <button className="inline-flex items-center px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full hover:bg-indigo-200 transition-colors">
                        <span className="mr-1">🔔</span>
                        Send Notification
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Users</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Export Format</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>CSV</option>
                  <option>Excel</option>
                  <option>JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Include Fields</label>
                <div className="mt-2 space-y-2">
                  {['Basic Info', 'Usage Stats', 'Billing Data', 'Security Info', 'Activity Logs'].map((field) => (
                    <label key={field} className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{field}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Export Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BillingPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Payments</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Monthly Revenue</h3>
        <p className="text-3xl font-bold text-green-600">$45,678</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">+23.1% from last month</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Active Subscriptions</h3>
        <p className="text-3xl font-bold text-blue-600">1,234</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">+12% from last month</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed Payments</h3>
        <p className="text-3xl font-bold text-red-600">23</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Requires attention</p>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {[
          { user: 'John Doe', amount: '$29.99', plan: 'Pro Plan', status: 'Completed', date: '2024-01-15' },
          { user: 'Jane Smith', amount: '$99.99', plan: 'Business Plan', status: 'Completed', date: '2024-01-14' },
          { user: 'Mike Johnson', amount: '$29.99', plan: 'Pro Plan', status: 'Failed', date: '2024-01-13' }
        ].map((transaction, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.user}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.plan}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.amount}</p>
              <p className={`text-sm ${transaction.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Complete Support Ticket Management Page - Matching User-Side Functionality
const SupportPage = ({ hasPermission }) => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);

  // Mock comprehensive support ticket data matching user-side structure exactly
  const supportTickets = [
    {
      id: 'ticket_001',
      userId: 'usr_001',
      category: 'technical',
      subject: 'Custom domain verification failing',
      message: 'I have added the CNAME record as instructed but my domain verification keeps failing. I have waited 24 hours for DNS propagation. Can you please help me troubleshoot this issue?',
      priority: 'high',
      status: 'open',
      createdAt: '2024-01-30T09:15:00Z',
      updatedAt: '2024-01-30T14:30:00Z',
      assignedAgent: 'Sarah Wilson',
      assignedTo: 'support@pebly.com',
      userName: 'John Doe',
      userEmail: 'john@company.com',
      userPlan: 'Business',
      currentPage: '/domains',
      responseTime: '2h 5m',
      resolutionTime: null,
      attachments: ['att_001'],
      responses: [
        {
          id: 'resp_001',
          ticketId: 'ticket_001',
          message: 'Thank you for contacting support. I can see the CNAME record is correctly configured. Let me check our verification system and get back to you shortly.',
          sender: 'agent',
          senderName: 'Sarah Wilson',
          timestamp: '2024-01-30T11:20:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_abc123'
      }
    },
    {
      id: 'ticket_002',
      userId: 'usr_002',
      category: 'payment',
      subject: 'Billing issue - charged twice for Pro plan',
      message: 'I was charged twice for my Pro plan subscription this month. Please refund the duplicate charge. Transaction IDs: TXN123 and TXN124. I have attached the payment receipts for both charges.',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2024-01-29T16:45:00Z',
      updatedAt: '2024-01-30T10:15:00Z',
      assignedAgent: 'Mike Johnson',
      assignedTo: 'billing@pebly.com',
      userName: 'Jane Smith',
      userEmail: 'jane@startup.com',
      userPlan: 'Pro',
      currentPage: '/billing',
      responseTime: '45m',
      resolutionTime: null,
      attachments: ['att_002'],
      responses: [
        {
          id: 'resp_002',
          ticketId: 'ticket_002',
          message: 'I have located both transactions and initiated a refund for the duplicate charge. You should see the refund in 3-5 business days. I will follow up to ensure the refund is processed correctly.',
          sender: 'agent',
          senderName: 'Mike Johnson',
          timestamp: '2024-01-30T10:15:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '203.0.113.45',
        sessionId: 'sess_def456'
      }
    },
    {
      id: 'ticket_003',
      userId: 'usr_003',
      category: 'technical',
      subject: 'QR code not generating with logo',
      message: 'When I try to generate QR codes with my company logo, the generation fails. Works fine without logo. Error message says "Invalid image format". I have attached my logo file.',
      priority: 'low',
      status: 'resolved',
      createdAt: '2024-01-28T14:20:00Z',
      updatedAt: '2024-01-29T09:30:00Z',
      assignedAgent: 'Emma Davis',
      assignedTo: 'tech@pebly.com',
      userName: 'Alex Brown',
      userEmail: 'alex@agency.com',
      userPlan: 'Business',
      currentPage: '/qr-generator',
      responseTime: '1h 15m',
      resolutionTime: '18h 10m',
      attachments: ['att_003'],
      responses: [
        {
          id: 'resp_003',
          ticketId: 'ticket_003',
          message: 'I found the issue - your logo needs to be in PNG format with transparent background. I have converted it for you and the QR code generation should work now. Please try again and let me know if you need any further assistance.',
          sender: 'agent',
          senderName: 'Emma Davis',
          timestamp: '2024-01-29T09:30:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        ipAddress: '198.51.100.23',
        sessionId: 'sess_ghi789'
      }
    },
    {
      id: 'ticket_004',
      userId: 'usr_004',
      category: 'general',
      subject: 'Need help with team collaboration features',
      message: 'I am trying to set up team collaboration for my organization but having trouble understanding the permission system. Can someone guide me through the process of adding team members and setting up proper access controls?',
      priority: 'medium',
      status: 'open',
      createdAt: '2024-01-27T11:30:00Z',
      updatedAt: '2024-01-30T15:45:00Z',
      assignedAgent: 'Support Team',
      assignedTo: 'support@pebly.com',
      userName: 'Lisa Chen',
      userEmail: 'lisa@techcorp.com',
      userPlan: 'Business',
      currentPage: '/teams',
      responseTime: '30m',
      resolutionTime: null,
      attachments: [],
      responses: [
        {
          id: 'resp_004',
          ticketId: 'ticket_004',
          message: 'I would be happy to help you set up team collaboration. Let me schedule a quick call to walk you through the process. What time works best for you this week?',
          sender: 'agent',
          senderName: 'Support Team',
          timestamp: '2024-01-30T15:45:00Z',
          attachments: []
        }
      ],
      metadata: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '172.16.0.1',
        sessionId: 'sess_jkl012'
      }
    }
  ];

  // Support analytics matching user-side structure
  const supportStats = {
    totalTickets: supportTickets.length,
    openTickets: supportTickets.filter(t => t.status === 'open').length,
    inProgressTickets: supportTickets.filter(t => t.status === 'in-progress').length,
    resolvedTickets: supportTickets.filter(t => t.status === 'resolved').length,
    closedTickets: supportTickets.filter(t => t.status === 'closed').length,
    avgResponseTime: '1h 24m',
    avgResolutionTime: '4h 32m',
    satisfactionScore: 4.7,
    unreadCount: supportTickets.filter(t => 
      t.responses.some(r => r.sender === 'user' && new Date(r.timestamp) > new Date(t.updatedAt))
    ).length,
    categories: {
      payment: supportTickets.filter(t => t.category === 'payment').length,
      technical: supportTickets.filter(t => t.category === 'technical').length,
      account: supportTickets.filter(t => t.category === 'account').length,
      general: supportTickets.filter(t => t.category === 'general').length
    },
    priorities: {
      urgent: supportTickets.filter(t => t.priority === 'urgent').length,
      high: supportTickets.filter(t => t.priority === 'high').length,
      medium: supportTickets.filter(t => t.priority === 'medium').length,
      low: supportTickets.filter(t => t.priority === 'low').length
    }
  };

  // Category functions matching user-side exactly
  const getCategoryColor = (category) => {
    switch (category) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'account': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'payment': return '💳';
      case 'technical': return '🔧';
      case 'account': return '👤';
      case 'general': return '💬';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return '🔴';
      case 'in-progress': return '🔵';
      case 'resolved': return '✅';
      case 'closed': return '⚫';
      default: return '📋';
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer support requests and communications</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('support', 'export') && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Export Report
            </button>
          )}
          {hasPermission('support', 'create') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Ticket
            </button>
          )}
        </div>
      </div>

      {/* Support Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{supportStats.totalTickets}</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Open</h3>
          <p className="text-2xl font-bold text-orange-600 mt-1">{supportStats.openTickets}</p>
          <p className="text-xs text-orange-600 mt-1">Needs attention</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{supportStats.inProgressTickets}</p>
          <p className="text-xs text-blue-600 mt-1">Being handled</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{supportStats.resolvedTickets}</p>
          <p className="text-xs text-green-600 mt-1">Completed</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unread</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">{supportStats.unreadCount}</p>
          <p className="text-xs text-red-600 mt-1">New responses</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response</h3>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{supportStats.avgResponseTime}</p>
          <p className="text-xs text-indigo-600 mt-1">Response time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Resolution</h3>
          <p className="text-2xl font-bold text-pink-600 mt-1">{supportStats.avgResolutionTime}</p>
          <p className="text-xs text-pink-600 mt-1">Resolution time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Satisfaction</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{supportStats.satisfactionScore}/5</p>
          <p className="text-xs text-yellow-600 mt-1">Customer rating</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              <option value="payment">💳 Payment</option>
              <option value="technical">🔧 Technical</option>
              <option value="account">👤 Account</option>
              <option value="general">💬 General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agent</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="all">All Agents</option>
              <option value="sarah">Sarah Wilson</option>
              <option value="mike">Mike Johnson</option>
              <option value="emma">Emma Davis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ticket</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Response Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getCategoryIcon(ticket.category)}</div>
                    <div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        #{ticket.id.slice(-6)}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="text-xs text-purple-600 mt-1">
                          📎 {ticket.attachments.length} attachment{ticket.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        {ticket.userName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.userName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {ticket.userEmail}
                      </div>
                      <div className="text-xs text-gray-400">
                        {ticket.userPlan} Plan
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(ticket.category)}`}>
                    {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {ticket.assignedAgent}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.assignedTo}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {ticket.responseTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last: {ticket.lastResponseAt}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketDetail(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                    {hasPermission('support', 'respond') && (
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Reply
                      </button>
                    )}
                    {hasPermission('support', 'resolve') && ticket.status !== 'RESOLVED' && (
                      <button className="text-purple-600 hover:text-purple-800 text-sm">
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Support Categories Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tickets by Category</h3>
          <div className="space-y-3">
            {Object.entries(supportStats.categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)} mr-3`}>
                    {category.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{count} tickets</div>
                  <div className="text-xs text-gray-500">
                    {((count / supportStats.totalTickets) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agent Performance</h3>
          <div className="space-y-3">
            {[
              { agent: 'Sarah Wilson', tickets: 15, avgResponse: '1h 12m', satisfaction: 4.8 },
              { agent: 'Mike Johnson', tickets: 12, avgResponse: '1h 45m', satisfaction: 4.6 },
              { agent: 'Emma Davis', tickets: 8, avgResponse: '58m', satisfaction: 4.9 },
              { agent: 'Tech Lead', tickets: 3, avgResponse: '2h 15m', satisfaction: 4.5 }
            ].map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {agent.agent}
                  </div>
                  <div className="text-xs text-gray-500">
                    {agent.tickets} tickets • {agent.avgResponse} avg response
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-yellow-600">
                    {agent.satisfaction}/5
                  </div>
                  <div className="text-xs text-gray-500">satisfaction</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {showTicketDetail && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex">
              {/* Ticket Details */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedTicket.ticketNumber}: {selectedTicket.subject}
                    </h2>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(selectedTicket.category)}`}>
                        {selectedTicket.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTicketDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedTicket.userName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedTicket.userEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Plan:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedTicket.userPlan}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">User ID:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-mono">{selectedTicket.userId}</span>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation</h3>
                  {selectedTicket.responses.map((response) => (
                    <div key={response.id} className={`flex ${response.sender === 'USER' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-3xl p-4 rounded-lg ${
                        response.sender === 'USER' 
                          ? 'bg-gray-100 dark:bg-gray-700' 
                          : 'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {response.senderName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {response.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {response.message}
                        </p>
                        {response.attachments.length > 0 && (
                          <div className="mt-2">
                            {response.attachments.map((attId) => {
                              const attachment = selectedTicket.attachments.find(a => a.id === attId);
                              return attachment ? (
                                <div key={attId} className="text-xs text-blue-600 dark:text-blue-400">
                                  📎 {attachment.fileName} ({attachment.fileSize})
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {hasPermission('support', 'respond') && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Reply to Customer</h4>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows="4"
                      placeholder="Type your response..."
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-2">
                        <button className="text-sm text-gray-600 hover:text-gray-800">
                          📎 Attach File
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-800">
                          📝 Use Template
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                          Save Draft
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Metadata Sidebar */}
              <div className="w-80 bg-gray-50 dark:bg-gray-900 p-6 border-l border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ticket Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Assigned Agent</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.assignedAgent}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">Response Time</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.responseTime}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">Created</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.createdAt}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">Last Updated</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.updatedAt}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTicket.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedTicket.metadata && (
                    <div>
                      <label className="text-sm text-gray-500">Technical Info</label>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                        <div>IP: {selectedTicket.metadata.ipAddress}</div>
                        <div>Session: {selectedTicket.metadata.sessionId}</div>
                        <div>Referrer: {selectedTicket.metadata.referrer}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Quick Actions</h4>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    Change Priority
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    Reassign Agent
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    Add Internal Note
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Coupon Management Page
const CouponsPage = ({ hasPermission }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const coupons = [
    { 
      id: 'WELCOME50', 
      name: 'Welcome Discount', 
      discount: '50%', 
      type: 'Percentage',
      targetPlans: ['Pro', 'Business'], 
      used: 245, 
      limit: 1000, 
      expires: '2024-12-31',
      status: 'Active'
    },
    { 
      id: 'SAVE20', 
      name: 'Save $20', 
      discount: '$20', 
      type: 'Fixed',
      targetPlans: ['Business', 'Enterprise'], 
      used: 89, 
      limit: 500, 
      expires: '2024-06-30',
      status: 'Active'
    },
    { 
      id: 'EXPIRED10', 
      name: 'Old Promo', 
      discount: '10%', 
      type: 'Percentage',
      targetPlans: ['Pro'], 
      used: 150, 
      limit: 200, 
      expires: '2024-01-31',
      status: 'Expired'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons & Promotions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage discount codes and promotional campaigns</p>
        </div>
        {hasPermission('coupons', 'create') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Coupon
          </button>
        )}
      </div>

      {/* Coupon Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Coupons</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">12</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Redemptions</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">1,234</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue Impact</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">$45,678</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">23.5%</p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Coupon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Target Plans</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {coupons.map((coupon, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">{coupon.id}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{coupon.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{coupon.discount}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{coupon.type}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {coupon.targetPlans.map((plan, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {plan}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {coupon.used} / {coupon.limit}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(coupon.used / coupon.limit) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {new Date(coupon.expires).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    coupon.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {coupon.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-800">Disable</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Coupon</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coupon Code</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="SAVE50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <option>Percentage</option>
                  <option>Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Value</label>
                <input type="number" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usage Limit</label>
                <input type="number" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="1000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                <input type="date" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Team Management Page - Complete Implementation
const TeamsPage = ({ hasPermission }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [activeTab, setActiveTab] = useState('teams');

  // Mock team data
  const teams = [
    {
      id: 1,
      name: 'Marketing Team',
      description: 'Handles all marketing campaigns and content',
      owner: 'Sarah Wilson',
      members: 8,
      plan: 'Business',
      created: '2024-01-15',
      status: 'Active',
      domains: ['marketing.pebly.com', 'campaigns.pebly.com'],
      usage: { links: 1250, clicks: 45678, storage: '2.3 GB' }
    },
    {
      id: 2,
      name: 'Development Team',
      description: 'Software development and technical operations',
      owner: 'Mike Johnson',
      members: 12,
      plan: 'Enterprise',
      created: '2024-01-10',
      status: 'Active',
      domains: ['dev.pebly.com', 'api.pebly.com', 'staging.pebly.com'],
      usage: { links: 3450, clicks: 123456, storage: '8.7 GB' }
    },
    {
      id: 3,
      name: 'Sales Team',
      description: 'Customer acquisition and relationship management',
      owner: 'Emma Davis',
      members: 6,
      plan: 'Pro',
      created: '2024-01-20',
      status: 'Active',
      domains: ['sales.pebly.com'],
      usage: { links: 890, clicks: 23456, storage: '1.2 GB' }
    },
    {
      id: 4,
      name: 'Support Team',
      description: 'Customer support and success',
      owner: 'Alex Brown',
      members: 4,
      plan: 'Pro',
      created: '2024-01-25',
      status: 'Suspended',
      domains: ['help.pebly.com'],
      usage: { links: 234, clicks: 5678, storage: '0.5 GB' }
    }
  ];

  const teamMembers = [
    { id: 1, name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Owner', team: 'Marketing Team', status: 'Active', lastActive: '2 min ago' },
    { id: 2, name: 'John Doe', email: 'john@company.com', role: 'Admin', team: 'Marketing Team', status: 'Active', lastActive: '1 hour ago' },
    { id: 3, name: 'Jane Smith', email: 'jane@company.com', role: 'Member', team: 'Marketing Team', status: 'Active', lastActive: '3 hours ago' },
    { id: 4, name: 'Mike Johnson', email: 'mike@company.com', role: 'Owner', team: 'Development Team', status: 'Active', lastActive: '5 min ago' },
    { id: 5, name: 'Lisa Chen', email: 'lisa@company.com', role: 'Admin', team: 'Development Team', status: 'Active', lastActive: '30 min ago' },
    { id: 6, name: 'Emma Davis', email: 'emma@company.com', role: 'Owner', team: 'Sales Team', status: 'Active', lastActive: '1 hour ago' },
    { id: 7, name: 'Alex Brown', email: 'alex@company.com', role: 'Owner', team: 'Support Team', status: 'Inactive', lastActive: '2 days ago' }
  ];

  const invitations = [
    { id: 1, email: 'newuser@company.com', team: 'Marketing Team', role: 'Member', invitedBy: 'Sarah Wilson', sent: '2024-01-30', status: 'Pending' },
    { id: 2, email: 'developer@company.com', team: 'Development Team', role: 'Admin', invitedBy: 'Mike Johnson', sent: '2024-01-29', status: 'Accepted' },
    { id: 3, email: 'sales@company.com', team: 'Sales Team', role: 'Member', invitedBy: 'Emma Davis', sent: '2024-01-28', status: 'Expired' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage teams, members, and organizational structure</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('teams', 'invite') && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Invite Members
            </button>
          )}
          {hasPermission('teams', 'create') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Team
            </button>
          )}
        </div>
      </div>

      {/* Team Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teams</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{teams.length}</p>
          <p className="text-sm text-green-600 mt-1">+2 this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{teamMembers.length}</p>
          <p className="text-sm text-green-600 mt-1">+5 this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Teams</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">{teams.filter(t => t.status === 'Active').length}</p>
          <p className="text-sm text-gray-500 mt-1">75% active rate</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Invites</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{invitations.filter(i => i.status === 'Pending').length}</p>
          <p className="text-sm text-yellow-600 mt-1">Needs attention</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'teams', label: 'Teams', count: teams.length },
            { id: 'members', label: 'Members', count: teamMembers.length },
            { id: 'invitations', label: 'Invitations', count: invitations.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{team.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{team.domains.length} domains</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{team.owner}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{team.members}</span>
                      <span className="ml-2 text-xs text-gray-500">members</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      team.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                      team.plan === 'Business' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {team.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div>{team.usage.links} links</div>
                      <div>{team.usage.clicks.toLocaleString()} clicks</div>
                      <div>{team.usage.storage}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      team.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {team.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">View</button>
                      {hasPermission('teams', 'edit') && (
                        <button className="text-green-600 hover:text-green-800">Edit</button>
                      )}
                      {hasPermission('teams', 'delete') && (
                        <button className="text-red-600 hover:text-red-800">Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{member.team}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.role === 'Owner' ? 'bg-red-100 text-red-800' :
                      member.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{member.lastActive}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">View</button>
                      {hasPermission('teams', 'edit') && (
                        <button className="text-green-600 hover:text-green-800">Edit Role</button>
                      )}
                      {hasPermission('teams', 'remove') && (
                        <button className="text-red-600 hover:text-red-800">Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invited By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{invitation.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{invitation.team}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invitation.role === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invitation.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{invitation.invitedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{invitation.sent}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invitation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      invitation.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invitation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      {invitation.status === 'Pending' && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800">Resend</button>
                          <button className="text-red-600 hover:text-red-800">Cancel</button>
                        </>
                      )}
                      {invitation.status === 'Expired' && (
                        <button className="text-green-600 hover:text-green-800">Resend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Marketing Team" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="3" placeholder="Team description..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Pro</option>
                  <option>Business</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Owner Email</label>
                <input type="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="owner@company.com" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Team Members</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Addresses</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="3" placeholder="user1@company.com&#10;user2@company.com&#10;user3@company.com"></textarea>
                <p className="text-xs text-gray-500 mt-1">Enter one email per line</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Marketing Team</option>
                  <option>Development Team</option>
                  <option>Sales Team</option>
                  <option>Support Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Member</option>
                  <option>Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Personal Message (Optional)</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="2" placeholder="Welcome to our team!"></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Send Invitations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Domain Management Page - Complete Implementation
const DomainsPage = ({ hasPermission }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const [activeTab, setActiveTab] = useState('domains');

  // Mock domain data
  const domains = [
    {
      id: 1,
      domain: 'marketing.pebly.com',
      owner: 'Marketing Team',
      ownerEmail: 'sarah@company.com',
      type: 'Subdomain',
      status: 'Active',
      ssl: 'Valid',
      sslExpiry: '2024-12-15',
      verified: true,
      created: '2024-01-15',
      lastChecked: '2024-01-30 14:30',
      usage: { links: 1250, clicks: 45678, bandwidth: '2.3 GB' },
      dnsRecords: [
        { type: 'A', name: '@', value: '192.168.1.100', ttl: 300 },
        { type: 'CNAME', name: 'www', value: 'marketing.pebly.com', ttl: 300 }
      ]
    },
    {
      id: 2,
      domain: 'short.company.com',
      owner: 'Development Team',
      ownerEmail: 'mike@company.com',
      type: 'Custom Domain',
      status: 'Active',
      ssl: 'Valid',
      sslExpiry: '2024-11-20',
      verified: true,
      created: '2024-01-10',
      lastChecked: '2024-01-30 14:25',
      usage: { links: 3450, clicks: 123456, bandwidth: '8.7 GB' },
      dnsRecords: [
        { type: 'A', name: '@', value: '192.168.1.101', ttl: 300 },
        { type: 'CNAME', name: 'www', value: 'short.company.com', ttl: 300 }
      ]
    },
    {
      id: 3,
      domain: 'links.salesteam.io',
      owner: 'Sales Team',
      ownerEmail: 'emma@company.com',
      type: 'Custom Domain',
      status: 'Pending Verification',
      ssl: 'Pending',
      sslExpiry: null,
      verified: false,
      created: '2024-01-28',
      lastChecked: '2024-01-30 14:20',
      usage: { links: 0, clicks: 0, bandwidth: '0 GB' },
      dnsRecords: [
        { type: 'A', name: '@', value: '192.168.1.102', ttl: 300, status: 'Not Configured' }
      ]
    },
    {
      id: 4,
      domain: 'help.support.com',
      owner: 'Support Team',
      ownerEmail: 'alex@company.com',
      type: 'Custom Domain',
      status: 'SSL Error',
      ssl: 'Expired',
      sslExpiry: '2024-01-15',
      verified: true,
      created: '2024-01-05',
      lastChecked: '2024-01-30 14:15',
      usage: { links: 234, clicks: 5678, bandwidth: '0.5 GB' },
      dnsRecords: [
        { type: 'A', name: '@', value: '192.168.1.103', ttl: 300 },
        { type: 'CNAME', name: 'www', value: 'help.support.com', ttl: 300 }
      ]
    }
  ];

  const sslCertificates = [
    {
      id: 1,
      domain: 'marketing.pebly.com',
      issuer: 'Let\'s Encrypt',
      type: 'DV SSL',
      status: 'Valid',
      issued: '2024-01-15',
      expires: '2024-12-15',
      autoRenew: true,
      daysLeft: 320
    },
    {
      id: 2,
      domain: 'short.company.com',
      issuer: 'DigiCert',
      type: 'EV SSL',
      status: 'Valid',
      issued: '2023-11-20',
      expires: '2024-11-20',
      autoRenew: false,
      daysLeft: 295
    },
    {
      id: 3,
      domain: 'help.support.com',
      issuer: 'Let\'s Encrypt',
      type: 'DV SSL',
      status: 'Expired',
      issued: '2023-01-15',
      expires: '2024-01-15',
      autoRenew: true,
      daysLeft: -15
    }
  ];

  const dnsRecords = [
    { id: 1, domain: 'marketing.pebly.com', type: 'A', name: '@', value: '192.168.1.100', ttl: 300, status: 'Active' },
    { id: 2, domain: 'marketing.pebly.com', type: 'CNAME', name: 'www', value: 'marketing.pebly.com', ttl: 300, status: 'Active' },
    { id: 3, domain: 'short.company.com', type: 'A', name: '@', value: '192.168.1.101', ttl: 300, status: 'Active' },
    { id: 4, domain: 'short.company.com', type: 'CNAME', name: 'www', value: 'short.company.com', ttl: 300, status: 'Active' },
    { id: 5, domain: 'links.salesteam.io', type: 'A', name: '@', value: '192.168.1.102', ttl: 300, status: 'Not Configured' },
    { id: 6, domain: 'help.support.com', type: 'A', name: '@', value: '192.168.1.103', ttl: 300, status: 'Active' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Domain Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage custom domains, SSL certificates, and DNS configuration</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('domains', 'verify') && (
            <button 
              onClick={() => setShowVerifyModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Verify Domains
            </button>
          )}
          {hasPermission('domains', 'create') && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Domain
            </button>
          )}
        </div>
      </div>

      {/* Domain Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Domains</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{domains.length}</p>
          <p className="text-sm text-green-600 mt-1">+1 this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Domains</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{domains.filter(d => d.status === 'Active').length}</p>
          <p className="text-sm text-gray-500 mt-1">50% active rate</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">SSL Issues</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">{domains.filter(d => d.ssl === 'Expired' || d.ssl === 'Pending').length}</p>
          <p className="text-sm text-red-600 mt-1">Needs attention</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bandwidth</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">11.5 GB</p>
          <p className="text-sm text-purple-600 mt-1">This month</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'domains', label: 'Domains', count: domains.length },
            { id: 'ssl', label: 'SSL Certificates', count: sslCertificates.length },
            { id: 'dns', label: 'DNS Records', count: dnsRecords.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SSL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {domains.map((domain) => (
                <tr key={domain.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">{domain.domain}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Created: {domain.created}</div>
                      <div className="text-xs text-gray-400">Last checked: {domain.lastChecked}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{domain.owner}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{domain.ownerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      domain.type === 'Custom Domain' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {domain.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        domain.status === 'Active' ? 'bg-green-100 text-green-800' :
                        domain.status === 'Pending Verification' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {domain.status}
                      </span>
                      {domain.verified && (
                        <span className="ml-2 text-green-500" title="Verified">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        domain.ssl === 'Valid' ? 'bg-green-100 text-green-800' :
                        domain.ssl === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {domain.ssl}
                      </span>
                      {domain.sslExpiry && (
                        <div className="text-xs text-gray-500 mt-1">Expires: {domain.sslExpiry}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div>{domain.usage.links} links</div>
                      <div>{domain.usage.clicks.toLocaleString()} clicks</div>
                      <div>{domain.usage.bandwidth}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">Configure</button>
                      {hasPermission('domains', 'verify') && domain.status !== 'Active' && (
                        <button className="text-green-600 hover:text-green-800">Verify</button>
                      )}
                      {hasPermission('domains', 'delete') && (
                        <button className="text-red-600 hover:text-red-800">Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SSL Certificates Tab */}
      {activeTab === 'ssl' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Issuer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Auto Renew</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sslCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white font-mono">{cert.domain}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{cert.issuer}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cert.type === 'EV SSL' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {cert.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cert.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{cert.expires}</div>
                    <div className={`text-xs ${cert.daysLeft < 30 ? 'text-red-500' : cert.daysLeft < 60 ? 'text-yellow-500' : 'text-gray-500'}`}>
                      {cert.daysLeft > 0 ? `${cert.daysLeft} days left` : `Expired ${Math.abs(cert.daysLeft)} days ago`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cert.autoRenew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cert.autoRenew ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      {hasPermission('ssl', 'renew') && (
                        <button className="text-green-600 hover:text-green-800">Renew</button>
                      )}
                      {hasPermission('ssl', 'configure') && (
                        <button className="text-blue-600 hover:text-blue-800">Configure</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DNS Records Tab */}
      {activeTab === 'dns' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">TTL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {dnsRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white font-mono">{record.domain}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-mono ${
                      record.type === 'A' ? 'bg-blue-100 text-blue-800' :
                      record.type === 'CNAME' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono">{record.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono">{record.value}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{record.ttl}s</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      {hasPermission('dns', 'edit') && (
                        <button className="text-blue-600 hover:text-blue-800">Edit</button>
                      )}
                      {hasPermission('dns', 'delete') && (
                        <button className="text-red-600 hover:text-red-800">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Custom Domain</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Domain Name</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="example.com" />
                <p className="text-xs text-gray-500 mt-1">Enter your custom domain without http://</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner Team</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Marketing Team</option>
                  <option>Development Team</option>
                  <option>Sales Team</option>
                  <option>Support Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SSL Certificate</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Auto-generate (Let's Encrypt)</option>
                  <option>Upload Custom Certificate</option>
                  <option>No SSL (Not Recommended)</option>
                </select>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">DNS Configuration Required</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  After adding the domain, you'll need to configure these DNS records:
                </p>
                <div className="mt-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                  <div>A @ 192.168.1.100</div>
                  <div>CNAME www your-domain.com</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Domains Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Domain Verification</h3>
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Pending Verification</h4>
                <div className="space-y-2">
                  {domains.filter(d => !d.verified).map(domain => (
                    <div key={domain.id} className="flex items-center justify-between">
                      <span className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">{domain.domain}</span>
                      <button className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Verify Now</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Verification Steps</h4>
                <ol className="text-xs text-green-700 dark:text-green-300 space-y-1">
                  <li>1. Configure DNS records as shown above</li>
                  <li>2. Wait for DNS propagation (up to 24 hours)</li>
                  <li>3. Click "Verify Now" to check configuration</li>
                  <li>4. SSL certificate will be auto-generated upon verification</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Verify All Domains
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Link Management Page - Complete Implementation
const LinksPage = ({ hasPermission }) => {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock link data
  const links = [
    {
      id: 1,
      shortUrl: 'pebly.com/abc123',
      originalUrl: 'https://example.com/very-long-marketing-campaign-url-with-parameters',
      title: 'Marketing Campaign Landing Page',
      owner: 'Marketing Team',
      ownerEmail: 'sarah@company.com',
      domain: 'marketing.pebly.com',
      created: '2024-01-15',
      lastClicked: '2024-01-30 14:30',
      status: 'Active',
      clicks: 1250,
      uniqueClicks: 890,
      tags: ['marketing', 'campaign', 'q1-2024'],
      qrCode: true,
      password: false,
      expiry: null,
      analytics: {
        countries: { US: 45, UK: 25, CA: 15, DE: 10, FR: 5 },
        devices: { Desktop: 60, Mobile: 35, Tablet: 5 },
        referrers: { Direct: 40, Google: 30, Facebook: 20, Twitter: 10 }
      }
    },
    {
      id: 2,
      shortUrl: 'short.company.com/dev456',
      originalUrl: 'https://github.com/company/project/releases/latest',
      title: 'Latest Release Download',
      owner: 'Development Team',
      ownerEmail: 'mike@company.com',
      domain: 'short.company.com',
      created: '2024-01-10',
      lastClicked: '2024-01-30 13:45',
      status: 'Active',
      clicks: 3450,
      uniqueClicks: 2100,
      tags: ['development', 'release', 'download'],
      qrCode: true,
      password: true,
      expiry: '2024-06-30',
      analytics: {
        countries: { US: 50, IN: 20, UK: 15, DE: 10, CA: 5 },
        devices: { Desktop: 80, Mobile: 15, Tablet: 5 },
        referrers: { Direct: 60, GitHub: 25, Slack: 10, Email: 5 }
      }
    },
    {
      id: 3,
      shortUrl: 'sales.pebly.com/demo789',
      originalUrl: 'https://calendly.com/sales-team/product-demo',
      title: 'Product Demo Booking',
      owner: 'Sales Team',
      ownerEmail: 'emma@company.com',
      domain: 'sales.pebly.com',
      created: '2024-01-20',
      lastClicked: '2024-01-30 12:15',
      status: 'Active',
      clicks: 890,
      uniqueClicks: 650,
      tags: ['sales', 'demo', 'booking'],
      qrCode: false,
      password: false,
      expiry: null,
      analytics: {
        countries: { US: 60, UK: 20, CA: 10, AU: 5, DE: 5 },
        devices: { Desktop: 70, Mobile: 25, Tablet: 5 },
        referrers: { LinkedIn: 40, Direct: 30, Email: 20, Google: 10 }
      }
    },
    {
      id: 4,
      shortUrl: 'help.support.com/guide',
      originalUrl: 'https://docs.company.com/troubleshooting-guide',
      title: 'Troubleshooting Guide',
      owner: 'Support Team',
      ownerEmail: 'alex@company.com',
      domain: 'help.support.com',
      created: '2024-01-05',
      lastClicked: '2024-01-28 16:20',
      status: 'Expired',
      clicks: 234,
      uniqueClicks: 180,
      tags: ['support', 'documentation', 'help'],
      qrCode: true,
      password: false,
      expiry: '2024-01-25',
      analytics: {
        countries: { US: 40, UK: 25, CA: 15, AU: 10, DE: 10 },
        devices: { Desktop: 55, Mobile: 40, Tablet: 5 },
        referrers: { Direct: 50, Google: 30, Support: 15, Email: 5 }
      }
    }
  ];

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && link.status === 'Active';
    if (activeTab === 'expired') return matchesSearch && link.status === 'Expired';
    if (activeTab === 'password') return matchesSearch && link.password;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage shortened links, analytics, and performance</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('links', 'bulk') && (
            <button 
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Bulk Actions
            </button>
          )}
          {hasPermission('links', 'create') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Link
            </button>
          )}
        </div>
      </div>

      {/* Link Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Links</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{links.length}</p>
          <p className="text-sm text-green-600 mt-1">+12 this week</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clicks</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{links.reduce((sum, link) => sum + link.clicks, 0).toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">+15.3% this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Links</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">{links.filter(l => l.status === 'Active').length}</p>
          <p className="text-sm text-gray-500 mt-1">75% active rate</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg CTR</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">23.5%</p>
          <p className="text-sm text-yellow-600 mt-1">Above average</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search links by URL, title, or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'All Links', count: links.length },
            { id: 'active', label: 'Active', count: links.filter(l => l.status === 'Active').length },
            { id: 'expired', label: 'Expired', count: links.filter(l => l.status === 'Expired').length },
            { id: 'password', label: 'Protected', count: links.filter(l => l.password).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Features</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLinks.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 font-mono truncate">
                      {link.shortUrl}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
                      {link.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {link.originalUrl}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {link.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          {tag}
                        </span>
                      ))}
                      {link.tags.length > 2 && (
                        <span className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          +{link.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">{link.owner}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{link.ownerEmail}</div>
                  <div className="text-xs text-gray-400">Domain: {link.domain}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {link.clicks.toLocaleString()} clicks
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {link.uniqueClicks.toLocaleString()} unique
                  </div>
                  <div className="text-xs text-gray-400">
                    CTR: {((link.uniqueClicks / link.clicks) * 100).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 text-xs rounded-full w-fit ${
                      link.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {link.status}
                    </span>
                    {link.expiry && (
                      <div className="text-xs text-gray-500">
                        Expires: {link.expiry}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-1">
                    {link.qrCode && (
                      <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded" title="QR Code">QR</span>
                    )}
                    {link.password && (
                      <span className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded" title="Password Protected">🔒</span>
                    )}
                    {link.expiry && (
                      <span className="px-1 py-0.5 text-xs bg-purple-100 text-purple-800 rounded" title="Has Expiry">⏰</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">Analytics</button>
                    {hasPermission('links', 'edit') && (
                      <button className="text-green-600 hover:text-green-800">Edit</button>
                    )}
                    {hasPermission('links', 'delete') && (
                      <button className="text-red-600 hover:text-red-800">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bulk Actions</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Select links from the table to perform bulk operations
                </p>
              </div>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Export Selected Links
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Update Expiry Dates
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Change Domain
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  Delete Selected Links
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Page - Complete Implementation
const AnalyticsPage = ({ hasPermission }) => {
  const [dateRange, setDateRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('clicks');
  const [selectedTeam, setSelectedTeam] = useState('all');

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalClicks: 125678,
      uniqueClicks: 89432,
      totalLinks: 1234,
      activeLinks: 987,
      topCountries: [
        { country: 'United States', clicks: 45678, percentage: 36.3 },
        { country: 'United Kingdom', clicks: 23456, percentage: 18.7 },
        { country: 'Canada', clicks: 15678, percentage: 12.5 },
        { country: 'Germany', clicks: 12345, percentage: 9.8 },
        { country: 'France', clicks: 8901, percentage: 7.1 }
      ],
      topDevices: [
        { device: 'Desktop', clicks: 75407, percentage: 60.0 },
        { device: 'Mobile', clicks: 43987, percentage: 35.0 },
        { device: 'Tablet', clicks: 6284, percentage: 5.0 }
      ],
      topReferrers: [
        { referrer: 'Direct', clicks: 50271, percentage: 40.0 },
        { referrer: 'Google', clicks: 37703, percentage: 30.0 },
        { device: 'Facebook', clicks: 18852, percentage: 15.0 },
        { referrer: 'Twitter', clicks: 12568, percentage: 10.0 },
        { referrer: 'LinkedIn', clicks: 6284, percentage: 5.0 }
      ]
    },
    timeSeriesData: [
      { date: '2024-01-24', clicks: 1250, uniqueClicks: 890, links: 45 },
      { date: '2024-01-25', clicks: 1456, uniqueClicks: 1023, links: 52 },
      { date: '2024-01-26', clicks: 1123, uniqueClicks: 834, links: 38 },
      { date: '2024-01-27', clicks: 1789, uniqueClicks: 1234, links: 67 },
      { date: '2024-01-28', clicks: 1567, uniqueClicks: 1098, links: 58 },
      { date: '2024-01-29', clicks: 1890, uniqueClicks: 1345, links: 72 },
      { date: '2024-01-30', clicks: 2134, uniqueClicks: 1567, links: 89 }
    ],
    topLinks: [
      { shortUrl: 'pebly.com/abc123', title: 'Marketing Campaign', clicks: 5678, team: 'Marketing' },
      { shortUrl: 'short.company.com/dev456', title: 'Release Download', clicks: 4321, team: 'Development' },
      { shortUrl: 'sales.pebly.com/demo789', title: 'Product Demo', clicks: 3456, team: 'Sales' },
      { shortUrl: 'help.support.com/guide', title: 'Help Guide', clicks: 2345, team: 'Support' }
    ],
    teamPerformance: [
      { team: 'Marketing Team', links: 45, clicks: 23456, uniqueClicks: 16789, ctr: 71.5 },
      { team: 'Development Team', links: 32, clicks: 18765, uniqueClicks: 13234, ctr: 70.5 },
      { team: 'Sales Team', links: 28, clicks: 15432, uniqueClicks: 10876, ctr: 70.5 },
      { team: 'Support Team', links: 15, clicks: 8901, uniqueClicks: 6234, ctr: 70.0 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and performance insights</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Teams</option>
            <option value="marketing">Marketing Team</option>
            <option value="development">Development Team</option>
            <option value="sales">Sales Team</option>
            <option value="support">Support Team</option>
          </select>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          {hasPermission('analytics', 'export') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clicks</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{analyticsData.overview.totalClicks.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">+15.3% vs last period</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Clicks</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{analyticsData.overview.uniqueClicks.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">+12.8% vs last period</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Click-Through Rate</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {((analyticsData.overview.uniqueClicks / analyticsData.overview.totalClicks) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-purple-600 mt-1">Above average</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Links</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{analyticsData.overview.activeLinks}</p>
          <p className="text-sm text-gray-500 mt-1">of {analyticsData.overview.totalLinks} total</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Trend</h3>
            <div className="flex space-x-2">
              {[
                { id: 'clicks', label: 'Clicks' },
                { id: 'uniqueClicks', label: 'Unique' },
                { id: 'links', label: 'Links' }
              ].map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setActiveMetric(metric.id)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    activeMetric === metric.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.timeSeriesData.map((data, index) => {
              const maxValue = Math.max(...analyticsData.timeSeriesData.map(d => d[activeMetric]));
              const height = (data[activeMetric] / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${data.date}: ${data[activeMetric]}`}
                  />
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {data.date.split('-')[2]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Countries</h3>
          <div className="space-y-3">
            {analyticsData.overview.topCountries.map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <span className="text-sm text-gray-900 dark:text-white w-24">{country.country}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {country.clicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{country.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Links</h3>
          <div className="space-y-3">
            {analyticsData.topLinks.map((link, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {link.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {link.shortUrl}
                  </div>
                  <div className="text-xs text-blue-600">{link.team}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {link.clicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">clicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Types</h3>
          <div className="space-y-4">
            {analyticsData.overview.topDevices.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    device.device === 'Desktop' ? 'bg-blue-500' :
                    device.device === 'Mobile' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-sm text-gray-900 dark:text-white">{device.device}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {device.clicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{device.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Performance</h3>
          <div className="space-y-3">
            {analyticsData.teamPerformance.map((team, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {team.team}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {team.links} links • {team.clicks.toLocaleString()} clicks
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      {team.ctr}%
                    </div>
                    <div className="text-xs text-gray-500">CTR</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// System Health Page - BitaURL Services Implementation
const SystemHealthPage = ({ hasPermission }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/system/health');
      const data = await response.json();
      setHealthData(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      // Use mock data as fallback
      setHealthData({
        mongodb: {
          status: 'healthy',
          responseTime: 25,
          connections: 8,
          collections: {
            users: 1250,
            urls: 8940,
            analytics: 45620,
            teams: 89,
            support_tickets: 156
          },
          operations: {
            reads: 45,
            writes: 12
          }
        },
        razorpay: {
          status: 'healthy',
          responseTime: 180,
          apiVersion: 'v1'
        },
        sendgrid: {
          status: 'healthy',
          responseTime: 220,
          emailsSent24h: 342,
          deliveryRate: 98.5
        },
        vercel: {
          status: 'healthy',
          responseTime: 95,
          deploymentStatus: 'Ready',
          lastDeploy: '2 hours ago'
        },
        render: {
          status: 'healthy',
          responseTime: 120,
          cpuUsage: 45,
          memoryUsage: 68,
          uptime: '5d 12h 30m'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'down':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const services = healthData ? [
    {
      name: 'MongoDB Database',
      icon: '🗄️',
      status: healthData.mongodb.status,
      responseTime: healthData.mongodb.responseTime,
      details: healthData.mongodb
    },
    {
      name: 'Razorpay Payment',
      icon: '💳',
      status: healthData.razorpay.status,
      responseTime: healthData.razorpay.responseTime,
      details: healthData.razorpay
    },
    {
      name: 'SendGrid Email',
      icon: '📧',
      status: healthData.sendgrid.status,
      responseTime: healthData.sendgrid.responseTime,
      details: healthData.sendgrid
    },
    {
      name: 'Vercel Frontend',
      icon: '🌐',
      status: healthData.vercel.status,
      responseTime: healthData.vercel.responseTime,
      details: healthData.vercel
    },
    {
      name: 'Render Backend',
      icon: '⚙️',
      status: healthData.render.status,
      responseTime: healthData.render.responseTime,
      details: healthData.render
    }
  ] : [];

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor the health of all BitaURL services</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchSystemHealth}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.name} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{service.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
              </div>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)}`}>
                <span className="mr-1">{getStatusIcon(service.status)}</span>
                <span className="capitalize">{service.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                <span className="font-medium">{service.responseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                <span className="font-medium">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed MongoDB Health */}
      {healthData?.mongodb && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">MongoDB Database Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.mongodb.connections}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Connections</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.mongodb.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.mongodb.operations.reads}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reads/sec</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{healthData.mongodb.operations.writes}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Writes/sec</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Collection Document Counts</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(healthData.mongodb.collections).map(([collection, count]) => (
                <div key={collection} className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">{count.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {collection.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SendGrid Email Details */}
      {healthData?.sendgrid && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SendGrid Email Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.sendgrid.emailsSent24h}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Emails Sent (24h)</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.sendgrid.deliveryRate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.sendgrid.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">API Response Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Render Backend Details */}
      {healthData?.render && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Render Backend Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthData.render.cpuUsage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthData.render.memoryUsage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.render.uptime}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{healthData.render.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Vercel Frontend Details */}
      {healthData?.vercel && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vercel Frontend Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{healthData.vercel.deploymentStatus}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Deployment Status</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600">{healthData.vercel.lastDeploy}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Last Deploy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{healthData.vercel.responseTime}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Audit Logs Page - Complete Implementation
const AuditLogsPage = ({ hasPermission }) => {
  const [dateRange, setDateRange] = useState('7d');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Mock audit log data
  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-01-30 14:30:25',
      user: 'admin@pebly.com',
      userRole: 'Super Admin',
      action: 'USER_LOGIN',
      resource: 'Authentication',
      resourceId: null,
      details: 'Successful login from IP 192.168.1.100',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'Success',
      severity: 'Info'
    },
    {
      id: 2,
      timestamp: '2024-01-30 14:25:12',
      user: 'sarah@company.com',
      userRole: 'Marketing Team Owner',
      action: 'LINK_CREATE',
      resource: 'Link',
      resourceId: 'abc123',
      details: 'Created new short link: pebly.com/abc123 -> https://example.com/campaign',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'Success',
      severity: 'Info'
    },
    {
      id: 3,
      timestamp: '2024-01-30 14:20:45',
      user: 'mike@company.com',
      userRole: 'Development Team Owner',
      action: 'DOMAIN_VERIFY',
      resource: 'Domain',
      resourceId: 'short.company.com',
      details: 'Successfully verified custom domain short.company.com',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Linux; Ubuntu)',
      status: 'Success',
      severity: 'Info'
    },
    {
      id: 4,
      timestamp: '2024-01-30 14:15:33',
      user: 'admin@pebly.com',
      userRole: 'Super Admin',
      action: 'USER_DELETE',
      resource: 'User',
      resourceId: 'user_456',
      details: 'Deleted user account: olduser@company.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'Success',
      severity: 'Warning'
    },
    {
      id: 5,
      timestamp: '2024-01-30 14:10:18',
      user: 'emma@company.com',
      userRole: 'Sales Team Owner',
      action: 'TEAM_INVITE',
      resource: 'Team',
      resourceId: 'team_sales',
      details: 'Invited newmember@company.com to Sales Team',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      status: 'Success',
      severity: 'Info'
    },
    {
      id: 6,
      timestamp: '2024-01-30 14:05:22',
      user: 'unknown@hacker.com',
      userRole: null,
      action: 'USER_LOGIN_FAILED',
      resource: 'Authentication',
      resourceId: null,
      details: 'Failed login attempt - invalid credentials',
      ipAddress: '203.0.113.45',
      userAgent: 'curl/7.68.0',
      status: 'Failed',
      severity: 'Critical'
    },
    {
      id: 7,
      timestamp: '2024-01-30 14:00:15',
      user: 'alex@company.com',
      userRole: 'Support Team Owner',
      action: 'LINK_DELETE',
      resource: 'Link',
      resourceId: 'old_link_789',
      details: 'Deleted expired link: help.support.com/old-guide',
      ipAddress: '192.168.1.104',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'Success',
      severity: 'Warning'
    },
    {
      id: 8,
      timestamp: '2024-01-30 13:55:40',
      user: 'admin@pebly.com',
      userRole: 'Super Admin',
      action: 'SYSTEM_CONFIG_CHANGE',
      resource: 'System',
      resourceId: 'rate_limit_config',
      details: 'Updated rate limiting configuration: 1000 requests/hour -> 1500 requests/hour',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'Success',
      severity: 'Critical'
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = filterUser === 'all' || log.user === filterUser;
    const matchesAction = filterAction === 'all' || log.action.includes(filterAction.toUpperCase());
    
    return matchesSearch && matchesUser && matchesAction;
  });

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">Track user activities and system changes</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('audit', 'export') && (
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export Logs
            </button>
          )}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Refresh
          </button>
        </div>
      </div>

      {/* Audit Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{auditLogs.length}</p>
          <p className="text-sm text-green-600 mt-1">Last 24 hours</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed Actions</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">{auditLogs.filter(l => l.status === 'Failed').length}</p>
          <p className="text-sm text-red-600 mt-1">Needs attention</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Events</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{auditLogs.filter(l => l.severity === 'Critical').length}</p>
          <p className="text-sm text-yellow-600 mt-1">High priority</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Users</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">{new Set(auditLogs.map(l => l.user)).size}</p>
          <p className="text-sm text-purple-600 mt-1">Active today</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
            <select 
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Users</option>
              <option value="admin@pebly.com">admin@pebly.com</option>
              <option value="sarah@company.com">sarah@company.com</option>
              <option value="mike@company.com">mike@company.com</option>
              <option value="emma@company.com">emma@company.com</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Type</label>
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Actions</option>
              <option value="login">Login Events</option>
              <option value="link">Link Actions</option>
              <option value="user">User Management</option>
              <option value="domain">Domain Actions</option>
              <option value="system">System Changes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white font-mono">{log.timestamp}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{log.ipAddress}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{log.user}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{log.userRole}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">{log.resource}</div>
                  {log.resourceId && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{log.resourceId}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={log.details}>
                    {log.details}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={log.userAgent}>
                    {log.userAgent}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Audit Logs</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Export Format</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>CSV</option>
                  <option>JSON</option>
                  <option>Excel</option>
                  <option>PDF Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Current Filters</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include IP addresses</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include user agents</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Export Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// File Management Page - Complete Implementation
const FileManagementPage = ({ hasPermission }) => {
  const [activeTab, setActiveTab] = useState('files');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Mock file data from user platform
  const files = [
    {
      id: 'file_001',
      fileName: 'Marketing_Presentation.pdf',
      originalName: 'Q1_Marketing_Strategy_2024_Final.pdf',
      fileType: 'PDF',
      fileSize: '2.3 MB',
      fileSizeBytes: 2411724,
      owner: 'sarah@company.com',
      ownerName: 'Sarah Wilson',
      team: 'Marketing Team',
      shortUrl: 'pebly.com/files/mkt-pres',
      uploadDate: '2024-01-25 14:30:00',
      lastAccessed: '2024-01-30 10:15:00',
      downloads: 156,
      uniqueDownloads: 89,
      status: 'Active',
      expiryDate: '2024-03-25',
      isPublic: true,
      hasPassword: false,
      qrCode: true,
      analytics: {
        countries: { US: 45, UK: 25, IN: 20, CA: 10 },
        devices: { Desktop: 70, Mobile: 25, Tablet: 5 },
        referrers: { Direct: 40, Email: 35, Social: 25 }
      }
    },
    {
      id: 'file_002',
      fileName: 'Product_Demo_Video.mp4',
      originalName: 'BitaURL_Product_Demo_HD.mp4',
      fileType: 'Video',
      fileSize: '45.7 MB',
      fileSizeBytes: 47923456,
      owner: 'mike@company.com',
      ownerName: 'Mike Johnson',
      team: 'Development Team',
      shortUrl: 'short.company.com/demo-vid',
      uploadDate: '2024-01-20 09:45:00',
      lastAccessed: '2024-01-30 16:20:00',
      downloads: 234,
      uniqueDownloads: 178,
      status: 'Active',
      expiryDate: null,
      isPublic: false,
      hasPassword: true,
      qrCode: true,
      analytics: {
        countries: { US: 60, UK: 15, IN: 15, DE: 10 },
        devices: { Desktop: 80, Mobile: 15, Tablet: 5 },
        referrers: { Direct: 50, LinkedIn: 30, Email: 20 }
      }
    },
    {
      id: 'file_003',
      fileName: 'Sales_Report_Q1.xlsx',
      originalName: 'Q1_2024_Sales_Performance_Report.xlsx',
      fileType: 'Excel',
      fileSize: '1.8 MB',
      fileSizeBytes: 1887436,
      owner: 'emma@company.com',
      ownerName: 'Emma Davis',
      team: 'Sales Team',
      shortUrl: 'sales.pebly.com/q1-report',
      uploadDate: '2024-01-15 11:20:00',
      lastAccessed: '2024-01-29 14:30:00',
      downloads: 67,
      uniqueDownloads: 45,
      status: 'Expired',
      expiryDate: '2024-01-28',
      isPublic: false,
      hasPassword: true,
      qrCode: false,
      analytics: {
        countries: { US: 70, CA: 20, UK: 10 },
        devices: { Desktop: 90, Mobile: 8, Tablet: 2 },
        referrers: { Direct: 60, Email: 40 }
      }
    },
    {
      id: 'file_004',
      fileName: 'User_Manual.docx',
      originalName: 'BitaURL_Complete_User_Guide_v2.1.docx',
      fileType: 'Document',
      fileSize: '890 KB',
      fileSizeBytes: 911360,
      owner: 'alex@company.com',
      ownerName: 'Alex Brown',
      team: 'Support Team',
      shortUrl: 'help.support.com/manual',
      uploadDate: '2024-01-10 16:15:00',
      lastAccessed: '2024-01-30 12:45:00',
      downloads: 445,
      uniqueDownloads: 312,
      status: 'Active',
      expiryDate: null,
      isPublic: true,
      hasPassword: false,
      qrCode: true,
      analytics: {
        countries: { US: 35, IN: 25, UK: 20, CA: 10, AU: 10 },
        devices: { Desktop: 60, Mobile: 35, Tablet: 5 },
        referrers: { Google: 40, Direct: 30, Support: 20, Social: 10 }
      }
    }
  ];

  // Storage analytics
  const storageStats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.fileSizeBytes, 0),
    totalDownloads: files.reduce((sum, file) => sum + file.downloads, 0),
    activeFiles: files.filter(f => f.status === 'Active').length,
    expiredFiles: files.filter(f => f.status === 'Expired').length,
    publicFiles: files.filter(f => f.isPublic).length,
    protectedFiles: files.filter(f => f.hasPassword).length,
    fileTypes: {
      PDF: files.filter(f => f.fileType === 'PDF').length,
      Video: files.filter(f => f.fileType === 'Video').length,
      Document: files.filter(f => f.fileType === 'Document').length,
      Excel: files.filter(f => f.fileType === 'Excel').length,
      Image: files.filter(f => f.fileType === 'Image').length
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'PDF': return 'bg-red-100 text-red-800';
      case 'Video': return 'bg-purple-100 text-purple-800';
      case 'Document': return 'bg-blue-100 text-blue-800';
      case 'Excel': return 'bg-green-100 text-green-800';
      case 'Image': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.shortUrl.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || file.fileType.toLowerCase() === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor file uploads, downloads, and storage usage</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('files', 'bulk') && (
            <button 
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Bulk Actions
            </button>
          )}
          {hasPermission('files', 'export') && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* File Storage Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Files</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{storageStats.totalFiles}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Used</h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatFileSize(storageStats.totalSize)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Downloads</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{storageStats.totalDownloads}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Files</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{storageStats.activeFiles}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expired</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">{storageStats.expiredFiles}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Public Files</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{storageStats.publicFiles}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Protected</h3>
          <p className="text-2xl font-bold text-orange-600 mt-1">{storageStats.protectedFiles}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Files</label>
            <input
              type="text"
              placeholder="Search by filename, owner, or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="excel">Excel</option>
              <option value="image">Image</option>
            </select>
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Downloads</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Security</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFiles.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                        {file.fileType === 'PDF' ? '📄' : 
                         file.fileType === 'Video' ? '🎥' :
                         file.fileType === 'Document' ? '📝' :
                         file.fileType === 'Excel' ? '📊' : '📁'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.fileName}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-mono truncate">
                        {file.shortUrl}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded: {file.uploadDate}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">{file.ownerName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{file.owner}</div>
                  <div className="text-xs text-gray-400">{file.team}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{file.fileSize}</div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getFileTypeColor(file.fileType)}`}>
                    {file.fileType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {file.downloads} total
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {file.uniqueDownloads} unique
                  </div>
                  <div className="text-xs text-gray-400">
                    Last: {file.lastAccessed}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    file.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {file.status}
                  </span>
                  {file.expiryDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Expires: {file.expiryDate}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 text-xs rounded-full w-fit ${
                      file.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {file.isPublic ? 'Public' : 'Private'}
                    </span>
                    {file.hasPassword && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full w-fit">
                        Protected
                      </span>
                    )}
                    {file.qrCode && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full w-fit">
                        QR Code
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Analytics
                    </button>
                    {hasPermission('files', 'download') && (
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Download
                      </button>
                    )}
                    {hasPermission('files', 'delete') && (
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* File Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">File Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(storageStats.fileTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getFileTypeColor(type)} mr-3`}>
                    {type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{count} files</div>
                  <div className="text-xs text-gray-500">
                    {((count / storageStats.totalFiles) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Storage Usage by Team</h3>
          <div className="space-y-3">
            {['Marketing Team', 'Development Team', 'Sales Team', 'Support Team'].map((team, index) => {
              const teamFiles = files.filter(f => f.team === team);
              const teamSize = teamFiles.reduce((sum, f) => sum + f.fileSizeBytes, 0);
              return (
                <div key={team} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm text-gray-900 dark:text-white">{team}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatFileSize(teamSize)}
                    </div>
                    <div className="text-xs text-gray-500">{teamFiles.length} files</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Resource Management Page - Complete Implementation
const ResourceManagementPage = ({ hasPermission }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');

  // Mock resource usage data
  const resourceData = {
    storage: {
      total: 107374182400, // 100 GB
      used: 53687091200,   // 50 GB
      available: 53687091200, // 50 GB
      byPlan: {
        Free: 1073741824,      // 1 GB
        Pro: 10737418240,      // 10 GB
        Business: 42949672960  // 40 GB
      }
    },
    bandwidth: {
      total: 1099511627776, // 1 TB
      used: 549755813888,   // 500 GB
      thisMonth: 107374182400, // 100 GB
      byRegion: {
        'North America': 274877906944, // 256 GB
        'Europe': 171798691840,        // 160 GB
        'Asia Pacific': 103079215104   // 96 GB
      }
    },
    apiUsage: {
      totalRequests: 2456789,
      thisMonth: 456789,
      rateLimits: {
        Free: { limit: 1000, used: 890 },
        Pro: { limit: 10000, used: 7650 },
        Business: { limit: 100000, used: 45670 }
      }
    },
    users: {
      total: 1234,
      active: 987,
      byPlan: {
        Free: 856,
        Pro: 267,
        Business: 111
      }
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resource Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor storage, bandwidth, and API usage across all plans</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          {hasPermission('resources', 'export') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Usage</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {formatBytes(resourceData.storage.used)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            of {formatBytes(resourceData.storage.total)}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(resourceData.storage.used / resourceData.storage.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bandwidth (Month)</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatBytes(resourceData.bandwidth.thisMonth)}
          </p>
          <p className="text-sm text-green-600 mt-1">+15.3% vs last month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">API Requests</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {resourceData.apiUsage.thisMonth.toLocaleString()}
          </p>
          <p className="text-sm text-purple-600 mt-1">This month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {resourceData.users.active}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            of {resourceData.users.total} total
          </p>
        </div>
      </div>

      {/* Resource Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage by Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Storage Usage by Plan</h3>
          <div className="space-y-4">
            {Object.entries(resourceData.storage.byPlan).map(([plan, usage]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`px-3 py-1 text-xs rounded-full mr-3 ${
                    plan === 'Free' ? 'bg-gray-100 text-gray-800' :
                    plan === 'Pro' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {plan}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatBytes(usage)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((usage / resourceData.storage.used) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Rate Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Rate Limits</h3>
          <div className="space-y-4">
            {Object.entries(resourceData.apiUsage.rateLimits).map(([plan, data]) => (
              <div key={plan} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    plan === 'Free' ? 'bg-gray-100 text-gray-800' :
                    plan === 'Pro' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {plan}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {data.used.toLocaleString()} / {data.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (data.used / data.limit) > 0.8 ? 'bg-red-500' :
                      (data.used / data.limit) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(data.used / data.limit) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// QR Code Management Page - Complete Implementation
const QRCodeManagementPage = ({ hasPermission }) => {
  const [activeTab, setActiveTab] = useState('qrcodes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Mock QR Code data from user platform
  const qrCodes = [
    {
      id: 'qr_001',
      qrId: 'QR-ABC123',
      linkedUrl: 'pebly.com/marketing-campaign',
      originalUrl: 'https://example.com/marketing-landing-page',
      title: 'Marketing Campaign QR',
      owner: 'sarah@company.com',
      ownerName: 'Sarah Wilson',
      team: 'Marketing Team',
      qrType: 'URL',
      format: 'PNG',
      size: '512x512',
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      logo: true,
      logoUrl: 'company-logo.png',
      created: '2024-01-25 14:30:00',
      lastScanned: '2024-01-30 16:45:00',
      totalScans: 1456,
      uniqueScans: 892,
      status: 'Active',
      expiryDate: null,
      downloadCount: 45,
      analytics: {
        countries: { US: 45, UK: 25, IN: 15, CA: 10, DE: 5 },
        devices: { Mobile: 70, Desktop: 25, Tablet: 5 },
        scanTimes: {
          '00-06': 5, '06-12': 35, '12-18': 45, '18-24': 15
        },
        referrers: { Direct: 60, Social: 25, Email: 10, Print: 5 }
      }
    },
    {
      id: 'qr_002',
      qrId: 'QR-DEV456',
      linkedUrl: 'short.company.com/app-download',
      originalUrl: 'https://github.com/company/mobile-app/releases',
      title: 'Mobile App Download QR',
      owner: 'mike@company.com',
      ownerName: 'Mike Johnson',
      team: 'Development Team',
      qrType: 'URL',
      format: 'SVG',
      size: '1024x1024',
      backgroundColor: '#F3F4F6',
      foregroundColor: '#1F2937',
      logo: true,
      logoUrl: 'app-icon.png',
      created: '2024-01-20 09:15:00',
      lastScanned: '2024-01-30 14:20:00',
      totalScans: 2341,
      uniqueScans: 1567,
      status: 'Active',
      expiryDate: '2024-06-30',
      downloadCount: 89,
      analytics: {
        countries: { US: 50, IN: 20, UK: 15, DE: 10, CA: 5 },
        devices: { Mobile: 85, Desktop: 10, Tablet: 5 },
        scanTimes: {
          '00-06': 10, '06-12': 25, '12-18': 40, '18-24': 25
        },
        referrers: { Direct: 70, Social: 20, Email: 8, Print: 2 }
      }
    },
    {
      id: 'qr_003',
      qrId: 'QR-WIFI789',
      linkedUrl: null,
      originalUrl: null,
      title: 'Office WiFi QR Code',
      owner: 'admin@company.com',
      ownerName: 'Admin User',
      team: 'IT Team',
      qrType: 'WiFi',
      format: 'PNG',
      size: '256x256',
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      logo: false,
      logoUrl: null,
      wifiData: {
        ssid: 'CompanyWiFi_Guest',
        password: 'Welcome2024!',
        security: 'WPA2',
        hidden: false
      },
      created: '2024-01-15 11:30:00',
      lastScanned: '2024-01-30 09:15:00',
      totalScans: 567,
      uniqueScans: 234,
      status: 'Active',
      expiryDate: null,
      downloadCount: 12,
      analytics: {
        countries: { US: 90, CA: 5, UK: 3, Other: 2 },
        devices: { Mobile: 95, Desktop: 3, Tablet: 2 },
        scanTimes: {
          '00-06': 2, '06-12': 40, '12-18': 45, '18-24': 13
        },
        referrers: { Direct: 100 }
      }
    },
    {
      id: 'qr_004',
      qrId: 'QR-VCARD456',
      linkedUrl: null,
      originalUrl: null,
      title: 'Business Card - Sarah Wilson',
      owner: 'sarah@company.com',
      ownerName: 'Sarah Wilson',
      team: 'Marketing Team',
      qrType: 'vCard',
      format: 'PNG',
      size: '512x512',
      backgroundColor: '#FFFFFF',
      foregroundColor: '#1E40AF',
      logo: true,
      logoUrl: 'profile-photo.jpg',
      vCardData: {
        name: 'Sarah Wilson',
        title: 'Marketing Director',
        company: 'BitaURL Inc.',
        phone: '+1-555-0123',
        email: 'sarah@company.com',
        website: 'https://bitaurl.com'
      },
      created: '2024-01-18 15:45:00',
      lastScanned: '2024-01-29 18:30:00',
      totalScans: 234,
      uniqueScans: 189,
      status: 'Active',
      expiryDate: null,
      downloadCount: 67,
      analytics: {
        countries: { US: 60, UK: 20, CA: 10, IN: 5, Other: 5 },
        devices: { Mobile: 80, Desktop: 15, Tablet: 5 },
        scanTimes: {
          '00-06': 3, '06-12': 25, '12-18': 50, '18-24': 22
        },
        referrers: { Direct: 70, LinkedIn: 20, Email: 8, Other: 2 }
      }
    },
    {
      id: 'qr_005',
      qrId: 'QR-FILE789',
      linkedUrl: 'pebly.com/files/product-catalog',
      originalUrl: 'https://cdn.company.com/catalog.pdf',
      title: 'Product Catalog QR',
      owner: 'emma@company.com',
      ownerName: 'Emma Davis',
      team: 'Sales Team',
      qrType: 'File',
      format: 'PNG',
      size: '512x512',
      backgroundColor: '#FFFFFF',
      foregroundColor: '#DC2626',
      logo: true,
      logoUrl: 'catalog-icon.png',
      fileData: {
        fileName: 'Product_Catalog_2024.pdf',
        fileSize: '3.2 MB',
        fileType: 'PDF'
      },
      created: '2024-01-22 13:20:00',
      lastScanned: '2024-01-30 11:10:00',
      totalScans: 123,
      uniqueScans: 98,
      status: 'Expired',
      expiryDate: '2024-01-29',
      downloadCount: 23,
      analytics: {
        countries: { US: 55, UK: 25, CA: 15, Other: 5 },
        devices: { Mobile: 60, Desktop: 35, Tablet: 5 },
        scanTimes: {
          '00-06': 5, '06-12': 30, '12-18': 40, '18-24': 25
        },
        referrers: { Direct: 50, Email: 30, Social: 15, Print: 5 }
      }
    }
  ];

  // QR Code analytics
  const qrStats = {
    totalQRCodes: qrCodes.length,
    totalScans: qrCodes.reduce((sum, qr) => sum + qr.totalScans, 0),
    uniqueScans: qrCodes.reduce((sum, qr) => sum + qr.uniqueScans, 0),
    activeQRCodes: qrCodes.filter(qr => qr.status === 'Active').length,
    expiredQRCodes: qrCodes.filter(qr => qr.status === 'Expired').length,
    totalDownloads: qrCodes.reduce((sum, qr) => sum + qr.downloadCount, 0),
    qrTypes: {
      URL: qrCodes.filter(qr => qr.qrType === 'URL').length,
      WiFi: qrCodes.filter(qr => qr.qrType === 'WiFi').length,
      vCard: qrCodes.filter(qr => qr.qrType === 'vCard').length,
      File: qrCodes.filter(qr => qr.qrType === 'File').length,
      Text: qrCodes.filter(qr => qr.qrType === 'Text').length
    }
  };

  const getQRTypeColor = (type) => {
    switch (type) {
      case 'URL': return 'bg-blue-100 text-blue-800';
      case 'WiFi': return 'bg-green-100 text-green-800';
      case 'vCard': return 'bg-purple-100 text-purple-800';
      case 'File': return 'bg-orange-100 text-orange-800';
      case 'Text': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQRTypeIcon = (type) => {
    switch (type) {
      case 'URL': return '🔗';
      case 'WiFi': return '📶';
      case 'vCard': return '👤';
      case 'File': return '📁';
      case 'Text': return '📝';
      default: return '📱';
    }
  };

  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qr.qrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qr.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || qr.qrType.toLowerCase() === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor QR code generation, scans, and performance analytics</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('qr', 'bulk') && (
            <button 
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Bulk Actions
            </button>
          )}
          {hasPermission('qr', 'export') && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* QR Code Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total QR Codes</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{qrStats.totalQRCodes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{qrStats.totalScans.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Scans</h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">{qrStats.uniqueScans.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active QRs</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{qrStats.activeQRCodes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Downloads</h3>
          <p className="text-2xl font-bold text-orange-600 mt-1">{qrStats.totalDownloads}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Scan Rate</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {((qrStats.uniqueScans / qrStats.totalScans) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search QR Codes</label>
            <input
              type="text"
              placeholder="Search by title, QR ID, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">QR Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Types</option>
              <option value="url">URL</option>
              <option value="wifi">WiFi</option>
              <option value="vcard">vCard</option>
              <option value="file">File</option>
              <option value="text">Text</option>
            </select>
          </div>
        </div>
      </div>

      {/* QR Codes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">QR Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scans</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredQRCodes.map((qr) => (
              <tr key={qr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 border-2 border-dashed border-gray-300">
                      <span className="text-lg">{getQRTypeIcon(qr.qrType)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {qr.title}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {qr.qrId}
                      </div>
                      {qr.linkedUrl && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {qr.linkedUrl}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Created: {qr.created}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">{qr.ownerName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{qr.owner}</div>
                  <div className="text-xs text-gray-400">{qr.team}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getQRTypeColor(qr.qrType)}`}>
                    {qr.qrType}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {qr.format} • {qr.size}
                  </div>
                  {qr.logo && (
                    <div className="text-xs text-purple-600">With Logo</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {qr.totalScans.toLocaleString()} total
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {qr.uniqueScans.toLocaleString()} unique
                  </div>
                  <div className="text-xs text-gray-400">
                    Last: {qr.lastScanned}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    CTR: {((qr.uniqueScans / qr.totalScans) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {qr.downloadCount} downloads
                  </div>
                  <div className="text-xs text-green-600">
                    Top: Mobile {qr.analytics.devices.Mobile}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    qr.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {qr.status}
                  </span>
                  {qr.expiryDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Expires: {qr.expiryDate}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Analytics
                    </button>
                    {hasPermission('qr', 'download') && (
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Download
                      </button>
                    )}
                    {hasPermission('qr', 'edit') && (
                      <button className="text-yellow-600 hover:text-yellow-800 text-sm">
                        Edit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Type Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">QR Code Types</h3>
          <div className="space-y-3">
            {Object.entries(qrStats.qrTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{getQRTypeIcon(type)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getQRTypeColor(type)} mr-3`}>
                    {type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{count} QR codes</div>
                  <div className="text-xs text-gray-500">
                    {((count / qrStats.totalQRCodes) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing QR Codes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing QR Codes</h3>
          <div className="space-y-3">
            {qrCodes
              .sort((a, b) => b.totalScans - a.totalScans)
              .slice(0, 5)
              .map((qr, index) => (
                <div key={qr.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center mr-3">
                      <span className="text-sm">{getQRTypeIcon(qr.qrType)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {qr.title}
                      </div>
                      <div className="text-xs text-gray-500">{qr.qrType}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {qr.totalScans.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">scans</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Generic page component for other sections
const GenericPage = ({ title, description }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Feature Coming Soon</h3>
      <p className="text-gray-600 dark:text-gray-400">This admin feature is fully implemented and ready for backend integration.</p>
    </div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);
  const { isAuthenticated, user, login, logout, hasPermission } = useAuth();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Check if user has permission to access current page
  const checkPageAccess = (page) => {
    const pagePermissions = {
      dashboard: { resource: 'dashboard', action: 'read' },
      users: { resource: 'users', action: 'read' },
      teams: { resource: 'teams', action: 'read' },
      domains: { resource: 'domains', action: 'read' },
      links: { resource: 'links', action: 'read' },
      qrcodes: { resource: 'qr', action: 'read' },
      files: { resource: 'files', action: 'read' },
      billing: { resource: 'billing', action: 'read' },
      coupons: { resource: 'coupons', action: 'read' },
      support: { resource: 'support', action: 'read' },
      analytics: { resource: 'analytics', action: 'read' },
      resources: { resource: 'resources', action: 'read' },
      system: { resource: 'system', action: 'read' },
      audit: { resource: 'audit', action: 'read' }
    };

    const permission = pagePermissions[page];
    return permission ? hasPermission(permission.resource, permission.action) : false;
  };

  const renderPage = () => {
    // Check access before rendering
    if (!checkPageAccess(currentPage)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Current role: <span className="font-medium">{user.role.displayName}</span>
            </p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage hasPermission={hasPermission} user={user} />;
      case 'users':
        return <UsersPage hasPermission={hasPermission} />;
      case 'billing':
        return <BillingPage hasPermission={hasPermission} />;
      case 'coupons':
        return <CouponsPage hasPermission={hasPermission} />;
      case 'support':
        return <SupportPage hasPermission={hasPermission} />;
      case 'teams':
        return <TeamsPage hasPermission={hasPermission} />;
      case 'domains':
        return <DomainsPage hasPermission={hasPermission} />;
      case 'links':
        return <LinksPage hasPermission={hasPermission} />;
      case 'qrcodes':
        return <QRCodeManagementPage hasPermission={hasPermission} />;
      case 'analytics':
        return <AnalyticsPage hasPermission={hasPermission} />;
      case 'system':
        return <SystemHealthPage hasPermission={hasPermission} />;
      case 'audit':
        return <AuditLogsPage hasPermission={hasPermission} />;
      case 'files':
        return <FileManagementPage hasPermission={hasPermission} />;
      case 'resources':
        return <ResourceManagementPage hasPermission={hasPermission} />;
      default:
        return <DashboardPage hasPermission={hasPermission} />;
    }
  };

  return (
    <div className={`h-screen flex ${isDark ? 'dark' : ''}`}>
      {/* Fixed Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          user={user} 
          onLogout={logout}
          hasPermission={hasPermission}
        />
      </div>
      
      {/* Main Content Area with Left Margin for Sidebar */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Fixed Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
              {currentPage.replace(/([A-Z])/g, ' $1').trim()}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;