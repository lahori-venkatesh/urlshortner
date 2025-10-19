import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Upload,
  RefreshCw,
  Link as LinkIcon} from 'lucide-react';
import toast from 'react-hot-toast';
import { fileService, FileInfo } from '../../services/fileService';

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
  const { user } = useAuth();
  const [fileLinks, setFileLinks] = useState<FileLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'image' | 'document' | 'video' | 'audio' | 'other'>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    fileTypeStats: {} as Record<string, number>
  });

  useEffect(() => {
    loadFileLinks();
    loadFileStats();
  }, [user]);

  const loadFileLinks = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading files');
      setFileLinks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading file links for user:', user.id);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/files/user/${user.id}`);
      const result = await response.json();
      
      if (result.success) {
        const fileLinksData: FileLink[] = result.data.map((file: any) => ({
          id: file.id,
          fileName: file.originalFileName,
          fileType: getFileTypeCategory(file.fileType),
          fileSize: file.fileSize,
          shortUrl: file.fileUrl,
          originalUrl: file.fileUrl,
          clicks: file.totalDownloads || 0,
          createdAt: file.uploadedAt,
          downloadCount: file.totalDownloads || 0,
          shortCode: file.fileCode,
          tags: file.tags || [],
          type: 'file' as const,
          isPasswordProtected: file.requiresPassword,
          expiresAt: file.expiresAt
        }));
        
        setFileLinks(fileLinksData);
        console.log(`Loaded ${fileLinksData.length} file links`);
      } else {
        console.log('No file links found for user');
        setFileLinks([]);
      }
    } catch (error) {
      console.error('Failed to load file links:', error);
      toast.error('Failed to load file links');
      setFileLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeCategory = (fileType: string): string => {
    if (!fileType) return 'other';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return 'document';
    return 'other';
  };

  const loadFileStats = async () => {
    try {
      const response = await fileService.getFileStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load file stats:', error);
    }
  };

  // localStorage fallback removed - backend only

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
    if (window.confirm('Are you sure you want to delete this file link? This action cannot be undone.')) {
      try {
        const response = await fileService.deleteFile(linkId);
        if (response.success) {
          setFileLinks(prev => prev.filter(link => link.id !== linkId));
          toast.success('File link deleted successfully');
          
          // Reload stats
          loadFileStats();
        }
      } catch (error) {
        console.error('Failed to delete file link:', error);
        toast.error('Failed to delete file link');
        
        // Remove from local state only
        const updatedLinks = fileLinks.filter(link => link.id !== linkId);
        setFileLinks(updatedLinks);
        toast.success('File link removed from display');
      }
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      await fileService.downloadFile(fileId, fileName);
      toast.success('Download started');
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

  const updateFileTags = (linkId: string, newTags: string[]) => {
    const updatedLinks = fileLinks.map(link => 
      link.id === linkId ? { ...link, tags: newTags } : link
    );
    setFileLinks(updatedLinks);
    
    // TODO: Update tags via backend API instead of localStorage
    
    toast.success('Tags updated successfully');
  };



  const filteredLinks = fileLinks
    .filter(link => {
      const matchesSearch = link.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || link.fileType === filterBy;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
              onClick={loadFileLinks}
              disabled={loading}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
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
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500">Loading file links...</p>
          </div>
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
                      onClick={() => downloadFile(fileLink.id, fileLink.fileName)}
                      className="text-gray-400 hover:text-green-600 p-2 hover:bg-green-50 rounded"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFileLink(fileLink.id)}
                      className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded"
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