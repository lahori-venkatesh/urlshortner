import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  File, 
  Image, 
  FileText, 
  Download, 
  Copy, 
  ExternalLink, 
  Trash2,
  Eye,
  Search,
  Plus,
  RefreshCw,
  BarChart3,
  Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserFiles } from '../../hooks/useDashboardData';
import { TableSkeleton, StatCardSkeleton } from '../ui/Skeleton';
import { fileService } from '../../services/fileService';

interface FileLink {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
  downloadCount: number;
  shortCode: string;
  tags?: string[];
  type: 'file';
  isPasswordProtected?: boolean;
  expiresAt?: string;
}

interface FileToUrlManagerProps {
  onCreateClick?: () => void;
}

const FileToUrlManager: React.FC<FileToUrlManagerProps> = ({ onCreateClick }) => {
  const navigate = useNavigate();
  
  // Use React Query for fast loading with caching
  const { data: rawFiles, isLoading, isFetching, error, refetch } = useUserFiles();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'image' | 'document' | 'video' | 'audio' | 'other'>('all');

  // Format the raw data from API
  const fileLinks: FileLink[] = rawFiles ? rawFiles.map((file: any) => ({
    id: file.id,
    fileName: file.originalFileName || file.fileName,
    fileType: file.fileType || file.mimeType,
    fileSize: file.fileSize || 0,
    shortUrl: file.fileUrl || file.shortUrl,
    originalUrl: file.fileUrl || file.shortUrl,
    clicks: file.totalClicks || file.clicks || 0,
    createdAt: file.uploadedAt || file.createdAt,
    downloadCount: file.downloadCount || 0,
    shortCode: file.shortCode || file.fileCode,
    tags: file.tags || [],
    type: 'file' as const,
    isPasswordProtected: file.isPasswordProtected || false,
    expiresAt: file.expiresAt
  })) : [];

  // Calculate stats from file data
  const stats = {
    totalFiles: fileLinks.length,
    totalSize: fileLinks.reduce((sum, file) => sum + file.fileSize, 0),
    totalDownloads: fileLinks.reduce((sum, file) => sum + file.downloadCount, 0),
    fileTypeStats: fileLinks.reduce((acc, file) => {
      const type = file.fileType.split('/')[0] || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const handleRefresh = () => {
    refetch();
    toast.success('File links refreshed!');
  };

  const getFileTypeCategory = (fileType: string): string => {
    if (!fileType) return 'other';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return 'document';
    return 'other';
  };

  const getFileType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) return 'document';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension || '')) return 'audio';
    return 'other';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="w-5 h-5 text-green-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'video':
        return <div className="w-5 h-5 text-purple-600">🎥</div>;
      case 'audio':
        return <div className="w-5 h-5 text-orange-600">🎵</div>;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const editFileLink = (linkId: string) => {
    // For now, just show a toast. In a real app, this would open an edit modal
    toast('Edit functionality coming soon!');
  };

  const deleteFileLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this file link? This action cannot be undone.')) {
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/files/${linkId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the data after successful deletion
        refetch();
        toast.success('File deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    }
  };

  const downloadFile = async (fileCode: string, fileName: string) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      
      // Record download analytics
      try {
        await fetch(`${apiUrl}/v1/files/${fileCode}/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ipAddress: 'unknown',
            userAgent: navigator.userAgent,
            country: 'unknown',
            city: 'unknown',
            deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
          }),
        });
      } catch (analyticsError) {
        console.warn('Failed to record download analytics:', analyticsError);
      }
      
      // Download the file
      const response = await fetch(`${apiUrl}/v1/files/${fileCode}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Download started');
      
      // Refresh the file list to update download counts
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleCreateFileLink = () => {
    if (onCreateClick) {
      onCreateClick();
    }
  };

  const updateFileTags = async (linkId: string, newTags: string[]) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/files/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: newTags
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh the data after successful update
        refetch();
        toast.success('Tags updated successfully');
      } else {
        toast.error(result.message || 'Failed to update tags');
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
      toast.error('Failed to update tags');
    }
  };



  const filteredLinks = fileLinks
    .filter(link => {
      const matchesSearch = link.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || link.fileType === filterBy;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-red-600 mb-4">Failed to load file links</div>
        <button 
          onClick={handleRefresh}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show skeleton loading when no cached data
  if (isLoading && !rawFiles) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-64"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-24 bg-white/20 rounded-lg"></div>
              <div className="h-12 w-32 bg-white/20 rounded-lg"></div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        
        {/* Table Skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center space-x-2">
              <LinkIcon className="w-8 h-8" />
              <span>File Links Manager</span>
            </h2>
            <p className="text-orange-100">
              Manage your file-to-link conversions and shareable file links
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleCreateFileLink}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create File Link</span>
            </button>
          </div>
        </div>
      </div>



      {/* File Links Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Your File Links ({fileLinks.length})</h3>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Files</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalFiles || fileLinks.length}</div>
            <div className="text-sm text-gray-600">File Links</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {fileLinks.reduce((sum, link) => sum + link.clicks, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDownloads || fileLinks.reduce((sum, link) => sum + link.downloadCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Downloads</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatFileSize(stats.totalSize || fileLinks.reduce((sum, link) => sum + link.fileSize, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
        </div>

        {/* File Links List */}
        {isLoading && !rawFiles ? (
          <TableSkeleton />
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-12">
            {fileLinks.length === 0 ? (
              <>
                <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No file links created yet</h4>
                <p className="text-gray-600 mb-4">Create your first file-to-link conversion to get started</p>
                <button
                  onClick={handleCreateFileLink}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create File Link</span>
                </button>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No file links found matching your criteria</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLinks.map((fileLink) => (
              <div key={fileLink.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {getFileIcon(fileLink.fileType)}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{fileLink.fileName}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-blue-600 font-mono text-sm">{fileLink.shortUrl}</code>
                        <button
                          onClick={() => copyToClipboard(fileLink.shortUrl)}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(fileLink.shortUrl, '_blank')}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{formatFileSize(fileLink.fileSize)}</span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{fileLink.clicks} views</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>{fileLink.downloadCount} downloads</span>
                        </span>
                        <span>{new Date(fileLink.createdAt).toLocaleDateString()}</span>
                        {fileLink.isPasswordProtected && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">🔒 Protected</span>
                        )}
                        {fileLink.expiresAt && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">⏰ Expires</span>
                        )}
                      </div>
                      
                      {fileLink.tags && fileLink.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {fileLink.tags.map(tag => (
                            <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        navigate(`/dashboard/file-links/analytics/${fileLink.shortCode}`);
                      }}
                      className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="View Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadFile(fileLink.shortCode, fileLink.fileName)}
                      className="text-gray-400 hover:text-green-600 p-2 hover:bg-green-50 rounded transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFileLink(fileLink.shortCode)}
                      className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete file link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};

export default FileToUrlManager;