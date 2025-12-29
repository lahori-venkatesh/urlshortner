import React, { useState } from 'react';

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
              className={`px-3 py-2 text-sm font-medium rounded-lg ${activeTab === tab.id
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
                    <span className={`px-2 py-1 text-xs rounded-full w-fit ${link.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

export default LinksPage;
