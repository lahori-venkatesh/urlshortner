import React, { useState, useEffect } from 'react';
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
  Plus} from 'lucide-react';
import toast from 'react-hot-toast';
import LinkActions from '../LinkActions';

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
}

interface FileToUrlManagerProps {
  onCreateClick?: () => void;
}

const FileToUrlManager: React.FC<FileToUrlManagerProps> = ({ onCreateClick }) => {
  const [fileLinks, setFileLinks] = useState<FileLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'image' | 'document' | 'other'>('all');

  useEffect(() => {
    // Load file links from localStorage
    const storedLinks = localStorage.getItem('shortenedLinks');
    if (storedLinks) {
      try {
        const allLinks = JSON.parse(storedLinks);
        const fileOnlyLinks = allLinks
          .filter((link: any) => link.type === 'file')
          .map((link: any) => ({
            id: link.id,
            fileName: link.originalUrl.split('/').pop() || 'Unknown File',
            fileType: getFileType(link.originalUrl),
            fileSize: Math.floor(Math.random() * 5000000) + 100000, // Mock file size
            shortUrl: link.shortUrl,
            originalUrl: link.originalUrl,
            clicks: link.clicks || 0,
            createdAt: link.createdAt,
            downloadCount: Math.floor(Math.random() * 50),
            shortCode: link.shortCode || link.shortUrl.split('/').pop() || '',
            tags: link.tags || [],
            type: 'file' as const
          }));
        setFileLinks(fileOnlyLinks);
      } catch (err) {
        console.error('Failed to parse file links:', err);
      }
    }
  }, []);

  const getFileType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) return 'document';
    return 'other';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="w-5 h-5 text-green-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
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

  const deleteFileLink = (linkId: string) => {
    if (window.confirm('Are you sure you want to delete this file link?')) {
      const updatedLinks = fileLinks.filter(link => link.id !== linkId);
      setFileLinks(updatedLinks);
      
      // Also update the main links storage
      const allLinks = JSON.parse(localStorage.getItem('shortenedLinks') || '[]');
      const updatedAllLinks = allLinks.filter((link: any) => link.id !== linkId);
      localStorage.setItem('shortenedLinks', JSON.stringify(updatedAllLinks));
      
      toast.success('File link deleted successfully');
    }
  };

  const updateFileTags = (linkId: string, newTags: string[]) => {
    const updatedLinks = fileLinks.map(link => 
      link.id === linkId ? { ...link, tags: newTags } : link
    );
    setFileLinks(updatedLinks);
    
    // Also update the main links storage
    const allLinks = JSON.parse(localStorage.getItem('shortenedLinks') || '[]');
    const updatedAllLinks = allLinks.map((link: any) => 
      link.id === linkId ? { ...link, tags: newTags } : link
    );
    localStorage.setItem('shortenedLinks', JSON.stringify(updatedAllLinks));
    
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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">File Links Manager</h2>
            <p className="text-green-100">
              Upload files and create shareable links
            </p>
          </div>
          <button
            onClick={onCreateClick}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>File to Link</span>
          </button>
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
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{fileLinks.length}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {fileLinks.reduce((sum, link) => sum + link.clicks, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {fileLinks.reduce((sum, link) => sum + link.downloadCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Downloads</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatFileSize(fileLinks.reduce((sum, link) => sum + link.fileSize, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
        </div>

        {/* File Links List */}
        {filteredLinks.length === 0 ? (
          <div className="text-center py-12">
            {fileLinks.length === 0 ? (
              <>
                <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No file links yet</h4>
                <p className="text-gray-600">Your file links will appear here once created</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No files found matching your criteria</p>
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
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteFileLink(fileLink.id)}
                    className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded ml-4"
                    title="Delete file link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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