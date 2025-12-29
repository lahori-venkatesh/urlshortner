import React, { useState } from 'react';

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

export default AuditLogsPage;
