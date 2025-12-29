import React, { useState } from 'react';

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
                  <span className={`px-2 py-1 text-xs rounded-full ${file.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                    <span className={`px-2 py-1 text-xs rounded-full w-fit ${file.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
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
                    <div className={`w-3 h-3 rounded-full mr-3 ${index === 0 ? 'bg-blue-500' :
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

export default FileManagementPage;
