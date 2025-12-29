import React, { useState } from 'react';

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
              onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
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
                    <div className={`w-2 h-2 rounded-full mr-2 ${user.lastActive.includes('minute') ? 'bg-green-500' :
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
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${user.status === 'Suspended'
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
                        <label className="text-sm text-gray-500">Last Password Change</label>
                        <p className="font-medium">{selectedUser.security.lastPasswordChange}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Login Devices</label>
                        <p className="font-medium">{selectedUser.security.loginDevices} active devices</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Recent Action</label>
                        <p className="font-medium">User updated profile settings</p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Log */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Activity Log</h3>
                    <div className="space-y-3">
                      {userActivities[selectedUser.id] ? (
                        userActivities[selectedUser.id].map((activity, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <span className="text-gray-500 w-32">{activity.date}</span>
                            <span className="font-medium text-gray-900 dark:text-white flex-1">{activity.action}</span>
                            <span className="text-gray-400">{activity.ip}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No activity logs found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
