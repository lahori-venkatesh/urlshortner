import React, { useState } from 'react';
import {
  Users, Activity, CreditCard, HardDrive,
  TrendingUp, TrendingDown, Globe
} from 'lucide-react';

const DashboardPage = ({ hasPermission, user }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Comprehensive metrics with all platform features
  // Note: Updated icons to use imported Lucide React icons
  const metrics = [
    { label: 'Total Users', value: '12,345', change: '+12.5%', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', permission: 'users:read', icon: Users },
    { label: 'Active Links', value: '98,765', change: '+8.2%', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', permission: 'links:read', icon: Activity },
    { label: 'QR Codes', value: '15,432', change: '+18.7%', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', permission: 'qr:read', icon: Activity },
    { label: 'File Uploads', value: '8,901', change: '+25.3%', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', permission: 'files:read', icon: HardDrive },
    { label: 'Total Clicks', value: '1.2M', change: '+15.3%', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', permission: 'analytics:read', icon: Activity },
    { label: 'Storage Used', value: '2.3 TB', change: '+11.2%', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20', permission: 'resources:read', icon: HardDrive },
    { label: 'Active Teams', value: '234', change: '+9.8%', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', permission: 'teams:read', icon: Globe },
    { label: 'Monthly Revenue', value: '$45,678', change: '+23.1%', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', permission: 'billing:read', icon: CreditCard }
  ];

  // Real-time activity data
  const recentActivity = [
    { type: 'user_signup', user: 'John Doe', action: 'Signed up for Pro plan', time: '2 min ago', icon: Users, color: 'text-green-600' },
    { type: 'link_created', user: 'Sarah Wilson', action: 'Created 5 new links', time: '5 min ago', icon: Activity, color: 'text-blue-600' },
    { type: 'qr_generated', user: 'Mike Johnson', action: 'Generated QR code for campaign', time: '8 min ago', icon: Activity, color: 'text-purple-600' },
    { type: 'file_uploaded', user: 'Emma Davis', action: 'Uploaded product catalog (3.2MB)', time: '12 min ago', icon: HardDrive, color: 'text-orange-600' },
    { type: 'domain_verified', user: 'Alex Brown', action: 'Verified custom domain', time: '15 min ago', icon: Globe, color: 'text-cyan-600' },
    { type: 'payment_received', user: 'Lisa Chen', action: 'Upgraded to Business plan', time: '18 min ago', icon: CreditCard, color: 'text-green-600' }
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
                <metric.icon />
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
                  <activity.icon size={16} />
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

export default DashboardPage;
