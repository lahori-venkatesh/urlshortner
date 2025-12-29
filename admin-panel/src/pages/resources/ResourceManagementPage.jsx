import React, { useState } from 'react';

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
                  <span className={`px-3 py-1 text-xs rounded-full mr-3 ${plan === 'Free' ? 'bg-gray-100 text-gray-800' :
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
                  <span className={`px-3 py-1 text-xs rounded-full ${plan === 'Free' ? 'bg-gray-100 text-gray-800' :
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
                    className={`h-2 rounded-full ${(data.used / data.limit) > 0.8 ? 'bg-red-500' :
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

export default ResourceManagementPage;
