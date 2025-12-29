import React, { useState } from 'react';

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
                  <span className={`px-2 py-1 text-xs rounded-full ${qr.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

export default QRCodeManagementPage;
